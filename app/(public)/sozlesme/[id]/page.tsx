import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function SozlesmePage({ params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) return notFound()

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg, #4A2C0E, #7A4A20)', padding: '48px 24px 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px,4vw,34px)', fontWeight: 900, color: 'white', margin: 0 }}>
          {data.title}
        </h1>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '40px 48px', boxShadow: '0 2px 16px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.4)' }}>
          {data.content ? (
            <div style={{ fontSize: 14, color: '#4A2C0E', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
              {data.content}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#8A7B6B' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div>Bu belge henüz hazırlanmamıştır.</div>
            </div>
          )}
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #F5EDD8', fontSize: 12, color: '#8A7B6B' }}>
            Son güncelleme: {new Date(data.updated_at).toLocaleDateString('tr-TR')}
          </div>
        </div>
      </div>
    </div>
  )
}