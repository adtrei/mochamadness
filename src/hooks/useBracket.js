import { useState, useEffect, useCallback, useRef } from 'react'
import { BracketService } from '../services/BracketService'
import { clearDownstreamPicks } from '../utils/bracketUtils'

export function useBracket(bracketId) {
  const [bracket, setBracket] = useState(null)
  const [picks, setPicks] = useState({})
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Separate timers so a tiebreaker change never cancels a pending pick save
  const pickTimer = useRef(null)
  const tiebreakerTimer = useRef(null)

  // Accumulate all pick changes between debounce flushes
  const pendingSaves = useRef(new Map())   // gameId (string) -> winnerId
  const pendingDeletes = useRef(new Set()) // gameId (string)

  const loadBracket = useCallback(async () => {
    if (!bracketId) return
    setLoading(true)
    try {
      const [bracketData, picksData, gamesData] = await Promise.all([
        BracketService.getBracket(bracketId),
        BracketService.getPicks(bracketId),
        BracketService.getGames(),
      ])
      setBracket(bracketData)
      setGames(gamesData)
      const picksMap = {}
      picksData.forEach(p => { picksMap[p.game_id] = p.picked_winner_id })
      setPicks(picksMap)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [bracketId])

  useEffect(() => {
    loadBracket()
  }, [loadBracket])

  // Flush all accumulated pick saves/deletes, verifying lock status server-side first
  async function flushPicks() {
    const saves = new Map(pendingSaves.current)
    const deletes = new Set(pendingDeletes.current)
    pendingSaves.current.clear()
    pendingDeletes.current.clear()

    if (saves.size === 0 && deletes.size === 0) return

    // Re-verify lock status server-side — client state may be stale
    try {
      const current = await BracketService.getBracket(bracketId)
      if (current.status === 'locked') return
    } catch {
      return // Can't verify — skip save rather than risk writing to a locked bracket
    }

    setSaving(true)
    try {
      await Promise.all([
        ...[...saves.entries()].map(([gId, wId]) =>
          BracketService.savePick(bracketId, Number(gId), wId)
        ),
        ...[...deletes].map(gId =>
          BracketService.deletePick(bracketId, Number(gId))
        ),
      ])
    } catch (err) {
      setError('Failed to save picks. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // makePick accumulates ALL changed picks (including cascade deletes) for the debounced flush
  const makePick = useCallback((gameId, winnerId) => {
    if (bracket?.status === 'locked') return

    // Compute what will change using current picks (for tracking purposes)
    const cleared = clearDownstreamPicks(picks, gameId, games)
    const newPicks = { ...cleared, [gameId]: winnerId }

    // Track new pick to save
    pendingSaves.current.set(String(gameId), winnerId)

    // Track any cascade-cleared picks to delete from DB
    Object.keys(picks).forEach(id => {
      if (newPicks[id] === undefined) {
        pendingSaves.current.delete(id)
        pendingDeletes.current.add(id)
      }
    })

    // Apply state update via functional form to ensure correctness
    setPicks(prev => {
      const c = clearDownstreamPicks(prev, gameId, games)
      return { ...c, [gameId]: winnerId }
    })

    clearTimeout(pickTimer.current)
    pickTimer.current = setTimeout(flushPicks, 1000)
  }, [bracket, games, picks])

  async function updateTiebreaker(value) {
    if (bracket?.status === 'locked') return
    setBracket(prev => ({ ...prev, tiebreaker: value }))
    clearTimeout(tiebreakerTimer.current)
    tiebreakerTimer.current = setTimeout(async () => {
      try {
        const current = await BracketService.getBracket(bracketId)
        if (current.status === 'locked') return
        await BracketService.updateBracket(bracketId, { tiebreaker: value })
      } catch (err) {
        console.error('Tiebreaker save failed:', err)
      }
    }, 1000)
  }

  async function submitBracket() {
    // Guard against submitting an already-locked bracket (stale client state)
    if (bracket?.status === 'locked') return
    try {
      const updated = await BracketService.submitBracket(bracketId)
      setBracket(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  return { bracket, picks, games, loading, saving, error, makePick, updateTiebreaker, submitBracket, reload: loadBracket }
}
