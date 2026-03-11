'use client'
export default function OfflinePage() {
  return (
    <div style={{textAlign:'center', padding:'80px 20px'}}>
      <div style={{fontSize:'64px', marginBottom:'16px'}}>📵</div>
      <h1 style={{fontSize:'28px', fontWeight:'bold', marginBottom:'8px'}}>Çevrimdışısın</h1>
      <p style={{color:'#8A7B6B', marginBottom:'24px'}}>İnternet bağlantın yok.</p>
      <button onClick={() => window.location.reload()} style={{background:'#E8622A', color:'white', padding:'12px 24px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'16px'}}>
        Tekrar Dene
      </button>
    </div>
  )
}