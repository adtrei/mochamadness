import { useState, useRef } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BracketBuilder from '../components/BracketBuilder'
import { useBracket } from '../hooks/useBracket'
import { useAuth } from '../hooks/useAuth'
import { BracketService } from '../services/BracketService'
import { EmailService } from '../services/EmailService'

function PaymentConfirmation({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-headline font-bold text-2xl text-mocha mb-2">Bracket Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your picks are locked in. Now send your $20 entry fee to secure your spot.
        </p>
        <div className="space-y-3 mb-6">
          <div className="bg-[#008CFF]/10 border border-[#008CFF]/30 rounded-xl px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-semibold text-[#008CFF] uppercase tracking-wider mb-0.5">Venmo</p>
                <p className="font-headline font-bold text-xl text-mocha">@adam-treitler</p>
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText('@adam-treitler')}
                className="text-xs text-[#008CFF] hover:underline ml-2 shrink-0"
              >Copy</button>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-0.5">Zelle</p>
                <p className="font-headline font-bold text-xl text-mocha">973-464-5650</p>
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText('973-464-5650')}
                className="text-xs text-purple-600 hover:underline ml-2 shrink-0"
              >Copy</button>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          Include your name or bracket name in the memo. Your bracket will show <strong>Payment Pending</strong> until confirmed.
        </p>
        <button onClick={onClose} className="btn-primary w-full">Got it — back to my bracket</button>
      </div>
    </div>
  )
}

function SubmitConfirmModal({ missingPicks, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="text-4xl mb-3">🏀</div>
        <h2 className="font-headline font-bold text-xl text-mocha mb-2">Submit your bracket?</h2>
        {missingPicks > 0 ? (
          <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4">
            You still have <strong>{missingPicks} unpicked game{missingPicks !== 1 ? 's' : ''}</strong>. Those games will score 0 points.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-4">All picks are in. You can still edit until the tournament locks.</p>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-secondary py-2 text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 btn-primary py-2 text-sm">Submit</button>
        </div>
      </div>
    </div>
  )
}

export default function BracketPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const { bracket, picks, games, loading, saving, error, makePick, updateTiebreaker, submitBracket } = useBracket(id)
  const [showPayment, setShowPayment] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const nameInputRef = useRef(null)

  function startEditName() {
    setNameValue(bracket.name || '')
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.select(), 0)
  }

  async function saveName() {
    const trimmed = nameValue.trim()
    if (trimmed && trimmed !== bracket.name) {
      await BracketService.updateBracket(bracket.id, { name: trimmed })
      bracket.name = trimmed
    }
    setEditingName(false)
  }

  async function handleSubmitConfirmed() {
    setShowConfirm(false)
    await submitBracket()
    setShowPayment(true)
    // Fire confirmation email — non-blocking, best-effort
    if (session?.user?.email) {
      EmailService.bracketSubmitted({
        to: session.user.email,
        firstName: profile?.first_name || profile?.display_name || 'there',
        bracketName: bracket.name,
      }).catch(() => {})
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-gray-400">Loading bracket…</div>
      </div>
    )
  }

  if (error || !bracket) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <p className="text-red-600 font-medium">{error || 'Bracket not found.'}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">← Back to Dashboard</button>
        </div>
      </div>
    )
  }

  // Ownership guard: redirect if this bracket doesn't belong to the current user
  if (session && bracket.user_id !== session.user.id) {
    return <Navigate to="/dashboard" replace />
  }

  const isLocked = bracket.status === 'locked'
  const isSubmitted = bracket.status === 'submitted'
  const canSubmit = !isLocked && !isSubmitted
  const missingPicks = games.length - Object.keys(picks).length
  const statusLabel = bracket.status
    ? bracket.status.charAt(0).toUpperCase() + bracket.status.slice(1)
    : 'Draft'

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <button onClick={() => navigate('/dashboard')} className="text-sm text-caramel hover:underline mb-1 block">
              ← Dashboard
            </button>
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                className="font-headline font-bold text-3xl text-mocha bg-transparent border-b-2 border-orange focus:outline-none w-full max-w-xs"
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="font-headline font-bold text-3xl text-mocha">{bracket.name}</h1>
                {!isLocked && (
                  <button
                    onClick={startEditName}
                    className="text-gray-400 hover:text-orange opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Rename bracket"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-gray-400 italic">Saving…</span>}
            <span className={`badge-${bracket.status}`}>{statusLabel}</span>
          </div>
        </div>

        {/* Payment reminder — shown for submitted AND locked unpaid brackets */}
        {['submitted', 'locked'].includes(bracket.status) && bracket.payment_status !== 'complete' && (
          <div className={`mb-6 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm
            ${bracket.payment_status === 'overdue'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}
          >
            <span>
              <strong>{bracket.payment_status === 'overdue' ? 'Payment Overdue' : 'Payment Pending'}</strong>
              {' '}— Send $20 via Venmo <strong>@adam-treitler</strong> or Zelle <strong>973-464-5650</strong>.
            </span>
            <button onClick={() => setShowPayment(true)} className="text-xs font-semibold underline hover:no-underline shrink-0">
              View payment details
            </button>
          </div>
        )}

        {games.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <p className="text-2xl mb-2">🏀</p>
            <p>The bracket isn't set up yet. Check back soon!</p>
          </div>
        ) : (
          <BracketBuilder
            games={games}
            picks={picks}
            isLocked={isLocked}
            canSubmit={canSubmit}
            onPick={makePick}
            tiebreaker={bracket.tiebreaker}
            onTiebreakerChange={updateTiebreaker}
            onSubmit={() => setShowConfirm(true)}
            saving={saving}
          />
        )}
      </main>

      {showConfirm && (
        <SubmitConfirmModal
          missingPicks={missingPicks}
          onConfirm={handleSubmitConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showPayment && <PaymentConfirmation onClose={() => setShowPayment(false)} />}
    </div>
  )
}
