// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, sifre } = await req.json()

    if (!email || !sifre) {
      return NextResponse.json({ error: 'Email ve şifre gerekli.' }, { status: 400 })
    }

    // Şifre kontrolü
    const adminSifre = process.env.ADMIN_PASSWORD
    if (sifre !== adminSifre) {
      return NextResponse.json({ error: 'Email veya şifre hatalı.' }, { status: 401 })
    }

    // admin_users tablosunda var mı kontrol et
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, full_name, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Bu hesabın admin yetkisi yok.' }, { status: 403 })
    }

    // Cookie set et
    const response = NextResponse.json({ success: true, name: adminUser.full_name })
    response.cookies.set('admin_token', Buffer.from(`${email}:${adminUser.id}:${Date.now()}`).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 saat
      path: '/',
      sameSite: 'lax',
    })

    return response
  } catch (e: any) {
    console.error('Admin giris hatasi:', e)
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 })
  }
}