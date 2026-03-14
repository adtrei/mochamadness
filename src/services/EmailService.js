import { supabase } from './supabase'

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

async function callFunction(name, body) {
  const token = await getToken()
  const res = await fetch(`/.netlify/functions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}))
    throw new Error(error || `Function ${name} failed`)
  }
  return res.json()
}

export const EmailService = {
  bracketSubmitted({ to, firstName, bracketName }) {
    return callFunction('send-email', {
      type: 'bracket-submitted',
      to, firstName, bracketName,
      subject: `${bracketName} is in — send your $20 entry fee`,
    })
  },

  paymentConfirmed({ to, firstName, bracketName, potTotal }) {
    return callFunction('send-email', {
      type: 'payment-confirmed',
      to, firstName, bracketName, potTotal,
      subject: 'Payment confirmed — you\'re officially in Mocha Madness!',
    })
  },

  tournamentLocked({ to, firstName, bracketNames, potTotal, bracketCount }) {
    return callFunction('send-email', {
      type: 'tournament-locked',
      to, firstName, bracketNames, potTotal, bracketCount,
      subject: '🔒 Picks are final — the tournament is live!',
    })
  },

  deleteUser(userId) {
    return callFunction('delete-user', { userId })
  },
}
