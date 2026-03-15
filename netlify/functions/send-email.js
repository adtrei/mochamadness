import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Mocha Madness <noreply@mochamadness.io>'

// ── Template generators ────────────────────────────────────────────────────

function header() {
  return `
    <tr>
      <td style="background-color:#3B2A26;padding:32px 40px;text-align:center;">
        <img src="https://mochamadness.io/assets/logo.png" alt="Mocha Madness" width="64" height="64"
             style="display:block;margin:0 auto 14px;border-radius:12px;object-fit:contain;" />
        <div style="font-size:22px;font-weight:800;color:#F2E8DA;letter-spacing:0.5px;text-transform:uppercase;">Mocha Madness</div>
        <div style="font-size:13px;color:#C98B4A;margin-top:4px;">March Madness · Private Bracket Pool</div>
      </td>
    </tr>`
}

function footer() {
  return `
    <tr>
      <td style="background-color:#3B2A26;padding:20px 40px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#F2E8DA;opacity:0.6;">Mocha Madness · Private bracket pool · Not a sportsbook</p>
        <p style="margin:0;font-size:11px;color:#C98B4A;">Even Mocha didn't see that upset coming.</p>
      </td>
    </tr>`
}

function wrap(rows) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
  <body style="margin:0;padding:0;background-color:#F2E8DA;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2E8DA;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(59,42,38,0.10);">
        ${rows}
      </table>
    </td></tr>
  </table>
  </body></html>`
}

function bracketSubmittedHtml({ firstName, bracketName }) {
  return wrap(`
    ${header()}
    <tr><td style="background-color:#E76F2F;padding:16px 40px;text-align:center;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">🎉 Your bracket is in!</p>
    </td></tr>
    <tr><td style="padding:36px 40px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#3B2A26;">Hey <strong>${firstName}</strong>,</p>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        <strong style="color:#3B2A26;">${bracketName}</strong> has been submitted. Your picks are locked in. Now send your $20 entry fee to secure your spot.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#3B2A26;text-transform:uppercase;letter-spacing:0.5px;">Entry Fee · $20</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
            <tr><td style="background-color:#EFF6FF;border-radius:8px;padding:12px 16px;">
              <span style="font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;">Venmo</span><br/>
              <span style="font-size:17px;font-weight:800;color:#3B2A26;">@adam-treitler</span>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background-color:#F5F3FF;border-radius:8px;padding:12px 16px;">
              <span style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;">Zelle</span><br/>
              <span style="font-size:17px;font-weight:800;color:#3B2A26;">973-464-5650</span>
            </td></tr>
          </table>
          <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Include your name or bracket name in the memo.</p>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px;">
        <tr><td style="border-radius:10px;background-color:#3B2A26;">
          <a href="https://mochamadness.io/dashboard" style="display:inline-block;padding:13px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">View My Bracket →</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#9ca3af;">The pot grows with every paid entry. Good luck — Mocha's watching. 🐱</p>
    </td></tr>
    ${footer()}`)
}

function paymentConfirmedHtml({ firstName, bracketName, potTotal }) {
  const first = Math.round(potTotal * 0.6)
  const second = Math.round(potTotal * 0.25)
  const third = Math.round(potTotal * 0.15)
  return wrap(`
    ${header()}
    <tr><td style="background-color:#16a34a;padding:16px 40px;text-align:center;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">✅ Payment confirmed — you're officially in!</p>
    </td></tr>
    <tr><td style="padding:36px 40px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#3B2A26;">Hey <strong>${firstName}</strong>,</p>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        Your $20 entry for <strong style="color:#3B2A26;">${bracketName}</strong> has been received and confirmed. You're locked and loaded.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#3B2A26;border-radius:12px;margin-bottom:28px;">
        <tr><td style="padding:24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#C98B4A;text-transform:uppercase;letter-spacing:0.5px;">Current Pot</p>
          <p style="margin:0 0 16px;font-size:36px;font-weight:800;color:#E76F2F;">$${potTotal}</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding:6px 0;border-top:1px solid rgba(255,255,255,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:13px;color:#C98B4A;font-weight:600;">🥇 1st Place</td>
                <td style="font-size:13px;color:#F2E8DA;font-weight:700;text-align:right;">$${first}</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:6px 0;border-top:1px solid rgba(255,255,255,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:13px;color:#d1d5db;font-weight:600;">🥈 2nd Place</td>
                <td style="font-size:13px;color:#F2E8DA;font-weight:700;text-align:right;">$${second}</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:6px 0;border-top:1px solid rgba(255,255,255,0.1);">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:13px;color:#C98B4A;font-weight:600;">🥉 3rd Place</td>
                <td style="font-size:13px;color:#F2E8DA;font-weight:700;text-align:right;">$${third}</td>
              </tr></table>
            </td></tr>
          </table>
          <p style="margin:12px 0 0;font-size:11px;color:rgba(242,232,218,0.4);">60/25/15% split · grows with every paid entry</p>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px;">
        <tr><td style="border-radius:10px;background-color:#E76F2F;">
          <a href="https://mochamadness.io/leaderboard" style="display:inline-block;padding:13px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">View the Leaderboard →</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#9ca3af;">May your bracket survive the first round. 🐱</p>
    </td></tr>
    ${footer()}`)
}

function tournamentLockedHtml({ firstName, bracketNames, potTotal, bracketCount }) {
  const bracketRows = bracketNames.map(name => `
    <tr><td style="padding:8px 0;border-top:1px solid #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:14px;font-weight:600;color:#3B2A26;">${name}</td>
        <td style="text-align:right;">
          <span style="font-size:11px;font-weight:700;background-color:#3B2A26;color:#F2E8DA;padding:3px 10px;border-radius:20px;">Locked</span>
        </td>
      </tr></table>
    </td></tr>`).join('')

  return wrap(`
    ${header()}
    <tr><td style="background-color:#E76F2F;padding:16px 40px;text-align:center;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">🔒 The buzzer sounded. Picks are final.</p>
    </td></tr>
    <tr><td style="padding:36px 40px 28px;">
      <p style="margin:0 0 16px;font-size:15px;color:#3B2A26;">Hey <strong>${firstName}</strong>,</p>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        The tournament is underway and all brackets are locked. Time to watch the games and see how your picks hold up.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#3B2A26;text-transform:uppercase;letter-spacing:0.5px;">Your Bracket${bracketNames.length !== 1 ? 's' : ''}</p>
          <table width="100%" cellpadding="0" cellspacing="0">${bracketRows}</table>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF7ED;border:1px solid #fed7aa;border-radius:12px;margin-bottom:28px;">
        <tr><td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">Total pot</p>
              <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#E76F2F;">$${potTotal}</p>
            </td>
            <td style="text-align:right;vertical-align:middle;">
              <p style="margin:0;font-size:12px;color:#92400e;">${bracketCount} brackets entered</p>
              <p style="margin:2px 0 0;font-size:11px;color:#b45309;">60 / 25 / 15% split</p>
            </td>
          </tr></table>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px;">
        <tr><td style="border-radius:10px;background-color:#E76F2F;">
          <a href="https://mochamadness.io/leaderboard" style="display:inline-block;padding:13px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Track the Leaderboard →</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#9ca3af;">The leaderboard updates live as results come in. Check back after each round.</p>
    </td></tr>
    ${footer()}`)
}

// ── Handler ────────────────────────────────────────────────────────────────

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

  // Verify caller has a valid session
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
  if (authError || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const body = JSON.parse(event.body || '{}')
  const { type, to, subject, ...data } = body

  // bracket-submitted: any authenticated user, but only to their own email
  // payment-confirmed / tournament-locked: admin only
  if (type === 'bracket-submitted') {
    if (to !== user.email) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Can only send to your own email' }) }
    }
  } else {
    const { data: callerProfile } = await adminClient.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!callerProfile?.is_admin) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }
    }
  }

  let html
  if (type === 'bracket-submitted') {
    html = bracketSubmittedHtml(data)
  } else if (type === 'payment-confirmed') {
    html = paymentConfirmedHtml(data)
  } else if (type === 'tournament-locked') {
    html = tournamentLockedHtml(data)
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown email type' }) }
  }

  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) }
}
