/**
 * Given a changed game pick, find all downstream game slots that depended on
 * that pick and clear them.
 *
 * @param {Object} picks - current picks map { [gameId]: winnerId }
 * @param {number} changedGameId - the game whose pick just changed
 * @param {Array} games - full games array with next_game_id and next_slot
 * @returns {Object} new picks map with downstream picks cleared
 */
export function clearDownstreamPicks(picks, changedGameId, games) {
  const newPicks = { ...picks }
  const gameMap = Object.fromEntries(games.map(g => [g.id, g]))

  // BFS/DFS through the bracket tree to clear picks that cascade from changedGameId
  const queue = [changedGameId]
  while (queue.length) {
    const gameId = queue.shift()
    const game = gameMap[gameId]
    if (!game || !game.next_game_id) continue

    const nextGame = gameMap[game.next_game_id]
    if (!nextGame) continue

    // If the winner of this game was picked in the next game, clear that pick too
    const pickedInNext = newPicks[nextGame.id]
    const previousWinner = picks[gameId]

    if (pickedInNext && pickedInNext === previousWinner) {
      delete newPicks[nextGame.id]
      queue.push(nextGame.id)
    }
  }

  return newPicks
}

/**
 * Get round name from round number.
 */
export function getRoundName(round) {
  const names = {
    1: 'Round of 64',
    2: 'Round of 32',
    3: 'Sweet 16',
    4: 'Elite 8',
    5: 'Final Four',
    6: 'Championship',
  }
  return names[round] || `Round ${round}`
}

/**
 * Group games by round.
 */
export function groupGamesByRound(games) {
  return games.reduce((acc, game) => {
    if (!acc[game.round]) acc[game.round] = []
    acc[game.round].push(game)
    return acc
  }, {})
}

/**
 * Group games by region within a round.
 */
export function groupByRegion(games) {
  return games.reduce((acc, game) => {
    const key = game.region || 'Finals'
    if (!acc[key]) acc[key] = []
    acc[key].push(game)
    return acc
  }, {})
}

/**
 * Point values per round.
 */
export const ROUND_POINTS = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 }
