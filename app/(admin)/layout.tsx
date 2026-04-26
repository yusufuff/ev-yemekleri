'use client'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 9999 }}>
        <button
          onClick={async () => { await fetch('/api/auth/signout', { method: 'POST' }); window.location.href = '/' }}
          style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Çıkış
        </button>
      </div>
      {children}
    </>
  )
}