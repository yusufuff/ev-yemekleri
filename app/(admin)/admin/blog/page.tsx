'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const bos = { title: '', slug: '', excerpt: '', content: '', cover_image: '', tags: '', status: 'draft' }

export default function AdminBlog() {
  const [yazilar, setYazilar]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [form, setForm]           = useState<any>(bos)
  const [duzenleme, setDuzenleme] = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [goster, setGoster]       = useState(false)

  useEffect(() => { yukle() }, [])

  const yukle = async () => {
    setLoading(true)
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setYazilar(data ?? [])
    setLoading(false)
  }

  const kaydet = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()) : [],
      updated_at: new Date().toISOString(),
    }
    if (duzenleme) {
      await supabase.from('blog_posts').update(payload).eq('id', duzenleme)
    } else {
      await supabase.from('blog_posts').insert({ ...payload, author_id: (await supabase.auth.getUser()).data.user?.id })
    }
    setSaving(false); setForm(bos); setDuzenleme(null); setGoster(false); yukle()
  }

  const sil = async (id: string) => {
    if (!confirm('Bu yazıyı silmek istiyor musunuz?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    yukle()
  }

  const duzenle = (y: any) => {
    setForm({ ...y, tags: Array.isArray(y.tags) ? y.tags.join(', ') : '' })
    setDuzenleme(y.id); setGoster(true)
  }

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E0D4', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>Blog Yazıları</h1>
        <button onClick={() => { setForm(bos); setDuzenleme(null); setGoster(true) }}
          style={{ padding: '10px 20px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>
          + Yeni Yazı
        </button>
      </div>

      {goster && (
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>{duzenleme ? 'Yazıyı Düzenle' : 'Yeni Yazı'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Başlık *</label>
              <input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Slug (URL)</label>
              <input value={form.slug} onChange={e => setForm((p: any) => ({ ...p, slug: e.target.value }))} placeholder="otomatik-olusturulur" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Özet</label>
            <input value={form.excerpt} onChange={e => setForm((p: any) => ({ ...p, excerpt: e.target.value }))} style={inp} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>İçerik *</label>
            <textarea value={form.content} onChange={e => setForm((p: any) => ({ ...p, content: e.target.value }))} rows={8}
              style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Kapak Görseli URL</label>
              <input value={form.cover_image} onChange={e => setForm((p: any) => ({ ...p, cover_image: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Etiketler (virgülle)</label>
              <input value={form.tags} onChange={e => setForm((p: any) => ({ ...p, tags: e.target.value }))} placeholder="yemek, tarif, saglik" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Durum</label>
              <select value={form.status} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))} style={inp}>
                <option value="draft">Taslak</option>
                <option value="published">Yayında</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={kaydet} disabled={saving}
              style={{ padding: '10px 24px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Kaydediliyor...' : duzenleme ? 'Güncelle' : 'Yayınla'}
            </button>
            <button onClick={() => { setGoster(false); setForm(bos); setDuzenleme(null) }}
              style={{ padding: '10px 18px', borderRadius: 10, background: '#f5f5f5', color: '#8A7B6B', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
              İptal
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8A7B6B' }}>Yükleniyor...</div>
        ) : yazilar.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8A7B6B' }}>Henüz blog yazısı yok</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #FAF6EF' }}>
                {['Başlık','Durum','Etiketler','Görüntülenme','Tarih','İşlem'].map(h => (
                  <th key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8A7B6B', padding: '12px 16px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yazilar.map(y => (
                <tr key={y.id} style={{ borderBottom: '1px solid #FAF6EF' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#4A2C0E' }}>{y.title}</div>
                    <div style={{ fontSize: 11, color: '#8A7B6B' }}>/{y.slug}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: y.status === 'published' ? '#ECFDF5' : '#F5F5F5', color: y.status === 'published' ? '#3D6B47' : '#8A7B6B' }}>
                      {y.status === 'published' ? 'Yayında' : 'Taslak'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#8A7B6B' }}>{(y.tags ?? []).join(', ') || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A2C0E' }}>{y.view_count ?? 0}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#8A7B6B' }}>{new Date(y.created_at).toLocaleDateString('tr-TR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => duzenle(y)} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: '#EFF6FF', color: '#3B82F6', border: 'none', cursor: 'pointer' }}>Düzenle</button>
                      <button onClick={() => sil(y.id)} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer' }}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}