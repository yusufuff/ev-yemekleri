// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('chef_stories')
    .select('*, chef_profiles(id, user_id, users(full_name, avatar_url))')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
  return NextResponse.json({ stories: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { chef_id, image_url, caption } = body
  if (!chef_id || !image_url) return NextResponse.json({ error: 'Eksik alan' }, { status: 400 })
  const expires_at = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('chef_stories')
    .insert({ chef_id, image_url, caption, expires_at })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ story: data })
}