import { Link } from 'react-router-dom'

const PAYMENT_STYLES = {
  pending:  'bg-yellow-50 text-yellow-700 border border-yellow-200',
  overdue:  'bg-red-50 text-red-700 border border-red-200',
  complete: 'bg-green-50 text-green-700 border border-green-200',
}

const PAYMENT_LABELS = {
  pending:  'Payment Pending',
  overdue:  'Payment Overdue',
  complete: 'Paid',
}

const STATUS_STYLES = {
  draft:     'bg-gray-100 text-gray-500',
  submitted: 'bg-orange/10 text-orange',
  locked:    'bg-mocha/10 text-mocha',
}

const STATUS_LABELS = {
  draft:     'Draft',
  submitted: 'Submitted',
  locked:    'Locked',
}

export default function BracketCard({ bracket, slotNumber, atLimit, onCreateBracket, creating }) {
  if (!bracket) {
    return (
      <div className={`card flex flex-col items-center justify-center min-h-[180px] gap-3 border-2 border-dashed transition-colors ${
        atLimit ? 'border-gray-200 bg-gray-50' : 'border-caramel/30 hover:border-caramel/60'
      }`}>
        <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-caramel font-headline font-bold text-lg">
          {slotNumber}
        </div>
        {atLimit ? (
          <p className="text-xs text-gray-400 text-center px-2">Max 3 brackets reached</p>
        ) : (
          <>
            <button
              onClick={onCreateBracket}
              disabled={creating}
              className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
            >
              {creating ? 'Creating…' : '+ Create Bracket'}
            </button>
            <p className="text-xs text-gray-400">$20 · pay after you submit</p>
          </>
        )}
      </div>
    )
  }

  const paymentStatus = bracket.payment_status || 'pending'
  const isLocked = bracket.status === 'locked'
  const isSubmitted = bracket.status === 'submitted'

  return (
    <div className="card flex flex-col gap-3 min-h-[180px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-headline font-bold text-base text-mocha leading-tight">{bracket.name}</h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[bracket.status]}`}>
          {STATUS_LABELS[bracket.status] || bracket.status}
        </span>
      </div>

      <p className="text-xs text-gray-400">
        Created {new Date(bracket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>

      {/* Payment badge */}
      <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg self-start ${PAYMENT_STYLES[paymentStatus]}`}>
        {PAYMENT_LABELS[paymentStatus]}
      </div>

      {isLocked && (
        <p className="text-xs text-mocha/60 bg-mocha/5 px-3 py-2 rounded-lg">
          The buzzer sounded. Picks are final.
        </p>
      )}

      {/* CTA */}
      <div className="mt-auto">
        <Link
          to={`/bracket/${bracket.id}`}
          className="block text-center btn-primary text-sm py-2"
        >
          {isLocked ? 'View Bracket' : isSubmitted ? 'View / Edit' : 'Fill Out Picks'}
        </Link>
      </div>
    </div>
  )
}
