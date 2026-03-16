import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string ?? 'food-photos'
    const folder = formData.get('folder') as string ?? 'misc'

    if (!file) return NextResponse.json({ error: 'Dosya bulunamadi.' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const allowed = ['jpg','jpeg','png','webp']
    if (!allowed.includes(ext)) return NextResponse.json({ error: 'Sadece JPG, PNG veya WEBP yuklenebilir.' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Dosya 5MB dan kucuk olmali.' }, { status: 400 })

    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (error) throw error

    const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl, path: data.path })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}