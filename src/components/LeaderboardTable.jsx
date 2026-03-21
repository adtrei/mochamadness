import { useNavigate } from 'react-router-dom'

const RANK_STYLES = {
  1: 'bg-gold/20 text-yellow-700 font-bold',
  2: 'bg-gray-100 text-gray-600 font-bold',
  3: 'bg-caramel/20 text-caramel font-bold',
}

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

function ChampChip({ pick }) {
  if (!pick) return null
  if (pick.isCorrect) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full whitespace-nowrap">
        🏆 {pick.seed} {pick.name}
      </span>
    )
  }
  if (pick.isEliminated) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full line-through whitespace-nowrap">
        {pick.seed} {pick.name}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">
      {pick.seed} {pick.name}
    </span>
  )
}

export default function LeaderboardTable({ entries = [], limit }) {
  const navigate = useNavigate()
  const rows = limit ? entries.slice(0, limit) : entries

  // Only show Max column once scores have diverged from pre-tournament max
  const showMax = rows.some(e => e.maxPossible !== undefined && e.maxPossible < 192)
  // Only show Champ column when at least one bracket has made a champ pick
  const showChamp = rows.some(e => e.championPick)

  if (rows.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        <p className="text-2xl mb-2">🏀</p>
        <p>No scores yet. Check back once the tournament starts.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-mocha text-cream">
            <th className="text-left px-4 py-3 font-headline font-semibold w-12">Rank</th>
            <th className="text-left px-4 py-3 font-headline font-semibold">Bracket</th>
            <th className="text-left px-3 py-3 font-headline font-semibold hidden sm:table-cell">User</th>
            {showChamp && (
              <th className="text-left px-3 py-3 font-headline font-semibold hidden sm:table-cell text-cream/70">Champion</th>
            )}
            <th className="text-right px-4 py-3 font-headline font-semibold">Pts</th>
            {showMax && (
              <th className="text-right px-3 py-3 font-headline font-semibold text-cream/60 hidden sm:table-cell">Max</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, i) => (
            <tr
              key={entry.bracketId}
              onClick={() => navigate(`/bracket/${entry.bracketId}`)}
              className={`border-t border-gray-100 cursor-pointer hover:bg-orange/5 transition-colors ${
                RANK_STYLES[entry.rank] || (i % 2 === 0 ? 'bg-white' : 'bg-cream/30')
              }`}
            >
              <td className="px-4 py-3 text-center">
                {RANK_MEDALS[entry.rank] || `#${entry.rank}`}
              </td>
              <td className="px-4 py-3 font-medium">
                <span className="hover:text-orange transition-colors">{entry.name}</span>
                {/* Champion pick shown inline on mobile */}
                {showChamp && entry.championPick && (
                  <div className="sm:hidden mt-1">
                    <ChampChip pick={entry.championPick} />
                  </div>
                )}
              </td>
              <td className="px-3 py-3 text-gray-500 hidden sm:table-cell">{entry.displayName}</td>
              {showChamp && (
                <td className="px-3 py-3 hidden sm:table-cell">
                  {entry.championPick
                    ? <ChampChip pick={entry.championPick} />
                    : <span className="text-gray-300 text-xs">—</span>
                  }
                </td>
              )}
              <td className="px-4 py-3 text-right font-bold text-orange">{entry.score}</td>
              {showMax && (
                <td className="px-3 py-3 text-right text-gray-400 text-xs hidden sm:table-cell">
                  {entry.maxPossible ?? '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
