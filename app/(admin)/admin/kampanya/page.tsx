'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BALON_EMOJILER = ['📢', '🉐', '✨', '🍽️', '🛵', '💬']

export default function AdminKampanya() {
  const [kampanya, setKampanya] = useState({ aktif: false, bitis: '', sart: '', gun: '7', link: 'https://www.anneelim.com', hiz: '12' })
  const [duyuru, setDuyuru]     = useState({ aktif: false, mesaj: '', renk: '#E8622A' })
  const [balonlar, setBalonlar] = useState(['', '', '', '', '', ''])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')

  useEffect(() => { yukle() }, [])

  const yukle = async () => {
    const { data } = await supabase.from('app_settings').select('*')
    if (data) {
      const m = Object.fromEntries(data.map((d: any) => [d.key, d.value]))
      setKampanya({
        aktif: m.kampanya_aktif === 'true',
        bitis: m.kampanya_bitis ?? '',
        sart:  m.kampanya_sart ?? '',
        gun:   m.kampanya_gun ?? '7',
        link:  m.kampanya_link ?? 'https://www.anneelim.com',
        
        hiz:   m.kampanya_hiz ?? '12',
      })
      setDuyuru({ aktif: m.duyuru_aktif === 'true', mesaj: m.duyuru_mesaj ?? '', renk: m.duyuru_renk ?? '#E8622A' })
      setBalonlar([m.duyuru_1 ?? '', m.duyuru_2 ?? '', m.duyuru_3 ?? '', m.duyuru_4 ?? '', m.duyuru_5 ?? '', m.duyuru_6 ?? ''])
    }
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const kaydet = async (tip: 'kampanya' | 'duyuru' | 'balonlar') => {
    setSaving(true)
    if (tip === 'kampanya') {
      await Promise.all([
        supabase.from('app_settings').upsert({ key: 'kampanya_aktif', value: String(kampanya.aktif) }),
        supabase.from('app_settings').upsert({ key: 'kampanya_bitis', value: kampanya.bitis }),
        supabase.from('app_settings').upsert({ key: 'kampanya_sart',  value: kampanya.sart }),
        supabase.from('app_settings').upsert({ key: 'kampanya_gun',   value: kampanya.gun }),
        supabase.from('app_settings').upsert({ key: 'kampanya_link',  value: kampanya.link }),
        supabase.from('app_settings').upsert({ key: 'kampanya_hiz',   value: kampanya.hiz }),
      ])

      // Kampanya aktifse tüm aşçılara bildirim gönder
      if (kampanya.aktif) {
        const { data: chefler } = await supabase
          .from('chef_profiles')
          .select('user_id')
          .eq('verification_status', 'approved')

        if (chefler && chefler.length > 0) {
          const bildirimler = chefler.map(c => ({
            user_id: c.user_id,
            title: '🎉 Yeni Kampanya Başladı!',
            body: kampanya.sart || ('Uygulamayı paylaş, ' + kampanya.gun + ' gün ücretsiz üyelik kazan!'),
            type: 'promo',
            is_read: false,
            created_at: new Date().toISOString(),
          }))
          await supabase.from('notifications').insert(bildirimler)
        }
      }
    } else if (tip === 'duyuru') {
      await Promise.all([
        supabase.from('app_settings').upsert({ key: 'duyuru_aktif', value: String(duyuru.aktif) }),
        supabase.from('app_settings').upsert({ key: 'duyuru_mesaj', value: duyuru.mesaj }),
        supabase.from('app_settings').upsert({ key: 'duyuru_renk',  value: duyuru.renk }),
      ])
    } else {
      await Promise.all(balonlar.map((b, i) => supabase.from('app_settings').upsert({ key: `duyuru_${i + 1}`, value: b })))
    }
    setSaving(false); showToast('Kaydedildi!')
  }

  const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E0D4', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>Yükleniyor...</div>

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', marginBottom: 24 }}>Kampanya & Duyuru Yönetimi</h1>

      {/* Kampanya */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>🉐 Ücretsiz Üyelik Kampanyası</h2>
            <p style={{ fontSize: 13, color: '#8A7B6B', margin: '4px 0 0' }}>Aşçılar uygulama paylaşımı yaparak ücretsiz üyelik kazanır</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={kampanya.aktif} onChange={e => setKampanya(p => ({ ...p, aktif: e.target.checked }))} />
            <span style={{ fontSize: 13, fontWeight: 700, color: kampanya.aktif ? '#3D6B47' : '#8A7B6B' }}>{kampanya.aktif ? 'Aktif' : 'Pasif'}</span>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Bitiş Tarihi</label>
            <input type="date" value={kampanya.bitis} onChange={e => setKampanya(p => ({ ...p, bitis: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Ücretsiz Üyelik Süresi (Gün)</label>
            <input type="number" min="1" max="365" value={kampanya.gun} onChange={e => setKampanya(p => ({ ...p, gun: e.target.value }))} placeholder="7" style={inp} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Paylaşım Linki</label>
          <input value={kampanya.link} onChange={e => setKampanya(p => ({ ...p, link: e.target.value }))} placeholder="https://www.anneelim.com" style={inp} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Kampanya Şartı (Mobilde gösterilir)</label>
          <input value={kampanya.sart} onChange={e => setKampanya(p => ({ ...p, sart: e.target.value }))} placeholder="Uygulamayı paylaş, ücretsiz üyelik kazan!" style={inp} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Kayan Yazı Hızı (saniye) — düşük = hızlı</label>
          <input type="number" min="5" max="60" value={kampanya.hiz} onChange={e => setKampanya(p => ({ ...p, hiz: e.target.value }))} placeholder="12" style={inp} />
        </div>

        {/* Önizleme */}
        {kampanya.aktif && (
          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid #86EFAC' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D', marginBottom: 6 }}>📱 Mobilde Göründüğü Hali</div>
            <div style={{ fontSize: 13, color: '#166534' }}>
              📢 {kampanya.sart || 'Uygulamayı paylaş, ücretsiz üyelik kazan!'} → Paylaş → <strong>{kampanya.gun} gün</strong> ücretsiz üyelik
            </div>
          </div>
        )}

        <button onClick={() => kaydet('kampanya')} disabled={saving}
          style={{ padding: '10px 24px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
          Kampanyayı Kaydet
        </button>
      </div>

      {/* Balonlar */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', margin: '0 0 6px' }}>🎈 Ana Sayfa Uçan Balonlar</h2>
        <p style={{ fontSize: 13, color: '#8A7B6B', margin: '0 0 20px' }}>Web ve mobil ana sayfasında hero alanında uçan 6 yuvarlak baloncuk</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {balonlar.map((b, i) => (
            <div key={i}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>{BALON_EMOJILER[i]} Balon {i + 1}</label>
              <input value={b} onChange={e => { const yeni = [...balonlar]; yeni[i] = e.target.value; setBalonlar(yeni) }}
                placeholder={`Balon ${i + 1} metni...`} maxLength={20} style={inp} />
            </div>
          ))}
        </div>
        <button onClick={() => kaydet('balonlar')} disabled={saving}
          style={{ padding: '10px 24px', borderRadius: 10, background: '#E8622A', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
          Balonları Kaydet
        </button>
      </div>

      {/* Duyuru */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', margin: 0 }}>📢 Nabız Atan Baloncuk Duyurusu</h2>
            <p style={{ fontSize: 13, color: '#8A7B6B', margin: '4px 0 0' }}>Navbar üstünde ortada görünen tek baloncuk</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={duyuru.aktif} onChange={e => setDuyuru(p => ({ ...p, aktif: e.target.checked }))} />
            <span style={{ fontSize: 13, fontWeight: 700, color: duyuru.aktif ? '#3D6B47' : '#8A7B6B' }}>{duyuru.aktif ? 'Aktif' : 'Pasif'}</span>
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#8A7B6B', display: 'block', marginBottom: 4 }}>Duyuru Mesajı</label>
          <input value={duyuru.mesaj} onChange={e => setDuyuru(p => ({ ...p, mesaj: e.target.value }))} placeholder="Yeni özelliklerimizi keşfedin!" style={inp} />
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

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#4A2C0E', color: 'white', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600, zIndex: 100 }}>✅ {toast}</div>
      )}
    </div>
  )
}