/**
 * GET /api/health
 * CI/CD ve uptime monitoring iÃ§in saÄŸlÄ±k kontrolÃ¼.
 * Supabase baÄŸlantÄ±sÄ±nÄ± ve temel tablolarÄ± test eder.
 */
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  const checks: Record<string, boolean | string> = {}

  // â”€â”€ Supabase baÄŸlantÄ± testi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  try {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    checks.supabase = !error
    if (error) checks.supabase_error = error.message
  } catch (e: any) {
    checks.supabase = false
    checks.supabase_error = e.message
  }

  // â”€â”€ Ortam deÄŸiÅŸkenleri â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  checks.env_supabase_url  = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  checks.env_supabase_anon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  checks.env_iyzico        = !!process.env.IYZICO_API_KEY

  // â”€â”€ Genel durum â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const allGood   = Object.values(checks).every(v => v === true || typeof v === 'string' && !v.includes('error'))
  const isHealthy = checks.supabase === true

  return NextResponse.json(
    {
      status:   isHealthy ? 'ok' : 'degraded',
      latency:  `${Date.now() - start}ms`,
      version:  process.env.npm_package_version ?? '0.1.0',
      env:      process.env.NODE_ENV,
      checks,
    },
    { status: isHealthy ? 200 : 503 }
  )
}

