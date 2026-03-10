/**
 * POST /api/auth/complete-profile
 * Yeni kullanıcı profil bilgilerini kaydeder.
 * Sadece giriş yapmış kullanıcılar çağırabilir.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ── Validasyon ────────────────────────────────────────────────────────────────
const schema = z.object({
  full_name: z.string().min(3, 'Ad en az 3 karakter olmalı').max(100),
  role:      z.enum(['buyer', 'chef']),
})

// ── Supabase Admin ────────────────────────────────────────────────────────────
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    // 1. Mevcut kullanıcıyı doğrula
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Oturum açık değil. Lütfen giriş yapın.' },
        { status: 401 }
      )
    }

    // 2. Body validasyon
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { full_name, role } = parsed.data

    // 3. public.users tablosunu güncelle
    const { error: updateError } = await supabase
      .from('users')
      .update({ full_name, role })
      .eq('id', user.id)

    if (updateError) {
      console.error('users update hatası:', updateError)
      return NextResponse.json(
        { error: 'Profil güncellenemedi.' },
        { status: 500 }
      )
    }

    // 4. Auth metadata güncelle (middleware'de role kontrolü için)
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name,
        role,
      },
    })

    // 5. Aşçı ise chef_profiles oluştur (başlangıç kaydı)
    if (role === 'chef') {
      const { error: chefError } = await supabase
        .from('chef_profiles')
        .insert({
          user_id:             user.id,
          verification_status: 'pending',
          delivery_types:      ['pickup'],
          is_open:             false,
        })
        .select('id')
        .single()

      if (chefError && chefError.code !== '23505') {
        // 23505 = unique_violation (profil zaten var) → görmezden gel
        console.error('chef_profiles oluşturma hatası:', chefError)
        // Kritik değil — onboarding'de tekrar denenebilir
      }
    }

    return NextResponse.json({
      success:   true,
      role,
      full_name,
      // Aşçı ise onboarding'e, alıcı ise ana sayfaya
      redirectTo: role === 'chef' ? '/giris/onboarding' : '/',
    })

  } catch (err) {
    console.error('complete-profile error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
