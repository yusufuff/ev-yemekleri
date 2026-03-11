// @ts-nocheck
/**
 * GET    /api/menu/[id]  â€” Tekil yemek getir
 * PATCH  /api/menu/[id]  â€” Yemek gÃ¼ncelle (kÄ±smi)
 * DELETE /api/menu/[id]  â€” Yemek sil (fotoÄŸraflarla birlikte)
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

const UpdateSchema = z.object({
  name:          z.string().min(1).max(80).optional(),
  description:   z.string().max(500).optional(),
  category:      z.enum(['main', 'soup', 'dessert', 'pastry', 'salad']).optional(),
  price:         z.number().positive().max(10_000).optional(),
  daily_stock:   z.number().int().min(0).max(9999).optional(),
  remaining_stock: z.number().int().min(0).optional(),
  prep_time_min: z.number().int().min(0).max(480).optional(),
  allergens:     z.array(z.string()).optional(),
  is_active:     z.boolean().optional(),
  photos:        z.array(z.string()).optional(),
})

// â”€â”€ YardÄ±mcÄ±: sahiplik kontrolÃ¼ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function getOwnedItem(supabase: any, itemId: string, userId: string) {
  const { data: profile } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!profile) return null

  const { data: item } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', itemId)
    .eq('chef_id', profile.id)
    .single()

  return item ?? null
}

// â”€â”€ GET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'chef') {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()
  const item = await getOwnedItem(supabase, params.id, user.id)

  if (!item) {
    return NextResponse.json({ error: 'Yemek bulunamadÄ±.' }, { status: 404 })
  }

  return NextResponse.json({ item })
}

// â”€â”€ PATCH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'chef') {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'GeÃ§ersiz JSON.' }, { status: 400 })
  }

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'DoÄŸrulama hatasÄ±.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const supabase = await getSupabaseServerClient()
  const existing = await getOwnedItem(supabase, params.id, user.id)

  if (!existing) {
    return NextResponse.json({ error: 'Yemek bulunamadÄ±.' }, { status: 404 })
  }

  // GÃ¼nlÃ¼k stok deÄŸiÅŸirse remaining_stock da gÃ¼ncelle
  const updates: any = { ...parsed.data, updated_at: new Date().toISOString() }
  if (parsed.data.daily_stock !== undefined && parsed.data.remaining_stock === undefined) {
    // Stok farkÄ± koru (kaÃ§ porsiyon satÄ±ldÄ±)
    const sold = (existing.daily_stock ?? 0) - (existing.remaining_stock ?? 0)
    updates.remaining_stock = Math.max(0, parsed.data.daily_stock - sold)
  }

  const { data: item, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('[menu PATCH]', error)
    return NextResponse.json({ error: 'GÃ¼ncelleme baÅŸarÄ±sÄ±z.' }, { status: 500 })
  }

  return NextResponse.json({ item })
}

// â”€â”€ DELETE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'chef') {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()
  const existing = await getOwnedItem(supabase, params.id, user.id)

  if (!existing) {
    return NextResponse.json({ error: 'Yemek bulunamadÄ±.' }, { status: 404 })
  }

  // Supabase Storage'dan fotoÄŸraflarÄ± sil
  if (existing.photos?.length > 0) {
    const paths = existing.photos.map((url: string) => {
      // URL'den storage path'i Ã§Ä±kar
      // Ã–rn: .../menu-photos/chef-id/filename.jpg â†’ chef-id/filename.jpg
      const parts = url.split('/menu-photos/')
      return parts[1] ?? ''
    }).filter(Boolean)

    if (paths.length > 0) {
      await supabase.storage.from('menu-photos').remove(paths)
    }
  }

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('[menu DELETE]', error)
    return NextResponse.json({ error: 'Silme baÅŸarÄ±sÄ±z.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}



