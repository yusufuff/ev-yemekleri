// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function PaylasimPage() {
  const supabase = getSupabaseBrowserClient()
  const [chefId, setChefId] = useState<string | null>(null)
  const [chefAd, setChefAd] = useState('')
  const [abonelik, setAbonelik] = useState<any>(null)
  const [kampanyalar, setKampanyalar] = useState<any[]>([])
  const [paylasimSayisi, setPaylasimSayisi] = useState(0)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kopyalandi, setKopyalandi] = useState(false)
  const [yeniKampanya, setYeniKampanya] = useState({ title: '', discount_pct: '10' })
  const [kampanyaYukleniyor, setKampanyaYukleniyor] = useState(false)
  const [kampanyaFormu, setKampanyaFormu] = useState(false)

  useEffect(() => { verileriYukle() }, [])

  const verileriYukle = async () => {
    setYukleniyor(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: chefData } = await supabase
        .from('chef_profiles')
        .select('id, user_id, users(full_name)')
        .eq('user_id', user.id)
        .single()

      if (chefData) {
        setChefId(chefData.id)
        setChefAd((chefData.users as any)?.full_name ?? 'Aşçı')

        const { data: abone } = await supabase
          .from('chef_subscriptions')
          .select('*')
          .eq('chef_id', chefData.id)
          .single()
        setAbonelik(abone)

        const { data: kampanya } = await supabase
          .from('chef_campaigns')
          .select('*')
          .eq('chef_id', chefData.id)
          .order('created_at', { ascending: false })
        setKampanyalar(kampanya ?? [])

        const { count } = await supabase
          .from('share_logs')
          .select('*', { count: 'exact', head: true })
          .eq('chef_id', chefData.id)
        setPaylasimSayisi(count ?? 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setYukleniyor(false)
    }
  }

  const profilLinkKopyala = () => {
    if (!chefId) return
    const link = `https://www.anneelim.com/asci/${chefId}`
    navigator.clipboard.writeText(link)
    setKopyalandi(true)
    setTimeout(() => setKopyalandi(false), 2000)
  }

  const paylasimYap = (platform: string) => {
    if (!chefId) return
    const link = `https://www.anneelim.com/asci/${chefId}`
    const mesaj = encodeURIComponent(`🍽️ ${chefAd} - Anneelim'de ev yemekleri yapıyorum! Sipariş vermek için: ${link}`)

    if (platform === 'instagram') {
      navigator.clipboard.writeText(link)
      alert('📸 Link kopyalandı! Instagram'ı aç, hikaye veya gönderi oluştur, linki yapıştır.')
      supabase.from('share_logs').insert({ chef_id: chefId, share_type: 'chef_profile', platform: 'instagram' })
      setPaylasimSayisi(prev => prev + 1)
      return
    }

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${mesaj}`,
      twitter: `https://twitter.com/intent/tweet?text=${mesaj}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    }

    if (urls[platform]) {
      window.open(urls[platform], '_blank')
    }

    // Log kaydet
    supabase.from('share_logs').insert({
      chef_id: chefId,
      share_type: 'chef_profile',
      platform,
    })

    // Paylaşım sayısını artır
    setPaylasimSayisi(prev => prev + 1)
  }

  const kampanyaEkle = async () => {
    if (!chefId || !yeniKampanya.title.trim()) return
    const pct = parseInt(yeniKampanya.discount_pct)
    if (!pct || pct < 1 || pct > 100) { alert('Geçerli bir indirim oranı gir (1-100)'); return }

    setKampanyaYukleniyor(true)
    try {
      await supabase.from('chef_campaigns').insert({
        chef_id: chefId,
        title: yeniKampanya.title,
        discount_pct: pct,
        coupon_prefix: 'SHARE',
        is_active: true,
      })
      setYeniKampanya({ title: '', discount_pct: '10' })
      setKampanyaFormu(false)
      verileriYukle()
    } catch (e) {
      alert('Kampanya eklenemedi.')
    } finally {
      setKampanyaYukleniyor(false)
    }
  }

  const kampanyaToggle = async (id: string, aktif: boolean) => {
    await supabase.from('chef_campaigns').update({ is_active: !aktif }).eq('id', id)
    setKampanyalar(prev => prev.map(k => k.id === id ? { ...k, is_active: !aktif } : k))
  }

  const kampanyaSil = async (id: string) => {
    if (!confirm('Bu kampanya silinecek, emin misin?')) return
    await supabase.from('chef_campaigns').delete().eq('id', id)
    setKampanyalar(prev => prev.filter(k => k.id !== id))
  }

  const indirimliUcret = abonelik?.discount_pct > 0
    ? Math.round((abonelik.monthly_fee ?? 299) * (1 - abonelik.discount_pct / 100))
    : null

  if (yukleniyor) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', color:'#8A7B6B', fontFamily:"'DM Sans', sans-serif" }}>
      Yükleniyor...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 20px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:'#4A2C0E', margin:0 }}>
              📲 Paylaşım & Kampanya
            </h1>
            <p style={{ color:'#8A7B6B', fontSize:13, margin:'4px 0 0' }}>Profilini paylaş, daha fazla müşteriye ulaş</p>
          </div>
          <Link href="/dashboard" style={{ fontSize:13, color:'#E8622A', fontWeight:600, textDecoration:'none' }}>
            ← Dashboard'a Dön
          </Link>
        </div>

        {/* Üyelik Kartı */}
        <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', marginBottom:20, borderTop:'3px solid #8B5CF6' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:12, color:'#8A7B6B', fontWeight:600, marginBottom:4 }}>ÜYELİK DURUMUN</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#4A2C0E' }}>
                {abonelik?.plan === 'premium' ? '⭐ Premium' : '🌱 Basic'} Üye
              </div>
              {abonelik?.discount_reason && (
                <div style={{ fontSize:12, color:'#059669', marginTop:4, fontWeight:600 }}>
                  🎁 {abonelik.discount_reason}
                </div>
              )}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, color:'#8A7B6B', marginBottom:4 }}>Aylık Ücret</div>
              {indirimliUcret !== null ? (
                <div>
                  <span style={{ fontSize:14, color:'#8A7B6B', textDecoration:'line-through', marginRight:8 }}>₺{abonelik.monthly_fee}</span>
                  <span style={{ fontSize:24, fontWeight:900, color:'#059669' }}>₺{indirimliUcret}</span>
                  <div style={{ fontSize:11, background:'#D1FAE5', color:'#059669', borderRadius:6, padding:'2px 10px', display:'inline-block', marginLeft:8, fontWeight:700 }}>
                    %{abonelik.discount_pct} indirim
                  </div>
                </div>
              ) : (
                <div style={{ fontSize:24, fontWeight:900, color:'#4A2C0E' }}>₺{abonelik?.monthly_fee ?? 299}</div>
              )}
              {parseInt(abonelik?.discount_pct) === 100 && (
                <div style={{ fontSize:13, color:'#059669', fontWeight:700, marginTop:4 }}>🎉 Ücretsiz Üyelik!</div>
              )}
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:20 }}>
          {[
            { label:'Toplam Paylaşım', value: paylasimSayisi, emoji:'📤' },
            { label:'Aktif Kampanya', value: kampanyalar.filter(k => k.is_active).length, emoji:'🎯' },
            { label:'Üyelik İndirimi', value: `%${abonelik?.discount_pct ?? 0}`, emoji:'🏷️' },
          ].map(s => (
            <div key={s.label} style={{ background:'white', borderRadius:14, padding:20, textAlign:'center', boxShadow:'0 2px 8px rgba(74,44,14,0.06)' }}>
              <div style={{ fontSize:28 }}>{s.emoji}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:'#4A2C0E', margin:'4px 0' }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#8A7B6B', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Profil Paylaşım */}
        <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', marginBottom:20 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#4A2C0E', marginBottom:6 }}>
            📤 Profilini Paylaş
          </div>
          <div style={{ fontSize:13, color:'#8A7B6B', marginBottom:20, lineHeight:1.6 }}>
            Profil linkin sosyal medyada yayıldıkça daha fazla müşteriye ulaşırsın.
            Yönetici paylaşımlarını takip ederek üyelik indirim tanımlayabilir.
          </div>

          {/* Link kutusu */}
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            <div style={{ flex:1, background:'#FAF6EF', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#8A7B6B', border:'1.5px solid #E8E0D4', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              https://www.anneelim.com/asci/{chefId}
            </div>
            <button onClick={profilLinkKopyala} style={{ padding:'12px 20px', borderRadius:10, border:'none', background: kopyalandi ? '#059669' : '#E8622A', color:'white', fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
              {kopyalandi ? '✅ Kopyalandı!' : '📋 Kopyala'}
            </button>
          </div>

          {/* Platform butonları */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {[
              { id:'whatsapp', label:'WhatsApp', emoji:'💬', renk:'#25D366' },
              { id:'twitter', label:'Twitter/X', emoji:'🐦', renk:'#1DA1F2' },
              { id:'facebook', label:'Facebook', emoji:'👥', renk:'#1877F2' },
              { id:'instagram', label:'Instagram', emoji:'📸', renk:'#E1306C' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => paylasimYap(p.id)}
                style={{ flex:1, minWidth:'45%', padding:'12px 0', borderRadius:12, border:`1.5px solid ${p.renk}40`, background:`${p.renk}10`, color:p.renk, fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
              >
                <span style={{ fontSize:18 }}>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kampanya Yönetimi */}
        <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#4A2C0E' }}>
              🎯 Alıcı Kampanyaları
            </div>
            <button
              onClick={() => setKampanyaFormu(!kampanyaFormu)}
              style={{ padding:'8px 16px', borderRadius:10, border:'none', background:'#E8622A', color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}
            >
              + Yeni Kampanya
            </button>
          </div>
          <div style={{ fontSize:13, color:'#8A7B6B', marginBottom:20, lineHeight:1.6 }}>
            Alıcılar profilini paylaşınca otomatik kupon kodu (SHARE-XXXX) üretilir ve indirim kazanırlar.
            Platform karışmaz — bu indirim seninle alıcı arasındadır.
          </div>

          {/* Yeni Kampanya Formu */}
          {kampanyaFormu && (
            <div style={{ background:'#FAF6EF', borderRadius:12, padding:20, marginBottom:20, border:'1.5px solid #E8E0D4' }}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'#8A7B6B', display:'block', marginBottom:6 }}>Kampanya Başlığı</label>
                  <input
                    type="text"
                    value={yeniKampanya.title}
                    onChange={e => setYeniKampanya({...yeniKampanya, title: e.target.value})}
                    placeholder="örn: Profili paylaşana %15 indirim"
                    style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #E8E0D4', fontSize:13, color:'#4A2C0E', background:'white', boxSizing:'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'#8A7B6B', display:'block', marginBottom:6 }}>İndirim Oranı (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={yeniKampanya.discount_pct}
                    onChange={e => setYeniKampanya({...yeniKampanya, discount_pct: e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #E8E0D4', fontSize:13, color:'#4A2C0E', background:'white', boxSizing:'border-box' }}
                  />
                </div>
              </div>
              <div style={{ background:'#FFF9E6', borderRadius:8, padding:10, fontSize:12, color:'#92400e', marginBottom:12 }}>
                💡 Alıcı profilini paylaşınca "SHARE-XXXX" kodu otomatik üretilir ve %{yeniKampanya.discount_pct} indirim kazanır.
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={kampanyaEkle} disabled={kampanyaYukleniyor}
                  style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'#E8622A', color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  {kampanyaYukleniyor ? 'Kaydediliyor...' : 'Kampanya Oluştur'}
                </button>
                <button onClick={() => setKampanyaFormu(false)}
                  style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid #E8E0D4', background:'white', color:'#8A7B6B', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Kampanya Listesi */}
          {kampanyalar.length === 0 ? (
            <div style={{ textAlign:'center', padding:32, color:'#8A7B6B' }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🎯</div>
              <div style={{ fontWeight:600, marginBottom:4 }}>Henüz kampanya yok</div>
              <div style={{ fontSize:12 }}>İlk kampanyanı oluştur!</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {kampanyalar.map(k => (
                <div key={k.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderRadius:12, background:'#FAF6EF', border:'1.5px solid #E8E0D4', opacity: k.is_active ? 1 : 0.6 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#4A2C0E', marginBottom:4 }}>{k.title}</div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:11, background:'#FEF3EC', color:'#E8622A', borderRadius:6, padding:'2px 8px', fontWeight:700 }}>%{k.discount_pct} indirim</span>
                      <span style={{ fontSize:11, color:'#8A7B6B' }}>Kod: SHARE-****</span>
                      <span style={{ fontSize:11, color:'#8A7B6B' }}>🔗 {k.share_count ?? 0} paylaşım</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <button onClick={() => kampanyaToggle(k.id, k.is_active)}
                      style={{ padding:'6px 14px', borderRadius:8, border:'none', background: k.is_active ? '#ECFDF5' : '#F3F4F6', color: k.is_active ? '#059669' : '#6B7280', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                      {k.is_active ? '✅ Aktif' : '⏸ Pasif'}
                    </button>
                    <button onClick={() => kampanyaSil(k.id)}
                      style={{ padding:'6px 12px', borderRadius:8, border:'none', background:'#FEE2E2', color:'#DC2626', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}