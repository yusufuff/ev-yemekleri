// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, sifre } = await req.json()
    if (!email || !sifre) {
      return NextResponse.json({ error: 'Email ve sifre gerekli.' }, { status: 400 })
    }

    // admin_users tablosunda var mi kontrol et
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, full_name, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Bu hesabin admin yetkisi yok.' }, { status: 403 })
    }

    // Sifre kontrolu - once hash'li kontrol, sonra eski env variable
    const { data: hashSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'admin_password_hash')
      .single()

    let sifreGecerli = false

    if (hashSetting?.value && hashSetting.value !== '$2b$10$placeholder') {
      // Hash ile karsilastir
      sifreGecerli = await bcrypt.compare(sifre, hashSetting.value)
    } else {
      // Eski yontem - env variable
      sifreGecerli = sifre === process.env.ADMIN_PASSWORD
    }

    if (!sifreGecerli) {
      return NextResponse.json({ error: 'Sifre hatali.' }, { status: 401 })
    }

    // Cookie set et
    const response = NextResponse.json({ success: true, name: adminUser.full_name })
    response.cookies.set('admin_token', Buffer.from(`${email}:${adminUser.id}:${Date.now()}`).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
      path: '/',
      sameSite: 'lax',
    })
    return response
  } catch (e: any) {
    console.error('Admin giris hatasi:', e)
    return NextResponse.json({ error: 'Bir hata olustu.' }, { status: 500 })
  }
}