import { useState, useMemo } from 'react'
import { getRoundName, groupGamesByRound, groupByRegion, ROUND_POINTS } from '../utils/bracketUtils'

// ---------------------------------------------------------------------------
// Layout constants (px)
// GAME_H must be tall enough to fit two 44px buttons + VS divider (~112px min)
// ---------------------------------------------------------------------------
const GAME_H   = 124  // height per R64 game slot; doubles each round
const COL_W    = 176  // width of each round column
const LABEL_H  = 24   // region name strip height
const HDR_H    = 22   // round name header strip height
const REGION_H = GAME_H * 8  // 992px — one region's total game height (constant across rounds)
const HALF_H   = HDR_H + LABEL_H + REGION_H  // height of one region section inc. headers
const TOTAL_H  = HALF_H * 2  // full bracket column height

// Absolute top offsets for the center column (Final Four + Championship)
const FF1_TOP   = HDR_H + LABEL_H + REGION_H / 2 - 44
const FF2_TOP   = HDR_H + LABEL_H + REGION_H + HDR_H + LABEL_H + REGION_H / 2 - 44
const CHAMP_TOP = Math.round((FF1_TOP + FF2_TOP) / 2)

const ROUNDS = [1, 2, 3, 4]

/**
 * Derive contestants for every game by traversing the pick tree.
 * R64 slots come directly from game.team1 / game.team2 (DB join).
 * R32+ slots resolve to whoever the user picked in the upstream feeder game.
 */
function buildContestants(games, picks) {
  const feeders = {}
  games.forEach(g => {
    if (!g.next_game_id) return
    if (!feeders[g.next_game_id]) feeders[g.next_game_id] = [null, null]
    feeders[g.next_game_id][g.next_slot - 1] = g.id
  })

  const c = {}
  ;[...games].sort((a, b) => a.round - b.round).forEach(g => {
    if (g.team1_id) {
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
// TeamBtn — result-aware
// resultState: 'correct' | 'wrong' | 'eliminated' | 'unpicked-winner' | null
// ---------------------------------------------------------------------------
function TeamBtn({ team, isSelected, isLocked, resultState, onClick }) {
  // Upstream pick not yet made — show placeholder
  if (team === null) {
    return (
      <div className="h-10 bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center px-3">
        <span className="text-xs text-gray-300 italic select-none">TBD</span>
      </div>
    )
  }
  if (!team) return <div className="h-10 bg-gray-100 rounded-lg" />

  // First Four teams have a slash in their name (e.g. "SMU/Miami OH")
  const isFirstFour = !resultState && !isSelected && team.name?.includes('/')
  if (isFirstFour) {
    return (
      <button
        onClick={onClick}
        disabled={isLocked}
        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all h-10 flex items-center justify-between gap-2 bg-white/60 hover:bg-cream border border-dashed border-caramel/50 hover:border-orange/40 text-mocha cursor-pointer active:scale-[0.98]"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {team.seed != null && (
            <span className="text-xs font-bold w-5 shrink-0 text-caramel">{team.seed}</span>
          )}
          <span className="truncate leading-tight italic text-xs">{team.name}</span>
        </span>
        <span className="shrink-0 text-[8px] font-bold text-caramel bg-caramel/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">1st 4</span>
      </button>
    )
  }

  // Derive styles from resultState
  let bg, textColor, seedColor, badge = null, extraClass = ''
  if (resultState === 'correct') {
    bg = 'bg-green-500'; textColor = 'text-white'; seedColor = 'text-white/70'
    badge = <span className="shrink-0 text-white text-sm font-bold leading-none">✓</span>
  } else if (resultState === 'wrong') {
    bg = 'bg-red-50 border border-red-200'; textColor = 'text-red-400'; seedColor = 'text-red-300'
    extraClass = 'line-through opacity-80'
    badge = <span className="shrink-0 text-red-400 text-sm font-bold leading-none">✗</span>
  } else if (resultState === 'unpicked-winner') {
    bg = 'bg-green-50 border border-green-300'; textColor = 'text-green-800'; seedColor = 'text-green-500'
    badge = <span className="shrink-0 text-green-500 text-xs leading-none font-semibold">WIN</span>
  } else if (resultState === 'eliminated') {
    bg = 'bg-gray-50 border border-gray-100'; textColor = 'text-gray-300'; seedColor = 'text-gray-200'
    extraClass = 'opacity-60'
  } else if (isSelected) {
    bg = 'bg-orange shadow-sm shadow-orange/30'; textColor = 'text-white'; seedColor = 'text-white/70'
    badge = <span className="shrink-0 text-white/80 text-sm leading-none">✓</span>
  } else {
    bg = 'bg-white hover:bg-cream border border-gray-200 hover:border-orange/40'
    textColor = 'text-mocha'; seedColor = 'text-caramel'
  }

  const interactive = !isLocked && !resultState
  return (
    <button
      onClick={onClick}
      disabled={isLocked || !!resultState}
      className={`
        w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all h-10
        flex items-center justify-between gap-2
        ${bg} ${textColor}
        ${interactive ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}
      `}
    >
      <span className={`flex items-center gap-1.5 min-w-0 ${extraClass}`}>
        {team.seed != null && (
          <span className={`text-xs font-bold w-5 shrink-0 ${seedColor}`}>{team.seed}</span>
        )}
        <span className="truncate leading-tight">{team.name}</span>
      </span>
      {badge}
    </button>
  )
}

// Determine result state for a single team button within a game.
// eliminated: Set of team IDs that have already lost a decided game.
function getResultState(team, gameWinnerId, userPickId, eliminated) {
  if (!team) return null
  if (!gameWinnerId) {
    // Game not yet played — but team may already be out from a prior round
    if (eliminated?.has(team.id)) {
      return userPickId === team.id ? 'wrong' : 'eliminated'
    }
    return null
  }
  const won = team.id === gameWinnerId
  const picked = userPickId === team.id
  if (picked && won)  return 'correct'
  if (picked && !won) return 'wrong'
  if (!picked && won) return 'unpicked-winner'
  return 'eliminated'
}

// ---------------------------------------------------------------------------
// ScoreSummary — shows current score and max possible (only once results exist)
// ---------------------------------------------------------------------------
// Total possible points across the whole tournament (192)
const TOTAL_TOURNAMENT_PTS = Object.entries(ROUND_POINTS).reduce((s, [, pts], i) => {
  const gameCounts = [32, 16, 8, 4, 2, 1]
  return s + pts * gameCounts[i]
}, 0)

function ScoreSummary({ games, picks }) {
  const { current, pointsAtStake, maxPossible, hasResults } = useMemo(() => {
    const eliminated = new Set()
    games.forEach(g => {
      if (!g.winner_id) return
      const loserId = g.team1?.id === g.winner_id ? g.team2?.id : g.team1?.id
      if (loserId) eliminated.add(loserId)
    })

    let current = 0, pointsAtStake = 0, maxPossible = 0
    games.forEach(g => {
      const pickedId = picks[g.id]
      const pts = ROUND_POINTS[g.round] || 0
      if (g.winner_id) {
        // Count decided games where user made a pick
        if (pickedId) {
          pointsAtStake += pts
          if (pickedId === g.winner_id) {
            current += pts
            maxPossible += pts
          }
        }
      } else {
        // Future game — only add to max if pick is still alive
        if (pickedId && !eliminated.has(pickedId)) maxPossible += pts
      }
    })
    const hasResults = games.some(g => g.winner_id)
    return { current, pointsAtStake, maxPossible, hasResults }
  }, [games, picks])

  if (!hasResults) return null

  const accuracyPct = pointsAtStake > 0 ? Math.round((current / pointsAtStake) * 100) : 0
  const maxColor = maxPossible > 100 ? 'text-green-600' : maxPossible > 50 ? 'text-orange' : 'text-red-500'

  return (
    <div className="flex items-center gap-4 bg-mocha/5 border border-mocha/10 rounded-xl px-4 py-3 mb-4 flex-wrap">
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Score So Far</p>
        <p className="font-headline font-bold text-2xl text-mocha leading-tight">
          {current}
          <span className="text-sm font-normal text-gray-400"> of {pointsAtStake} pts</span>
        </p>
      </div>
      <div className="flex-1 min-w-[80px]">
        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
          <span>Accuracy so far</span>
          <span>{accuracyPct}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${accuracyPct >= 70 ? 'bg-green-400' : accuracyPct >= 40 ? 'bg-orange' : 'bg-red-400'}`}
            style={{ width: `${accuracyPct}%` }}
          />
        </div>
      </div>
      <div className="text-right">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Max Possible</p>
        <p className={`font-headline font-bold text-2xl leading-tight ${maxColor}`}>
          {maxPossible}
          <span className="text-sm font-normal text-gray-400"> of {TOTAL_TOURNAMENT_PTS}</span>
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GameCard — a single matchup with result-aware team buttons
// ---------------------------------------------------------------------------
function GameCard({ game, contestants, picks, isLocked, onPick, eliminated }) {
  if (!game) return null
  const { team1, team2 } = contestants?.[game.id] || {}
  const picked = picks[game.id]
  const winnerId = game.winner_id

  return (
    <div className="bg-white/70 rounded-xl border border-gray-200/80 shadow-sm p-1.5 w-full">
      <TeamBtn
        team={team1 ?? null}
        isSelected={!winnerId && picked === team1?.id}
        isLocked={isLocked}
        resultState={getResultState(team1, winnerId, picked, eliminated)}
        onClick={() => !getResultState(team1, winnerId, picked, eliminated) && !winnerId && team1 && onPick(game.id, team1.id)}
      />
      <div className="flex items-center gap-1 px-2" style={{ height: 14 }}>
        <div className="flex-1 border-t border-gray-100" />
        <span className="text-[9px] text-gray-300 font-semibold">vs</span>
        <div className="flex-1 border-t border-gray-100" />
      </div>
      <TeamBtn
        team={team2 ?? null}
        isSelected={!winnerId && picked === team2?.id}
        isLocked={isLocked}
        resultState={getResultState(team2, winnerId, picked, eliminated)}
        onClick={() => !getResultState(team2, winnerId, picked, eliminated) && !winnerId && team2 && onPick(game.id, team2.id)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// GameSlot — positions GameCard inside a fixed-height row for alignment
// ---------------------------------------------------------------------------
function GameSlot({ game, contestants, picks, isLocked, onPick, rowHeight, eliminated }) {
  if (!game) return null

  if (rowHeight) {
    return (
      <div className="flex items-center justify-center px-1" style={{ height: rowHeight }}>
        <GameCard game={game} contestants={contestants} picks={picks} isLocked={isLocked} onPick={onPick} eliminated={eliminated} />
      </div>
    )
  }
  return (
    <div className="px-1 mb-2">
      <GameCard game={game} contestants={contestants} picks={picks} isLocked={isLocked} onPick={onPick} eliminated={eliminated} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// HalfBracket — renders 4 round columns for two stacked regions
// reverse=true mirrors the right side (E8 nearest center, R64 on outside)
// ---------------------------------------------------------------------------
function HalfBracket({ topRegion, bottomRegion, gamesByRound, contestants, picks, isLocked, onPick, reverse, eliminated }) {
  const cols = ROUNDS.map(r => {
    const rowH      = GAME_H * Math.pow(2, r - 1)
    const topGames  = (gamesByRound[r] || []).filter(g => g.region === topRegion)
    const btmGames  = (gamesByRound[r] || []).filter(g => g.region === bottomRegion)

    return (
      <div key={r} className="flex flex-col shrink-0" style={{ width: COL_W }}>
        {/* Round name label */}
        <div
          className="flex items-center justify-center border-b border-gray-200/60"
          style={{ height: HDR_H }}
        >
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {getRoundName(r)}
          </span>
        </div>

        {/* Top region */}
        <div className="flex items-end px-2 pb-0.5" style={{ height: LABEL_H }}>
          <span className="text-[11px] font-bold text-caramel uppercase tracking-wider truncate">
            {topRegion}
          </span>
        </div>
        {topGames.map(game => (
          <GameSlot key={game.id} game={game} contestants={contestants} picks={picks}
            isLocked={isLocked} onPick={onPick} rowHeight={rowH} eliminated={eliminated} />
        ))}

        {/* Bottom region */}
        <div className="flex items-end px-2 pb-0.5" style={{ height: LABEL_H }}>
          <span className="text-[11px] font-bold text-caramel uppercase tracking-wider truncate">
            {bottomRegion}
          </span>
        </div>
        {btmGames.map(game => (
          <GameSlot key={game.id} game={game} contestants={contestants} picks={picks}
            isLocked={isLocked} onPick={onPick} rowHeight={rowH} eliminated={eliminated} />
        ))}
      </div>
    )
  })

  return (
    <div className={`flex shrink-0 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
      {cols}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CenterColumn — Final Four + Championship, absolutely positioned
// ---------------------------------------------------------------------------
function CenterColumn({ gamesByRound, contestants, picks, isLocked, onPick, eliminated }) {
  const ff    = gamesByRound[5] || []
  const ff1   = ff[0]
  const ff2   = ff[1]
  const champ = (gamesByRound[6] || [])[0]

  return (
    <div className="relative shrink-0" style={{ width: COL_W, height: TOTAL_H }}>
      {/* Column header */}
      <div
        className="flex items-center justify-center border-b border-gray-200/60"
        style={{ height: HDR_H }}
      >
        <span className="text-[10px] font-bold text-orange uppercase tracking-wider">Finals</span>
      </div>

      {ff1 && (
        <div className="absolute left-0 right-0" style={{ top: FF1_TOP }}>
          <div className="px-1 mb-1.5 text-center">
            <span className="inline-block text-[9px] font-bold text-caramel uppercase tracking-wider bg-mocha/5 border border-caramel/30 px-2 py-0.5 rounded-full">
              Final Four
            </span>
          </div>
          <GameSlot game={ff1} contestants={contestants} picks={picks} isLocked={isLocked} onPick={onPick} eliminated={eliminated} />
        </div>
      )}

      {champ && (
        <div className="absolute left-0 right-0" style={{ top: CHAMP_TOP }}>
          <div className="px-1 mb-1.5 text-center">
            <span className="inline-block text-[9px] font-bold text-orange uppercase tracking-wider bg-orange/10 border border-orange/30 px-2 py-0.5 rounded-full">
              Championship
            </span>
          </div>
          <GameSlot game={champ} contestants={contestants} picks={picks} isLocked={isLocked} onPick={onPick} eliminated={eliminated} />
        </div>
      )}

      {ff2 && (
        <div className="absolute left-0 right-0" style={{ top: FF2_TOP }}>
          <div className="px-1 mb-1.5 text-center">
            <span className="inline-block text-[9px] font-bold text-caramel uppercase tracking-wider bg-mocha/5 border border-caramel/30 px-2 py-0.5 rounded-full">
              Final Four
            </span>
          </div>
          <GameSlot game={ff2} contestants={contestants} picks={picks} isLocked={isLocked} onPick={onPick} eliminated={eliminated} />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DesktopBracket — full ESPN-style layout with scroll hint + fade
// ---------------------------------------------------------------------------
function DesktopBracket({ gamesByRound, contestants, picks, isLocked, onPick, eliminated }) {
  return (
    <div className="relative">
      {/* Region orientation legend */}
      <div className="flex items-center gap-2 mb-2 text-[10px] font-semibold select-none">
        <span className="text-mocha/50 whitespace-nowrap">← West · Midwest</span>
        <div className="flex-1 border-t border-gray-200 min-w-[12px]" />
        <span className="text-orange/80 shrink-0">Finals</span>
        <div className="flex-1 border-t border-gray-200 min-w-[12px]" />
        <span className="text-mocha/50 whitespace-nowrap">East · South →</span>
      </div>

      {/* Scroll hint */}
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 select-none">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        <span>Scroll left &amp; right to navigate the full bracket</span>
        <svg className="w-3.5 h-3.5 shrink-0 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>

      {/* Right-edge fade to hint at off-screen content */}
      <div
        className="pointer-events-none absolute top-0 right-0 bottom-0 w-20 z-10"
        style={{ background: 'linear-gradient(to left, #F2E8DA 0%, transparent 100%)' }}
      />
      {/* Left-edge fade */}
      <div
        className="pointer-events-none absolute top-0 left-0 bottom-0 w-6 z-10"
        style={{ background: 'linear-gradient(to right, #F2E8DA 0%, transparent 100%)' }}
      />

      {/* Scrollable bracket */}
      <div className="overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex items-start gap-3" style={{ minWidth: 'max-content' }}>
          <HalfBracket
            topRegion="West" bottomRegion="Midwest"
            gamesByRound={gamesByRound} contestants={contestants}
            picks={picks} isLocked={isLocked} onPick={onPick}
            reverse={false} eliminated={eliminated}
          />
          <div className="shrink-0 self-stretch w-px bg-gray-200/70 mx-1" />
          <CenterColumn
            gamesByRound={gamesByRound} contestants={contestants}
            picks={picks} isLocked={isLocked} onPick={onPick} eliminated={eliminated}
          />
          <div className="shrink-0 self-stretch w-px bg-gray-200/70 mx-1" />
          <HalfBracket
            topRegion="East" bottomRegion="South"
            gamesByRound={gamesByRound} contestants={contestants}
            picks={picks} isLocked={isLocked} onPick={onPick}
            reverse={true} eliminated={eliminated}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PickProgress
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
// MobileBracket — tab-per-round
// ---------------------------------------------------------------------------
function MobileBracket({ roundNums, gamesByRound, contestants, picks, isLocked, onPick, eliminated }) {
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

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline font-bold text-mocha">{getRoundName(round)}</h3>
        <span className="text-xs text-gray-400 font-medium">{roundPicksMade}/{games.length} picked</span>
      </div>

      <div className="space-y-5">
        {Object.entries(groupByRegion(games)).map(([region, rgGames]) => (
          <div key={region}>
            {region !== 'undefined' && region !== 'Finals' && (
              <p className="text-xs font-bold text-caramel uppercase tracking-wider mb-3">{region}</p>
            )}
            <div className="space-y-3">
              {rgGames.map(game => (
                <GameSlot key={game.id} game={game} contestants={contestants}
                  picks={picks} isLocked={isLocked} onPick={onPick} eliminated={eliminated} />
              ))}
            </div>
          </div>
        ))}
      </div>

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
  const contestants  = useMemo(() => buildContestants(games, picks), [games, picks])
  const eliminated   = useMemo(() => {
    const s = new Set()
    games.forEach(g => {
      if (!g.winner_id) return
      const loserId = g.team1_id === g.winner_id ? g.team2_id : g.team1_id
      if (loserId) s.add(loserId)
    })
    return s
  }, [games])

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

      {/* Score summary — shown once tournament results start coming in */}
      <ScoreSummary games={games} picks={picks} />

      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopBracket
          gamesByRound={gamesByRound}
          contestants={contestants}
          picks={picks}
          isLocked={isLocked}
          onPick={onPick}
          eliminated={eliminated}
        />
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <PickProgress picks={picks} games={games} />
        <MobileBracket
          roundNums={roundNums}
          gamesByRound={gamesByRound}
          contestants={contestants}
          picks={picks}
          isLocked={isLocked}
          onPick={onPick}
          eliminated={eliminated}
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

      {canSubmit && (
        <div className="mt-6 flex items-center gap-4">
          <button onClick={onSubmit} className="btn-primary px-8">Submit Bracket</button>
          {saving && <span className="text-sm text-gray-400 italic">Saving…</span>}
        </div>
      )}

      {!isLocked && !canSubmit && (
        <div className="mt-6 text-sm text-gray-500 bg-orange/5 border border-orange/20 rounded-xl px-4 py-3">
          Your bracket is submitted. You can still edit picks until the tournament locks.
          {saving && <span className="ml-2 italic text-gray-400">Saving…</span>}
        </div>
      )}
    </div>
  )
}
