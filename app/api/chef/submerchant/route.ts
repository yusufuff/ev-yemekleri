// @ts-nocheck
/**
 * POST /api/chef/submerchant
 * Aşçı başvurusu onaylandığında iyzico sub-merchant hesabı oluşturur.
 * chef_profiles.iyzico_sub_merchant_key güncellenir.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSubMerchant } from '@/lib/iyzico'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { chef_id } = await req.json()
    if (!chef_id) {
      return NextResponse.json({ error: 'chef_id gerekli' }, { status: 400 })
    }

    // Chef bilgilerini çek
    const { data: chef, error: chefErr } = await supabase
      .from('chef_profiles')
      .select(`
        id, iban, iyzico_sub_merchant_key, user_id,
        users!inner (full_name, phone),
        chef_billing_info (tc_kimlik, address, city)
      `)
      .eq('id', chef_id)
      .single()

    if (chefErr || !chef) {
      return NextResponse.json({ error: 'Aşçı bulunamadı' }, { status: 404 })
    }

    // Email'i auth'dan al
    const { data: authUser } = await supabase.auth.admin.getUserById(chef.user_id)
    const chefEmail = authUser?.user?.email ?? `${chef.id}@anneelim.com`

    // Zaten sub-merchant kaydı varsa
    if (chef.iyzico_sub_merchant_key) {
      return NextResponse.json({
        success: true,
        subMerchantKey: chef.iyzico_sub_merchant_key,
        message: 'Sub-merchant zaten kayıtlı'
      })
    }

    const billing = chef.chef_billing_info?.[0] ?? {}
    const user    = chef.users as any

    if (!chef.iban) {
      return NextResponse.json({ error: 'IBAN bilgisi eksik' }, { status: 400 })
    }

    // İyzico sub-merchant oluştur
    const result = await createSubMerchant({
      referenceCode:  chef.id,
      name:           user.full_name ?? 'Aşçı',
      iban:           chef.iban,
      identityNumber: billing.tc_kimlik ?? '11111111110',
      address:        billing.address ?? 'Türkiye',
      city:           billing.city ?? 'İstanbul',
      phone:          user.phone ?? '+905550000000',
      email:          chefEmail,
    })

    if (!result.success) {
      return NextResponse.json({
        error: result.error ?? 'Sub-merchant oluşturulamadı'
      }, { status: 502 })
    }

    // Sub-merchant key'i kaydet
    await supabase
      .from('chef_profiles')
      .update({ iyzico_sub_merchant_key: result.subMerchantKey })
      .eq('id', chef_id)

    return NextResponse.json({
      success: true,
      subMerchantKey: result.subMerchantKey
    })

  } catch (e: any) {
    console.error('Sub-merchant route hatası:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}