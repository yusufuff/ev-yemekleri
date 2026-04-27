'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const NAV_LINKS = [
  ['Dashboard',      '/admin'],
  ['Asciler',        '/admin/asciler'],
  ['Kullanicilar',   '/admin/kullanicilar'],
  ['Siparisler',     '/admin/siparisler'],
  ['Odemeler',       '/admin/odemeler'],
  ['Uyelikler',      '/admin/uyelikler'],
  ['Yoneticiler',    '/admin/yoneticiler'],
  ['Yemek Fotolari', '/admin/yemekler'],
  ['Destek',         '/admin/destek'],
  ['Blog',           '/admin/blog'],
  ['Kampanya',       '/admin/kampanya'],
]

export default function AdminKampanya() {
  const [kampanya, setKampanya] = useState({ aktif: false, bitis: '', sart: '' })
  const [duyuru, setDuyuru]     = useState({ aktif: false, mesaj: '', renk: '#E8622A' })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')

  useEffect(() => { yukle() }, [])

  const yukle = async () => {
    const { data } = await supabase.from('app_settings').select('*')
    if (data) {
      const m = Object.fromEntries(data.map((d: any) => [d.key, d.value]))
      setKampanya({ aktif: m.kampanya_aktif === 'true', bitis: m.kampanya_bitis ?? '', sart: m.kampanya_sart ?? '' })
      setDuyuru({ aktif: m.duyuru_aktif === 'true', mesaj: m.duyuru_mesaj ?? '', renk: m.duyuru_renk ?? '#E8622A' })
    }
    setLoading(false)
  }

  const kaydet = async (tip: 'kampanya' | 'duyuru') => {
    setSaving(true)
    if (tip === 'kampanya') {
      await Promise.all([
        supabase.from('app_settings').upsert({ key: 'kampanya_aktif', value: String(kampanya.aktif) }),
        supabase.from('app_settings').upsert({ key: 'kampanya_bitis', value: kampanya.bitis }),
        supabase.from('app_settings').upsert({ key: 'kampanya_sart',  value: kampanya.sart }),
      ])
    } else {
      await Promise.all([
        supabase.from('app_settings').upsert({ key: 'duyuru_aktif', value: String(duyuru.aktif) }),
        supabase.from('app_settings').upsert({ key: 'duyuru_mesaj', value: duyuru.mesaj }),
        supabase.from('app_settings').upsert({ key: 'duyuru_renk',  value: duyuru.renk }),
      ])
    }
    setSaving(false)
    setToast('Kaydedildi!')
    setTimeout(() => setToast(''), 3000)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Yukleniyor...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: '#4A2C0E', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, color: 'white', fontSize: 18 }}>ANNEELIM - Admin</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {NAV_LINKS.map(([l, h]) => (
            <Link key={h} href={h} style={{ color: h === '/admin/kampanya' ? 'white' : 'rgba(255,255,255,0.7)', fontSize: 12, textDecoration: 'none', fontWeight: h === '/admin/kampanya' ? 700 : 500 }}>{l}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', marginBottom: 24 }}>Kampanya & Duyuru Yönetimi</h1>

        {/* Ücretsiz Üyelik Kampanyası */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>🎉 Ücretsiz Üyelik Kampanyası</h2>
              <p style={{ fontSize: 13, color: '#8A7B6B', margin: '4px 0 0' }}>Aşçılar uygulama paylaşımı yaparak 1 ay ücretsiz üyelik kazanır</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={kampanya.aktif} onChange={e => setKampanya(p => ({ ...p, aktif: e.target.checked }))} />
              <span style={{ fontSize: 13, fontWeight: 700, color: kampanya.aktif ? '#3D6B47' : '#8A7B6B' }}>{kampanya.aktif ? 'Aktif' : 'Pasif'}</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Bitiş Tarihi</label>
              <input type="date" value={kampanya.bitis} onChange={e => setKampanya(p => ({ ...p, bitis: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E0D4', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Kampanya Şartı (Uygulama içi metin)</label>
              <input value={kampanya.sart} onChange={e => setKampanya(p => ({ ...p, sart: e.target.value }))}
                placeholder="Uygulamayı paylaş, 1 ay ücretsiz kazan!"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E0D4', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
            </div>
          </div>

          <button onClick={() => kaydet('kampanya')} disabled={saving}
            style={{ padding: '10px 24px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
            Kampanyayı Kaydet
          </button>
        </div>

        {/* Duyuru Banner */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>📢 Ana Sayfa Duyurusu</h2>
              <p style={{ fontSize: 13, color: '#8A7B6B', margin: '4px 0 0' }}>Web ve mobil ana sayfasında görünür banner</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={duyuru.aktif} onChange={e => setDuyuru(p => ({ ...p, aktif: e.target.checked }))} />
              <span style={{ fontSize: 13, fontWeight: 700, color: duyuru.aktif ? '#3D6B47' : '#8A7B6B' }}>{duyuru.aktif ? 'Aktif' : 'Pasif'}</span>
            </label>
          </div>

          {/* Önizleme */}
          {duyuru.mesaj && (
            <div style={{ background: duyuru.renk, borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: 'white', fontSize: 13, fontWeight: 600 }}>
              📢 {duyuru.mesaj}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Duyuru Mesajı</label>
            <input value={duyuru.mesaj} onChange={e => setDuyuru(p => ({ ...p, mesaj: e.target.value }))}
              placeholder="Yeni özelliklerimizi keşfedin!"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E0D4', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Renk</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {['#E8622A', '#3D6B47', '#3B82F6', '#8B5CF6', '#DC2626', '#F59E0B'].map(r => (
                <div key={r} onClick={() => setDuyuru(p => ({ ...p, renk: r }))}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: r, cursor: 'pointer', border: duyuru.renk === r ? '3px solid #4A2C0E' : '3px solid transparent' }} />
              ))}
              <input type="color" value={duyuru.renk} onChange={e => setDuyuru(p => ({ ...p, renk: e.target.value }))}
                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer' }} />
            </div>
          </div>

          <button onClick={() => kaydet('duyuru')} disabled={saving}
            style={{ padding: '10px 24px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
            Duyuruyu Kaydet
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 80, right: 24, background: '#4A2C0E', color: 'white', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600, zIndex: 100 }}>
          ✅ {toast}
        </div>
      )}
    </div>
  )
}