import { useState } from 'react'
import { supabase } from '../services/supabase'

export default function OnboardingModal({ userId, onComplete }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [username, setUsername]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const displayName = username.trim() || `${firstName.trim()} ${lastName.trim()}`
      const { error: err } = await supabase
        .from('profiles')
        .update({
          first_name:   firstName.trim(),
          last_name:    lastName.trim(),
          username:     username.trim() || null,
          display_name: displayName,
        })
        .eq('id', userId)
      if (err) throw err
      onComplete()
    } catch (err) {
      setError(err.message.includes('unique') ? 'That username is taken. Try another.' : err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <img src="/assets/logo.png" alt="Mocha Madness" className="w-16 h-16 mx-auto mb-3 object-contain" />
          <h2 className="font-headline font-bold text-2xl text-mocha">Welcome to Mocha Madness!</h2>
          <p className="text-gray-500 text-sm mt-1">Quick setup before you start picking.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mocha mb-1">First Name <span className="text-orange">*</span></label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Adam"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mocha mb-1">Last Name <span className="text-orange">*</span></label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Treitler"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-mocha mb-1">
              Username <span className="text-gray-400 font-normal">(optional — shown on leaderboard)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                placeholder="mochacat"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/50"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">If blank, your first + last name will appear on the leaderboard.</p>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full justify-center disabled:opacity-50 mt-2"
          >
            {saving ? 'Saving…' : "Let's go →"}
          </button>
        </form>
      </div>
    </div>
  )
}
