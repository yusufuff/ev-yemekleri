'use client'
import { useState } from 'react'

export default function ProfilPage() {
  const [role, setRole] = useState<'buyer' | 'chef'>('buyer')
  const [form, setForm] = useState({ full_name: 'Mehmet Yılmaz', phone: '+90 532 987 65 43', email: 'mehmet@gmail.com' })
  const [chefForm, setChefForm] = useState({ bio: 'Ev mutfağımdan lezzetli yemekler.', iban: 'TR12 3456 7890', radius: 5, min_order: 40 })
  const [notifs, setNotifs] = useState({ orders: true, favorites: true, reviews: true, campaigns: false, stock: true })
  const [saved, setSaved] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'idle'|'loading'|'done'>('idle')

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const getFCMToken = async () => {
    try {
      const { initializeApp, getApps } = await import('firebase/app')
      const { getMessaging, getToken } = await import('firebase/messaging')
      
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }
      
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
      const messaging = getMessaging(app)
      const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })
      
      if (token) {
        // Supabase'e kaydet
        const res = await fetch('/api/auth/session')
        const session = await res.json()
        if (session?.user?.id) {
          await fetch('/api/user/fcm-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          })
        }
        setNotifStatus('done')
      }
    } catch (err) {
      console.error('FCM token error:', err)
      setNotifStatus('idle')
    }
  }

  const requestNotification = async () => {
    setNotifStatus('loading')
    try {
      const perm = await Notification.requestPermission()
      if (perm === 'granted') {
        await getFCMToken()
      } else {
        setNotifStatus('idle')
        alert('Bildirim izni reddedildi.')
      }
    } catch {
      setNotifStatus('idle')
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#FAF6EF', fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'24px 16px' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:'#4A2C0E', marginBottom:20 }}>Profil & Ayarlar</h1>

        {/* Rol seçimi */}
        <div style={{ display:'flex', gap:10, marginBottom:24 }}>
          {[['buyer','🛒','Alıcı'],['chef','👩‍🍳','Aşçı']].map(([r,icon,label]) => (
            <button key={r} onClick={() => setRole(r as any)} style={{
              flex:1, padding:'12px 0', borderRadius:12, cursor:'pointer', border:'2px solid',
              borderColor: role === r ? '#E8622A' : '#E8E0D4',
              background: role === r ? '#FEF3EC' : 'white',
              color: role === r ? '#E8622A' : '#4A2C0E',
              fontWeight:700, fontSize:14, fontFamily:'inherit',
            }}>{icon} {label}</button>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Kişisel Bilgiler */}
          <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>Kişisel Bilgiler</div>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'#E8622A', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:24, fontWeight:700 }}>
                {form.full_name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'#4A2C0E' }}>{form.full_name}</div>
                <div style={{ fontSize:12, color:'#8A7B6B', marginTop:2 }}>{role === 'buyer' ? '🛒 Alıcı' : '👩‍🍳 Aşçı'}</div>
                <label style={{ fontSize:11, color:'#E8622A', fontWeight:600, cursor:'pointer', marginTop:4, display:'inline-block' }}>
                  📷 Fotoğraf Değiştir
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const fd = new FormData()
                    fd.append('file', file)
                    fd.append('bucket', 'chef-avatars')
                    fd.append('folder', 'avatars')
                    const res = await fetch('/api/upload', { method:'POST', body: fd })
                    const json = await res.json()
                    if (json.url) alert('Fotoğraf yüklendi!')
                  }} />
                </label>
              </div>
            </div>
            {[['Ad Soyad','full_name','text'],['Telefon','phone','tel'],['E-posta','email','email']].map(([label,key,type]) => (
              <div key={key} style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:5 }}>{label}</label>
                <input type={type} value={form[key as keyof typeof form]} onChange={e => setForm(p => ({...p,[key]:e.target.value}))}
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>
            ))}
          </div>

          {/* Aşçı Ayarları */}
          {role === 'chef' && (
            <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>Aşçı Ayarları</div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:5 }}>Biyografi</label>
                <textarea value={chefForm.bio} onChange={e => setChefForm(p => ({...p,bio:e.target.value}))} rows={3}
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', resize:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:5 }}>IBAN</label>
                <input value={chefForm.iban} onChange={e => setChefForm(p => ({...p,iban:e.target.value}))}
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:8 }}>
                  Teslimat Yarıçapı: <span style={{ color:'#E8622A' }}>{chefForm.radius} km</span>
                </label>
                <input type="range" min={1} max={10} value={chefForm.radius} onChange={e => setChefForm(p => ({...p,radius:Number(e.target.value)}))}
                  style={{ width:'100%', accentColor:'#E8622A' }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#7A4A20', display:'block', marginBottom:5 }}>Min. Sipariş Tutarı (₺)</label>
                <input type="number" value={chefForm.min_order} onChange={e => setChefForm(p => ({...p,min_order:Number(e.target.value)}))}
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8E0D4', borderRadius:8, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>
            </div>
          )}

          {/* Bildirimler */}
          <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(74,44,14,0.08)' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#4A2C0E', marginBottom:16 }}>Bildirim Tercihleri</div>

            {/* Push bildirim izni */}
            <div style={{ background:'#FEF3EC', borderRadius:10, padding:'12px 14px', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:'#4A2C0E' }}>🔔 Push Bildirimler</div>
                <div style={{ fontSize:11, color:'#8A7B6B' }}>
                  {notifStatus === 'done' ? '✅ Bildirimler aktif' : 'Sipariş güncellemelerini anlık alın'}
                </div>
              </div>
              {notifStatus !== 'done' && (
                <button
                  onClick={requestNotification}
                  disabled={notifStatus === 'loading'}
                  style={{ padding:'7px 14px', background:'#E8622A', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  {notifStatus === 'loading' ? '⏳...' : 'İzin Ver'}
                </button>
              )}
            </div>

            {[
              ['orders','📦 Sipariş Güncellemeleri','Onay, hazırlık, teslimat'],
              ['favorites','👩‍🍳 Favori Aşçı','Yeni menü paylaşımları'],
              ['reviews','⭐ Değerlendirme','Teslimdan 30 dk sonra'],
              ['campaigns','🎁 Kampanyalar','Promosyon bildirimleri'],
              ['stock','📉 Stok Uyarısı','Son porsiyon uyarısı'],
            ].map(([key,title,desc]) => (
              <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:12, marginBottom:12, borderBottom:'1px solid #F5EDD8' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:'#4A2C0E' }}>{title}</div>
                  <div style={{ fontSize:11, color:'#8A7B6B' }}>{desc}</div>
                </div>
                <button onClick={() => setNotifs(p => ({...p,[key]:!p[key as keyof typeof notifs]}))} style={{
                  width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', flexShrink:0,
                  background: notifs[key as keyof typeof notifs] ? '#3D6B47' : '#E8E0D4', position:'relative', transition:'background 0.2s',
                }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left: notifs[key as keyof typeof notifs] ? 23 : 3, transition:'left 0.2s' }} />
                </button>
              </div>
            ))}
          </div>

          {/* Kaydet */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={save} style={{ flex:1, padding:'12px 0', background: saved ? '#3D6B47' : '#E8622A', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'background 0.2s' }}>
              {saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
            </button>
            <button style={{ padding:'12px 20px', background:'#FEE2E2', color:'#DC2626', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Çıkış Yap
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}