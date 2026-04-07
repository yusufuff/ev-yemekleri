// @ts-nocheck
'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const ALICI_SABLONLARI = [
  { grup: 'Sipariş Öncesi', mesajlar: [
    'Menünüzde neler var?',
    'Bugün hangi yemekler hazır?',
    'Minimum sipariş tutarı nedir?',
    'Teslimat ücreti nedir?',
    'Ne kadar sürede teslim ediyorsunuz?',
    'Vejetaryen seçenek var mı?',
    'Glutensiz seçenek var mı?',
    'Porsiyon kaç kişilik?',
  ]},
  { grup: 'Sipariş Sırası', mesajlar: [
    'Siparişim onaylandı mı?',
    'Siparişim ne zaman gelecek?',
    'Siparişimin durumu nedir?',
    'Acı olmadan yapabilir misiniz?',
    'Az tuzlu yapabilir misiniz?',
    'Soğansız yapabilir misiniz?',
    'Siparişime ekstra ekmek ekleyebilir misiniz?',
    'Siparişime bir şey eklemek istiyorum',
    'Teslimat adresim değişti',
    'Kapıda ödeme yapabilir miyim?',
    'Siparişimi iptal etmek istiyorum',
  ]},
  { grup: 'Teslimat Sonrası', mesajlar: [
    'Siparişim geldi, teşekkürler! 🙏',
    'Yemek harikaydı, çok beğendim 🌟',
    'Tekrar sipariş vereceğim, elinize sağlık',
    'Bir sorun yaşadım, görüşebilir miyiz?',
    'Yanlış ürün geldi',
    'Eksik ürün var',
  ]},
]

const ASCI_SABLONLARI = [
  { grup: 'Sipariş Alındı', mesajlar: [
    'Siparişinizi aldım, hemen hazırlıyorum 👨‍🍳',
    'Siparişiniz onaylandı ✅',
    'Talebinizi not aldım ✅',
    'Maalesef bu özelleştirme mümkün değil',
    'Stok durumuna bakıyorum, bir dakika',
  ]},
  { grup: 'Hazırlık', mesajlar: [
    'Yaklaşık 15-20 dakika',
    'Yaklaşık 30-45 dakika',
    'Siparişiniz hazırlanıyor, biraz bekleyiniz',
    'Biraz gecikeceğim, özür dilerim 🙏',
    'Siparişiniz hazır, yola çıkıyorum 🛵',
  ]},
  { grup: 'Teslimat', mesajlar: [
    'Yola çıktım, yakında kapınızdayım 🛵',
    'Kapınızdayım, lütfen kapıyı açar mısınız?',
    'Siparişinizi kapıya bıraktım',
    'Siparişiniz teslim edildi, afiyet olsun 😊',
    'Ödeme kapıda nakit alınacaktır',
  ]},
  { grup: 'Genel', mesajlar: [
    'Teşekkürler, bizi tercih ettiğiniz için mutluyuz 🙏',
    'Bir dahaki siparişinizde görüşmek üzere!',
    'Değerlendirme yaparsanız seviniriz ⭐',
    'Sorunuzu en kısa sürede yanıtlayacağım',
  ]},
]

function MesajlarIcerigi() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState('buyer')
  const [conversations, setConversations] = useState([])
  const [activeOrderId, setActiveOrderId] = useState(searchParams.get('order_id') ?? null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sablonAcik, setSablonAcik] = useState(false)
  const [aktifGrup, setAktifGrup] = useState(0)
  const bottomRef = useRef(null)
  const activeOrderIdRef = useRef(activeOrderId)

  useEffect(() => {
    activeOrderIdRef.current = activeOrderId
  }, [activeOrderId])

  useEffect(() => {
    const yukle = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      const role = profile?.role ?? 'buyer'
      setUserRole(role)

      let ordersQuery = supabase
        .from('orders')
        .select('id, order_number, chef_id, buyer_id, status')
        .order('created_at', { ascending: false })
        .limit(20)

      if (role === 'buyer') {
        ordersQuery = ordersQuery.eq('buyer_id', user.id)
      } else if (role === 'chef') {
        const { data: cp } = await supabase
          .from('chef_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (cp) ordersQuery = ordersQuery.eq('chef_id', cp.id)
      }

      const { data: orders } = await ordersQuery

      const convList = await Promise.all((orders ?? []).map(async (order) => {
        let karsiAd = 'Kullanıcı'
        if (role === 'buyer') {
          const { data: chef } = await supabase
            .from('chef_public_profiles')
            .select('full_name')
            .eq('chef_id', order.chef_id)
            .single()
          karsiAd = chef?.full_name ?? 'Aşçı'
        } else {
          const { data: buyer } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', order.buyer_id)
            .single()
            console.log('buyer:', buyer, 'order.buyer_id:', order.buyer_id)
          karsiAd = buyer?.full_name ?? 'Alıcı'
        }

        const { data: lastMsgArr } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1)
          
          const lastMsg = lastMsgArr?.[0]

        return {
          order_id: order.id,
          order_number: order.order_number,
          karsi_ad: karsiAd,
          chef_id: order.chef_id,
          buyer_id: order.buyer_id,
          last_message: lastMsg?.content ?? 'Henüz mesaj yok',
          last_time: lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '',
          status: order.status,
        }
      }))

      setConversations(convList)
      if (!activeOrderIdRef.current && convList.length > 0) setActiveOrderId(convList[0].order_id)
      setLoading(false)
    }
    yukle()
  }, [])

  // Mesajlari yukle ve 5 saniyede bir yenile
  useEffect(() => {
    if (!activeOrderId || !user) return
    const supabase = getSupabaseBrowserClient()

    const mesajlariYukle = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at')
        .eq('order_id', activeOrderId)
        .order('created_at', { ascending: true })
      setMessages(data ?? [])
    }

    mesajlariYukle()

    // 5 saniyede bir yenile
    const interval = setInterval(mesajlariYukle, 5000)

    return () => clearInterval(interval)
  }, [activeOrderId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text?.trim() || !user || !activeOrderId) return
    const supabase = getSupabaseBrowserClient()

    const conv = conversations.find(c => c.order_id === activeOrderId)
    if (!conv) return

    let recipientId
    if (userRole === 'buyer') {
      const { data: cp } = await supabase
        .from('chef_profiles')
        .select('user_id')
        .eq('id', conv.chef_id)
        .single()
      recipientId = cp?.user_id
    } else {
      recipientId = conv.buyer_id
    }

    if (!recipientId) return

    // Aninda local state'e ekle
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: text.trim(),
      sender_id: user.id,
      created_at: new Date().toISOString(),
    }])

    await supabase.from('messages').insert({
      order_id: activeOrderId,
      sender_id: user.id,
      recipient_id: recipientId,
      content: text.trim(),
      is_read: false,
    })

    setSablonAcik(false)
  }

  const sablonlar = userRole === 'chef' ? ASCI_SABLONLARI : ALICI_SABLONLARI
  const active = conversations.find(c => c.order_id === activeOrderId)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#8A7B6B', fontFamily: "'DM Sans', sans-serif" }}>
      Yükleniyor...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, color: '#4A2C0E', marginBottom: 20 }}>Mesajlar</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, height: 'calc(100vh - 160px)', minHeight: 500 }}>

          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.08)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F5EDD8', fontWeight: 700, fontSize: 14, color: '#4A2C0E' }}>
              Konuşmalar
            </div>
            {conversations.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#8A7B6B', fontSize: 13 }}>Henüz konuşma yok</div>
            ) : conversations.map(conv => (
              <div key={conv.order_id} onClick={() => setActiveOrderId(conv.order_id)} style={{
                padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #F5EDD8',
                background: activeOrderId === conv.order_id ? '#FEF3EC' : 'white',
                borderLeft: activeOrderId === conv.order_id ? '3px solid #E8622A' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#4A2C0E' }}>
                    {userRole === 'buyer' ? '👩‍🍳 ' : '🛒 '}{conv.karsi_ad}
                  </div>
                  <div style={{ fontSize: 10, color: '#8A7B6B' }}>{conv.last_time}</div>
                </div>
                <div style={{ fontSize: 11, color: '#8A7B6B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  #{conv.order_number} · {conv.last_message}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(74,44,14,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {active ? (
              <>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F5EDD8', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {userRole === 'buyer' ? '👩‍🍳' : '🛒'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#4A2C0E' }}>{active.karsi_ad}</div>
                    <div style={{ fontSize: 11, color: '#8A7B6B' }}>Sipariş #{active.order_number}</div>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#8A7B6B', fontSize: 13, marginTop: 40 }}>
                      Henüz mesaj yok. Şablon seçerek mesaj gönderin.
                    </div>
                  )}
                  {messages.map(msg => {
                    const benden = msg.sender_id === user?.id
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: benden ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%', padding: '10px 14px',
                          borderRadius: benden ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: benden ? '#E8622A' : '#F5EDD8',
                          color: benden ? 'white' : '#4A2C0E',
                          fontSize: 13, lineHeight: 1.5,
                        }}>
                          {msg.content}
                          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                            {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                {sablonAcik && (
                  <div style={{ borderTop: '1px solid #F5EDD8', background: '#FAFAFA', maxHeight: 280, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #F5EDD8', overflowX: 'auto' }}>
                      {sablonlar.map((grup, i) => (
                        <button key={i} onClick={() => setAktifGrup(i)} style={{
                          padding: '8px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          border: 'none', background: 'transparent', fontFamily: 'inherit',
                          color: aktifGrup === i ? '#E8622A' : '#8A7B6B',
                          borderBottom: aktifGrup === i ? '2px solid #E8622A' : '2px solid transparent',
                          whiteSpace: 'nowrap',
                        }}>
                          {grup.grup}
                        </button>
                      ))}
                    </div>
                    <div style={{ overflowY: 'auto', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {sablonlar[aktifGrup]?.mesajlar.map((sablon, i) => (
                        <button key={i} onClick={() => sendMessage(sablon)} style={{
                          padding: '8px 12px', background: 'white', border: '1.5px solid #E8E0D4',
                          borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#4A2C0E',
                        }}>
                          {sablon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ padding: '12px 16px', borderTop: '1px solid #F5EDD8', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button onClick={() => setSablonAcik(p => !p)} style={{
                    padding: '10px 14px', background: sablonAcik ? '#FEF3EC' : 'white',
                    border: `1.5px solid ${sablonAcik ? '#E8622A' : '#E8E0D4'}`,
                    borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: sablonAcik ? '#E8622A' : '#4A2C0E', fontFamily: 'inherit',
                  }}>
                    💬 Şablon
                  </button>
                  <input
                    id="mesaj-input"
                    type="text"
                    placeholder="Mesajınızı yazın..."
                    onKeyDown={(e) => { if (e.key === 'Enter') { sendMessage(e.target.value); e.target.value = '' } }}
                    style={{
                      flex: 1, fontSize: 13, color: '#4A2C0E', padding: '10px 14px',
                      background: '#F5F5F5', borderRadius: 10, border: '1.5px solid #E8E0D4',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('mesaj-input')
                      if (input?.value) { sendMessage(input.value); input.value = '' }
                    }}
                    style={{
                      padding: '10px 16px', background: '#E8622A', border: 'none',
                      borderRadius: 10, cursor: 'pointer', color: 'white', fontWeight: 700, fontSize: 13,
                    }}
                  >
                    Gönder
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A7B6B', fontSize: 14 }}>
                Konuşma seçin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MesajlarPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#8A7B6B' }}>Yükleniyor…</div>}>
      <MesajlarIcerigi />
    </Suspense>
  )
}