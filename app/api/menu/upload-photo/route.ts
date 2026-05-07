// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Dosya yok' }, { status: 400 })
  const ext = file.name.split('.').pop()
  const fileName = `menu-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await supabase.storage
    .from('food-photos')
    .upload(fileName, buffer, { contentType: file.type, upsert: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data } = supabase.storage.from('food-photos').getPublicUrl(fileName)
  return NextResponse.json({ url: data.publicUrl })
}