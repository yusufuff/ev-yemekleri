// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

const supabase = getSupabaseBrowserClient()

export default function YemekTalepleriSayfasi() {
  const [talepler, setTalepler] = useState([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aktifSekme, setAktifSekme] = useState('talepler')
  const [userId, setUserId] = useState(null)
  const [rol, setRol] = useState('buyer')
  const [chefId, setChefId] = useState(null)
  const [talepModal, setTalepModal] = useState(false)
  const [teklifModal, setTeklifModal] = useState(false)
  const [tekliflerModal, setTekliflerModal] = useState(false)
  const [seciliTalep, setSeciliTalep] = useState(null)
  const [teklifler, setTeklifler] = useState([])
  const [tekliflerYukleniyor, setTekliflerYukleniyor] = useState(false)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [form, setForm] = useState({ baslik: '', aciklama: '', kisi_sayisi: '', butce: '', tarih: '', saat: '', konum: '', sure: '7' })
  const [teklifForm, setTeklifForm] = useState({ fiyat: '', mesaj: '' })

  useEffect(() => { baslat() }, [])

  const baslat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { await taleplerYukle(); return }
      setUserId(user.id)
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      setRol(profile?.role ?? 'buyer')
      if (profile?.role === 'chef') {
        const { data: cp } = await supabase.from('chef_profiles').select('id').eq('user_id', user.id).single()
        if (cp) setChefId(cp.id)
      }
    } catch {}
    await taleplerYukle()
  }

  const taleplerYukle = async () => {
    setYukleniyor(true)
    try {
      const { data } = await supabase.from('food_requests')
        .select('*, food_request_offers(count)')
        .eq('durum', 'aktif')
        .order('created_at', { ascending: false })
      if (!data || data.length === 0) { setTalepler([]); return }
      const userIds = [...new Set(data.map(t => t.user_id).filter(Boolean))]
      const { data: usersData } = await supabase.from('users').select('id, full_name').in('id', userIds)
      const userMap = {}
      ;(usersData ?? []).forEach(u => { userMap[u.id] = u.full_name })
      setTalepler(data.map(t => ({ ...t, user_full_name: userMap[t.user_id] ?? null })))
    } catch {}
    finally { setYukleniyor(false) }
  }

  const beniminTaleplerYukle = async () => {
    setYukleniyor(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('food_requests')
        .select('*, food_request_offers(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setTalepler(data ?? [])
    } catch {}
    finally { setYukleniyor(false) }
  }

  const tekliflerYukle = async (requestId) => {
    setTekliflerYukleniyor(true)
    try {
      const { data: teklifData } = await supabase.from('food_request_offers')
        .select('*').eq('request_id', requestId).order('created_at', { ascending: false })
      if (!teklifData || teklifData.length === 0) { setTeklifler([]); return }
      const chefIds = teklifData.map(t => t.chef_id).filter(Boolean)
      const { data: chefData } = await supabase.from('chef_profiles').select('id, display_name, avg_rating').in('id', chefIds)
      const chefMap = {}
      ;(chefData ?? []).forEach(c => { chefMap[c.id] = c })
      setTeklifler(teklifData.map(t => ({ ...t, chef_profiles: chefMap[t.chef_id] ?? null })))
    } catch {}
    finally { setTekliflerYukleniyor(false) }
  }

  const talepOlustur = async () => {
    if (!form.baslik.trim()) { alert('Başlık gerekli'); return }
    if (!form.kisi_sayisi) { alert('Kişi sayısı gerekli'); return }
    if (!userId) { alert('Talep oluşturmak için giriş yapmalısınız'); return }
    if (form.tarih) {
      const [g, a, y] = form.tarih.split('.')
      const secilen = new Date(parseInt(y), parseInt(a) - 1, parseInt(g))
      const bugun = new Date(); bugun.setHours(0, 0, 0, 0)
      if (secilen < bugun) { alert('Geçmiş tarih seçemezsiniz'); return }
    }
    setKaydediliyor(true)
    try {
      const expires = new Date(Date.now() + parseInt(form.sure) * 24 * 60 * 60 * 1000)
      await supabase.from('food_requests').insert({
        user_id: userId, baslik: form.baslik.trim(), aciklama: form.aciklama.trim(),
        kisi_sayisi: parseInt(form.kisi_sayisi),
        butce: form.butce ? parseFloat(form.butce) : null,
        tarih: form.tarih || null,
        istenen_saat: form.saat || null,
        konum: form.konum.trim() || null,
        expires_at: expires.toISOString(), durum: 'aktif',
      })
      setTalepModal(false)
      setForm({ baslik: '', aciklama: '', kisi_sayisi: '', butce: '', tarih: '', saat: '', konum: '', sure: '7' })
      alert('Talep yayınlandı!')
      await taleplerYukle()
    } catch (e) {
      alert('Hata: ' + (e?.message ?? 'Bir hata oluştu'))
    } finally { setKaydediliyor(false) }
  }

  const teklifGonder = async () => {
    if (!teklifForm.fiyat) { alert('Fiyat gerekli'); return }
    if (!teklifForm.mesaj.trim()) { alert('Mesaj gerekli'); return }
    setKaydediliyor(true)
    try {
      await supabase.from('food_request_offers').insert({
        request_id: seciliTalep.id, chef_id: chefId,
        fiyat: parseFloat(teklifForm.fiyat), mesaj: teklifForm.mesaj.trim(), durum: 'bekliyor',
      })
      if (seciliTalep.user_id) {
        await supabase.from('notifications').insert({
          user_id: seciliTalep.user_id,
          title: '🍽️ Yemek Talebinize Teklif Geldi!',
          body: seciliTalep.baslik + ' talebiniz için yeni bir teklif var.',
          type: 'system', is_read: false, created_at: new Date().toISOString(),
        })
      }
      setTeklifModal(false)
      setTeklifForm({ fiyat: '', mesaj: '' })
      alert('Teklif gönderildi!')
      await taleplerYukle()
    } catch (e) {
      alert('Hata: ' + (e?.message ?? 'Bir hata oluştu'))
    } finally { setKaydediliyor(false) }
  }

  const pasifEt = async (talep) => {
    if (!confirm('Bu talebi pasife almak istiyor musunuz?')) return
    await supabase.from('food_requests').update({ durum: 'pasif' }).eq('id', talep.id)
    await beniminTaleplerYukle()
  }

  const aktifEt = async (talep) => {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await supabase.from('food_requests').update({ durum: 'aktif', expires_at: expires.toISOString() }).eq('id', talep.id)
    await beniminTaleplerYukle()
  }

  const talepSil = async (talep) => {
    if (!confirm('Bu talebi silmek istiyor musunuz?')) return
    await supabase.from('food_requests').delete().eq('id', talep.id)
    await beniminTaleplerYukle()
  }

  const kalanGun = (expires) => {
    if (!expires) return null
    const ms = new Date(expires).getTime() - Date.now()
    if (ms <= 0) return null
    const saat = Math.floor(ms / 3600000)
    if (saat < 24) return saat + ' saat'
    return Math.floor(saat / 24) + ' gün'
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700">← Geri</Link>
            <h1 className="text-xl font-bold text-gray-900">🍽️ Yemek Talepleri</h1>
          </div>
          {userId && (
            <button
              onClick={() => setTalepModal(true)}
              className="bg-[#E67E22] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#d35400] transition"
            >
              + Talep Oluştur
            </button>
          )}
        </div>

        {/* Sekmeler */}
        <div className="max-w-4xl mx-auto px-4 flex border-t border-gray-100">
          <button
            onClick={() => { setAktifSekme('talepler'); taleplerYukle() }}
            className={`flex-1 py-3 text-sm font-600 border-b-2 transition ${aktifSekme === 'talepler' ? 'border-[#E67E22] text-[#E67E22] font-bold' : 'border-transparent text-gray-500'}`}
          >
            Açık Talepler
          </button>
          {userId && (
            <button
              onClick={() => { setAktifSekme('benim'); beniminTaleplerYukle() }}
              className={`flex-1 py-3 text-sm font-600 border-b-2 transition ${aktifSekme === 'benim' ? 'border-[#E67E22] text-[#E67E22] font-bold' : 'border-transparent text-gray-500'}`}
            >
              Taleplerim
            </button>
          )}
        </div>
      </div>

      {/* İçerik */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {yukleniyor ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E67E22]" />
          </div>
        ) : talepler.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-gray-500 text-lg mb-4">{aktifSekme === 'benim' ? 'Henüz talep oluşturmadınız' : 'Açık talep yok'}</p>
            {userId && (
              <button onClick={() => setTalepModal(true)} className="bg-[#E67E22] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#d35400] transition">
                + Talep Oluştur
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {talepler.map(talep => {
              const teklifSayisi = talep.food_request_offers?.[0]?.count ?? 0
              const kalan = kalanGun(talep.expires_at)
              const benim = talep.user_id === userId
              const isPasif = talep.durum === 'pasif'
              return (
                <div key={talep.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 ${benim ? 'border-[#E67E22]' : 'border-transparent'} ${isPasif ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{talep.baslik}</h3>
                    {talep.butce && <span className="text-[#E67E22] font-bold">₺{talep.butce.toLocaleString()}</span>}
                  </div>

                  {!benim && talep.user_full_name && (
                    <p className="text-sm text-gray-500 mb-2">👤 {talep.user_full_name}</p>
                  )}

                  {isPasif && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded mb-2 inline-block">Pasif</span>}

                  <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-500">
                    {talep.kisi_sayisi && <span>👥 {talep.kisi_sayisi} kişilik</span>}
                    {talep.tarih && <span>📅 {talep.tarih}{talep.istenen_saat ? ' ' + talep.istenen_saat : ''}</span>}
                    {talep.konum && <span>📍 {talep.konum}</span>}
                    {kalan && <span className="text-amber-500">⏳ {kalan} kaldı</span>}
                  </div>

                  {talep.aciklama && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{talep.aciklama}</p>}

                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                    <p className={`text-sm font-semibold ${teklifSayisi > 0 ? 'text-[#E67E22]' : 'text-gray-400'}`}>
                      {teklifSayisi > 0 ? `${teklifSayisi} teklif var!` : 'Henüz teklif yok'}
                    </p>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {benim ? (
                        <>
                          <button
                            onClick={() => { setSeciliTalep(talep); tekliflerYukle(talep.id); setTekliflerModal(true) }}
                            className={`px-3 py-2 rounded-xl text-sm font-bold ${teklifSayisi > 0 ? 'bg-[#E67E22] text-white' : 'bg-blue-50 text-blue-600'}`}
                          >
                            {teklifSayisi > 0 ? `${teklifSayisi} Teklif Gör` : 'Teklifler'}
                          </button>
                          {isPasif ? (
                            <button onClick={() => aktifEt(talep)} className="px-3 py-2 rounded-xl text-sm font-bold bg-green-50 text-green-600">Yayınla</button>
                          ) : (
                            <button onClick={() => pasifEt(talep)} className="px-3 py-2 rounded-xl text-sm font-bold bg-amber-50 text-amber-600">Pasif</button>
                          )}
                          <button onClick={() => talepSil(talep)} className="px-3 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-500">Sil</button>
                        </>
                      ) : rol === 'chef' && !isPasif ? (
                        <button
                          onClick={() => { setSeciliTalep(talep); setTeklifModal(true) }}
                          className="px-4 py-2 rounded-xl text-sm font-bold bg-[#E67E22] text-white hover:bg-[#d35400] transition"
                        >
                          Teklif Ver
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Talep Oluştur Modal */}
      {talepModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-4">Yemek Talebi Oluştur</h2>

            <label className="text-sm font-semibold text-gray-600 block mb-1">Ne yemek istiyorsunuz? *</label>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-[#E67E22]" value={form.baslik} onChange={e => setForm(p => ({ ...p, baslik: e.target.value }))} placeholder="Örn: Bayram için kuzulu pilav" />

            <label className="text-sm font-semibold text-gray-600 block mb-1">Açıklama</label>
            <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 h-20 resize-none focus:outline-none focus:border-[#E67E22]" value={form.aciklama} onChange={e => setForm(p => ({ ...p, aciklama: e.target.value }))} placeholder="Özel istekler, lezzet tercihi..." />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Kişi sayısı *</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E67E22]" value={form.kisi_sayisi} onChange={e => setForm(p => ({ ...p, kisi_sayisi: e.target.value }))} placeholder="50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Bütçe (₺)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E67E22]" value={form.butce} onChange={e => setForm(p => ({ ...p, butce: e.target.value }))} placeholder="3000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Tarih (GG.AA.YYYY)</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E67E22]" value={form.tarih} onChange={e => setForm(p => ({ ...p, tarih: e.target.value }))} placeholder="06.05.2026" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Saat</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E67E22]" value={form.saat} onChange={e => setForm(p => ({ ...p, saat: e.target.value }))} placeholder="14:00" />
              </div>
            </div>

            <label className="text-sm font-semibold text-gray-600 block mb-1">Konum / Şehir</label>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-[#E67E22]" value={form.konum} onChange={e => setForm(p => ({ ...p, konum: e.target.value }))} placeholder="Örn: İskenderun, Hatay" />

            <label className="text-sm font-semibold text-gray-600 block mb-1">İlan Süresi</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-[#E67E22]" value={form.sure} onChange={e => setForm(p => ({ ...p, sure: e.target.value }))}>
              <option value="1">1 Gün</option>
              <option value="2">2 Gün</option>
              <option value="3">3 Gün</option>
              <option value="5">5 Gün</option>
              <option value="7">7 Gün</option>
              <option value="10">10 Gün</option>
              <option value="15">15 Gün</option>
            </select>

            <button onClick={talepOlustur} disabled={kaydediliyor} className="w-full bg-[#E67E22] text-white py-4 rounded-xl font-bold text-base hover:bg-[#d35400] transition disabled:opacity-50">
              {kaydediliyor ? 'Yayınlanıyor...' : 'Talebi Yayınla'}
            </button>
            <button onClick={() => setTalepModal(false)} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm mt-2 hover:bg-gray-200 transition">
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* Teklif Ver Modal */}
      {teklifModal && seciliTalep && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6">
            <div className="w-10 h-1 bg-gray-200 rounded mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-4">Teklif Ver</h2>

            <div className="bg-[#FFF5EC] border border-[#E67E22] rounded-xl p-3 mb-4">
              <p className="font-bold text-[#4A2C0E]">{seciliTalep.baslik}</p>
              <p className="text-xs text-[#8A7B6B] mt-1">
                {seciliTalep.kisi_sayisi ? seciliTalep.kisi_sayisi + ' kişilik' : ''}
                {seciliTalep.konum ? ' · ' + seciliTalep.konum : ''}
                {seciliTalep.butce ? ' · Bütçe: ₺' + seciliTalep.butce.toLocaleString() : ''}
              </p>
            </div>

            <label className="text-sm font-semibold text-gray-600 block mb-1">Fiyat Teklifim (₺) *</label>
            <input type="number" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-[#E67E22]" value={teklifForm.fiyat} onChange={e => setTeklifForm(p => ({ ...p, fiyat: e.target.value }))} placeholder="2800" />

            <label className="text-sm font-semibold text-gray-600 block mb-1">Mesajınız *</label>
            <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 h-24 resize-none focus:outline-none focus:border-[#E67E22]" value={teklifForm.mesaj} onChange={e => setTeklifForm(p => ({ ...p, mesaj: e.target.value }))} placeholder="50 kişilik yemek yapabilirim..." />

            <button onClick={teklifGonder} disabled={kaydediliyor} className="w-full bg-[#E67E22] text-white py-4 rounded-xl font-bold hover:bg-[#d35400] transition disabled:opacity-50">
              {kaydediliyor ? 'Gönderiliyor...' : 'Teklifi Gönder'}
            </button>
            <button onClick={() => setTeklifModal(false)} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm mt-2">Vazgeç</button>
          </div>
        </div>
      )}

      {/* Teklifler Modal */}
      {tekliflerModal && seciliTalep && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded mx-auto mb-4" />
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Gelen Teklifler</h2>
              <button onClick={() => setTekliflerModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>

            <div className="bg-[#FFF5EC] border border-[#E67E22] rounded-xl p-3 mb-4">
              <p className="font-bold text-[#4A2C0E]">{seciliTalep.baslik}</p>
            </div>

            {tekliflerYukleniyor ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E67E22]" />
              </div>
            ) : teklifler.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-500">Henüz teklif gelmedi</p>
              </div>
            ) : teklifler.map(teklif => (
              <div key={teklif.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
                <div className="flex justify-between items-center mb-1">
                  <Link href={`/asci/${teklif.chef_id}`} className="font-bold text-[#E67E22] underline hover:text-[#d35400]">
                    {teklif.chef_profiles?.display_name ?? 'Aşçı'} →
                  </Link>
                  <span className="font-bold text-gray-900 text-lg">₺{teklif.fiyat?.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">⭐ {teklif.chef_profiles?.avg_rating ?? '?'} puan</p>
                <p className="text-sm text-gray-600 mb-3">{teklif.mesaj}</p>
                {teklif.durum === 'kabul' ? (
                  <div className="bg-green-50 rounded-xl p-3 text-center text-green-600 font-bold">✅ Kabul Edildi</div>
                ) : (
                  <button className="w-full bg-[#E67E22] text-white py-3 rounded-xl font-bold hover:bg-[#d35400] transition">
                    💳 Teklifi Kabul Et & Öde
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}