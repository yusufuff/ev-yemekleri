'use client'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div style={{ position:'fixed', bottom:20, right:20, zIndex:9999 }}>
        <button
          onClick={async () => { await fetch('/api/auth/signout', { method: 'POST' }); window.location.href = '/' }}
          style={{ background:'#DC2626', color:'white', border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.2)' }}
        >
          Cikis Yap
        </button>
      </div>
    </>
  )
}