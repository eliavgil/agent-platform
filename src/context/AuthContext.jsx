import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase, getProfile } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

const LOCAL_ADMIN_KEY = '_app_adm'
// Fallback profile used only when no Supabase admin account is configured
const FALLBACK_ADMIN_USER    = { id: 'local-admin', email: 'admin@local', role: 'admin' }
const FALLBACK_ADMIN_PROFILE = { id: 'local-admin', full_name: 'מנהל', role: 'admin', email: 'admin@local' }

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Track whether we've already fetched the profile so we can skip re-fetching on TOKEN_REFRESHED
  const profileFetchedRef = useRef(false)

  const fetchProfile = async (supabaseUser) => {
    const isAdminSession = localStorage.getItem(LOCAL_ADMIN_KEY) === '1'
    try {
      const { data, error } = await Promise.race([
        getProfile(supabaseUser.id),
        new Promise((_, rej) => setTimeout(() => rej(new Error('profile timeout')), 5000)),
      ])
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
          role: isAdminSession ? 'admin' : 'teacher',
          avatar_url: supabaseUser.user_metadata?.avatar_url || null,
        }
        const { data: created } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single()
        setProfile(created || newProfile)
      } else {
        setProfile(isAdminSession ? { ...data, role: 'admin' } : data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfile({
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name:
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.email?.split('@')[0] ||
          'משתמש',
        role: isAdminSession ? 'admin' : 'teacher',
        avatar_url: supabaseUser.user_metadata?.avatar_url || null,
      })
    } finally {
      profileFetchedRef.current = true
      setLoading(false)
    }
  }

  useEffect(() => {
    // Safety timeout — if Supabase hangs, stop the loading spinner after 8s
    const timeout = setTimeout(() => setLoading(false), 8000)

    // onAuthStateChange is the single source of truth.
    // INITIAL_SESSION fires immediately when the listener is attached, with the
    // stored session (if any) — equivalent to calling getSession() but without
    // the risk of a network-error catch block wiping localStorage.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)

        if (event === 'TOKEN_REFRESHED' && profileFetchedRef.current) {
          // Token silently refreshed — just update the user object (new JWT),
          // no need to hit the DB again since the profile hasn't changed.
          clearTimeout(timeout)
          return
        }

        // INITIAL_SESSION / SIGNED_IN / USER_UPDATED — fetch/create the profile
        await fetchProfile(session.user)
        clearTimeout(timeout)

      } else {
        // No session in this event
        if (event === 'SIGNED_OUT') {
          // Explicit sign-out or expired refresh token.
          // Guard: don't clear local-admin fallback session.
          if (localStorage.getItem(LOCAL_ADMIN_KEY) === '1') return
          setUser(null)
          setProfile(null)
          profileFetchedRef.current = false
          setLoading(false)
          clearTimeout(timeout)

        } else if (event === 'INITIAL_SESSION') {
          // First load, genuinely no session.
          if (localStorage.getItem(LOCAL_ADMIN_KEY) === '1') {
            // Local admin fallback — no real Supabase session needed
            setUser(FALLBACK_ADMIN_USER)
            setProfile(FALLBACK_ADMIN_PROFILE)
            profileFetchedRef.current = true
          } else {
            setUser(null)
            setProfile(null)
          }
          setLoading(false)
          clearTimeout(timeout)
        }
        // Other events (e.g. PASSWORD_RECOVERY) with no session → ignore, keep current state
      }
    })

    // If LOCAL_ADMIN_KEY is set and there IS a real Supabase session,
    // INITIAL_SESSION will fire with it and fetchProfile will run normally.
    // If there is NO real Supabase session, INITIAL_SESSION fires with null
    // and the fallback admin is set above.

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    // Secret admin login — not shown in UI
    if (String(email).trim() === '7' && String(password).trim() === '7') {
      localStorage.setItem(LOCAL_ADMIN_KEY, '1')

      // 1. Reuse an existing Supabase session (e.g. logged in via Google earlier)
      try {
        const { data: { session: existing } } = await supabase.auth.getSession()
        if (existing?.user) {
          setUser(existing.user)
          await fetchProfile(existing.user)
          return { user: existing.user }
        }
      } catch { /* ignore */ }

      // 2. Try password auth with configured admin credentials
      const adminEmail    = import.meta.env.VITE_ADMIN_EMAIL
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
      if (adminEmail && adminPassword) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: adminPassword,
          })
          if (!error && data?.user) {
            setUser(data.user)
            await fetchProfile(data.user)
            return { user: data.user }
          }
          if (error) console.warn('[Admin] signInWithPassword failed:', error.message)
        } catch (e) {
          console.warn('[Admin] signInWithPassword threw:', e)
        }
      }

      // 3. Fallback: local-only (no JWT — Supabase RLS will block writes/reads)
      console.warn('[Admin] falling back to local-only mode — DB operations may be blocked by RLS')
      setUser(FALLBACK_ADMIN_USER)
      setProfile(FALLBACK_ADMIN_PROFILE)
      profileFetchedRef.current = true
      setLoading(false)
      return { user: FALLBACK_ADMIN_USER }
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
      // Sign out of real Supabase session if one was established for the admin
      try { await supabase.auth.signOut() } catch { /* ignore */ }
      setUser(null)
      setProfile(null)
      profileFetchedRef.current = false
      setLoading(false)
      return
    }
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('signOut error:', err)
    } finally {
      setUser(null)
      setProfile(null)
      profileFetchedRef.current = false
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
      isAdmin: profile?.role === 'admin' || localStorage.getItem(LOCAL_ADMIN_KEY) === '1',
    }}>
      {children}
    </AuthContext.Provider>
  )
}
