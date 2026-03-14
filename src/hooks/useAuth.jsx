import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Prevent concurrent fetchProfile calls (getSession + onAuthStateChange can both fire on mount)
  const fetchingProfile = useRef(false)

  useEffect(() => {
    // onAuthStateChange handles all session states including the initial INITIAL_SESSION event,
    // so we don't need to call getSession separately.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    if (fetchingProfile.current) return
    fetchingProfile.current = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = row not found (acceptable for new users), all other errors are real
        console.error('Profile fetch error:', error.message)
      }
      setProfile(data || null)
    } finally {
      fetchingProfile.current = false
      setLoading(false)
    }
  }

  async function refreshProfile() {
    if (!session) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    setProfile(data || null)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
