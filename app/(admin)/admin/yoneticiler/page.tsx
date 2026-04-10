// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  ['Dashboard',    '/admin'],
  ['Aşçılar',      '/admin/asciler'],
  ['Kullanıcılar', '/admin/kullanicilar'],
  ['Siparişler',   '/admin/siparisler'],
  ['Ödemeler',     '/admin/odemeler'],
  ['Üyelikler',    '/admin/uyelikler'],
  ['Yöneticiler',  '/admin/yoneticiler'],
]

export default function YoneticilerPage() {
  const [yoneticiler, setYoneticiler] = useState([])
  const [tumKullanicilar, setTumKullanicilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [aramaMetni, setAramaMetni] = useState('')
  const [islemYapiliyor, setIslemYapiliyor] = useState(null)

  useEffect(() => { yukle() }, [])

  const yukle = async () => {
    try {
      const supabase = getSupabaseBrowserClient()

      const { data: adminler } = await supabase
        .from('users')
        .select('id, full_name, phone, created_at')
        .eq('is_admin', true)
        .order('created_at', { ascending: false })

      setYoneticiler(adminler ?? [])

      const { data: kullanicilar } = await supabase
        .from('users')
        .select('id, full_name, phone')
        .eq('is_admin', false)
        .order('full_name', { ascending: true })
        .limit(100)

      setTumKullanicilar(kullanicilar ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const yetkiVer = async (userId: string) => {
    if (!confirm('Bu kullanıcıya admin yetkisi vermek istediğinize emin misiniz?')) return
    setIslemYapiliyor(userId)
    try {
      const supabase = getSupabaseBrowserClient()
      await (supabase as any).from('users').update({ is_admin: true }).eq('id', userId)
      await yukle()
    } catch (e: any) {
      alert('Hata: ' + e.message)
    } finally {
      setIslemYapiliyor(null)
    }
  }

  const yetkiKaldir = async (userId: string) => {
    if (!confirm('Bu yöneticinin yetkisini kaldırmak istediğinize emin misiniz?')) return
    setIslemYapiliyor(userId)
    try {
      const supabase = getSupabaseBrowserClient()
      await (supabase as any).from('users').update({ is_admin: false }).eq('id', userId)
      await yukle()
    } catch (e: any) {
      alert('Hata: ' + e.message)
    } finally {
      setIslemYapiliyor(null)
    }
  }

  const filtreliKullanicilar = tumKullanicilar.filter(k =>
    k.full_name?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    k.phone?.includes(aramaMetni)
  )

  const formatTarih = (tarih: string) =>
    new Date(tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <nav style={{ background:'#4A2C0E', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, color:'white', fontSize:18 }}>ANNEELİM · Admin</div>
        <div style={{ display:'flex', gap:20 }}>
          {NAV_LINKS.map(([l, h]) => (
            <Link key={h} href={h} style={{ color: h === '/admin/yoneticiler' ? 'white' : 'rgba(255,255,255,0.7)', fontSize:13, textDecoration:'none', fontWeight: h === '/admin/yoneticiler' ? 700 : 500 }}>{l}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 24px' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:'#4A2C0E', marginBottom:8 }}>Yöneticiler</h1>
        <p style={{ fontSize:13, color:'#8A7B6B', marginBottom:24 }}>Admin paneline erişim yetkisi olan kullanıcılar</p>

        {/* Mevcut Yöneticiler */}
        <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', marginBottom:24 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>
            Mevcut Yöneticiler ({yoneticiler.length})
          </div>

          {loading ? (
            <div style={{ color:'#8A7B6B', textAlign:'center', padding:24 }}>Yükleniyor...</div>
          ) : yoneticiler.length === 0 ? (
            <div style={{ color:'#8A7B6B', textAlign:'center', padding:24 }}>Yönetici bulunamadı</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Ad Soyad', 'Telefon', 'Eklenme Tarihi', 'İşlem'].map(h => (
                    <th key={h} style={{ fontSize:11, textTransform:'uppercase', letterSpacing:0.5, color:'#8A7B6B', padding:'10px 14px', textAlign:'left', borderBottom:'1px solid #E8E0D4' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yoneticiler.map(y => (
                  <tr key={y.id}>
                    <td style={{ padding:'14px', borderBottom:'1px solid rgba(232,224,212,0.4)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'#FEE2E2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#DC2626' }}>
                          {y.full_name?.charAt(0) ?? '?'}
                        </div>
                        <span style={{ fontWeight:600, fontSize:14, color:'#4A2C0E' }}>{y.full_name ?? '-'}</span>
                      </div>
                    </td>
                    <td style={{ padding:'14px', borderBottom:'1px solid rgba(232,224,212,0.4)', fontSize:13, color:'#8A7B6B' }}>{y.phone ?? '-'}</td>
                    <td style={{ padding:'14px', borderBottom:'1px solid rgba(232,224,212,0.4)', fontSize:13, color:'#8A7B6B' }}>{formatTarih(y.created_at)}</td>
                    <td style={{ padding:'14px', borderBottom:'1px solid rgba(232,224,212,0.4)' }}>
                      <button
                        onClick={() => yetkiKaldir(y.id)}
                        disabled={islemYapiliyor === y.id}
                        style={{ padding:'6px 14px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}
                      >
                        {islemYapiliyor === y.id ? 'İşleniyor...' : 'Yetkiyi Kaldır'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Yeni Yönetici Ekle */}
        <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>
            Yönetici Ekle
          </div>

          <input
            value={aramaMetni}
            onChange={e => setAramaMetni(e.target.value)}
            placeholder="Kullanıcı adı veya telefon ara..."
            style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', marginBottom:16, boxSizing:'border-box' }}
          />

          {aramaMetni.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {filtreliKullanicilar.length === 0 ? (
                <div style={{ color:'#8A7B6B', fontSize:13, textAlign:'center', padding:16 }}>Kullanıcı bulunamadı</div>
              ) : filtreliKullanicilar.slice(0, 10).map(k => (
                <div key={k.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#FAF6EF', borderRadius:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'#FEF3EC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#E8622A' }}>
                      {k.full_name?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14, color:'#4A2C0E' }}>{k.full_name ?? 'İsimsiz'}</div>
                      <div style={{ fontSize:12, color:'#8A7B6B' }}>{k.phone ?? '-'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => yetkiVer(k.id)}
                    disabled={islemYapiliyor === k.id}
                    style={{ padding:'8px 16px', background:'#E8622A', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}
                  >
                    {islemYapiliyor === k.id ? 'İşleniyor...' : '+ Yönetici Yap'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}