'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

// ── Konuşma tipi ──────────────────────────────────────────────────────────────

interface Conversation {
  order_id:     string
  order_number: string
  order_status: string
  other_user:   { id: string; full_name: string; avatar_url: string | null }
  chef_id:      string
  is_chef:      boolean
  last_message: {
    content:    string
    sender_id:  string
    created_at: string
  } | null
  unread_count: number
}

// ── Durum rengi ───────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { emoji: string; cls: string }> = {
  confirmed: { emoji: '✅', cls: 'badge-green'  },
  preparing: { emoji: '👩‍🍳', cls: 'badge-orange' },
  ready:     { emoji: '📦', cls: 'badge-blue'   },
  on_way:    { emoji: '🛵', cls: 'badge-blue'   },
  delivered: { emoji: '🏠', cls: 'badge-gray'   },
  cancelled: { emoji: '❌', cls: 'badge-red'    },
  pending:   { emoji: '⏳', cls: 'badge-gray'   },
}

// ── Konuşma listesi satırı ────────────────────────────────────────────────────

function ConvRow({
  conv,
  active,
  myId,
  onClick,
}: {
  conv:    Conversation
  active:  boolean
  myId:    string
  onClick: () => void
}) {
  const sm   = STATUS_META[conv.order_status] ?? STATUS_META.pending
  const isMineLastMsg = conv.last_message?.sender_id === myId

  return (
    <button
      className={`conv-row ${active ? 'conv-row--active' : ''} ${conv.unread_count > 0 ? 'conv-row--unread' : ''}`}
      onClick={onClick}
      type="button"
    >
      {/* Avatar */}
      <div className="conv-avatar-wrap">
        {conv.other_user?.avatar_url
          ? <img src={conv.other_user.avatar_url} alt={conv.other_user.full_name} className="conv-avatar" />
          : <div className="conv-avatar-ph">
              {conv.other_user?.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
        }
        {conv.unread_count > 0 && (
          <span className="conv-unread-dot">{conv.unread_count}</span>
        )}
      </div>

      {/* Bilgi */}
      <div className="conv-info">
        <div className="conv-top">
          <span className="conv-name">{conv.other_user?.full_name ?? 'Kullanıcı'}</span>
          {conv.last_message && (
            <span className="conv-time">
              {new Date(conv.last_message.created_at).toLocaleTimeString('tr-TR', {
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <div className="conv-bottom">
          <div className="conv-preview">
            {conv.last_message
              ? `${isMineLastMsg ? 'Siz: ' : ''}${conv.last_message.content.slice(0, 45)}${conv.last_message.content.length > 45 ? '…' : ''}`
              : 'Henüz mesaj yok'
            }
          </div>
          <div className={`conv-status-badge badge ${sm.cls}`}>
            {sm.emoji} #{conv.order_number.slice(-4)}
          </div>
        </div>
      </div>

      <style>{`
        .conv-row {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 12px 14px;
          background: none; border: none; cursor: pointer;
          text-align: left; transition: background 0.12s;
          border-radius: 0;
          font-family: 'DM Sans', sans-serif;
          border-bottom: 1px solid var(--gray-light);
        }
        .conv-row:hover       { background: var(--warm); }
        .conv-row--active     { background: #FFF5EF; }
        .conv-row--unread     {}
        .conv-row--unread .conv-name { font-weight: 800; color: var(--brown); }

        .conv-avatar-wrap { position: relative; flex-shrink: 0; }
        .conv-avatar, .conv-avatar-ph {
          width: 44px; height: 44px; border-radius: 50%;
        }
        .conv-avatar { object-fit: cover; }
        .conv-avatar-ph {
          background: linear-gradient(135deg, var(--warm), var(--gray-light));
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 800; color: var(--brown-mid);
        }

        .conv-unread-dot {
          position: absolute; top: -2px; right: -2px;
          width: 18px; height: 18px; border-radius: 9px;
          background: var(--orange); color: white;
          font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--white);
        }

        .conv-info { flex: 1; min-width: 0; }
        .conv-top  { display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 4px; }
        .conv-name { font-size: 13.5px; font-weight: 700; color: var(--brown); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-time { font-size: 10.5px; color: var(--gray); flex-shrink: 0; }

        .conv-bottom { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .conv-preview {
          font-size: 12px; color: var(--gray);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          flex: 1;
        }

        .conv-status-badge { font-size: 10px; flex-shrink: 0; }
      `}</style>
    </button>
  )
}

// ── Ana sayfa ─────────────────────────────────────────────────────────────────

function MesajlarInner() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const orderFromUrl = searchParams.get('order')

  const [convs,    setConvs]    = useState<Conversation[]>([])
  const [loading,  setLoading]  = useState(true)
  const [activeId, setActiveId] = useState<string | null>(orderFromUrl)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) {
        const data = await res.json()
        setConvs(data)
        // URL'deki order aktif değilse ilk konuşmayı aç
        if (!activeId && data.length > 0 && !orderFromUrl) {
          setActiveId(data[0].order_id)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [activeId, orderFromUrl])

  useEffect(() => { load() }, [load])

  const activeConv = convs.find(c => c.order_id === activeId)
  const totalUnread = convs.reduce((s, c) => s + c.unread_count, 0)

  if (!user) return (
    <div className="mp-empty">
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
      <div className="mp-empty-title">Giriş Yapmanız Gerekiyor</div>
      <Link href="/giris" className="mp-login-btn">Giriş Yap</Link>
    </div>
  )

  return (
    <div className="mp-page">

      {/* ── Sidebar: konuşma listesi ── */}
      <div className={`mp-sidebar ${activeId ? 'mp-sidebar--hidden-mobile' : ''}`}>
        <div className="mp-sidebar-header">
          <h1 className="mp-title">
            Mesajlar
            {totalUnread > 0 && (
              <span className="mp-unread-badge">{totalUnread}</span>
            )}
          </h1>
        </div>

        {loading ? (
          <div className="mp-list-loading">
            <div className="mp-spinner" />
          </div>
        ) : convs.length === 0 ? (
          <div className="mp-list-empty">
            <div style={{ fontSize: 36 }}>💬</div>
            <div className="mp-list-empty-text">Henüz mesajınız yok.</div>
            <div className="mp-list-empty-sub">
              Bir sipariş verdikten sonra aşçınızla mesajlaşabilirsiniz.
            </div>
          </div>
        ) : (
          <div className="mp-list">
            {convs.map(conv => (
              <ConvRow
                key={conv.order_id}
                conv={conv}
                active={activeId === conv.order_id}
                myId={user.id}
                onClick={() => setActiveId(conv.order_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Chat alanı ── */}
      <div className={`mp-chat ${!activeId ? 'mp-chat--hidden-mobile' : ''}`}>
        {activeId && activeConv ? (
          <>
            {/* Mobil geri butonu */}
            <button
              className="mp-back-btn"
              onClick={() => setActiveId(null)}
              type="button"
              aria-label="Geri"
            >
              ← Konuşmalar
            </button>
            <ChatWindow
              key={activeId}
              orderId={activeId}
              myId={user.id}
              isChef={activeConv.is_chef}
              orderNum={activeConv.order_number}
              embedded
            />
          </>
        ) : (
          <div className="mp-chat-placeholder">
            <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
            <div className="mp-chat-ph-title">Bir konuşma seçin</div>
            <div className="mp-chat-ph-sub">
              Soldaki listeden bir sipariş konuşması seçerek mesajlaşmaya başlayın.
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* ── Sayfa ─────────────────────── */
        .mp-page {
          display: flex;
          height: calc(100vh - 60px);
          overflow: hidden;
          background: var(--cream);
        }

        /* ── Sidebar ───────────────────── */
        .mp-sidebar {
          width: 340px; flex-shrink: 0;
          background: var(--white);
          border-right: 1.5px solid var(--gray-light);
          display: flex; flex-direction: column;
          overflow: hidden;
        }

        .mp-sidebar-header {
          padding: 16px 18px;
          border-bottom: 1.5px solid var(--gray-light);
          flex-shrink: 0;
        }

        .mp-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 900; color: var(--brown);
          display: flex; align-items: center; gap: 8px;
        }

        .mp-unread-badge {
          background: var(--orange); color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 800;
          padding: 2px 8px; border-radius: 12px;
        }

        .mp-list { flex: 1; overflow-y: auto; }
        .mp-list::-webkit-scrollbar { width: 4px; }
        .mp-list::-webkit-scrollbar-thumb { background: var(--gray-light); border-radius: 4px; }

        .mp-list-loading {
          flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px;
        }

        .mp-spinner {
          width: 28px; height: 28px;
          border: 3px solid var(--gray-light);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .mp-list-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 24px; text-align: center; gap: 8px;
        }
        .mp-list-empty-text { font-weight: 700; font-size: 14px; color: var(--brown); }
        .mp-list-empty-sub  { font-size: 12px; color: var(--gray); line-height: 1.6; }

        /* ── Chat alanı ─────────────────── */
        .mp-chat {
          flex: 1; display: flex; flex-direction: column;
          overflow: hidden; position: relative;
        }

        .mp-back-btn {
          display: none; padding: 10px 14px;
          background: var(--warm); border: none;
          border-bottom: 1.5px solid var(--gray-light);
          font-size: 13px; font-weight: 700; color: var(--brown);
          cursor: pointer; text-align: left;
          font-family: 'DM Sans', sans-serif;
        }

        .mp-chat-placeholder {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px; text-align: center; color: var(--gray);
        }
        .mp-chat-ph-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--brown); margin-bottom: 8px; }
        .mp-chat-ph-sub   { font-size: 13px; line-height: 1.6; max-width: 320px; }

        /* ── Boş / giriş gereken ───────── */
        .mp-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 60vh; gap: 10px; text-align: center; padding: 24px;
        }
        .mp-empty-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: var(--brown); }
        .mp-login-btn {
          padding: 11px 22px; background: var(--orange); color: white;
          border-radius: 12px; text-decoration: none;
          font-size: 13.5px; font-weight: 700; margin-top: 8px;
        }

        /* ── Mobil ─────────────────────── */
        @media (max-width: 767px) {
          .mp-page { flex-direction: column; height: calc(100vh - 56px - env(safe-area-inset-bottom, 0px)); }

          .mp-sidebar { width: 100%; height: 100%; }
          .mp-sidebar--hidden-mobile { display: none; }

          .mp-chat { width: 100%; height: 100%; }
          .mp-chat--hidden-mobile { display: none; }

          .mp-back-btn { display: block; }
        }
      `}</style>
    </div>
  )
}

import { Suspense } from 'react'
export default function MesajlarPage() {
  return (
    <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'#8A7B6B'}}>Yükleniyor…</div>}>
      <MesajlarInner />
    </Suspense>
  )
}