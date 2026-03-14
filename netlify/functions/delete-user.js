import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const authHeader = event.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const token = authHeader.slice(7)

  const adminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Verify caller is authenticated
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
  if (authError || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  // Verify caller is admin
  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!callerProfile?.is_admin) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }
  }

  const { userId } = JSON.parse(event.body || '{}')
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) }
  }

  // Safety: prevent admin from deleting themselves
  if (userId === user.id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Cannot delete your own account.' }) }
  }

  // Delete picks → brackets → profile → auth user in order
  // (belt-and-suspenders in case foreign key cascades aren't set up)
  const { data: userBrackets } = await adminClient
    .from('brackets')
    .select('id')
    .eq('user_id', userId)

  if (userBrackets?.length) {
    const bracketIds = userBrackets.map(b => b.id)
    await adminClient.from('bracket_picks').delete().in('bracket_id', bracketIds)
    await adminClient.from('brackets').delete().in('id', bracketIds)
  }

  await adminClient.from('profiles').delete().eq('id', userId)

  // Delete from auth.users — requires service role
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
  if (deleteError) {
    return { statusCode: 500, body: JSON.stringify({ error: deleteError.message }) }
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) }
}
