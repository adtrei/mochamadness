import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { session, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-mocha text-cream shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src="/assets/logo.png" alt="Mocha Madness" className="h-10 w-auto" />
          <span className="font-headline font-bold text-xl tracking-wide">Mocha Madness</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-orange transition-colors">Home</Link>
          <Link to="/leaderboard" className="hover:text-orange transition-colors">Leaderboard</Link>
          <a
            href="https://www.ncaa.com/march-madness-live/scores"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange transition-colors flex items-center gap-1 text-cream/70 hover:text-orange"
            title="Live game scores on NCAA.com"
          >
            Scores
            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          {session ? (
            <>
              <Link to="/dashboard" className="hover:text-orange transition-colors">My Brackets</Link>
              {profile?.is_admin && (
                <Link to="/admin" className="hover:text-orange transition-colors">Admin</Link>
              )}
              <button
                onClick={handleSignOut}
                className="bg-orange text-white px-4 py-1.5 rounded-lg hover:bg-opacity-90 transition-colors font-headline"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-orange text-white px-4 py-1.5 rounded-lg hover:bg-opacity-90 transition-colors font-headline"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 bg-cream mb-1"></span>
          <span className="block w-5 h-0.5 bg-cream mb-1"></span>
          <span className="block w-5 h-0.5 bg-cream"></span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-mocha border-t border-white/10 px-4 pb-4 flex flex-col gap-3 text-sm font-medium">
          <Link to="/" onClick={() => setMenuOpen(false)} className="py-2 hover:text-orange">Home</Link>
          <Link to="/leaderboard" onClick={() => setMenuOpen(false)} className="py-2 hover:text-orange">Leaderboard</Link>
          <a
            href="https://www.ncaa.com/march-madness-live/scores"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="py-2 hover:text-orange text-cream/70 flex items-center gap-1"
          >
            Scores
            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          {session ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="py-2 hover:text-orange">My Brackets</Link>
              {profile?.is_admin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="py-2 hover:text-orange">Admin</Link>
              )}
              <button onClick={handleSignOut} className="text-left py-2 hover:text-orange">Sign Out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="py-2 hover:text-orange">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  )
}
