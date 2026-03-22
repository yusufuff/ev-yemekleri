// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function DavetPage() {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [code,    setCode]    = useState('')
  const [applying, setApplying] = useState(false)
  const [msg,     setMsg]     = useState('')
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    fetch('/api/referral').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const copyLink = () => {
    const link = `https://www.anneelim.com/kayit?ref=${data?.code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyCode = async () => {
    if (!code.trim()) return
    setApplying(true)
    setMsg('')
    const res  = await fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const d = await res.json()
    if (res.ok) {
      setMsg(`✅ Kod uygulandı! ₺${d.credit} platform kredisi kazandınız.`)
      fetch('/api/referral').then(r => r.json()).then(setData)
    } else {
      setMsg(`⚠️ ${d.error}`)
    }
    setApplying(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', color:'#8A7B6B' }}>
      Yükleniyor…
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif", paddingBottom:80 }}>

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg, #3D6B47, #2e5236)', padding:'48px 24px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🎁</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, color:'white', margin:'0 0 10px' }}>
          Arkadaşını Davet Et
        </h1>
        <p style={{ color:'rgba(255,255,255,0.75)', fontSize:14, margin:0 }}>
          Her davet için sen <strong style={{ color:'white' }}>₺20</strong>, arkadaşın <strong style={{ color:'white' }}>₺10</strong> platform kredisi kazanır
        </p>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'32px 16px' }}>

        {/* Mevcut kredi */}
        <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', marginBottom:16, textAlign:'center' }}>
          <div style={{ fontSize:12, color:'#8A7B6B', fontWeight:600, marginBottom:4 }}>MEVCUT KREDİNİZ</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:40, fontWeight:900, color:'#E8622A' }}>
            ₺{(data?.platform_credit ?? 0).toFixed(0)}
          </div>
          <div style={{ fontSize:12, color:'#8A7B6B', marginTop:4 }}>Siparişlerinizde kullanabilirsiniz</div>
        </div>

        {/* Referans kodu */}
        <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', marginBottom:16 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>
            📤 Davet Linkiniz
          </div>

          {/* Kod kutusu */}
          <div style={{ background:'#F5EDD8', borderRadius:12, padding:'16px 20px', textAlign:'center', marginBottom:16 }}>
            <div style={{ fontSize:11, color:'#8A7B6B', marginBottom:6, fontWeight:600 }}>REFERANS KODUNUZ</div>
            <div style={{ fontFamily:'monospace', fontSize:28, fontWeight:900, color:'#E8622A', letterSpacing:'4px' }}>
              {data?.code ?? '—'}
            </div>
          </div>

          {/* İstatistik */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <div style={{ background:'#F5EDD8', borderRadius:10, padding:'12px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:900, color:'#4A2C0E', fontFamily:"'Playfair Display',serif" }}>
                {data?.used_count ?? 0}
              </div>
              <div style={{ fontSize:11, color:'#8A7B6B', marginTop:2 }}>Davet Edilen</div>
            </div>
            <div style={{ background:'#ECFDF5', borderRadius:10, padding:'12px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:900, color:'#3D6B47', fontFamily:"'Playfair Display',serif" }}>
                ₺{(data?.total_earned ?? 0).toFixed(0)}
              </div>
              <div style={{ fontSize:11, color:'#8A7B6B', marginTop:2 }}>Toplam Kazanç</div>
            </div>
          </div>

          {/* Paylaş butonları */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={copyLink} style={{
              flex:1, padding:'11px 0', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer',
              background: copied ? '#3D6B47' : '#E8622A', color:'white', border:'none', fontFamily:'inherit',
              transition:'background 0.2s',
            }}>
              {copied ? '✅ Kopyalandı!' : '📋 Linki Kopyala'}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Ev Yemekleri'nde harika ev yemekleri var! Kayıt olurken ${data?.code} kodunu kullan, ₺10 kredi kazan: https://www.anneelim.com/kayit?ref=${data?.code}`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:44, background:'#25D366', borderRadius:10, textDecoration:'none', fontSize:20 }}>
              📱
            </a>
          </div>
        </div>

        {/* Kod uygula */}
        <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)', marginBottom:16 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>
            🎟️ Referans Kodu Kullan
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Arkadaşınızın kodunu girin"
              style={{ flex:1, padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none' }}
            />
            <button onClick={applyCode} disabled={applying || !code.trim()} style={{
              padding:'10px 16px', background: applying ? '#F28B5E' : '#E8622A',
              color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:700,
              cursor: applying ? 'not-allowed' : 'pointer', fontFamily:'inherit',
            }}>
              {applying ? '⏳' : 'Uygula'}
            </button>
          </div>
          {msg && (
            <div style={{ marginTop:10, fontSize:13, color: msg.startsWith('✅') ? '#3D6B47' : '#DC2626', fontWeight:600 }}>
              {msg}
            </div>
          )}
        </div>

        {/* Davet geçmişi */}
        {(data?.usages ?? []).length > 0 && (
          <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>
              📋 Davet Geçmişi
            </div>
            {data.usages.map((u: any, i: number) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < data.usages.length-1 ? '1px solid #F5EDD8' : 'none' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#4A2C0E' }}>
                    {u.users?.full_name ?? 'Kullanıcı'}
                  </div>
                  <div style={{ fontSize:11, color:'#8A7B6B', marginTop:2 }}>
                    {new Date(u.created_at).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'#3D6B47' }}>
                  +₺{u.referrer_credit}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}