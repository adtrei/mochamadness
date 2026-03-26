import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { BracketService } from '../services/BracketService'
import { supabase } from '../services/supabase'
import { EmailService } from '../services/EmailService'
import sweet16Html from '../../email-templates/Sweet 16 Email.html?raw'

const TABS = ['Games', 'Payments', 'Users', 'Brackets', 'Emails']

const BLAST_TEMPLATES = [
  {
    id: 'sweet16',
    label: 'Sweet 16 Preview',
    subject: "Mocha Madness 2026: Who's Still Alive? Sweet 16 Preview",
    html: sweet16Html,
  },
]

const PAYMENT_STATUS_OPTIONS = ['pending', 'overdue', 'complete']

const PAYMENT_STYLES = {
  pending:  'bg-yellow-50 text-yellow-700',
  overdue:  'bg-red-50 text-red-700',
  complete: 'bg-green-50 text-green-700',
}

const ROUND_NAMES = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship']

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('Games')
  const [users, setUsers] = useState([])
  const [brackets, setBrackets] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [message, setMessage] = useState({ text: '', type: 'success' })
  const [lockingAll, setLockingAll] = useState(false)
  const [blastTarget, setBlastTarget] = useState(null)   // BLAST_TEMPLATES entry
  const [blasting, setBlasting] = useState(false)
  const [blastResult, setBlastResult] = useState(null)   // { sent, failed }
  const [deleteTarget, setDeleteTarget] = useState(null)   // { id, email, name }
  const [deleteStep, setDeleteStep] = useState(1)          // 1 = confirm, 2 = type email
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const flashTimer = useRef(null)

  useEffect(() => {
    loadAll()
    return () => clearTimeout(flashTimer.current)
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [gamesData, profilesResult, bracketsResult] = await Promise.all([
        BracketService.getGames(),
        supabase.from('profiles').select('*, brackets(count)'),
        supabase.from('brackets').select('*, profiles(email, display_name)').order('created_at', { ascending: true }),
      ])
      if (profilesResult.error) throw profilesResult.error
      if (bracketsResult.error) throw bracketsResult.error
      setGames(gamesData || [])
      setUsers(profilesResult.data || [])
      setBrackets(bracketsResult.data || [])
    } catch (err) {
      flash('Failed to load data: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function flash(text, type = 'success') {
    setMessage({ text, type })
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setMessage({ text: '', type: 'success' }), 3500)
  }

  async function setPaymentStatus(bracketId, status) {
    setSaving(bracketId)
    try {
      const { error } = await supabase.from('brackets').update({ payment_status: status }).eq('id', bracketId)
      if (error) throw error
      setBrackets(prev => prev.map(b => b.id === bracketId ? { ...b, payment_status: status } : b))
      flash('Payment status updated.')
    } catch (err) {
      flash('Error: ' + err.message, 'error')
    } finally {
      setSaving(null)
    }
  }

  async function setWinner(gameId, winnerId) {
    setSaving(gameId)
    try {
      const { error } = await supabase.from('games').update({ winner_id: winnerId || null }).eq('id', gameId)
      if (error) throw error
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, winner_id: winnerId || null } : g))
      flash('Winner saved.')
    } catch (err) {
      flash('Error: ' + err.message, 'error')
    } finally {
      setSaving(null)
    }
  }

  async function setTiebreakerScore(gameId, score) {
    setSaving(`tb-${gameId}`)
    try {
      const val = parseInt(score) || null
      const { error } = await supabase.from('games').update({ tiebreaker_score: val }).eq('id', gameId)
      if (error) throw error
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, tiebreaker_score: val } : g))
      flash('Championship score saved.')
    } catch (err) {
      flash('Error: ' + err.message, 'error')
    } finally {
      setSaving(null)
    }
  }

  async function lockAllSubmitted() {
    setLockingAll(true)
    try {
      const { error } = await supabase
        .from('brackets')
        .update({ status: 'locked' })
        .eq('status', 'submitted')
      if (error) throw error
      setBrackets(prev => prev.map(b => b.status === 'submitted' ? { ...b, status: 'locked' } : b))
      flash('All submitted brackets are now locked.')

      // Email every user whose bracket(s) just got locked
      const { count: paidCount } = await supabase
        .from('brackets').select('*', { count: 'exact', head: true }).eq('payment_status', 'complete')
      const potTotal = (paidCount || 0) * 20
      const bracketCount = brackets.filter(b => ['submitted', 'locked'].includes(b.status)).length

      // Group brackets by user
      const byUser = {}
      brackets.filter(b => b.status === 'submitted').forEach(b => {
        if (!byUser[b.user_id]) byUser[b.user_id] = []
        byUser[b.user_id].push(b.name)
      })

      for (const [userId, bracketNames] of Object.entries(byUser)) {
        const { data: profile } = await supabase
          .from('profiles').select('email, first_name, display_name').eq('id', userId).single()
        if (profile?.email) {
          EmailService.tournamentLocked({
            to: profile.email,
            firstName: profile.first_name || profile.display_name || 'there',
            bracketNames,
            potTotal,
            bracketCount,
          }).catch(() => {})
        }
      }
    } catch (err) {
      flash('Error: ' + err.message, 'error')
    } finally {
      setLockingAll(false)
    }
  }

  async function sendBlast(template) {
    setBlasting(true)
    setBlastResult(null)
    try {
      const result = await EmailService.blast({ subject: template.subject, html: template.html })
      setBlastResult({ sent: result.sent, failed: result.failed })
      flash(`Sent to ${result.sent} participant${result.sent !== 1 ? 's' : ''}${result.failed ? ` (${result.failed} failed)` : ''}.`)
    } catch (err) {
      flash('Blast failed: ' + err.message, 'error')
    } finally {
      setBlasting(false)
      setBlastTarget(null)
    }
  }

  function openDeleteModal(user) {
    setDeleteTarget({ id: user.id, email: user.email, name: user.display_name || user.email })
    setDeleteStep(1)
    setDeleteConfirmInput('')
  }

  function closeDeleteModal() {
    setDeleteTarget(null)
    setDeleteStep(1)
    setDeleteConfirmInput('')
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await EmailService.deleteUser(deleteTarget.id)
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setBrackets(prev => prev.filter(b => b.user_id !== deleteTarget.id))
      closeDeleteModal()
      flash(`Deleted ${deleteTarget.email}.`)
    } catch (err) {
      flash('Delete failed: ' + err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function setPaymentStatusAndEmail(bracketId, status) {
    await setPaymentStatus(bracketId, status)
    if (status !== 'complete') return
    // Find bracket + user profile to send confirmation email
    const bracket = brackets.find(b => b.id === bracketId)
    if (!bracket) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, display_name')
      .eq('id', bracket.user_id)
      .single()
    const { count: paidCount } = await supabase
      .from('brackets')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'complete')
    if (profile?.email) {
      EmailService.paymentConfirmed({
        to: profile.email,
        firstName: profile.first_name || profile.display_name || 'there',
        bracketName: bracket.name,
        potTotal: (paidCount || 0) * 20,
      }).catch(() => {})
    }
  }

  const paymentCounts = brackets.reduce((acc, b) => {
    const s = b.payment_status || 'pending'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const gamesWithWinners = games.filter(g => g.winner_id).length
  const totalGames = games.length
  const submittedCount = brackets.filter(b => b.status === 'submitted').length

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-headline font-bold text-3xl text-mocha">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage game results, payments, users, and brackets.</p>
          </div>
          <button
            onClick={loadAll}
            className="btn-secondary text-xs py-1.5 px-3 shrink-0"
          >
            ↺ Refresh
          </button>
        </div>

        {message.text && (
          <div className={`mb-4 text-sm px-4 py-3 rounded-xl border ${
            message.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-2.5 font-headline font-semibold text-sm transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-orange text-orange'
                  : 'border-transparent text-gray-400 hover:text-mocha'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card text-center py-16 text-gray-400">Loading…</div>
        ) : (
          <>
            {/* ── GAMES TAB ── */}
            {activeTab === 'Games' && (
              <div className="space-y-4">

                {/* Progress + actions header */}
                <div className="card flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <p className="font-headline font-bold text-mocha">
                      {gamesWithWinners} / {totalGames} results entered
                    </p>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full w-48 overflow-hidden">
                      <div
                        className="h-full bg-orange rounded-full transition-all"
                        style={{ width: totalGames > 0 ? `${(gamesWithWinners / totalGames) * 100}%` : '0%' }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Leaderboard scores update automatically as you enter results.
                    </p>
                  </div>
                  {submittedCount > 0 && (
                    <button
                      onClick={lockAllSubmitted}
                      disabled={lockingAll}
                      className="btn-primary text-sm py-2 px-4 disabled:opacity-50 shrink-0"
                    >
                      {lockingAll ? 'Locking…' : `Lock ${submittedCount} Submitted Bracket${submittedCount !== 1 ? 's' : ''}`}
                    </button>
                  )}
                </div>

                {/* Game rounds */}
                {[1, 2, 3, 4, 5, 6].map(round => {
                  const roundGames = games.filter(g => g.round === round)
                  if (!roundGames.length) return null
                  const setCount = roundGames.filter(g => g.winner_id).length
                  return (
                    <div key={round} className="card">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-headline font-bold text-mocha">{ROUND_NAMES[round - 1]}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          setCount === roundGames.length
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {setCount}/{roundGames.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {roundGames.map(game => (
                          <div key={game.id} className={`flex items-center gap-3 flex-wrap p-2 rounded-lg text-sm transition-colors ${
                            game.winner_id ? 'bg-green-50/50' : 'bg-gray-50'
                          }`}>
                            {game.region && (
                              <span className="text-gray-400 text-xs w-16 shrink-0">{game.region}</span>
                            )}
                            <span className="font-medium shrink-0 flex-1 min-w-[140px]">
                              {game.team1?.name || '?'} <span className="text-gray-300">vs</span> {game.team2?.name || '?'}
                            </span>
                            <select
                              value={game.winner_id || ''}
                              onChange={e => { const v = parseInt(e.target.value); setWinner(game.id, isNaN(v) ? null : v) }}
                              disabled={saving === game.id}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange/50 disabled:opacity-50"
                            >
                              <option value="">— Set winner —</option>
                              {game.team1 && <option value={game.team1.id}>{game.team1.name}</option>}
                              {game.team2 && <option value={game.team2.id}>{game.team2.name}</option>}
                            </select>
                            {game.winner_id && (
                              <span className="text-green-600 text-xs font-semibold">
                                ✓ {[game.team1, game.team2].find(t => String(t?.id) === String(game.winner_id))?.name}
                              </span>
                            )}
                            {/* Championship tiebreaker score input */}
                            {round === 6 && (
                              <div className="flex items-center gap-2 ml-auto">
                                <label className="text-xs text-gray-400 shrink-0">Final score:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="300"
                                  placeholder="e.g. 143"
                                  value={game.tiebreaker_score || ''}
                                  onChange={e => setTiebreakerScore(game.id, e.target.value)}
                                  disabled={saving === `tb-${game.id}`}
                                  className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange/50 disabled:opacity-50"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {!games.length && (
                  <div className="card text-center py-12 text-gray-400">No games set up yet.</div>
                )}
              </div>
            )}

            {/* ── PAYMENTS TAB ── */}
            {activeTab === 'Payments' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[['pending', 'Pending'], ['overdue', 'Overdue'], ['complete', 'Paid']].map(([status, label]) => (
                    <div key={status} className={`card py-5 text-center ${PAYMENT_STYLES[status]}`}>
                      <p className="font-headline font-bold text-3xl">{paymentCounts[status] || 0}</p>
                      <p className="text-xs font-semibold mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Mobile card list */}
                <div className="sm:hidden space-y-3">
                  {brackets.length === 0 && (
                    <div className="card text-center py-8 text-gray-400 text-sm">No brackets yet.</div>
                  )}
                  {brackets.map(b => (
                    <div key={b.id} className="card flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-mocha text-sm truncate">{b.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {b.profiles?.display_name || b.profiles?.email || '—'}
                        </p>
                        <span className={`mt-1 inline-block badge-${b.status} text-xs`}>{b.status}</span>
                      </div>
                      <select
                        value={b.payment_status || 'pending'}
                        onChange={e => setPaymentStatusAndEmail(b.id, e.target.value)}
                        disabled={saving === b.id}
                        className="shrink-0 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange/50 disabled:opacity-50"
                      >
                        {PAYMENT_STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block card overflow-hidden p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-mocha text-cream">
                        <th className="text-left px-4 py-3">Bracket</th>
                        <th className="text-left px-4 py-3">User</th>
                        <th className="text-center px-4 py-3">Status</th>
                        <th className="text-center px-4 py-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brackets.map((b, i) => (
                        <tr key={b.id} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-cream/30'}`}>
                          <td className="px-4 py-3 font-medium">{b.name}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {b.profiles?.display_name || b.profiles?.email || '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`badge-${b.status}`}>{b.status}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <select
                              value={b.payment_status || 'pending'}
                              onChange={e => setPaymentStatusAndEmail(b.id, e.target.value)}
                              disabled={saving === b.id}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-orange/50 disabled:opacity-50"
                            >
                              {PAYMENT_STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                      {!brackets.length && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No brackets yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-gray-400">
                  Collect $20/bracket via Venmo <strong className="text-mocha">@adam-treitler</strong> or Zelle <strong className="text-mocha">973-464-5650</strong>.
                </p>
              </div>
            )}

            {/* ── USERS TAB ── */}
            {activeTab === 'Users' && (
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-mocha text-cream">
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Name</th>
                      <th className="text-center px-4 py-3">Admin</th>
                      <th className="text-center px-4 py-3">Brackets</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, i) => (
                      <tr key={user.id} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-cream/30'}`}>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{user.display_name || '—'}</td>
                        <td className="px-4 py-3 text-center">{user.is_admin ? '✅' : '—'}</td>
                        <td className="px-4 py-3 text-center">{user.brackets?.[0]?.count || 0}</td>
                        <td className="px-4 py-3 text-center">
                          {!user.is_admin && (
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="text-red-400 hover:text-red-600 transition-colors p-1 rounded"
                              title="Delete user"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!users.length && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No users yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── EMAILS TAB ── */}
            {activeTab === 'Emails' && (
              <div className="space-y-4">
                <div className="card">
                  <p className="font-headline font-bold text-mocha mb-1">Email Blasts</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Send a broadcast to all participants with submitted or locked brackets.
                  </p>
                  <div className="space-y-3">
                    {BLAST_TEMPLATES.map(t => (
                      <div key={t.id} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-mocha">{t.label}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{t.subject}</p>
                        </div>
                        <button
                          onClick={() => setBlastTarget(t)}
                          disabled={blasting}
                          className="btn-primary text-sm py-1.5 px-4 shrink-0 disabled:opacity-50"
                        >
                          Send to All →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {blastResult && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                    Last blast: <strong>{blastResult.sent}</strong> sent{blastResult.failed > 0 && <>, <strong>{blastResult.failed}</strong> failed</>}.
                  </div>
                )}
              </div>
            )}

            {/* ── BRACKETS TAB ── */}
            {activeTab === 'Brackets' && (
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-mocha text-cream">
                      <th className="text-left px-4 py-3">Bracket</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">User</th>
                      <th className="text-center px-4 py-3">Status</th>
                      <th className="text-center px-4 py-3">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brackets.map((b, i) => (
                      <tr key={b.id} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-cream/30'}`}>
                        <td className="px-4 py-3 font-medium">{b.name}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{b.profiles?.email}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`badge-${b.status}`}>{b.status}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_STYLES[b.payment_status || 'pending']}`}>
                            {b.payment_status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!brackets.length && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No brackets yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Blast Confirm Modal ── */}
      {blastTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">📧</div>
              <h2 className="font-headline font-bold text-xl text-mocha mb-1">Send email blast?</h2>
              <p className="text-sm text-gray-500 mb-1"><strong className="text-mocha">{blastTarget.label}</strong></p>
              <p className="text-xs text-gray-400">{blastTarget.subject}</p>
            </div>
            <div className="bg-orange/5 border border-orange/20 rounded-lg px-3 py-2 text-xs text-orange-900 mb-5">
              This will send to every participant with a submitted or locked bracket. This cannot be undone.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setBlastTarget(null)} disabled={blasting} className="flex-1 btn-secondary py-2 text-sm">
                Cancel
              </button>
              <button
                onClick={() => sendBlast(blastTarget)}
                disabled={blasting}
                className="flex-1 btn-primary py-2 text-sm disabled:opacity-50"
              >
                {blasting ? 'Sending…' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete User Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            {deleteStep === 1 ? (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h2 className="font-headline font-bold text-xl text-mocha mb-1">Delete this account?</h2>
                  <p className="text-sm text-gray-500">
                    You're about to permanently delete <strong className="text-mocha">{deleteTarget.name}</strong>.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{deleteTarget.email}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-5">
                  This will permanently remove their account, all brackets, and all picks. This cannot be undone.
                </div>
                <div className="flex gap-3">
                  <button onClick={closeDeleteModal} className="flex-1 btn-secondary py-2 text-sm">Cancel</button>
                  <button onClick={() => setDeleteStep(2)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
                    Continue →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <h2 className="font-headline font-bold text-xl text-mocha mb-1">Confirm deletion</h2>
                  <p className="text-sm text-gray-500">
                    Type <strong className="text-red-600 font-mono">{deleteTarget.email}</strong> to confirm.
                  </p>
                </div>
                <input
                  type="email"
                  autoFocus
                  value={deleteConfirmInput}
                  onChange={e => setDeleteConfirmInput(e.target.value)}
                  placeholder={deleteTarget.email}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                />
                <div className="flex gap-3">
                  <button onClick={closeDeleteModal} className="flex-1 btn-secondary py-2 text-sm">Cancel</button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteConfirmInput !== deleteTarget.email || deleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    {deleting ? 'Deleting…' : 'Delete Forever'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
