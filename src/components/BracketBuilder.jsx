import { useState } from 'react'
import { getRoundName, groupGamesByRound, groupByRegion } from '../utils/bracketUtils'

function TeamButton({ team, isSelected, isLocked, onClick }) {
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
      <span className="flex items-center gap-1.5 truncate">
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

function GameSlot({ game, picks, isLocked, onPick }) {
  if (!game) return null
  const { team1, team2 } = game
  const picked = picks[game.id]

  return (
    <div className="flex flex-col gap-1">
      <TeamButton team={team1} isSelected={picked === team1?.id} isLocked={isLocked} onClick={() => team1 && onPick(game.id, team1.id)} />
      <div className="flex items-center gap-2 px-1">
        <div className="flex-1 border-t border-gray-100" />
        <span className="text-[10px] text-gray-300 font-medium">VS</span>
        <div className="flex-1 border-t border-gray-100" />
      </div>
      <TeamButton team={team2} isSelected={picked === team2?.id} isLocked={isLocked} onClick={() => team2 && onPick(game.id, team2.id)} />
    </div>
  )
}

function RoundColumn({ games, picks, isLocked, onPick }) {
  return (
    <div className="flex flex-col justify-around gap-3 min-w-[168px]">
      {games.map(game => (
        <GameSlot key={game.id} game={game} picks={picks} isLocked={isLocked} onPick={onPick} />
      ))}
    </div>
  )
}

function RegionBracket({ region, gamesByRound, picks, isLocked, onPick }) {
  const rounds = [1, 2, 3, 4].filter(r => gamesByRound[r]?.some(g => g.region === region))
  if (!rounds.length) return null
  return (
    <div className="mb-8">
      <h3 className="font-headline font-bold text-base text-mocha mb-3 border-b border-caramel/30 pb-2">
        {region}
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {rounds.map(r => {
          const regionGames = (gamesByRound[r] || []).filter(g => g.region === region)
          if (!regionGames.length) return null
          return (
            <div key={r}>
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">{getRoundName(r)}</p>
              <RoundColumn games={regionGames} picks={picks} isLocked={isLocked} onPick={onPick} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PickProgress({ picks, games }) {
  // Only count picks for games that currently exist
  const gameIdSet = new Set(games.map(g => g.id))
  const made = Object.keys(picks).filter(id => gameIdSet.has(Number(id))).length
  const total = games.length
  const pct = total > 0 ? Math.round((made / total) * 100) : 0

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

function MobileBracket({ roundNums, gamesByRound, picks, isLocked, onPick }) {
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
          const rDone = rGames.length > 0 && rGames.every(g => picks[g.id])
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

      {/* Games */}
      <div className="space-y-5">
        {Object.entries(groupByRegion(games)).map(([region, rgGames]) => (
          <div key={region}>
            {region !== 'undefined' && region !== 'Finals' && (
              <p className="text-xs font-bold text-caramel uppercase tracking-wider mb-3">{region}</p>
            )}
            <div className="space-y-4">
              {rgGames.map(game => (
                <GameSlot key={game.id} game={game} picks={picks} isLocked={isLocked} onPick={onPick} />
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

export default function BracketBuilder({ games, picks, isLocked, canSubmit, onPick, tiebreaker, onTiebreakerChange, onSubmit, saving }) {
  const gamesByRound = groupGamesByRound(games)
  const roundNums = Object.keys(gamesByRound).map(Number).sort((a, b) => a - b)
  const finalFourGames = gamesByRound[5] || []
  const champGame = (gamesByRound[6] || [])[0]

  // Derive regions from actual game data rather than hardcoding
  const regions = [...new Set(games.filter(g => g.region).map(g => g.region))]

  return (
    <div>
      {isLocked && (
        <div className="mb-6 bg-mocha/5 border border-mocha/20 rounded-xl px-4 py-3 text-mocha font-medium text-sm text-center">
          The buzzer sounded. Picks are final.
          {Object.keys(picks).length === 0 && (
            <span className="block text-mocha/60 font-normal mt-1">No picks were submitted before the tournament locked.</span>
          )}
        </div>
      )}

      {/* Desktop bracket */}
      <div className="hidden md:block">
        {regions.map(region => (
          <RegionBracket
            key={region}
            region={region}
            gamesByRound={gamesByRound}
            picks={picks}
            isLocked={isLocked}
            onPick={onPick}
          />
        ))}

        {(finalFourGames.length > 0 || champGame) && (
          <div className="mb-8">
            <h3 className="font-headline font-bold text-base text-mocha mb-3 border-b border-caramel/30 pb-2">
              Final Four &amp; Championship
            </h3>
            <div className="flex gap-6">
              {finalFourGames.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Final Four</p>
                  <RoundColumn games={finalFourGames} picks={picks} isLocked={isLocked} onPick={onPick} />
                </div>
              )}
              {champGame && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Championship</p>
                  <RoundColumn games={[champGame]} picks={picks} isLocked={isLocked} onPick={onPick} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile bracket */}
      <div className="md:hidden">
        <PickProgress picks={picks} games={games} />
        <MobileBracket
          roundNums={roundNums}
          gamesByRound={gamesByRound}
          picks={picks}
          isLocked={isLocked}
          onPick={onPick}
        />
      </div>

      {/* Tiebreaker */}
      <div className="card mt-8 bg-mocha/[0.03] border border-caramel/20">
        <label className="block font-headline font-semibold text-mocha mb-1">Tiebreaker</label>
        <p className="text-sm text-gray-500 mb-3">Predict the combined final score of the championship game.</p>
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

      {/* Submit — only shown before first submission */}
      {canSubmit && (
        <div className="mt-6 flex items-center gap-4">
          <button onClick={onSubmit} className="btn-primary px-8">Submit Bracket</button>
          {saving && <span className="text-sm text-gray-400 italic">Saving…</span>}
        </div>
      )}

      {/* Submitted but unlocked — show edit note */}
      {!isLocked && !canSubmit && (
        <div className="mt-6 text-sm text-gray-500 bg-orange/5 border border-orange/20 rounded-xl px-4 py-3">
          Your bracket is submitted. You can still edit picks until the tournament locks.
          {saving && <span className="ml-2 italic text-gray-400">Saving…</span>}
        </div>
      )}
    </div>
  )
}
