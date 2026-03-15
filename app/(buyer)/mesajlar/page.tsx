'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const MOCK_CONVERSATIONS = [
  {
    order_id: 'ord-1',
    order_number: '00234',
    chef_name: 'Fatma Hanım',
    last_message: 'Siparişiniz hazırlanıyor, yaklaşık 20 dakika.',
    last_time: '5 dk',
    unread: 1,
    messages: [
      { id: 'm1', sender: 'chef', text: 'Siparişinizi aldım, hemen hazırlamaya başlıyorum!', time: '14:32' },
      { id: 'm2', sender: 'buyer', text: 'Teşekkürler, acı olmadan yapabilir misiniz?', time: '14:33' },
      { id: 'm3', sender: 'chef', text: 'Tabii, not aldım. Acısız hazırlayacağım 🙂', time: '14:34' },
      { id: 'm4', sender: 'chef', text: 'Siparişiniz hazırlanıyor, yaklaşık 20 dakika.', time: '14:45' },
    ],
  },
  {
    order_id: 'ord-2',
    order_number: '00198',
    chef_name: 'Zeynep Arslan',
    last_message: 'Hayırlı olsun, afiyet olsun!',
    last_time: '1 gün',
    unread: 0,
    messages: [
      { id: 'm5', sender: 'buyer', text: 'Börekler çok lezzetliydi, teşekkürler!', time: 'Dün 12:15' },
      { id: 'm6', sender: 'chef', text: 'Hayırlı olsun, afiyet olsun! 😊', time: 'Dün 12:20' },
    ],
  },
]

function MesajlarIcerigi() {
  const searchParams = useSearchParams()
  const [conversations] = useState(MOCK_CONVERSATIONS)
  const [activeId, setActiveId] = useState<string | null>(searchParams.get('order_id') ?? 'ord-1')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(MOCK_CONVERSATIONS[0].messages)
  const bottomRef = useRef<HTMLDivElement>(null)

  const active = conversations.find(c => c.order_id === activeId)

  useEffect(() => {
    const conv = conversations.find(c => c.order_id === activeId)
    if (conv) setMessages([...conv.messages])
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, {
      id: `m${Date.now()}`,
      sender: 'buyer',
      text: input.trim(),
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    }])
    setInput('')
    // Simüle aşçı cevabı
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `m${Date.now()}`,
        sender: 'chef',
        text: 'Mesajınızı aldım, teşekkürler! 🙂',
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      }])
    }, 1500)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:'#4A2C0E', marginBottom:20 }}>Mesajlar</h1>

        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:16, height:'calc(100vh - 160px)', minHeight:500 }}>

          {/* Konuşma listesi */}
          <div style={{ background:'white', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 12px rgba(74,44,14,0.08)', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #F5EDD8', fontWeight:700, fontSize:14, color:'#4A2C0E' }}>
              Konuşmalar
            </div>
            {conversations.map(conv => (
              <div key={conv.order_id} onClick={() => setActiveId(conv.order_id)} style={{
                padding:'14px 16px', cursor:'pointer', borderBottom:'1px solid #F5EDD8',
                background: activeId === conv.order_id ? '#FEF3EC' : 'white',
                borderLeft: activeId === conv.order_id ? '3px solid #E8622A' : '3px solid transparent',
                transition: 'background 0.15s',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'#4A2C0E' }}>👩‍🍳 {conv.chef_name}</div>
                  <div style={{ fontSize:10, color:'#8A7B6B' }}>{conv.last_time}</div>
                </div>
                <div style={{ fontSize:11, color:'#8A7B6B', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>{conv.last_message}</span>
                  {conv.unread > 0 && (
                    <span style={{ background:'#E8622A', color:'white', fontSize:10, fontWeight:700, width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{conv.unread}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mesaj alanı */}
          <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {active ? (
              <>
                {/* Header */}
                <div style={{ padding:'14px 20px', borderBottom:'1px solid #F5EDD8', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#FDE68A,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>👩‍🍳</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:'#4A2C0E' }}>{active.chef_name}</div>
                    <div style={{ fontSize:11, color:'#8A7B6B' }}>Sipariş #{active.order_number}</div>
                  </div>
                </div>

                {/* Mesajlar */}
                <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:10 }}>
                  {messages.map(msg => (
                    <div key={msg.id} style={{ display:'flex', justifyContent: msg.sender === 'buyer' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth:'70%', padding:'10px 14px', borderRadius: msg.sender === 'buyer' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: msg.sender === 'buyer' ? '#E8622A' : '#F5EDD8',
                        color: msg.sender === 'buyer' ? 'white' : '#4A2C0E',
                        fontSize:13, lineHeight:1.5,
                      }}>
                        {msg.text}
                        <div style={{ fontSize:10, opacity:0.7, marginTop:4, textAlign:'right' }}>{msg.time}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div style={{ padding:'12px 16px', borderTop:'1px solid #F5EDD8', display:'flex', gap:10 }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Mesaj yazın..."
                    style={{ flex:1, padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none' }}
                  />
                  <button onClick={sendMessage} style={{ padding:'10px 16px', background:'#E8622A', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:13 }}>
                    Gönder
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#8A7B6B', fontSize:14 }}>
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
    <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'#8A7B6B'}}>Yükleniyor…</div>}>
      <MesajlarIcerigi />
    </Suspense>
  )
}