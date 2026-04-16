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
    // Admin token kontrolu
    const adminToken = req.cookies.get('admin_token')?.value
    if (!adminToken) {
      return NextResponse.json({ error: 'Yetkisiz erisim.' }, { status: 401 })
    }

    const { mevcutSifre, yeniSifre } = await req.json()
    if (!mevcutSifre || !yeniSifre) {
      return NextResponse.json({ error: 'Mevcut ve yeni sifre gerekli.' }, { status: 400 })
    }
    if (yeniSifre.length < 6) {
      return NextResponse.json({ error: 'Yeni sifre en az 6 karakter olmali.' }, { status: 400 })
    }

    // Mevcut sifre kontrolu
    const { data: hashSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'admin_password_hash')
      .single()

    let mevcutGecerli = false
    if (hashSetting?.value && hashSetting.value !== '$2b$10$placeholder') {
      mevcutGecerli = await bcrypt.compare(mevcutSifre, hashSetting.value)
    } else {
      mevcutGecerli = mevcutSifre === process.env.ADMIN_PASSWORD
    }

    if (!mevcutGecerli) {
      return NextResponse.json({ error: 'Mevcut sifre hatali.' }, { status: 401 })
    }

    // Yeni sifreyi hash'le ve kaydet
    const hash = await bcrypt.hash(yeniSifre, 10)
    const { error } = await supabase
      .from('platform_settings')
      .update({ value: hash, updated_at: new Date().toISOString() })
      .eq('key', 'admin_password_hash')

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Sifre degistir hatasi:', e)
    return NextResponse.json({ error: 'Bir hata olustu.' }, { status: 500 })
  }
}