// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { usePWA } from '@/hooks/usePWA'

// ─── Ana Ekrana Ekle Banneri ──────────────────────────────────────────────────

export function InstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePWA()
  const [dismissed, setDismissed] = useState(true)  // başlangıçta gizli
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // LocalStorage'da "dismissed" yoksa göster
    const dis = sessionStorage.getItem('install-banner-dismissed')
    if (!dis && canInstall) setDismissed(false)
  }, [canInstall])

  if (dismissed || isInstalled || !canInstall) return null

  const handleInstall = async () => {
    setInstalling(true)
    const accepted = await promptInstall()
    if (!accepted) setDismissed(true)
    setInstalling(false)
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('install-banner-dismissed', '1')
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-80 z-40
                    bg-[#4A2C0E] border border-[#7A4A20] rounded-2xl shadow-2xl
                    flex items-center gap-3 p-4 animate-slide-up">
      {/* İkon */}
      <div className="w-12 h-12 rounded-xl bg-[#E8622A] flex items-center justify-center text-2xl flex-shrink-0">
        🍽️
      </div>

      {/* Metin */}
      <div className="flex-1 min-w-0">
        <div className="text-white text-[13px] font-bold leading-tight">
          Ana Ekrana Ekle
        </div>
        <div className="text-[#F5DEB3] text-[11px] mt-0.5 leading-tight">
          Daha hızlı erişim için uygulamayı yükle
        </div>
      </div>

      {/* Butonlar */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          disabled={installing}
          className="px-3 py-1.5 bg-[#E8622A] hover:bg-[#d4541e] text-white text-[11px] font-bold
                     rounded-lg transition-all disabled:opacity-50"
        >
          {installing ? '…' : 'Yükle'}
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/60
                     text-[11px] rounded-lg transition-all"
        >
          Şimdi değil
        </button>
      </div>
    </div>
  )
}

// ─── iOS Kurulum Rehberi (iOS Safari, beforeinstallprompt desteklemez) ─────────

export function IOSInstallGuide() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIOS     = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari  = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    const installed = window.matchMedia('(display-mode: standalone)').matches
    const dismissed = sessionStorage.getItem('ios-guide-dismissed')

    if (isIOS && isSafari && !installed && !dismissed) setShow(true)
  }, [])

  if (!show) return null

  const handleDismiss = () => {
    setShow(false)
    sessionStorage.setItem('ios-guide-dismissed', '1')
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={handleDismiss}>
      <div
        className="w-full bg-white rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
        <div className="text-[#4A2C0E] font-bold text-lg mb-4 text-center">
          🍽️ Uygulamayı Ana Ekrana Ekle
        </div>

        <div className="space-y-4 mb-6">
          {[
            { icon: '1️⃣', text: 'Alttaki Safari paylaşma butonuna tap et', sub: '↑ Ekranın altındaki kare + ok simgesi' },
            { icon: '2️⃣', text: '"Ana Ekrana Ekle" seçeneğine tap et',     sub: 'Listede aşağı kaydır' },
            { icon: '3️⃣', text: '"Ekle" butonuna tap et',                  sub: 'Sağ üst köşede' },
          ].map(step => (
            <div key={step.icon} className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{step.icon}</div>
              <div>
                <div className="text-[#4A2C0E] text-[14px] font-semibold">{step.text}</div>
                <div className="text-[#8A7B6B] text-[12px] mt-0.5">{step.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-3.5 bg-[#E8622A] text-white font-bold rounded-2xl text-[15px]"
        >
          Anladım
        </button>
      </div>
    </div>
  )
}

// ─── Bildirim İzni İsteme ─────────────────────────────────────────────────────

export function PushPermissionPrompt() {
  const { pushPermission, subscribePush, swReady } = usePWA()
  const [show,      setShow]     = useState(false)
  const [loading,   setLoading]  = useState(false)
  const [subscribed,setSubscribed] = useState(false)

  useEffect(() => {
    if (!swReady) return
    // Sadece giriş yapmış kullanıcılara göster
    // Daha önce reddedilmişse gösterme
    const dismissed = localStorage.getItem('push-prompt-dismissed')
    if (pushPermission === 'default' && !dismissed) {
      // 3 saniye sonra göster
      const t = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(t)
    }
  }, [swReady, pushPermission])

  if (!show || pushPermission !== 'default' || subscribed) return null

  const handleAccept = async () => {
    setLoading(true)
    const ok = await subscribePush()
    setLoading(false)
    setSubscribed(ok)
    setShow(false)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('push-prompt-dismissed', '1')
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:top-6 md:left-auto md:right-6 md:w-80 z-50
                    bg-white border border-[#E8E0D4] rounded-2xl shadow-2xl p-5 animate-slide-down">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl">🔔</div>
        <div>
          <div className="text-[#4A2C0E] font-bold text-[14px]">Bildirimler Açık Olsun mu?</div>
          <div className="text-[#8A7B6B] text-[12px] mt-1 leading-relaxed">
            Sipariş güncellemeleri ve favori aşçıların yeni menüleri için bildirim al.
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 py-2.5 bg-[#E8622A] hover:bg-[#d4541e] text-white text-[13px]
                     font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? '…' : '✅ İzin Ver'}
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2.5 bg-[#F5EDD8] hover:bg-[#E8E0D4] text-[#8A7B6B]
                     text-[13px] rounded-xl transition-all"
        >
          Şimdi değil
        </button>
      </div>
    </div>
  )
}

// ─── Çevrimdışı Banner ────────────────────────────────────────────────────────

export function OfflineBanner() {
  const { isOnline } = usePWA()

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#4A2C0E] text-white
                    text-center py-2.5 text-[12px] font-semibold tracking-wide">
      📡 Çevrimdışısın — bazı özellikler çalışmayabilir
    </div>
  )
}

// ─── PWAProvider — tüm bileşenleri layout'a ekler ────────────────────────────

export function PWAProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OfflineBanner />
      <PushPermissionPrompt />
      <InstallBanner />
      <IOSInstallGuide />
    </>
  )
}
