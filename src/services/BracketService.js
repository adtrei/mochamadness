import { supabase } from './supabase'

export const BracketService = {
  async getBracketsByUser(userId) {
    const { data, error } = await supabase
      .from('brackets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async getBracket(bracketId) {
    const { data, error } = await supabase
      .from('brackets')
      .select('*')
      .eq('id', bracketId)
      .single()
    if (error) throw error
    return data
  },

  async createBracket(userId, bracketNumber, firstName) {
    const { count, error: countError } = await supabase
      .from('brackets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (countError) throw countError
    if (count >= 3) throw new Error('You\'ve reached the maximum of 3 brackets.')

    const bracketName = firstName
      ? `${firstName}'s Bracket ${bracketNumber}`
      : `My Bracket ${bracketNumber}`

    const { data, error } = await supabase
      .from('brackets')
      .insert({
        user_id: userId,
        name: bracketName,
        status: 'draft',
        payment_status: 'pending',
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getPicks(bracketId) {
    const { data, error } = await supabase
      .from('bracket_picks')
      .select('*')
      .eq('bracket_id', bracketId)
    if (error) throw error
    return data
  },

  async savePick(bracketId, gameId, pickedWinnerId) {
    const { error } = await supabase
      .from('bracket_picks')
      .upsert(
        { bracket_id: bracketId, game_id: gameId, picked_winner_id: pickedWinnerId },
        { onConflict: 'bracket_id,game_id' }
      )
    if (error) throw error
  },

  async deletePick(bracketId, gameId) {
    const { error } = await supabase
      .from('bracket_picks')
      .delete()
      .eq('bracket_id', bracketId)
      .eq('game_id', gameId)
    if (error) throw error
  },

  async updateBracket(bracketId, updates) {
    const { data, error } = await supabase
      .from('brackets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', bracketId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async submitBracket(bracketId) {
    return BracketService.updateBracket(bracketId, { status: 'submitted' })
  },

  async getGames() {
    const { data, error } = await supabase
      .from('games')
      .select('*, team1:team1_id(*), team2:team2_id(*), winner:winner_id(*)')
      .order('round', { ascending: true })
      .order('game_order', { ascending: true })
    if (error) throw error
    return data
  },

  async getTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('region')
      .order('seed')
    if (error) throw error
    return data
  },
}
