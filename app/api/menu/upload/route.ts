/**
 * POST /api/menu/upload
 * Supabase Storage'a fotoÄŸraf yÃ¼kler, signed URL dÃ¶ndÃ¼rÃ¼r.
 *
 * multipart/form-data:
 *   file      File     â€” YÃ¼klenecek gÃ¶rsel (max 5 MB, JPEG/PNG/WEBP)
 *   item_id?  string   â€” Varsa hangi yemeÄŸe ait (opsiyonel, yeni ekleme iÃ§in boÅŸ)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server'

const MAX_SIZE_BYTES = 5 * 1024 * 1024   // 5 MB
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTOS     = 5

export async function POST(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'chef') {
    return NextResponse.json({ error: 'AÅŸÃ§Ä± giriÅŸi gerekli.' }, { status: 401 })
  }

  const supabase = await getSupabaseServerClient()

  // Chef profil ID
  const { data: profile } = await supabase
    .from('chef_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'AÅŸÃ§Ä± profili bulunamadÄ±.' }, { status: 404 })
  }

  // Multipart form okuma
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Form verisi okunamadÄ±.' }, { status: 400 })
  }

  const file   = formData.get('file') as File | null
  const itemId = formData.get('item_id') as string | null

  if (!file) {
    return NextResponse.json({ error: 'Dosya zorunludur.' }, { status: 400 })
  }

  // Tip kontrolÃ¼
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Desteklenen formatlar: JPEG, PNG, WEBP.' },
      { status: 400 }
    )
  }

  // Boyut kontrolÃ¼
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Dosya boyutu 5 MB\'Ä± geÃ§emez.' },
      { status: 400 }
    )
  }

  // Mevcut fotoÄŸraf sayÄ±sÄ± kontrolÃ¼ (varolan yemek iÃ§in)
  if (itemId) {
    const { data: item } = await supabase
      .from('menu_items')
      .select('photos')
      .eq('id', itemId)
      .eq('chef_id', profile.id)
      .single()

    if (item && (item.photos?.length ?? 0) >= MAX_PHOTOS) {
      return NextResponse.json(
        { error: `En fazla ${MAX_PHOTOS} fotoÄŸraf yÃ¼kleyebilirsiniz.` },
        { status: 400 }
      )
    }
  }

  // Dosya adÄ±: chef-id/timestamp-random.ext
  const ext       = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
  const timestamp = Date.now()
  const rand      = Math.random().toString(36).slice(2, 8)
  const path      = `${profile.id}/${timestamp}-${rand}.${ext}`

  // DosyayÄ± buffer'a dÃ¶nÃ¼ÅŸtÃ¼r
  const buffer = await file.arrayBuffer()

  // Supabase Storage'a yÃ¼kle
  const { error: uploadError } = await supabase.storage
    .from('menu-photos')
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '31536000',    // 1 yÄ±l Ã¶nbellekle
      upsert: false,
    })

  if (uploadError) {
    console.error('[photo upload]', uploadError)
    return NextResponse.json({ error: 'YÃ¼kleme baÅŸarÄ±sÄ±z.' }, { status: 500 })
  }

  // Public URL al
  const { data: urlData } = supabase.storage
    .from('menu-photos')
    .getPublicUrl(path)

  const publicUrl = urlData.publicUrl

  // Varolan yemek iÃ§in photos dizisini gÃ¼ncelle
  if (itemId) {
    const { data: item } = await supabase
      .from('menu_items')
      .select('photos')
      .eq('id', itemId)
      .single()

    if (item) {
      await supabase
        .from('menu_items')
        .update({ photos: [...(item.photos ?? []), publicUrl] })
        .eq('id', itemId)
    }
  }

  return NextResponse.json({
    url:  publicUrl,
    path,
  })
}

// â”€â”€ DELETE /api/menu/upload â€” tek fotoÄŸraf silme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser() as any
  if (!user || user.role !== 'chef') {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  const { path, item_id, url } = await req.json()

  if (!path && !url) {
    return NextResponse.json({ error: 'path veya url gerekli.' }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  // Storage'dan sil
  const storagePath = path ?? url.split('/menu-photos/')[1]
  if (storagePath) {
    await supabase.storage.from('menu-photos').remove([storagePath])
  }

  // Yemek kaydÄ±ndan URL'i Ã§Ä±kar
  if (item_id) {
    const { data: item } = await supabase
      .from('menu_items')
      .select('photos, chef_id')
      .eq('id', item_id)
      .single()

    if (item) {
      const { data: profile } = await supabase
        .from('chef_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      // Sahiplik kontrolÃ¼
      if (profile && item.chef_id === profile.id) {
        const filtered = (item.photos ?? []).filter((p: string) => p !== url)
        await supabase
          .from('menu_items')
          .update({ photos: filtered })
          .eq('id', item_id)
      }
    }
  }

  return NextResponse.json({ success: true })
}

