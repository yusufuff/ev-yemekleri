// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: NextRequest) {
  try {
    const { chef_id } = await request.json()
    if (!chef_id) return NextResponse.json({ error: 'chef_id gerekli' }, { status: 400 })

    // Global üyelik ücretini çek
    const { data: setting } = await admin
      .from('platform_settings')
      .select('value')
      .eq('key', 'membership_fee')
      .single()

    const aylikUcret = Number(setting?.value ?? 100)

    // Başlangıç ve bitiş tarihleri
    const simdi = new Date()
    const bitis = new Date(simdi)
    bitis.setMonth(bitis.getMonth() + 1)

    // Mevcut abonelik var mı?
    const { data: mevcut } = await admin
      .from('chef_subscriptions')
      .select('id, expires_at')
      .eq('chef_id', chef_id)
      .single()

    if (mevcut) {
      // Yenile — bitiş tarihinden itibaren 1 ay ekle
      const mevcutBitis = mevcut.expires_at ? new Date(mevcut.expires_at) : simdi
      const yeniBitis = new Date(mevcutBitis > simdi ? mevcutBitis : simdi)
      yeniBitis.setMonth(yeniBitis.getMonth() + 1)

      const { error } = await admin
        .from('chef_subscriptions')
        .update({
          status:      'active',
          started_at:  simdi.toISOString(),
          expires_at:  yeniBitis.toISOString(),
          amount_paid: aylikUcret,
          is_active:   true,
          updated_at:  simdi.toISOString(),
        })
        .eq('chef_id', chef_id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      // Yeni abonelik oluştur
      const { error } = await admin
        .from('chef_subscriptions')
        .insert({
          chef_id,
          status:      'active',
          started_at:  simdi.toISOString(),
          expires_at:  bitis.toISOString(),
          amount_paid: aylikUcret,
          is_active:   true,
          plan:        'standard',
        })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aşçıya bildirim gönder
    const { data: cp } = await admin
      .from('chef_profiles')
      .select('user_id')
      .eq('id', chef_id)
      .single()

    if (cp?.user_id) {
      await admin.from('notifications').insert({
        user_id: cp.user_id,
        type:    'system',
        title:   '🎉 Üyeliğiniz Aktif!',
        body:    `Aylık ₺${aylikUcret} üyeliğiniz başarıyla aktive edildi. İyi satışlar!`,
        is_read: false,
      })
    }

    return NextResponse.json({ success: true, expires_at: bitis.toISOString() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}