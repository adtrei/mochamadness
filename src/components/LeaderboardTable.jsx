const RANK_STYLES = {
  1: 'bg-gold/20 text-yellow-700 font-bold',
  2: 'bg-gray-100 text-gray-600 font-bold',
  3: 'bg-caramel/20 text-caramel font-bold',
}

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function LeaderboardTable({ entries = [], limit }) {
  const rows = limit ? entries.slice(0, limit) : entries

  // Only show the Max column once scores have diverged from the pre-tournament max
  const showMax = rows.some(e => e.maxPossible !== undefined && e.maxPossible < 192)

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
            <th className="text-left px-4 py-3 font-headline font-semibold hidden sm:table-cell">User</th>
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
              className={`border-t border-gray-100 ${RANK_STYLES[entry.rank] || (i % 2 === 0 ? 'bg-white' : 'bg-cream/30')}`}
            >
              <td className="px-4 py-3 text-center">
                {RANK_MEDALS[entry.rank] || `#${entry.rank}`}
              </td>
              <td className="px-4 py-3 font-medium">{entry.name}</td>
              <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{entry.displayName}</td>
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
