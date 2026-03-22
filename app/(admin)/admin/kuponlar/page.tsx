// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminKuponlarPage() {
  const [coupons,  setCoupons]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState('')

  const [form, setForm] = useState({
    code:             '',
    description:      '',
    discount_type:    'percentage',
    discount_value:   10,
    max_discount:     '',
    min_order_amount: '',
    max_uses:         '',
    per_user_limit:   1,
    expires_at:       '',
    first_order_only: false,
    is_active:        true,
  })

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/coupons')
    const d   = await res.json()
    setCoupons(d.coupons ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleCreate = async () => {
    if (!form.code.trim()) { showToast('⚠️ Kupon kodu gerekli'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          code:             form.code.toUpperCase().trim(),
          discount_value:   Number(form.discount_value),
          max_discount:     form.max_discount     ? Number(form.max_discount)     : null,
          min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
          max_uses:         form.max_uses         ? Number(form.max_uses)         : null,
          per_user_limit:   Number(form.per_user_limit),
          expires_at:       form.expires_at || null,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        showToast('✅ Kupon oluşturuldu')
        setShowForm(false)
        setForm({ code:'', description:'', discount_type:'percentage', discount_value:10, max_discount:'', min_order_amount:'', max_uses:'', per_user_limit:1, expires_at:'', first_order_only:false, is_active:true })
        load()
      } else {
        showToast('⚠️ ' + (d.error ?? 'Hata'))
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !is_active } : c))
    showToast(!is_active ? '✅ Kupon aktif edildi' : '🚫 Kupon pasif edildi')
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Kuponu silmek istediğinize emin misiniz?')) return
    await fetch('/api/admin/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCoupons(prev => prev.filter(c => c.id !== id))
    showToast('🗑️ Kupon silindi')
  }

  const inputStyle: any = {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid #E8E0D4', borderRadius: 8,
    fontSize: 13, fontFamily: 'inherit',
    boxSizing: 'border-box', outline: 'none',
  }

  const labelStyle: any = {
    fontSize: 11, fontWeight: 700, color: '#7A4A20',
    display: 'block', marginBottom: 4,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background: '#4A2C0E', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 20, overflowX: 'auto' }}>
        <Link href="/admin" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, color: 'white', fontSize: 18, textDecoration: 'none', flexShrink: 0 }}>
          EV YEMEKLERİ · Admin
        </Link>
        {[['Dashboard','/admin'],['Aşçılar','/admin/asciler'],['Kullanıcılar','/admin/kullanicilar'],['Siparişler','/admin/siparisler'],['Kuponlar','/admin/kuponlar']].map(([l,h]) => (
          <Link key={h} href={h} style={{ color: h==='/admin/kuponlar' ? 'white' : 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none', fontWeight: h==='/admin/kuponlar' ? 700 : 400, flexShrink: 0 }}>{l}</Link>
        ))}
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>

        {/* Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#4A2C0E', margin: 0 }}>Kupon Yönetimi</h1>
            <div style={{ fontSize: 13, color: '#8A7B6B', marginTop: 4 }}>{coupons.length} kupon</div>
          </div>
          <button onClick={() => setShowForm(s => !s)} style={{
            padding: '10px 20px', background: '#E8622A', color: 'white',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {showForm ? '✕ İptal' : '+ Yeni Kupon'}
          </button>
        </div>

        {/* Yeni Kupon Formu */}
        {showForm && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(74,44,14,0.08)', marginBottom: 24, border: '2px solid #E8622A' }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 20 }}>
              Yeni Kupon Oluştur
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Kupon Kodu *</label>
                <input value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value.toUpperCase()}))}
                  placeholder="YAZA10" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Açıklama</label>
                <input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  placeholder="Yaz kampanyası" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>İndirim Türü</label>
                <select value={form.discount_type} onChange={e => setForm(p => ({...p, discount_type: e.target.value}))} style={inputStyle}>
                  <option value="percentage">Yüzde (%)</option>
                  <option value="fixed">Sabit (₺)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>İndirim Değeri</label>
                <input type="number" value={form.discount_value} onChange={e => setForm(p => ({...p, discount_value: Number(e.target.value)}))}
                  style={inputStyle} min={1} />
              </div>
              <div>
                <label style={labelStyle}>Maks. İndirim (₺)</label>
                <input type="number" value={form.max_discount} onChange={e => setForm(p => ({...p, max_discount: e.target.value}))}
                  placeholder="Boş = limitsiz" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Min. Sipariş (₺)</label>
                <input type="number" value={form.min_order_amount} onChange={e => setForm(p => ({...p, min_order_amount: e.target.value}))}
                  placeholder="Boş = yok" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Toplam Kullanım</label>
                <input type="number" value={form.max_uses} onChange={e => setForm(p => ({...p, max_uses: e.target.value}))}
                  placeholder="Boş = limitsiz" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Kişi Başı Kullanım</label>
                <input type="number" value={form.per_user_limit} onChange={e => setForm(p => ({...p, per_user_limit: Number(e.target.value)}))}
                  style={inputStyle} min={1} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Son Kullanma Tarihi</label>
                <input type="date" value={form.expires_at} onChange={e => setForm(p => ({...p, expires_at: e.target.value}))}
                  style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.first_order_only} onChange={e => setForm(p => ({...p, first_order_only: e.target.checked}))} />
                  Sadece ilk siparişte geçerli
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({...p, is_active: e.target.checked}))} />
                  Aktif
                </label>
              </div>
            </div>

            <button onClick={handleCreate} disabled={saving} style={{
              padding: '12px 28px', background: saving ? '#E8E0D4' : '#E8622A',
              color: saving ? '#8A7B6B' : 'white', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? 'Oluşturuluyor…' : '✅ Kuponu Oluştur'}
            </button>
          </div>
        )}

        {/* Kupon Listesi */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#8A7B6B' }}>Yükleniyor…</div>
        ) : coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏷️</div>
            <div style={{ fontWeight: 700, color: '#4A2C0E', marginBottom: 8 }}>Henüz kupon yok</div>
            <div style={{ fontSize: 13, color: '#8A7B6B' }}>Yukarıdaki butona tıklayarak ilk kuponu oluştur</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {coupons.map(c => {
              const isExpired = c.expires_at && new Date(c.expires_at) < new Date()
              return (
                <div key={c.id} style={{
                  background: 'white', borderRadius: 14, padding: '16px 20px',
                  boxShadow: '0 2px 12px rgba(74,44,14,0.07)',
                  border: '1px solid rgba(232,224,212,0.5)',
                  borderLeft: `4px solid ${c.is_active && !isExpired ? '#3D6B47' : '#E8E0D4'}`,
                  opacity: isExpired ? 0.6 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Kod */}
                      <div style={{
                        background: '#F5EDD8', borderRadius: 8, padding: '6px 14px',
                        fontFamily: 'monospace', fontSize: 16, fontWeight: 900, color: '#E8622A',
                        letterSpacing: '1px',
                      }}>
                        {c.code}
                      </div>
                      {/* Durum */}
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                        background: isExpired ? '#F3F4F6' : c.is_active ? '#ECFDF5' : '#FEE2E2',
                        color: isExpired ? '#6B7280' : c.is_active ? '#3D6B47' : '#DC2626',
                      }}>
                        {isExpired ? '⏰ Süresi Doldu' : c.is_active ? '✅ Aktif' : '🚫 Pasif'}
                      </span>
                    </div>

                    {/* Aksiyonlar */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!isExpired && (
                        <button onClick={() => toggleActive(c.id, c.is_active)} style={{
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          border: '1.5px solid #E8E0D4', background: 'white', cursor: 'pointer',
                          color: '#4A2C0E', fontFamily: 'inherit',
                        }}>
                          {c.is_active ? '🚫 Pasifleştir' : '✅ Aktifleştir'}
                        </button>
                      )}
                      <button onClick={() => deleteCoupon(c.id)} style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        border: 'none', background: '#FEE2E2', cursor: 'pointer',
                        color: '#DC2626', fontFamily: 'inherit',
                      }}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Detaylar */}
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', fontSize: 12, color: '#8A7B6B' }}>
                    <span>
                      💰 {c.discount_type === 'percentage'
                        ? `%${c.discount_value} indirim${c.max_discount ? ` (maks. ₺${c.max_discount})` : ''}`
                        : `₺${c.discount_value} indirim`}
                    </span>
                    {c.min_order_amount && <span>🛒 Min. ₺{c.min_order_amount}</span>}
                    {c.max_uses && <span>🔢 {c.used_count ?? 0}/{c.max_uses} kullanım</span>}
                    {!c.max_uses && <span>🔢 {c.used_count ?? 0} kullanım</span>}
                    {c.per_user_limit && <span>👤 Kişi başı {c.per_user_limit}</span>}
                    {c.expires_at && <span>📅 {new Date(c.expires_at).toLocaleDateString('tr-TR')}</span>}
                    {c.first_order_only && <span>🆕 Sadece ilk sipariş</span>}
                    {c.description && <span>📝 {c.description}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#4A2C0E', color: 'white', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}