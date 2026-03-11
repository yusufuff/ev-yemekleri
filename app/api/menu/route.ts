/**
 * GET  /api/menu          â€” AÅŸÃ§Ä±nÄ±n menÃ¼ Ã¶ÄŸelerini listeler
 * POST /api/menu          â€” Yeni menÃ¼ Ã¶ÄŸesi oluÅŸturur
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

// â”€â”€ Åema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MenuItemSchema = z.object({
  name:          z.string().min(1).max(80),
  description:   z.string().max(500).optional().default(''),
  category:      z.enum(['main', 'soup', 'dessert', 'pastry', 'salad']),
  price:         z.number().positive().max(10_000),
  daily_stock:   z.number().int().min(0).max(9999),
  prep_time_min: z.number().int().min(0).max(480).optional(),
  allergens:     z.array(z.string()).optional().default([]),
  is_active:     z.boolean().optional().default(true),
  photos:        z.array(z.string()).optional().default([]),
})

// â”€â”€ GET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'chef') {
    return NextResponse.json({ error: 'AÅŸÃ§Ä± giriÅŸi gerekli.' }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()

  // Chef profilinden chef_id bul
  const { data: profile } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'AÅŸÃ§Ä± profili bulunamadÄ±.' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const category  = searchParams.get('category')
  const is_active = searchParams.get('active')

  let query = supabase
    .from('menu_items')
    .select('*')
    .eq('chef_id', profile.id)
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (is_active === 'true')  query = query.eq('is_active', true)
  if (is_active === 'false') query = query.eq('is_active', false)

  const { data: items, error } = await query

  if (error) {
    return NextResponse.json({ error: 'MenÃ¼ yÃ¼klenemedi.' }, { status: 500 })
  }

  return NextResponse.json({ items: items ?? [], total: items?.length ?? 0 })
}

// â”€â”€ POST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function POST(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'chef') {
    return NextResponse.json({ error: 'AÅŸÃ§Ä± giriÅŸi gerekli.' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'GeÃ§ersiz JSON.' }, { status: 400 })
  }

  const parsed = MenuItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'DoÄŸrulama hatasÄ±.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const supabase = await getSupabaseServerClient()

  const { data: profile } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'AÅŸÃ§Ä± profili bulunamadÄ±.' }, { status: 404 })
  }

  const { data: item, error } = await supabase
    .from('menu_items')
    .insert({
      chef_id:         profile.id,
      name:            parsed.data.name,
      description:     parsed.data.description,
      category:        parsed.data.category,
      price:           parsed.data.price,
      daily_stock:     parsed.data.daily_stock,
      remaining_stock: parsed.data.daily_stock,  // baÅŸlangÄ±Ã§ta eÅŸit
      prep_time_min:   parsed.data.prep_time_min,
      allergens:       parsed.data.allergens,
      is_active:       parsed.data.is_active,
      photos:          parsed.data.photos,
    })
    .select()
    .single()

  if (error) {
    console.error('[menu POST]', error)
    return NextResponse.json({ error: 'Yemek kaydedilemedi.' }, { status: 500 })
  }

  return NextResponse.json({ item }, { status: 201 })
}

