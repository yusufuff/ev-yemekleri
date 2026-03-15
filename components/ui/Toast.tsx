'use client'
import { useState, useEffect, useCallback } from 'react'
import { createContext, useContext } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  emoji?: string
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], emoji?: string) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: Toast['type'] = 'success', emoji?: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type, emoji }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const bgColor = (type: Toast['type']) => ({
    success: '#3D6B47',
    error: '#DC2626',
    info: '#3B82F6',
  }[type])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:1000, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: bgColor(toast.type),
            color: 'white',
            padding: '12px 18px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            fontFamily: "'DM Sans', sans-serif",
            animation: 'slideIn 0.3s ease',
            maxWidth: 320,
          }}>
            {toast.emoji && <span style={{ fontSize:18 }}>{toast.emoji}</span>}
            {toast.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100px); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>
    </ToastContext.Provider>
  )
}