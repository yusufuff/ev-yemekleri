// app/(buyer)/profil/SifreForm.tsx - Client Component
'use client'
// @ts-nocheck
import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function SifreForm() {
  const [sifreForm, setSifreForm] = useState({ yeni: '', tekrar: '' })
  const [goster, setGoster] = useState({ yeni: false, tekrar: false })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hata, setHata] = useState('')

  const sifreDegistir = async () => {
    setHata('')
    if (!sifreForm.yeni || sifreForm.yeni.length < 6) {
      setHata('Şifre en az 6 karakter olmalı')
      return
    }
    if (sifreForm.yeni !== sifreForm.tekrar) {
      setHata('Şifreler eşleşmiyor')
      return
    }
    setSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password: sifreForm.yeni })
      if (error) {
        if (error.message.includes('different from the old password')) {
          setHata('Yeni şifre eski şifreden farklı olmalı')
        } else {
          setHata('Hata: ' + error.message)
        }
        return
      }
      setSaved(true)
      setSifreForm({ yeni: '', tekrar: '' })
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setHata('Bir sorun oluştu')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #E8E0D4', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#4A2C0E' }

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.08)' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>🔒 Şifre Değiştir</div>

      <div style={{ marginBottom: 12 }}>


        <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Yeni Şifre</label>
        <div style={{ position: 'relative' }}>
          <input
            type={goster.yeni ? 'text' : 'password'}
            value={sifreForm.yeni}
            onChange={e => setSifreForm(p => ({ ...p, yeni: e.target.value }))}
            placeholder="En az 6 karakter"
            style={{ ...inputStyle, paddingRight: 44 }}
          />
          <button onClick={() => setGoster(p => ({ ...p, yeni: !p.yeni }))}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8A7B6B' }}>
            {goster.yeni ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#7A4A20', display: 'block', marginBottom: 5 }}>Yeni Şifre (Tekrar)</label>
        <div style={{ position: 'relative' }}>
          <input
            type={goster.tekrar ? 'text' : 'password'}
            value={sifreForm.tekrar}
            onChange={e => setSifreForm(p => ({ ...p, tekrar: e.target.value }))}
            placeholder="Şifreyi tekrar girin"
            style={{ ...inputStyle, paddingRight: 44 }}
          />
          <button onClick={() => setGoster(p => ({ ...p, tekrar: !p.tekrar }))}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8A7B6B' }}>
            {goster.tekrar ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {hata && (
        <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
          ❌ {hata}
        </div>
      )}

      <button onClick={sifreDegistir} disabled={saving} style={{ width: '100%', padding: '12px 0', background: saved ? '#3D6B47' : '#4A2C0E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
        {saving ? '⏳ Değiştiriliyor...' : saved ? '✅ Şifre Değiştirildi!' : '🔒 Şifreyi Değiştir'}
      </button>
    </div>
  )
}