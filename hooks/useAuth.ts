// @ts-nocheck
/**
 * useAuth — Auth state ve helper fonksiyonları
 *
 * Kullanım:
 *   const { user, profile, isLoading, isChef, signOut } = useAuth()
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { User as DbUser } from '@/types/database'

interface AuthState {
  user:      User | null           // Supabase Auth kullanıcısı
  profile:   DbUser | null         // public.users kaydı
  session:   Session | null
  isLoading: boolean
}

interface AuthHelpers {
  isAuthenticated: boolean
  isBuyer:  boolean
  isChef:   boolean
  isAdmin:  boolean
  signOut:  () => Promise<void>
  refreshProfile: () => Promise<void>
}

export function useAuth(): AuthState & AuthHelpers {
  const router  = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [state, setState] = useState<AuthState>({
    user:      null,
    profile:   null,
    session:   null,
    isLoading: true,
  })

  // Profili veritabanından çek
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Profil çekilemedi:', error)
      return null
    }

    return data as DbUser
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return
    const profile = await fetchProfile(state.user.id)
    setState(s => ({ ...s, profile }))
  }, [state.user, fetchProfile])

  // Auth değişikliklerini dinle
  useEffect(() => {
    // İlk oturum kontrolü
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({ user: session.user, profile, session, isLoading: false })
      } else {
        setState({ user: null, profile: null, session: null, isLoading: false })
      }
    })

    // Oturum değişiklikleri (giriş/çıkış)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({ user: session.user, profile, session, isLoading: false })
        } else if (event === 'SIGNED_OUT') {
          setState({ user: null, profile: null, session: null, isLoading: false })
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(s => ({ ...s, session, isLoading: false }))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  // Çıkış
  const signOut = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }))
    await supabase.auth.signOut()
    router.push('/')
  }, [supabase, router])

  const role = state.profile?.role ?? state.user?.user_metadata?.role

  return {
    ...state,
    isAuthenticated: !!state.user,
    isBuyer:  role === 'buyer',
    isChef:   role === 'chef',
    isAdmin:  role === 'admin',
    signOut,
    refreshProfile,
  }
}

// ── Token → Session dönüşümü (verify-otp sonrasında çağrılır) ────────────────
export async function exchangeTokenForSession(token: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient()

  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type:       'magiclink',
    })

    if (error) {
      console.error('Token exchange hatası:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('exchangeTokenForSession hatası:', err)
    return false
  }
}
