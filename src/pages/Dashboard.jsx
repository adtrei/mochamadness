import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BracketCard from '../components/BracketCard'
import PotSummary from '../components/PotSummary'
import LeaderboardTable from '../components/LeaderboardTable'
import OnboardingModal from '../components/OnboardingModal'
import { useAuth } from '../hooks/useAuth'
import { BracketService } from '../services/BracketService'
import { supabase } from '../services/supabase'
import { ScoreCalculator } from '../services/ScoreCalculator'

const MAX_BRACKETS = 3

export default function Dashboard() {
  const { session, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [brackets, setBrackets] = useState([])
  const [paidCount, setPaidCount] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [onboardingDone, setOnboardingDone] = useState(false)

  const showOnboarding = profile && !profile.first_name && !onboardingDone

  useEffect(() => {
    if (session) loadData()
  }, [session])

  async function loadData() {
    setLoading(true)
    try {
      const [myBrackets, paidResult, games, profilesResult] = await Promise.all([
        BracketService.getBracketsByUser(session.user.id),
        // Pot only counts paid, submitted/locked brackets
        supabase
          .from('brackets')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'complete'),
        BracketService.getGames(),
        supabase.from('profiles').select('id, display_name'),
      ])

      setBrackets(myBrackets || [])
      setPaidCount(paidResult.count || 0)

      if (games.length) {
        const { data: allBrackets, error: lbError } = await supabase
          .from('brackets')
          .select('*, bracket_picks(*)')
          .in('status', ['submitted', 'locked'])
        if (!lbError && allBrackets?.length) {
          const entries = ScoreCalculator.buildLeaderboard(
            allBrackets.map(b => ({ ...b, picks: b.bracket_picks })),
            games,
            profilesResult.data || []
          )
          setLeaderboard(entries.slice(0, 5))
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateBracket() {
    if (brackets.length >= MAX_BRACKETS) return
    setCreating(true)
    setError('')
    try {
      const bracket = await BracketService.createBracket(session.user.id, brackets.length + 1)
      navigate(`/bracket/${bracket.id}`)
    } catch (err) {
      setError(err.message)
      setCreating(false)
    }
  }

  const slots = Array.from({ length: MAX_BRACKETS }, (_, i) => brackets[i] || null)
  const displayName = profile?.display_name || session?.user?.email?.split('@')[0] || 'there'
  const slotsUsed = brackets.length
  const atLimit = slotsUsed >= MAX_BRACKETS

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      {/* Header banner */}
      <div className="bg-mocha text-cream">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-headline font-bold text-2xl sm:text-3xl">Hey, {displayName}!</h1>
            <p className="text-cream/60 text-sm mt-0.5">
              {atLimit
                ? "You're at the 3-bracket max. Good luck!"
                : `${MAX_BRACKETS - slotsUsed} bracket slot${MAX_BRACKETS - slotsUsed !== 1 ? 's' : ''} remaining · $20 each · pay after you submit`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {slots.map((b, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  b ? 'bg-orange border-orange' : 'bg-transparent border-cream/40'
                }`}
              />
            ))}
            <span className="text-cream/50 text-xs ml-1">{slotsUsed}/{MAX_BRACKETS}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading your brackets…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-headline font-bold text-xl text-mocha">My Brackets</h2>
                  {atLimit && (
                    <span className="text-xs font-semibold bg-mocha text-cream px-3 py-1 rounded-full">Full</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {slots.map((bracket, i) => (
                    <BracketCard
                      key={bracket?.id || `empty-${i}`}
                      bracket={bracket}
                      slotNumber={i + 1}
                      atLimit={atLimit}
                      onCreateBracket={handleCreateBracket}
                      creating={creating}
                    />
                  ))}
                </div>
              </div>

              {leaderboard.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-headline font-bold text-xl text-mocha">Leaderboard</h2>
                    <Link to="/leaderboard" className="text-sm text-orange hover:underline font-medium">See all →</Link>
                  </div>
                  <LeaderboardTable entries={leaderboard} />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <PotSummary totalBrackets={paidCount} />
              <a
                href="https://www.ncaa.com/march-madness-live/scores"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between card py-3 px-4 hover:shadow-md transition-shadow group"
              >
                <div>
                  <p className="font-headline font-semibold text-mocha text-sm">Live Scores</p>
                  <p className="text-xs text-gray-400 mt-0.5">Check game results on NCAA.com</p>
                </div>
                <svg className="w-4 h-4 text-orange group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <div className="card text-sm space-y-2">
                <p className="font-headline font-semibold text-mocha mb-1">Scoring Rules</p>
                {[['Round of 64', 1], ['Round of 32', 2], ['Sweet 16', 4], ['Elite 8', 8], ['Final Four', 16], ['Championship', 32]].map(([r, pts]) => (
                  <div key={r} className="flex justify-between text-gray-600">
                    <span>{r}</span>
                    <span className="font-bold text-mocha">{pts} pt{pts > 1 ? 's' : ''}</span>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                  Tiebreaker: closest championship score prediction.
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {showOnboarding && (
        <OnboardingModal
          userId={session.user.id}
          onComplete={async () => {
            await refreshProfile()
            setOnboardingDone(true)
          }}
        />
      )}
    </div>
  )
}
