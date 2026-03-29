// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const NAV = [
  ['Dashboard', '/admin'],
  ['Aşçılar', '/admin/asciler'],
  ['Kullanıcılar', '/admin/kullanicilar'],
  ['Siparişler', '/admin/siparisler'],
  ['Ödemeler', '/admin/odemeler'],
  ['Üyelikler', '/admin/uyelikler'],
]

export default function UyeliklerPage() {
  const supabase = getSupabaseBrowserClient()
  const [asciler, setAsciler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydedilen, setKaydedilen] = useState<string | null>(null)
  const [duzenlenen, setDuzenlenen] = useState<any>(null)

  useEffect(() => { verileriYukle() }, [])

  const verileriYukle = async () => {
    setYukleniyor(true)
    try {
      // Tüm aşçıları çek
      const { data: chefData } = await supabase
        .from('chef_profiles')
        .select('id, display_name, is_approved, badge')
        .order('display_name')

      // Üyelikleri çek
      const { data: aboneData } = await supabase
        .from('chef_subscriptions')
        .select('*')

      // Paylaşım sayıları
      const { data: shareData } = await supabase
        .from('share_logs')
        .select('chef_id')

      const shareMap: Record<string, number> = {}
      ;(shareData ?? []).forEach((s: any) => {
        shareMap[s.chef_id] = (shareMap[s.chef_id] ?? 0) + 1
      })

      const aboneMap: Record<string, any> = {}
      ;(aboneData ?? []).forEach((a: any) => { aboneMap[a.chef_id] = a })

      const birlesik = (chefData ?? []).map((c: any) => ({
        ...c,
        abonelik: aboneMap[c.id] ?? null,
        share_count: shareMap[c.id] ?? 0,
      }))

      setAsciler(birlesik)
    } catch (e) {
      console.error('Veri yükle hata:', e)
    } finally {
      setYukleniyor(false)
    }
  }

  const kaydet = async (chefId: string, data: any) => {
    setKaydedilen(chefId)
    try {
      const mevcutAbone = asciler.find(a => a.id === chefId)?.abonelik

      if (mevcutAbone) {
        await supabase
          .from('chef_subscriptions')
          .update({
            monthly_fee: parseFloat(data.monthly_fee),
            discount_pct: parseInt(data.discount_pct),
            discount_reason: data.discount_reason,
            plan: data.plan,
            updated_at: new Date().toISOString(),
          })
          .eq('chef_id', chefId)
      } else {
        await supabase
          .from('chef_subscriptions')
          .insert({
            chef_id: chefId,
            monthly_fee: parseFloat(data.monthly_fee),
            discount_pct: parseInt(data.discount_pct),
            discount_reason: data.discount_reason,
            plan: data.plan,
            is_active: true,
          })
      }

      setDuzenlenen(null)
      verileriYukle()
    } catch (e) {
      alert('Kaydetme hatası!')
    } finally {
      setTimeout(() => setKaydedilen(null), 1500)
    }
  }

  const BADGE_RENK: Record<string, string> = {
    new: '#6B7280', trusted: '#059669', master: '#D97706', chef: '#B45309'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background:'#4A2C0E', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, color:'white', fontSize:18 }}>EV YEMEKLERİ · Admin</div>
        <div style={{ display:'flex', gap:20 }}>
          {NAV.map(([l, h]) => (
            <Link key={h} href={h} style={{ color: h === '/admin/uyelikler' ? 'white' : 'rgba(255,255,255,0.7)', fontSize:13, textDecoration:'none', fontWeight: h === '/admin/uyelikler' ? 700 : 500 }}>{l}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:'#4A2C0E' }}>
            🏷️ Üyelik Yönetimi
          </h1>
          <div style={{ fontSize:13, color:'#8A7B6B' }}>{asciler.length} aşçı</div>
        </div>

        {/* Bilgi notu */}
        <div style={{ background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:12, padding:16, marginBottom:24 }}>
          <div style={{ fontWeight:700, color:'#5B21B6', marginBottom:6 }}>💡 Nasıl Çalışır?</div>
          <div style={{ fontSize:13, color:'#6B21A8', lineHeight:1.6 }}>
            Her aşçıya aylık üyelik ücreti ve indirim oranı belirleyebilirsiniz.
            İndirim oranını <strong>%100</strong> yaparak aşçıya ücretsiz üyelik tanımlayabilirsiniz.
            Aşçılar sosyal medyada paylaşım yaptığında bu sayfadan indirim tanımlayın.
          </div>
        </div>

        {yukleniyor ? (
          <div style={{ textAlign:'center', padding:60, color:'#8A7B6B' }}>Yükleniyor...</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {asciler.map(asci => {
              const duz = duzenlenen?.id === asci.id ? duzenlenen : null
              const indirimliUcret = asci.abonelik?.discount_pct > 0
                ? Math.round((asci.abonelik.monthly_fee ?? 299) * (1 - asci.abonelik.discount_pct / 100))
                : null

              return (
                <div key={asci.id} style={{ background:'white', borderRadius:16, padding:20, boxShadow:'0 2px 8px rgba(74,44,14,0.06)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: duz ? 20 : 0 }}>
                    {/* Sol: Aşçı bilgisi */}
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:44, height:44, borderRadius:22, background:'#FEF3EC', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👩‍🍳</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E' }}>{asci.display_name ?? 'İsimsiz Aşçı'}</div>
                        <div style={{ display:'flex', gap:8, marginTop:4 }}>
                          <span style={{ fontSize:11, fontWeight:700, color: BADGE_RENK[asci.badge] ?? '#6B7280', background: BADGE_RENK[asci.badge] + '15', borderRadius:6, padding:'2px 8px' }}>
                            {asci.badge === 'new' ? '🌱 Yeni' : asci.badge === 'trusted' ? '⭐ Güvenilir' : asci.badge === 'master' ? '🏅 Usta' : '👑 Şef'}
                          </span>
                          <span style={{ fontSize:11, color:'#8A7B6B' }}>📤 {asci.share_count} paylaşım</span>
                        </div>
                      </div>
                    </div>

                    {/* Orta: Üyelik durumu */}
                    <div style={{ textAlign:'center' }}>
                      {asci.abonelik ? (
                        <>
                          <div style={{ fontSize:11, color:'#8A7B6B', marginBottom:2 }}>Aylık Ücret</div>
                          {indirimliUcret !== null ? (
                            <div>
                              <span style={{ fontSize:13, color:'#8A7B6B', textDecoration:'line-through', marginRight:6 }}>₺{asci.abonelik.monthly_fee}</span>
                              <span style={{ fontSize:18, fontWeight:800, color:'#059669' }}>₺{indirimliUcret}</span>
                              <span style={{ fontSize:11, background:'#D1FAE5', color:'#059669', borderRadius:6, padding:'2px 8px', marginLeft:6, fontWeight:700 }}>%{asci.abonelik.discount_pct} indirim</span>
                            </div>
                          ) : (
                            <div style={{ fontSize:18, fontWeight:800, color:'#4A2C0E' }}>₺{asci.abonelik.monthly_fee}/ay</div>
                          )}
                          {asci.abonelik.discount_reason && (
                            <div style={{ fontSize:11, color:'#059669', marginTop:2 }}>🎁 {asci.abonelik.discount_reason}</div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize:12, color:'#8A7B6B', fontStyle:'italic' }}>Üyelik tanımlı değil</div>
                      )}
                    </div>

                    {/* Sağ: Düzenle butonu */}
                    <button
                      onClick={() => setDuzenlenen(duz ? null : {
                        id: asci.id,
                        plan: asci.abonelik?.plan ?? 'basic',
                        monthly_fee: asci.abonelik?.monthly_fee ?? 299,
                        discount_pct: asci.abonelik?.discount_pct ?? 0,
                        discount_reason: asci.abonelik?.discount_reason ?? '',
                      })}
                      style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid #E8622A', background: duz ? '#E8622A' : 'transparent', color: duz ? 'white' : '#E8622A', fontWeight:700, fontSize:13, cursor:'pointer' }}
                    >
                      {duz ? 'İptal' : '✏️ Düzenle'}
                    </button>
                  </div>

                  {/* Düzenleme formu */}
                  {duz && (
                    <div style={{ borderTop:'1px solid #F0E8DC', paddingTop:20 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:16 }}>
                        <div>
                          <label style={{ fontSize:12, fontWeight:700, color:'#8A7B6B', display:'block', marginBottom:6 }}>Plan</label>
                          <select
                            value={duz.plan}
                            onChange={e => setDuzenlenen({ ...duz, plan: e.target.value })}
                            style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #E8E0D4', fontSize:13, color:'#4A2C0E', background:'#FAF6EF' }}
                          >
                            <option value="basic">🌱 Basic</option>
                            <option value="premium">⭐ Premium</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:12, fontWeight:700, color:'#8A7B6B', display:'block', marginBottom:6 }}>Aylık Ücret (₺)</label>
                          <input
                            type="number"
                            value={duz.monthly_fee}
                            onChange={e => setDuzenlenen({ ...duz, monthly_fee: e.target.value })}
                            style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #E8E0D4', fontSize:13, color:'#4A2C0E', background:'#FAF6EF', boxSizing:'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize:12, fontWeight:700, color:'#8A7B6B', display:'block', marginBottom:6 }}>İndirim Oranı (%0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={duz.discount_pct}
                            onChange={e => setDuzenlenen({ ...duz, discount_pct: e.target.value })}
                            style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #E8E0D4', fontSize:13, color:'#4A2C0E', background:'#FAF6EF', boxSizing:'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize:12, fontWeight:700, color:'#8A7B6B', display:'block', marginBottom:6 }}>İndirim Sebebi</label>
                          <input
                            type="text"
                            value={duz.discount_reason}
                            onChange={e => setDuzenlenen({ ...duz, discount_reason: e.target.value })}
                            placeholder="örn: Sosyal medya paylaşımı"
                            style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #E8E0D4', fontSize:13, color:'#4A2C0E', background:'#FAF6EF', boxSizing:'border-box' }}
                          />
                        </div>
                      </div>

                      {/* Önizleme */}
                      <div style={{ background:'#F5F3FF', borderRadius:10, padding:12, marginBottom:16, fontSize:13, color:'#5B21B6' }}>
                        💡 Aşçı aylık <strong>₺{duz.discount_pct > 0 ? Math.round(duz.monthly_fee * (1 - duz.discount_pct / 100)) : duz.monthly_fee}</strong> ödeyecek
                        {duz.discount_pct > 0 && ` (₺${duz.monthly_fee} yerine %${duz.discount_pct} indirimli)`}
                        {parseInt(duz.discount_pct) === 100 && ' → ÜCRETSİZ ÜYELİK 🎉'}
                      </div>

                      <button
                        onClick={() => kaydet(asci.id, duz)}
                        disabled={kaydedilen === asci.id}
                        style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'#E8622A', color:'white', fontWeight:700, fontSize:14, cursor:'pointer', opacity: kaydedilen === asci.id ? 0.7 : 1 }}
                      >
                        {kaydedilen === asci.id ? '✅ Kaydedildi!' : 'Kaydet'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}