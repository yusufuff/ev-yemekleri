// @ts-nocheck
'use client'

/**
 * AuthProvider
 * App genelinde auth state'i yönetir.
 * app/layout.tsx'e sarılır.
 *
 * Görevleri:
 * - Supabase session'ı cookie'den okur
 * - verify-otp'den gelen token'ı session'a çevirir
 * - Auth olaylarını router'a yansıtır
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { exchangeTokenForSession } from '@/hooks/useAuth'
import type { Session, User } from '@supabase/supabase-js'

// ── Context ───────────────────────────────────────────────────────────────────
interface AuthContextValue {
  session:   Session | null
  user:      User | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  session:   null,
  user:      null,
  isLoading: true,
})

export function useAuthContext() {
  return useContext(AuthContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────
interface AuthProviderProps {
  children:        ReactNode
  initialSession?: Session | null
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const router    = useRouter()
  const supabase  = getSupabaseBrowserClient()

  const [session,   setSession]   = useState<Session | null>(initialSession ?? null)
  const [user,      setUser]      = useState<User | null>(initialSession?.user ?? null)
  const [isLoading, setIsLoading] = useState(!initialSession)

  // Sayfa yüklenince URL'de token var mı kontrol et (verify-otp'den geliyorsa)
  useEffect(() => {
    const hash   = window.location.hash
    const params = new URLSearchParams(hash.slice(1))
    const token  = params.get('access_token')

    if (token) {
      // URL hash'ten access token ve refresh token'ı al
      const refreshToken = params.get('refresh_token')
      if (token && refreshToken) {
        supabase.auth.setSession({
          access_token:  token,
          refresh_token: refreshToken,
        }).then(({ data, error }) => {
          if (!error && data.session) {
            setSession(data.session)
            setUser(data.session.user)
            // URL hash'i temizle
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
          }
        })
      }
    }
  }, [supabase])

  // Auth state değişikliklerini dinle
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        setIsLoading(false)

        // Server component'leri yenile (router.refresh)
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          router.refresh()
        }
      }
    )

    // İlk yükleme
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <AuthContext.Provider value={{ session, user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── HOC: withAuth — Sayfa seviyesinde auth koruması ──────────────────────────
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredRole?: 'buyer' | 'chef' | 'admin'
    redirectTo?:  string
  } = {}
) {
  return function ProtectedPage(props: P) {
    const { user, isLoading } = useAuthContext()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !user) {
        router.replace(options.redirectTo ?? '/giris')
      }
    }, [user, isLoading, router])

    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          flexDirection: 'column',
          gap: 12,
          color: 'var(--gray)',
        }}>
          <div style={{
            width: 32, height: 32,
            border: '3px solid var(--gray-light)',
            borderTopColor: 'var(--orange)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <span style={{ fontSize: 13 }}>Yükleniyor…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )
    }

    if (!user) return null

    return <Component {...props} />
  }
}
