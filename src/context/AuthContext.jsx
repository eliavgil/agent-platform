import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getProfile } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

const LOCAL_ADMIN_KEY = '_app_adm'
const ADMIN_USER = { id: 'local-admin', email: 'admin@local', role: 'admin' }
const ADMIN_PROFILE = { id: 'local-admin', full_name: 'מנהל', role: 'admin', email: 'admin@local' }

function clearSupabaseStorage() {
  Object.keys(localStorage)
    .filter(k => k.startsWith('sb-'))
    .forEach(k => localStorage.removeItem(k))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for local admin session first
    if (localStorage.getItem(LOCAL_ADMIN_KEY) === '1') {
      setUser(ADMIN_USER)
      setProfile(ADMIN_PROFILE)
      setLoading(false)
      return
    }

    const timeout = setTimeout(() => setLoading(false), 6000)

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error || !session) {
          setUser(null)
          setLoading(false)
          return
        }
        setUser(session.user)
        fetchProfile(session.user)
      })
      .catch(() => {
        clearSupabaseStorage()
        setUser(null)
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Never let Supabase events override a local admin session
      if (localStorage.getItem(LOCAL_ADMIN_KEY) === '1') {
        setUser(ADMIN_USER)
        setProfile(ADMIN_PROFILE)
        setLoading(false)
        return
      }
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user)
      } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        // Only clear auth state when we're certain there's no session:
        // SIGNED_OUT = explicit sign-out or expired refresh token
        // INITIAL_SESSION with no session = first load, truly unauthenticated
        // Other events (e.g. mid-token-refresh) → keep existing state to avoid premature redirect
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (supabaseUser) => {
    try {
      const { data, error } = await getProfile(supabaseUser.id)
      if (error || !data) {
        // Create profile for new OAuth users
        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          full_name:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            supabaseUser.email?.split('@')[0] ||
            'משתמש',
          role: 'teacher',
          avatar_url: supabaseUser.user_metadata?.avatar_url || null,
        }
        const { data: created } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single()
        setProfile(created || newProfile)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    // Secret admin login — not shown in UI
    if (String(email).trim() === '7' && String(password).trim() === '7') {
      localStorage.setItem(LOCAL_ADMIN_KEY, '1')
      setUser(ADMIN_USER)
      setProfile(ADMIN_PROFILE)
      setLoading(false)
      return { user: ADMIN_USER }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/login' },
    })
    if (error) throw error
    return data
  }

  const signUp = async (email, password, fullName, role = 'teacher') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    if (localStorage.getItem(LOCAL_ADMIN_KEY) === '1') {
      localStorage.removeItem(LOCAL_ADMIN_KEY)
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('signOut error:', err)
    } finally {
      clearSupabaseStorage()
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  }

  const refreshProfile = () => {
    if (user && user.id !== 'local-admin') fetchProfile(user)
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      refreshProfile,
      isTeacher: profile?.role === 'teacher',
      isAgent: profile?.role === 'agent',
      isAdmin: profile?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}
