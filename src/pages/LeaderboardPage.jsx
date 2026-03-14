import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import LeaderboardTable from '../components/LeaderboardTable'
import PotSummary from '../components/PotSummary'
import { BracketService } from '../services/BracketService'
import { ScoreCalculator } from '../services/ScoreCalculator'
import { supabase } from '../services/supabase'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([])
  const [paidCount, setPaidCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    setLoading(true)
    try {
      const [games, bracketsResult, profilesResult, paidResult] = await Promise.all([
        BracketService.getGames(),
        // Leaderboard shows all submitted + locked brackets (paid or not)
        supabase
          .from('brackets')
          .select('*, bracket_picks(*)')
          .in('status', ['submitted', 'locked']),
        supabase.from('profiles').select('id, display_name'),
        // Pot count: only paid entries
        supabase
          .from('brackets')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'complete'),
      ])

      if (bracketsResult.error) throw bracketsResult.error
      if (profilesResult.error) throw profilesResult.error

      setPaidCount(paidResult.count || 0)

      const allBrackets = bracketsResult.data || []
      const profiles = profilesResult.data || []

      if (games.length && allBrackets.length) {
        const ranked = ScoreCalculator.buildLeaderboard(
          allBrackets.map(b => ({ ...b, picks: b.bracket_picks })),
          games,
          profiles
        )
        setEntries(ranked)
      } else {
        setEntries([])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <img src="/assets/logo.png" alt="" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="font-headline font-bold text-3xl text-mocha">Leaderboard</h1>
            <p className="text-gray-500 text-sm">{entries.length} bracket{entries.length !== 1 ? 's' : ''} entered</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {loading ? (
              <div className="card text-center py-12 text-gray-400">Loading leaderboard…</div>
            ) : (
              <LeaderboardTable entries={entries} />
            )}
          </div>
          <div>
            <PotSummary totalBrackets={paidCount} />
            <div className="card mt-4 text-sm">
              <p className="font-headline font-semibold text-mocha mb-3">Scoring Rules</p>
              <div className="space-y-1.5 text-gray-500">
                {Object.entries(ScoreCalculator.ROUND_POINTS).map(([round, pts]) => {
                  const names = { 1: 'Round of 64', 2: 'Round of 32', 3: 'Sweet 16', 4: 'Elite 8', 5: 'Final Four', 6: 'Championship' }
                  return (
                    <div key={round} className="flex justify-between">
                      <span>{names[round]}</span>
                      <span className="font-semibold text-mocha">{pts} pt{pts > 1 ? 's' : ''}</span>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">Tiebreaker: closest championship score prediction.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
