'use client'

/**
 * useChat — Supabase Realtime mesajlaşma hook'u
 * ───────────────────────────────────────────────
 * Belirli bir orderId için iki taraflı canlı sohbet sağlar.
 * Yeni mesajlar Realtime kanalıyla anlık gelir.
 * Gönderilen mesajlar optimistic olarak eklenir, hata halinde geri alınır.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Tip tanımları ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:         string
  content:    string
  sender_id:  string
  is_read:    boolean
  created_at: string
  users?: {
    full_name:  string
    avatar_url: string | null
  }
  // Optimistic gönderim için
  pending?:   boolean
  failed?:    boolean
}

export interface ChatOtherUser {
  id:         string
  full_name:  string
  avatar_url: string | null
  phone?:     string
}

// ── Hızlı yanıt şablonları ────────────────────────────────────────────────────

export const QUICK_REPLIES = {
  chef: [
    { emoji: '✅', text: 'Siparişinizi aldım, hazırlamaya başlıyorum!' },
    { emoji: '⏱️', text: 'Yaklaşık 20-25 dakika içinde hazır olacak.' },
    { emoji: '📦', text: 'Yemeğiniz paketlendi, birazdan yola çıkıyorum.' },
    { emoji: '🏠', text: 'Kapınızdayım.' },
    { emoji: '❓', text: 'Adresinizi teyit edebilir misiniz?' },
  ],
  buyer: [
    { emoji: '🙏', text: 'Teşekkürler, bekliyorum!' },
    { emoji: '📍', text: 'Adresim: ' },
    { emoji: '⏰', text: 'Ne zaman hazır olur yaklaşık?' },
    { emoji: '🔔', text: 'Kapıya gelince zil çalın lütfen.' },
    { emoji: '👍', text: 'Anlaşıldı!' },
  ],
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChat(orderId: string, myId: string, isChef = false) {
  const [messages,   setMessages]   = useState<ChatMessage[]>([])
  const [otherUser,  setOtherUser]  = useState<ChatOtherUser | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [sending,    setSending]    = useState(false)
  const [connected,  setConnected]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [typingOther, setTypingOther] = useState(false)

  const supabase       = getSupabaseBrowserClient()
  const channelRef     = useRef<RealtimeChannel | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Geçmişi yükle ─────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/messages/${orderId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Mesajlar yüklenemedi.')
      setMessages(json.messages)
      setOtherUser(json.other_user)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { load() }, [load])

  // ── Realtime kanalı ───────────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${orderId}`)
      // Yeni mesaj
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `order_id=eq.${orderId}`,
        },
        payload => {
          const newMsg = payload.new as ChatMessage
          // Optimistic mesajı güncelle veya yenisini ekle
          setMessages(prev => {
            const hasPending = prev.some(
              m => m.pending && m.sender_id === myId
            )
            if (newMsg.sender_id === myId && hasPending) {
              // Kendi optimistic mesajını gerçek ID ile değiştir
              return prev.map(m =>
                m.pending && m.sender_id === myId ? { ...newMsg, pending: false } : m
              )
            }
            // Karşı taraftan gelen mesaj — zaten listede yoksa ekle
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Karşı tarafın mesajını otomatik okundu yap
          if (newMsg.sender_id !== myId) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id)
              .then(() => {})
          }
        }
      )
      // Yazıyor göstergesi (presence)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const othersTyping = Object.values(state)
          .flat()
          .some((p: any) => p.user_id !== myId && p.typing)
        setTypingOther(othersTyping)
      })
      .subscribe(status => {
        setConnected(status === 'SUBSCRIBED')
      })

    // Presence track
    channel.track({ user_id: myId, typing: false })
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, myId, supabase])

  // ── Yazıyor göstergesi gönder ─────────────────────────────────────────────

  const setTyping = useCallback((isTyping: boolean) => {
    channelRef.current?.track({ user_id: myId, typing: isTyping })
    if (isTyping) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        channelRef.current?.track({ user_id: myId, typing: false })
      }, 3000)
    }
  }, [myId])

  // ── Mesaj gönder ──────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    const trimmed = content.trim()
    if (!trimmed || sending) return false

    // Optimistic ekleme
    const tempId  = `temp-${Date.now()}`
    const tempMsg: ChatMessage = {
      id:         tempId,
      content:    trimmed,
      sender_id:  myId,
      is_read:    false,
      created_at: new Date().toISOString(),
      pending:    true,
    }

    setMessages(prev => [...prev, tempMsg])
    setSending(true)
    setTyping(false)

    try {
      const res = await fetch(`/api/messages/${orderId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: trimmed }),
      })

      if (!res.ok) {
        // Hata — optimistic mesajı hatalı olarak işaretle
        setMessages(prev =>
          prev.map(m => m.id === tempId ? { ...m, pending: false, failed: true } : m)
        )
        return false
      }

      return true
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...m, pending: false, failed: true } : m)
      )
      return false
    } finally {
      setSending(false)
    }
  }, [orderId, myId, sending, setTyping])

  // ── Başarısız mesajı yeniden dene ─────────────────────────────────────────

  const retryMessage = useCallback(async (tempId: string) => {
    const msg = messages.find(m => m.id === tempId)
    if (!msg) return
    // Hatalıyı kaldır ve yeniden gönder
    setMessages(prev => prev.filter(m => m.id !== tempId))
    await sendMessage(msg.content)
  }, [messages, sendMessage])

  // ── Okunmamış sayı (gerçek zamanlı) ──────────────────────────────────────

  const unreadCount = messages.filter(
    m => !m.is_read && m.sender_id !== myId
  ).length

  const quickReplies = isChef ? QUICK_REPLIES.chef : QUICK_REPLIES.buyer

  return {
    messages,
    otherUser,
    loading,
    sending,
    connected,
    error,
    typingOther,
    unreadCount,
    quickReplies,
    sendMessage,
    retryMessage,
    setTyping,
    reload: load,
  }
}
