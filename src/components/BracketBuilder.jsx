import { useState, useMemo } from 'react'
import { getRoundName, groupGamesByRound, groupByRegion } from '../utils/bracketUtils'

// Layout constants (px)
const GAME_H  = 96   // height of one R64 game slot; doubles each round
const COL_W   = 172  // width of each round column
const LABEL_H = 28   // region label strip height
const REGION_H = GAME_H * 8  // 768 — one region's total game height (constant across rounds)
const TOTAL_H  = (LABEL_H + REGION_H) * 2  // 1592 — full bracket height

// Final Four / Championship absolute top offsets
const FF1_TOP   = LABEL_H + REGION_H / 2 - 40          // 372
const CHAMP_TOP = Math.round((FF1_TOP + (LABEL_H + REGION_H + LABEL_H + REGION_H / 2 - 40)) / 2)  // 770
const FF2_TOP   = LABEL_H + REGION_H + LABEL_H + REGION_H / 2 - 40  // 1168

/**
 * Derive contestants for every game slot by traversing the pick tree.
 * R64 contestants come from game.team1 / game.team2 (joined from DB).
 * R32+ contestants are whoever the user picked in the upstream feeder games.
 */
function buildContestants(games, picks) {
  // feeders[gameId] = [feederGameId_slot1, feederGameId_slot2]
  const feeders = {}
  games.forEach(g => {
    if (!g.next_game_id) return
    if (!feeders[g.next_game_id]) feeders[g.next_game_id] = [null, null]
    feeders[g.next_game_id][g.next_slot - 1] = g.id
  })

  const c = {}
  ;[...games].sort((a, b) => a.round - b.round).forEach(g => {
    if (g.team1_id) {
      // R64: team objects come directly from DB join
      c[g.id] = { team1: g.team1, team2: g.team2 }
    } else {
      const [f1, f2] = feeders[g.id] || [null, null]
      const resolve = fid => {
        if (!fid) return null
        const pid = picks[fid]
        if (!pid) return null
        const fc = c[fid]
        if (!fc) return null
        return fc.team1?.id === pid ? fc.team1 : fc.team2?.id === pid ? fc.team2 : null
      }
      c[g.id] = { team1: resolve(f1), team2: resolve(f2) }
    }
  })
  return c
}

// ---------------------------------------------------------------------------
// TeamBtn
// ---------------------------------------------------------------------------
function TeamBtn({ team, isSelected, isLocked, onClick }) {
  // Slot not yet determined (waiting for upstream pick)
  if (team === undefined) {
    return (
      <div className="h-11 bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center px-3">
        <span className="text-xs text-gray-300 italic">TBD</span>
      </div>
    )
  }
  // Seed data missing (shouldn't normally happen)
  if (!team) return <div className="h-11 bg-gray-100 rounded-lg" />

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`
        w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px]
        flex items-center justify-between gap-2
        ${isSelected
          ? 'bg-orange text-white shadow-md shadow-orange/20'
          : 'bg-white hover:bg-cream border border-gray-200 text-mocha'}
        ${isLocked ? 'cursor-default opacity-75' : 'cursor-pointer active:scale-[0.98]'}
      `}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        {team.seed && (
          <span className={`text-xs font-bold w-5 shrink-0 ${isSelected ? 'text-white/70' : 'text-caramel'}`}>
            {team.seed}
          </span>
        )}
        <span className="truncate">{team.name}</span>
      </span>
      {isSelected && <span className="text-white/80 shrink-0 text-base leading-none">✓</span>}
    </button>
  )
}

// ---------------------------------------------------------------------------
// GameSlot — single matchup card
// ---------------------------------------------------------------------------
function GameSlot({ game, contestants, picks, isLocked, onPick, rowHeight }) {
  if (!game) return null
  const { team1, team2 } = contestants?.[game.id] || {}
  const picked = picks[game.id]

  const inner = (
    <div className="flex flex-col gap-1 w-full">
      <TeamBtn
        team={team1}
        isSelected={picked === team1?.id}
        isLocked={isLocked}
        onClick={() => team1 && onPick(game.id, team1.id)}
      />
      <div className="flex items-center gap-1 px-1">
        <div className="flex-1 border-t border-gray-100" />
        <span className="text-[10px] text-gray-300 font-medium">vs</span>
        <div className="flex-1 border-t border-gray-100" />
      </div>
      <TeamBtn
        team={team2}
        isSelected={picked === team2?.id}
        isLocked={isLocked}
        onClick={() => team2 && onPick(game.id, team2.id)}
      />
    </div>
  )

  if (rowHeight) {
    return (
      <div className="flex items-center justify-center px-1" style={{ height: rowHeight }}>
        {inner}
      </div>
    )
  }
  return <div className="px-1">{inner}</div>
}

// ---------------------------------------------------------------------------
// HalfBracket — left (West+Midwest, flex-row) or right (East+South, flex-row-reverse)
// ---------------------------------------------------------------------------
function HalfBracket({ topRegion, bottomRegion, gamesByRound, contestants, picks, isLocked, onPick, reverse }) {
  const rounds = [1, 2, 3, 4]

  const cols = rounds.map(r => {
    const rowH = GAME_H * Math.pow(2, r - 1)
    const topGames    = (gamesByRound[r] || []).filter(g => g.region === topRegion)
    const bottomGames = (gamesByRound[r] || []).filter(g => g.region === bottomRegion)

    return (
      <div key={r} className="flex flex-col shrink-0" style={{ width: COL_W }}>
        {/* Top region */}
        <div className="flex items-end pb-0.5 px-1" style={{ height: LABEL_H }}>
          {r === 1 && (
            <span className="text-[11px] font-bold text-caramel uppercase tracking-wider truncate">
              {topRegion}
            </span>
          )}
        </div>
        {topGames.map(game => (
          <GameSlot
            key={game.id}
            game={game}
            contestants={contestants}
            picks={picks}
            isLocked={isLocked}
            onPick={onPick}
            rowHeight={rowH}
          />
        ))}
        {/* Bottom region */}
        <div className="flex items-end pb-0.5 px-1" style={{ height: LABEL_H }}>
          {r === 1 && (
            <span className="text-[11px] font-bold text-caramel uppercase tracking-wider truncate">
              {bottomRegion}
            </span>
          )}
        </div>
        {bottomGames.map(game => (
          <GameSlot
            key={game.id}
            game={game}
            contestants={contestants}
            picks={picks}
            isLocked={isLocked}
            onPick={onPick}
            rowHeight={rowH}
          />
        ))}
      </div>
    )
  })

  return (
    <div className={`flex ${reverse ? 'flex-row-reverse' : 'flex-row'} shrink-0`}>
      {cols}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CenterColumn — Final Four + Championship, absolutely positioned
// ---------------------------------------------------------------------------
function CenterColumn({ gamesByRound, contestants, picks, isLocked, onPick }) {
  const ff = gamesByRound[5] || []
  const ff1   = ff[0]
  const ff2   = ff[1]
  const champ = (gamesByRound[6] || [])[0]

  return (
    <div className="relative shrink-0" style={{ width: COL_W, height: TOTAL_H }}>
      {/* Label */}
      <div
        className="absolute flex items-end pb-0.5 px-1"
        style={{ top: 0, left: 0, right: 0, height: LABEL_H }}
      >
        <span className="text-[11px] font-bold text-caramel uppercase tracking-wider w-full text-center">
          Finals
        </span>
      </div>

      {ff1 && (
        <div className="absolute left-0 right-0" style={{ top: FF1_TOP }}>
          <GameSlot game={ff1} contestants={contestants} picks={picks} isLocked={isLocked} onPick={onPick} />
        </div>
      )}

      {champ && (
        <div className="absolute left-0 right-0" style={{ top: CHAMP_TOP }}>
          <div className="px-1 mb-1">
            <p className="text-[10px] font-bold text-orange uppercase tracking-wider text-center mb-1">
              Championship
            </p>
          </div>
          <GameSlot game={champ} contestants={contestants} picks={picks} isLocked={isLocked} onPick={onPick} />
        </div>
      )}

      {ff2 && (
        <div className="absolute left-0 right-0" style={{ top: FF2_TOP }}>
          <GameSlot game={ff2} contestants={contestants} picks={picks} isLocked={isLocked} onPick={onPick} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DesktopBracket — ESPN-style left/center/right layout
// ---------------------------------------------------------------------------
function DesktopBracket({ gamesByRound, contestants, picks, isLocked, onPick }) {
  return (
    <div className="flex flex-row items-start overflow-x-auto pb-4" style={{ minHeight: TOTAL_H }}>
      <HalfBracket
        topRegion="West"
        bottomRegion="Midwest"
        gamesByRound={gamesByRound}
        contestants={contestants}
        picks={picks}
        isLocked={isLocked}
        onPick={onPick}
        reverse={false}
      />
      <CenterColumn
        gamesByRound={gamesByRound}
        contestants={contestants}
        picks={picks}
        isLocked={isLocked}
        onPick={onPick}
      />
      <HalfBracket
        topRegion="East"
        bottomRegion="South"
        gamesByRound={gamesByRound}
        contestants={contestants}
        picks={picks}
        isLocked={isLocked}
        onPick={onPick}
        reverse={true}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// PickProgress — mobile progress bar
// ---------------------------------------------------------------------------
function PickProgress({ picks, games }) {
  const gameIdSet = new Set(games.map(g => g.id))
  const made  = Object.keys(picks).filter(id => gameIdSet.has(Number(id))).length
  const total = games.length
  const pct   = total > 0 ? Math.round((made / total) * 100) : 0

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-mocha">{made} of {total} picks made</span>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MobileBracket — tab-per-round view
// ---------------------------------------------------------------------------
function MobileBracket({ roundNums, gamesByRound, contestants, picks, isLocked, onPick }) {
  const [activeRound, setActiveRound] = useState(0)

  if (!roundNums.length) {
    return <div className="card text-center py-8 text-gray-400">No rounds available.</div>
  }

  const round = roundNums[activeRound]
  const games = gamesByRound[round] || []
  const roundPicksMade = games.filter(g => picks[g.id]).length

  return (
    <div>
      {/* Round tabs */}
      <div className="flex overflow-x-auto gap-2 mb-5 pb-1 -mx-1 px-1">
        {roundNums.map((r, idx) => {
          const rGames = gamesByRound[r] || []
          const rDone  = rGames.length > 0 && rGames.every(g => picks[g.id])
          return (
            <button
              key={r}
              onClick={() => setActiveRound(idx)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeRound === idx
                  ? 'bg-orange text-white shadow-sm'
                  : rDone
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-white text-mocha border border-gray-200'
              }`}
            >
              {rDone && activeRound !== idx && <span className="text-green-500 text-xs">✓</span>}
              {getRoundName(r)}
            </button>
          )
        })}
      </div>

      {/* Round header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline font-bold text-mocha">{getRoundName(round)}</h3>
        <span className="text-xs text-gray-400 font-medium">{roundPicksMade}/{games.length} picked</span>
      </div>

      {/* Games grouped by region */}
      <div className="space-y-5">
        {Object.entries(groupByRegion(games)).map(([region, rgGames]) => (
          <div key={region}>
            {region !== 'undefined' && region !== 'Finals' && (
              <p className="text-xs font-bold text-caramel uppercase tracking-wider mb-3">{region}</p>
            )}
            <div className="space-y-4">
              {rgGames.map(game => (
                <GameSlot
                  key={game.id}
                  game={game}
                  contestants={contestants}
                  picks={picks}
                  isLocked={isLocked}
                  onPick={onPick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next */}
      <div className="flex justify-between mt-8 gap-3">
        <button
          onClick={() => setActiveRound(prev => Math.max(0, prev - 1))}
          disabled={activeRound === 0}
          className="flex-1 btn-secondary text-sm py-2.5 disabled:opacity-30"
        >
          ← Prev Round
        </button>
        <button
          onClick={() => setActiveRound(prev => Math.min(roundNums.length - 1, prev + 1))}
          disabled={activeRound === roundNums.length - 1}
          className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-30"
        >
          Next Round →
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BracketBuilder — main export
// ---------------------------------------------------------------------------
export default function BracketBuilder({
  games,
  picks,
  isLocked,
  canSubmit,
  onPick,
  tiebreaker,
  onTiebreakerChange,
  onSubmit,
  saving,
}) {
  const gamesByRound = groupGamesByRound(games)
  const roundNums    = Object.keys(gamesByRound).map(Number).sort((a, b) => a - b)

  // Derive who plays in every slot (propagates picks into later rounds)
  const contestants = useMemo(() => buildContestants(games, picks), [games, picks])

  return (
    <div>
      {isLocked && (
        <div className="mb-6 bg-mocha/5 border border-mocha/20 rounded-xl px-4 py-3 text-mocha font-medium text-sm text-center">
          The buzzer sounded. Picks are final.
          {Object.keys(picks).length === 0 && (
            <span className="block text-mocha/60 font-normal mt-1">
              No picks were submitted before the tournament locked.
            </span>
          )}
        </div>
      )}

      {/* Desktop — ESPN-style left/right bracket */}
      <div className="hidden md:block">
        <DesktopBracket
          gamesByRound={gamesByRound}
          contestants={contestants}
          picks={picks}
          isLocked={isLocked}
          onPick={onPick}
        />
      </div>

      {/* Mobile — tab per round */}
      <div className="md:hidden">
        <PickProgress picks={picks} games={games} />
        <MobileBracket
          roundNums={roundNums}
          gamesByRound={gamesByRound}
          contestants={contestants}
          picks={picks}
          isLocked={isLocked}
          onPick={onPick}
        />
      </div>

      {/* Tiebreaker */}
      <div className="card mt-8 bg-mocha/[0.03] border border-caramel/20">
        <label className="block font-headline font-semibold text-mocha mb-1">Tiebreaker</label>
        <p className="text-sm text-gray-500 mb-3">
          Predict the combined final score of the championship game.
        </p>
        <input
          type="number"
          min="0"
          max="300"
          value={tiebreaker || ''}
          onChange={e => onTiebreakerChange(parseInt(e.target.value) || 0)}
          disabled={isLocked}
          placeholder="e.g. 145"
          className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50 disabled:bg-gray-100"
        />
      </div>

      {/* Submit — only before first submission */}
      {canSubmit && (
        <div className="mt-6 flex items-center gap-4">
          <button onClick={onSubmit} className="btn-primary px-8">Submit Bracket</button>
          {saving && <span className="text-sm text-gray-400 italic">Saving…</span>}
        </div>
      )}

      {/* Submitted but still editable */}
      {!isLocked && !canSubmit && (
        <div className="mt-6 text-sm text-gray-500 bg-orange/5 border border-orange/20 rounded-xl px-4 py-3">
          Your bracket is submitted. You can still edit picks until the tournament locks.
          {saving && <span className="ml-2 italic text-gray-400">Saving…</span>}
        </div>
      )}
    </div>
  )
}
