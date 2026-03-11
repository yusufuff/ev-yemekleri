/**
 * GET    /api/favorites/[chefId]  â€” Favori durumu sorgula
 * POST   /api/favorites/[chefId]  â€” Favori ekle
 * DELETE /api/favorites/[chefId]  â€” Favoriden Ã§Ä±kar
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { chefId: string } }
) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ favorited: false })

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('chef_id', params.chefId)
    .maybeSingle()

  return NextResponse.json({ favorited: !!data })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { chefId: string } }
) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'GiriÅŸ gerekli.' }, { status: 401 })

  const supabase = await getSupabaseServerClient()
  await supabase.from('favorites').upsert(
    { user_id: user.id, chef_id: params.chefId },
    { onConflict: 'user_id,chef_id' }
  )
  return NextResponse.json({ favorited: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { chefId: string } }
) {
  const user = await getCurrentUser() as any
  if (!user) return NextResponse.json({ error: 'GiriÅŸ gerekli.' }, { status: 401 })

  const supabase = await getSupabaseServerClient()
  await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('chef_id', params.chefId)

  return NextResponse.json({ favorited: false })
}

