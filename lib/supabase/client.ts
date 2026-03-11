// @ts-nocheck
/**
 * Supabase Browser Client
 * Client Component'larda kullanılır: 'use client' direktifi olan dosyalar.
 * Singleton pattern — her render'da yeni instance oluşturulmasını önler.
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}
