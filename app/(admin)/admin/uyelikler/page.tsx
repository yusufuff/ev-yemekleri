// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function UyeliklerPage() {
  const supabase = getSupabaseBrowserClient()
  const [yukleniyor, setYukleniyor] = useState(true)
  const [asciler, setAsciler] = useState<any[]>([])
  const [aylikUcret, setAylikUcret] = useState('100')
  const [yeniUcret, setYeniUcret] = useState('100')
  const [ucretKaydedil, setUcretKaydedil] = useState(false)
  const [ucretYukleniyor, setUcretYukleniyor] = useState(false)

  useEffect(() => { verileriYukle() }, [])

  const verileriYukle = async () => {
    setYukleniyor(true)
    try {
      const { data: setting } = await supabase.from('platform_settings').select('value').eq('key', 'membership_fee').single()
      if (setting?.value) { setAylikUcret(setting.value); setYeniUcret(setting.value) }
      const { data: chefData } = await supabase.from('chef_profiles').select('id, badge, verification_status, user_id, created_at').order('created_at', { ascending: false })
      const { data: aboneData } = await supabase.from('chef_subscriptions').select('*')
      const userIds = (chefData ?? []).map((c: any) => c.user_id)
      const { data: userData } = await supabase.from('users').select('id, full_name').in('id', userIds)
      const userMap: Record<string, string> = {}
      ;(userData ?? []).forEach((u: any) => { userMap[u.id] = u.full_name })
      const aboneMap: Record<string, any> = {}
      ;(aboneData ?? []).forEach((a: any) => { aboneMap[a.chef_id] = a })
      setAsciler((chefData ?? []).map((c: any) => ({ ...c, full_name: userMap[c.user_id] ?? 'İsimsiz Aşçı', abonelik: aboneMap[c.id] ?? null })))
    } catch (e) { console.error(e) } finally { setYukleniyor(false) }
  }

  const ucretiKaydet = async () => {
    if (!yeniUcret || isNaN(Number(yeniUcret)) || Number(yeniUcret) < 0) { alert('Geçerli bir ücret girin.'); return }
    setUcretYukleniyor(true)
    try {
      await supabase.from('platform_settings').upsert({ key: 'membership_fee', value: yeniUcret, updated_at: new Date().toISOString() })
      setAylikUcret(yeniUcret); setUcretKaydedil(true); setTimeout(() => setUcretKaydedil(false), 2000)
    } catch { alert('Kaydetme hatası!') } finally { setUcretYukleniyor(false) }
  }

  const abonelikDurumDegistir = async (chefId: string, aktif: boolean) => {
    const mevcutAbone = asciler.find(a => a.id === chefId)?.abonelik
    try {
      if (mevcutAbone) {
        await supabase.from('chef_subscriptions').update({ status: aktif ? 'active' : 'cancelled', updated_at: new Date().toISOString() }).eq('chef_id', chefId)
      } else {
        const simdi = new Date(); const bitis = new Date(simdi); bitis.setMonth(bitis.getMonth() + 1)
        await supabase.from('chef_subscriptions').insert({ chef_id: chefId, status: aktif ? 'active' : 'cancelled', amount_paid: Number(aylikUcret), started_at: simdi.toISOString(), expires_at: bitis.toISOString() })
      }
      verileriYukle()
    } catch { alert('İşlem başarısız!') }
  }

  const BADGE_META: Record<string, { label: string; color: string }> = {
    new:     { label: 'Yeni',      color: '#6B7280' },
    trusted: { label: 'Güvenilir', color: '#059669' },
    master:  { label: 'Usta',      color: '#D97706' },
    chef:    { label: 'Şef',       color: '#B45309' },
  }

  const aktifSayisi = asciler.filter(a => a.abonelik?.status === 'active').length
  const toplamGelir = aktifSayisi * Number(aylikUcret)

  return (
    <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', marginBottom: 24 }}>💳 Üyelik Yönetimi</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Aylık Ücret', value: `₺${aylikUcret}`, icon: '💰', color: '#E8622A' },
          { label: 'Aktif Üye',   value: `${aktifSayisi} aşçı`, icon: '✅', color: '#059669' },
          { label: 'Aylık Gelir', value: `₺${toplamGelir}`, icon: '📈', color: '#8B5CF6' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(74,44,14,0.06)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 11, color: '#8A7B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(74,44,14,0.06)', marginBottom: 20, border: '2px solid #E8622A' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 4 }}>⚙️ Aylık Üyelik Ücreti</div>
        <div style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 16 }}>Tüm aşçılara uygulanacak aylık üyelik ücretini buradan belirleyin.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flex: '0 0 200px' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: '#4A2C0E' }}>₺</span>
            <input type="number" min="0" value={yeniUcret} onChange={e => setYeniUcret(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 32px', border: '2px solid #E8E0D4', borderRadius: 10, fontSize: 18, fontWeight: 700, color: '#4A2C0E', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <span style={{ fontSize: 14, color: '#8A7B6B', fontWeight: 600 }}>/ay</span>
          <button onClick={ucretiKaydet} disabled={ucretYukleniyor || yeniUcret === aylikUcret}
            style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: ucretKaydedil ? '#059669' : (yeniUcret === aylikUcret ? '#E8E0D4' : '#E8622A'), color: 'white', fontWeight: 700, fontSize: 14, cursor: yeniUcret === aylikUcret ? 'default' : 'pointer' }}>
            {ucretKaydedil ? '✅ Kaydedildi!' : ucretYukleniyor ? '⏳ Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: '#4A2C0E', marginBottom: 12 }}>👩‍🍳 Aşçı Üyelikleri</div>

      {yukleniyor ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#8A7B6B' }}>Yükleniyor...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {asciler.map(asci => {
            const aktif = asci.abonelik?.status === 'active'
            const badge = BADGE_META[asci.badge ?? 'new']
            const kalanGun = asci.abonelik?.expires_at ? Math.ceil((new Date(asci.abonelik.expires_at).getTime() - Date.now()) / 86400000) : null
            return (
              <div key={asci.id} style={{ background: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(74,44,14,0.06)', display: 'flex', alignItems: 'center', gap: 16, borderLeft: `4px solid ${aktif ? '#059669' : '#E8E0D4'}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: '#FEF3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>👩‍🍳</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E', marginBottom: 4 }}>{asci.full_name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: badge.color, background: badge.color + '18', borderRadius: 6, padding: '2px 8px' }}>{badge.label}</span>
                    <span style={{ fontSize: 11, color: '#8A7B6B' }}>{asci.verification_status === 'approved' ? '✅ Onaylı' : '⏳ Bekliyor'}</span>
                    {kalanGun !== null && <span style={{ fontSize: 11, color: kalanGun < 7 ? '#DC2626' : '#8A7B6B' }}>{kalanGun > 0 ? `📅 ${kalanGun} gün kaldı` : '⚠️ Süresi doldu'}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#8A7B6B', marginBottom: 2 }}>Aylık Ücret</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#E8622A' }}>₺{aylikUcret}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: aktif ? '#059669' : '#8A7B6B', fontWeight: 700 }}>{aktif ? 'Aktif' : 'Pasif'}</div>
                  <div onClick={() => abonelikDurumDegistir(asci.id, !aktif)} style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: aktif ? '#059669' : '#E8E0D4', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: aktif ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}