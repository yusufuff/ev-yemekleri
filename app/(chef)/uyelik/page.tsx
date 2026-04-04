// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function UyelikPage() {
  const [loading,      setLoading]      = useState(true)
  const [odemeniyor,   setOdemeniyor]   = useState(false)
  const [abonelik,     setAbonelik]     = useState<any>(null)
  const [aylikUcret,   setAylikUcret]   = useState(100)
  const [chefId,       setChefId]       = useState<string | null>(null)
  const [mesaj,        setMesaj]        = useState<{tip: 'basari' | 'hata'; metin: string} | null>(null)

  useEffect(() => { verileriYukle() }, [])

  const verileriYukle = async () => {
    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Chef profil ID
    const { data: cp } = await supabase
      .from('chef_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!cp) return
    setChefId(cp.id)

    // Global ücret
    const { data: setting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'membership_fee')
      .single()

    if (setting?.value) setAylikUcret(Number(setting.value))

    // Abonelik durumu
    const { data: abone } = await supabase
      .from('chef_subscriptions')
      .select('*')
      .eq('chef_id', cp.id)
      .single()

    setAbonelik(abone)
    setLoading(false)
  }

  const odemeYap = async () => {
    if (!chefId) return
    setOdemeniyor(true)
    setMesaj(null)

    try {
      const res = await fetch('/api/chef/uyelik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chef_id: chefId }),
      })
      const data = await res.json()

      if (res.ok) {
        setMesaj({ tip: 'basari', metin: 'Üyeliğiniz başarıyla aktive edildi! 🎉' })
        verileriYukle()
      } else {
        setMesaj({ tip: 'hata', metin: data.error ?? 'Bir hata oluştu.' })
      }
    } catch {
      setMesaj({ tip: 'hata', metin: 'Bağlantı hatası, tekrar deneyin.' })
    } finally {
      setOdemeniyor(false)
    }
  }

  const formatTarih = (iso: string) => {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const kalanGun = abonelik?.expires_at
    ? Math.ceil((new Date(abonelik.expires_at).getTime() - Date.now()) / 86400000)
    : null

  const aktif = abonelik?.status === 'active' && kalanGun !== null && kalanGun > 0

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#FAF6EF', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans', sans-serif" }}>
        <div style={{ color:'#8A7B6B', fontSize:14 }}>Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:560, margin:'0 auto', padding:'32px 16px' }}>

        {/* Başlık */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <Link href="/dashboard" style={{ color:'#8A7B6B', textDecoration:'none', fontSize:13 }}>← Dashboard</Link>
          <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:24, fontWeight:900, color:'#4A2C0E', margin:0 }}>
            Üyelik
          </h1>
        </div>

        {/* Mesaj */}
        {mesaj && (
          <div style={{
            background: mesaj.tip === 'basari' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${mesaj.tip === 'basari' ? '#86EFAC' : '#FECACA'}`,
            borderRadius:12, padding:'12px 16px', marginBottom:20,
            fontSize:14, fontWeight:600,
            color: mesaj.tip === 'basari' ? '#059669' : '#DC2626',
          }}>
            {mesaj.metin}
          </div>
        )}

        {aktif ? (
          /* Aktif üyelik */
          <>
            <div style={{ background:'white', borderRadius:20, padding:28, boxShadow:'0 2px 16px rgba(74,44,14,0.08)', marginBottom:16, border:'2px solid #059669' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ width:48, height:48, borderRadius:24, background:'#ECFDF5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>✅</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:17, color:'#059669' }}>Üyeliğiniz Aktif</div>
                  <div style={{ fontSize:13, color:'#8A7B6B', marginTop:2 }}>Platform üzerinde aktif olarak satış yapabilirsiniz.</div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                {[
                  { label:'Aylık Ücret',     value:`₺${abonelik.amount_paid ?? aylikUcret}` },
                  { label:'Başlangıç',        value: abonelik.started_at ? formatTarih(abonelik.started_at) : '—' },
                  { label:'Bitiş Tarihi',     value: abonelik.expires_at ? formatTarih(abonelik.expires_at) : '—' },
                  { label:'Kalan Süre',       value: `${kalanGun} gün` },
                ].map(item => (
                  <div key={item.label} style={{ background:'#F5FDF8', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:11, color:'#8A7B6B', fontWeight:600, marginBottom:4 }}>{item.label}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#4A2C0E' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Uyarı: son 7 gün */}
              {kalanGun !== null && kalanGun <= 7 && (
                <div style={{ background:'#FEF3EC', border:'1px solid #F28B5E', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#E8622A', fontWeight:600 }}>
                  ⚠️ Üyeliğinizin süresi {kalanGun} gün içinde dolacak. Yenilemek ister misiniz?
                </div>
              )}

              <button
                onClick={odemeYap}
                disabled={odemeniyor || (kalanGun !== null && kalanGun > 7)}
                style={{
                  width:'100%', padding:'14px', borderRadius:12, border:'none',
                  background: kalanGun !== null && kalanGun > 7 ? '#E8E0D4' : '#E8622A',
                  color: kalanGun !== null && kalanGun > 7 ? '#8A7B6B' : 'white',
                  fontWeight:700, fontSize:15, cursor: kalanGun !== null && kalanGun > 7 ? 'default' : 'pointer',
                  fontFamily:'inherit',
                }}
              >
                {odemeniyor ? '⏳ İşleniyor...' : kalanGun !== null && kalanGun > 7 ? `Yenileme ${kalanGun} gün sonra` : `🔄 Üyeliği Yenile — ₺${aylikUcret}`}
              </button>
            </div>

            {/* Avantajlar */}
            <div style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(74,44,14,0.06)' }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#4A2C0E', marginBottom:14 }}>Üyelik Avantajları</div>
              {[
                '✅ Sınırsız menü öğesi ekle',
                '✅ Siparişleri anlık takip et',
                '✅ Müşteri bildirimleri al',
                '✅ Keşfet sayfasında görün',
                '✅ Rozet sistemi ve istatistikler',
              ].map(m => (
                <div key={m} style={{ fontSize:13, color:'#4A2C0E', padding:'6px 0', borderBottom:'1px solid #F5EDD8' }}>{m}</div>
              ))}
            </div>
          </>
        ) : (
          /* Üyelik yok / pasif */
          <>
            {/* Üyelik kartı */}
            <div style={{ background:'linear-gradient(135deg, #4A2C0E, #E8622A)', borderRadius:20, padding:28, marginBottom:16, color:'white' }}>
              <div style={{ fontSize:13, fontWeight:700, opacity:0.8, marginBottom:8, letterSpacing:1 }}>AYLIK ÜYELİK PAKET</div>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:42, fontWeight:900, marginBottom:4 }}>₺{aylikUcret}</div>
              <div style={{ fontSize:13, opacity:0.8, marginBottom:20 }}>/ ay · Her ay otomatik yenilenir</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  'Sınırsız menü', 'Anlık sipariş', 'Müşteri bildirimleri',
                  'Keşfet görünürlüğü', 'Rozet sistemi', 'İstatistikler',
                ].map(f => (
                  <div key={f} style={{ fontSize:12, opacity:0.9, display:'flex', alignItems:'center', gap:6 }}>
                    <span>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Uyarı */}
            {abonelik && !aktif && (
              <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#DC2626', fontWeight:600 }}>
                ⚠️ Üyeliğinizin süresi doldu. Platform üzerinde görünmek için yenileyin.
              </div>
            )}

            {/* Ödeme kutusu */}
            <div style={{ background:'white', borderRadius:20, padding:24, boxShadow:'0 2px 16px rgba(74,44,14,0.08)', marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E', marginBottom:16 }}>💳 Ödeme Bilgileri</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {[
                  ['Kart No',       '4242 4242 4242 4242'],
                  ['Son Kullanma',  '12/28'],
                  ['CVV',           '123'],
                  ['Kart Sahibi',   'Test User'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize:11, fontWeight:600, color:'#7A4A20', marginBottom:4 }}>{label}</div>
                    <input defaultValue={val} readOnly style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:12, fontFamily:'inherit', boxSizing:'border-box', color:'#8A7B6B' }} />
                  </div>
                ))}
              </div>

              <div style={{ background:'#FEF3EC', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#E8622A' }}>
                💡 Şu an demo modunda — gerçek ödeme alınmaz.
              </div>

              <button
                onClick={odemeYap}
                disabled={odemeniyor}
                style={{
                  width:'100%', padding:'16px', borderRadius:12, border:'none',
                  background: odemeniyor ? '#F28B5E' : '#E8622A',
                  color:'white', fontWeight:700, fontSize:16, cursor: odemeniyor ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit',
                }}
              >
                {odemeniyor ? '⏳ İşleniyor...' : `🚀 Üyeliği Başlat — ₺${aylikUcret}/ay`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}