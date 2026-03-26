/**
 * One-time script: send Sweet 16 update email to all active participants.
 *
 * Usage (PowerShell):
 *   $env:RESEND_API_KEY="re_xxx"
 *   $env:SUPABASE_URL="https://xxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJxxx"
 *   node scripts/send-sweet16.mjs
 *
 * Usage (bash):
 *   RESEND_API_KEY=re_xxx SUPABASE_URL=https://xxx.supabase.co \
 *     SUPABASE_SERVICE_ROLE_KEY=eyJxxx node scripts/send-sweet16.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Config ──────────────────────────────────────────────────────────────────

const RESEND_API_KEY          = process.env.RESEND_API_KEY
const SUPABASE_URL            = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const FROM    = 'Mocha Madness <meow@mochamadness.io>'
const SUBJECT = "Mocha Madness 2026: Who's Still Alive? Sweet 16 Preview"

// ── Validation ───────────────────────────────────────────────────────────────

if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌  Missing required environment variables:')
  if (!RESEND_API_KEY)            console.error('   RESEND_API_KEY')
  if (!SUPABASE_URL)              console.error('   SUPABASE_URL')
  if (!SUPABASE_SERVICE_ROLE_KEY) console.error('   SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nSet them before running this script.\n')
  process.exit(1)
}

// ── Load template ────────────────────────────────────────────────────────────

const html = readFileSync(
  join(__dirname, '../email-templates/Sweet 16 Email.html'),
  'utf8'
)

// ── Fetch recipients ──────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Get all user_ids with at least one submitted or locked bracket
const { data: brackets, error: bracketsError } = await supabase
  .from('brackets')
  .select('user_id')
  .in('status', ['submitted', 'locked'])

if (bracketsError) {
  console.error('❌  Failed to fetch brackets:', bracketsError.message)
  process.exit(1)
}

const userIds = [...new Set(brackets.map(b => b.user_id))]

if (!userIds.length) {
  console.log('No participants found with submitted or locked brackets. Nothing to send.')
  process.exit(0)
}

// Resolve unique emails from profiles
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('email')
  .in('id', userIds)
  .not('email', 'is', null)

if (profilesError) {
  console.error('❌  Failed to fetch profiles:', profilesError.message)
  process.exit(1)
}

const emails = [...new Set(profiles.map(p => p.email).filter(Boolean))]

console.log(`\n📧  Sending Sweet 16 email to ${emails.length} participant${emails.length !== 1 ? 's' : ''}...\n`)

// ── Send ──────────────────────────────────────────────────────────────────────

const resend = new Resend(RESEND_API_KEY)
let sent = 0, failed = 0

for (const to of emails) {
  const { error: sendError } = await resend.emails.send({ from: FROM, to, subject: SUBJECT, html })
  if (sendError) {
    console.error(`  ✗  ${to}  —  ${sendError.message}`)
    failed++
  } else {
    console.log(`  ✓  ${to}`)
    sent++
  }
  // Small delay to stay well within Resend rate limits
  await new Promise(r => setTimeout(r, 150))
}

console.log(`\n✅  Done — ${sent} sent${failed ? `, ${failed} failed` : ''}.`)
