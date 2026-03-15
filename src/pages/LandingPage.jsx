import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../hooks/useAuth'

export default function LandingPage() {
  const { session, profile } = useAuth()
  const displayName = profile?.display_name || profile?.first_name || null

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-24">
        <img
          src="/assets/logo.png"
          alt="Mocha Madness"
          className="w-28 h-28 md:w-40 md:h-40 object-contain mb-6 drop-shadow-lg"
        />
        <h1 className="font-headline font-extrabold text-5xl md:text-7xl text-mocha leading-tight mb-3">
          Mocha Madness
        </h1>
        <p className="text-lg md:text-2xl text-caramel font-medium mb-8">
          Pick your winners. Track your bracket. Win the pot.
        </p>

        {session ? (
          /* ── Logged-in state ── */
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-full px-4 py-1.5">
              ✓ Signed in{displayName ? ` as ${displayName}` : ''}
            </p>
            <Link to="/dashboard" className="btn-primary text-lg px-10 py-4">
              Go to My Brackets →
            </Link>
            <Link to="/leaderboard" className="text-sm text-caramel hover:underline">
              View leaderboard
            </Link>
          </div>
        ) : (
          /* ── Logged-out state ── */
          <div className="flex flex-col items-center gap-3">
            <Link to="/login" className="btn-primary text-lg px-10 py-4">
              Sign Up / Sign In →
            </Link>
            <p className="text-xs text-gray-400">
              Enter your email and we'll send you a magic link — no password needed.
            </p>
            <Link to="/leaderboard" className="text-sm text-caramel hover:underline mt-2">
              Just browsing? View the leaderboard
            </Link>
          </div>
        )}

        {/* How it works */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full text-left">
          {[
            !session && {
              icon: '✉️',
              title: '1. Sign In',
              desc: 'Enter your email. We send you a one-click magic link. No password, no app to download.',
            },
            {
              icon: '🏀',
              title: `${session ? '1' : '2'}. Make Your Picks`,
              desc: '$20 per bracket, up to 3 per person. Fill out your picks before tip-off, then pay via Venmo or Zelle.',
            },
            {
              icon: '🏆',
              title: `${session ? '2' : '3'}. Win the Pot`,
              desc: 'Top 3 brackets split the pot 70/20/10%. Tiebreaker: closest championship score prediction.',
            },
          ].filter(Boolean).map(step => (
            <div key={step.title} className="card hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-headline font-bold text-lg mb-1">{step.title}</h3>
              <p className="text-gray-500 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-mocha text-cream/50 text-center text-xs py-4 px-4">
        <p>Mocha Madness · Private bracket pool · Not a sportsbook</p>
        <p className="mt-1">Even Mocha didn't see that upset coming.</p>
      </footer>
    </div>
  )
}
