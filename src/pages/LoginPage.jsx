import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect already-authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && session) navigate('/dashboard', { replace: true })
  }, [session, authLoading])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="card w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/assets/logo.png" alt="Mocha Madness" className="w-20 h-20 mx-auto mb-4 object-contain" />
            <h1 className="font-headline font-bold text-3xl text-mocha">Sign In</h1>
            <p className="text-gray-500 mt-1 text-sm">We'll send you a magic link — no password needed.</p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="font-headline font-bold text-xl text-mocha mb-2">Check your email!</h2>
              <p className="text-gray-500 text-sm">
                We sent a magic link to <strong>{email}</strong>.<br />
                Click the link to sign in and start picking.
              </p>
              <button onClick={() => setSent(false)} className="mt-6 text-sm text-caramel hover:underline">
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mocha mb-1" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send Magic Link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-caramel hover:underline">← Back to home</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
