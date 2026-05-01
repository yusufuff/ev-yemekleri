'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'

const KULLANIM_YERI: Record<string, string> = {
  'kullanici-sozlesmesi': 'Kayıt Ekranı, Web Sitesi',
  'gizlilik-politikasi': 'App Store, Google Play, Web Sitesi',
  'kvkk': 'Kayıt Ekranı, İletişim Formları',
  'on-bilgilendirme': 'Ödeme Ekranı',
  'mesafeli-satis': 'Ödeme Ekranı',
  'cerez-politikasi': 'Web Sitesi',
  'ticari-ileti-onay': 'Kayıt / Profil Ekranı',
  'acik-riza': 'Kayıt Ekranı',
}

export default function AdminSozlesmeler() {
  const [docs, setDocs] = useState<any[]>([])
  const [secili, setSecili] = useState<any>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { yukle() }, [])

  const yukle = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/legal')
    const d = await res.json()
    setDocs(d.docs ?? [])
    setLoading(false)
  }

  const sec = (doc: any) => {
    setSecili(doc)
    setContent(doc.content ?? '')
  }

  const kaydet = async () => {
    if (!secili) return
    setSaving(true)
    await fetch('/api/admin/legal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: secili.id, content }),
    })
    setSaving(false)
    yukle()
    alert('Kaydedildi!')
  }

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', marginBottom: 24 }}>Sozlesmeler</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24, color: '#8A7B6B', textAlign: 'center' }}>Yukleniyor...</div>
          ) : docs.map(doc => (
            <div key={doc.id} onClick={() => sec(doc)}
              style={{ padding: '14px 18px', cursor: 'pointer', borderBottom: '1px solid #FAF6EF', background: secili?.id === doc.id ? '#FEF3EC' : 'white', borderLeft: secili?.id === doc.id ? '3px solid #E8622A' : '3px solid transparent' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#4A2C0E', marginBottom: 3 }}>{doc.title}</div>
              <div style={{ fontSize: 11, color: '#8A7B6B' }}>{KULLANIM_YERI[doc.id] ?? ''}</div>
              <div style={{ fontSize: 10, color: doc.content ? '#3D6B47' : '#E8622A', marginTop: 4, fontWeight: 600 }}>
                {doc.content ? 'Icerik var' : 'Icerik yok'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', padding: 24 }}>
          {!secili ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#8A7B6B' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div>Sol taraftan bir sozlesme secin</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>{secili.title}</h2>
                  <div style={{ fontSize: 12, color: '#8A7B6B', marginTop: 4 }}>Kullanim: {KULLANIM_YERI[secili.id]}</div>
                </div>
                <button onClick={kaydet} disabled={saving}
                  style={{ padding: '10px 24px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={22}
                placeholder="Sozlesme icerigini buraya girin..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #E8E0D4', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.8, color: '#4A2C0E' }}
              />
              {secili.updated_at && (
                <div style={{ fontSize: 11, color: '#8A7B6B', marginTop: 8 }}>
                  Son guncelleme: {new Date(secili.updated_at).toLocaleString('tr-TR')}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}