const ROUND_POINTS = {
  1: 1,   // Round of 64
  2: 2,   // Round of 32
  3: 4,   // Sweet 16
  4: 8,   // Elite 8
  5: 16,  // Final Four
  6: 32,  // Championship
}

export const ScoreCalculator = {
  /**
   * Calculate score for a single bracket.
   * @param {Array} picks - array of { game_id, picked_winner_id }
   * @param {Array} games - array of { id, round, winner_id }
   * @returns {number} total score
   */
  calculateBracketScore(picks, games) {
    const gameMap = Object.fromEntries(games.map(g => [g.id, g]))
    let score = 0

    for (const pick of picks) {
      const game = gameMap[pick.game_id]
      if (!game || !game.winner_id) continue
      if (pick.picked_winner_id === game.winner_id) {
        score += ROUND_POINTS[game.round] || 0
      }
    }

    return score
  },

  /**
   * Calculate the maximum points still achievable for a bracket.
   * Counts correct picks from decided games + future picks where team is still alive.
   * @param {Array} picks - array of { game_id, picked_winner_id }
   * @param {Array} games - array of { id, round, team1_id, team2_id, winner_id }
   * @returns {number} max possible score
   */
  calculateMaxPossible(picks, games) {
    const gameMap = Object.fromEntries(games.map(g => [g.id, g]))

    // Build set of eliminated team IDs (losers of decided games)
    const eliminated = new Set()
    games.forEach(g => {
      if (!g.winner_id) return
      const loserId = g.team1_id === g.winner_id ? g.team2_id : g.team1_id
      if (loserId) eliminated.add(loserId)
    })

    let maxPossible = 0
    for (const pick of picks) {
      const game = gameMap[pick.game_id]
      if (!game || !pick.picked_winner_id) continue
      const pts = ROUND_POINTS[game.round] || 0
      if (game.winner_id) {
        if (pick.picked_winner_id === game.winner_id) maxPossible += pts
      } else {
        if (!eliminated.has(pick.picked_winner_id)) maxPossible += pts
      }
    }
    return maxPossible
  },

  /**
   * Calculate scores for all brackets, returns sorted leaderboard entries.
   * @param {Array} brackets - array of { id, user_id, tiebreaker, picks: [...] }
   * @param {Array} games - array of game records
   * @param {Array} profiles - array of { id, display_name, email }
   * @returns {Array} sorted leaderboard entries
   */
  buildLeaderboard(brackets, games, profiles) {
    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))

    const entries = brackets.map(bracket => ({
      bracketId: bracket.id,
      userId: bracket.user_id,
      name: bracket.name,
      displayName: profileMap[bracket.user_id]?.display_name || 'Player',
      score: ScoreCalculator.calculateBracketScore(bracket.picks || [], games),
      maxPossible: ScoreCalculator.calculateMaxPossible(bracket.picks || [], games),
      tiebreaker: bracket.tiebreaker,
    }))

    // Sort: highest score first, then by tiebreaker (closest to actual champ score)
    const champGame = games.find(g => g.round === 6)
    const actualChampScore = champGame?.tiebreaker_score || null

    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (actualChampScore !== null) {
        const diffA = Math.abs((a.tiebreaker || 0) - actualChampScore)
        const diffB = Math.abs((b.tiebreaker || 0) - actualChampScore)
        return diffA - diffB
      }
      return 0
    })

    return entries.map((entry, i) => ({ ...entry, rank: i + 1 }))
  },

  ROUND_POINTS,
}
