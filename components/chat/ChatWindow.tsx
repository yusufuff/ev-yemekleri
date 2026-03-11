// @ts-nocheck
'use client'

/**
 * ChatWindow
 * ───────────
 * Tek bir order bazlı konuşma penceresi.
 * useChat hook'u ile Supabase Realtime'a bağlı.
 */
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { useChat, type ChatMessage } from '@/hooks/useChat'

// ── Zaman damgası ─────────────────────────────────────────────────────────────

function timeLabel(iso: string): string {
  const date = new Date(iso)
  const now  = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60_000)                     return 'Az önce'
  if (diff < 3_600_000)                  return `${Math.floor(diff / 60_000)} dk önce`
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Gün ayırıcı
function dayLabel(iso: string): string {
  const date = new Date(iso)
  const now  = new Date()
  const yest = new Date(now); yest.setDate(yest.getDate() - 1)
  if (date.toDateString() === now.toDateString())  return 'Bugün'
  if (date.toDateString() === yest.toDateString()) return 'Dün'
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Tek mesaj balonu ──────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMine,
  showAvatar,
  onRetry,
}: {
  msg:        ChatMessage
  isMine:     boolean
  showAvatar: boolean
  onRetry:    (id: string) => void
}) {
  return (
    <div className={`cb-row ${isMine ? 'cb-row--mine' : 'cb-row--other'}`}>
      {/* Avatar (karşı taraf, ilk mesaj grubunda) */}
      {!isMine && (
        <div className="cb-avatar-slot">
          {showAvatar && (
            msg.users?.avatar_url
              ? <img src={msg.users.avatar_url} alt={msg.users.full_name} className="cb-avatar" />
              : <div className="cb-avatar-ph">{(msg.users?.full_name?.[0] ?? '?').toUpperCase()}</div>
          )}
        </div>
      )}

      {/* Balon */}
      <div className={`cb-bubble ${isMine ? 'cb-bubble--mine' : 'cb-bubble--other'} ${msg.pending ? 'cb-bubble--pending' : ''} ${msg.failed ? 'cb-bubble--failed' : ''}`}>
        <div className="cb-content">{msg.content}</div>

        <div className="cb-meta">
          <span className="cb-time">{timeLabel(msg.created_at)}</span>
          {isMine && (
            <span className="cb-status" aria-label={msg.pending ? 'Gönderiliyor' : msg.failed ? 'Hata' : msg.is_read ? 'Okundu' : 'Gönderildi'}>
              {msg.pending ? '🕐' : msg.failed ? '⚠️' : msg.is_read ? '✓✓' : '✓'}
            </span>
          )}
        </div>

        {/* Yeniden dene */}
        {msg.failed && (
          <button
            className="cb-retry"
            onClick={() => onRetry(msg.id)}
            type="button"
          >
            Tekrar gönder ↺
          </button>
        )}
      </div>
    </div>
  )
}

// ── Yazıyor göstergesi ────────────────────────────────────────────────────────

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="cb-row cb-row--other">
      <div className="cb-avatar-slot">
        <div className="cb-avatar-ph" style={{ fontSize: 12 }}>…</div>
      </div>
      <div className="cb-bubble cb-bubble--other cb-bubble--typing">
        <div className="cb-dots">
          <span className="cb-dot" />
          <span className="cb-dot" />
          <span className="cb-dot" />
        </div>
        <div className="cb-typing-label">{name} yazıyor…</div>
      </div>
    </div>
  )
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

interface ChatWindowProps {
  orderId:    string
  myId:       string
  isChef?:    boolean
  orderNum?:  string
  onClose?:   () => void
  embedded?:  boolean  // true = sayfa içi, false = modal/panel
}

export function ChatWindow({
  orderId,
  myId,
  isChef   = false,
  orderNum,
  onClose,
  embedded = false,
}: ChatWindowProps) {
  const {
    messages, otherUser, loading, sending, connected,
    error, typingOther, unreadCount, quickReplies,
    sendMessage, retryMessage, setTyping, reload,
  } = useChat(orderId, myId, isChef)

  const [draft,        setDraft]        = useState('')
  const [showQuick,    setShowQuick]    = useState(false)
  const bottomRef                        = useRef<HTMLDivElement>(null)
  const inputRef                         = useRef<HTMLTextAreaElement>(null)
  const lastDayRef                       = useRef<string>('')

  // Yeni mesajda otomatik scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingOther])

  // Gönder
  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? draft).trim()
    if (!content) return
    setDraft('')
    setShowQuick(false)
    await sendMessage(content)
    inputRef.current?.focus()
  }, [draft, sendMessage])

  // Enter = gönder, Shift+Enter = satır sonu
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value)
    setTyping(e.target.value.length > 0)
  }

  // Gün ayırıcı hesapla
  function shouldShowDay(msg: ChatMessage): boolean {
    const day = dayLabel(msg.created_at)
    if (day !== lastDayRef.current) {
      lastDayRef.current = day
      return true
    }
    return false
  }
  // reset her render
  lastDayRef.current = ''

  if (loading) return (
    <div className={`cw-wrap ${embedded ? 'cw-wrap--embedded' : ''}`}>
      <div className="cw-loading">
        <div className="cw-spinner" />
        <span>Yükleniyor…</span>
      </div>
    </div>
  )

  if (error) return (
    <div className={`cw-wrap ${embedded ? 'cw-wrap--embedded' : ''}`}>
      <div className="cw-error">
        <div>⚠️ {error}</div>
        <button className="cw-retry-btn" onClick={reload} type="button">Tekrar Dene</button>
      </div>
    </div>
  )

  return (
    <div className={`cw-wrap ${embedded ? 'cw-wrap--embedded' : ''}`}>

      {/* ── Başlık ── */}
      <div className="cw-header">
        <div className="cw-header-left">
          {otherUser?.avatar_url
            ? <img src={otherUser.avatar_url} alt={otherUser.full_name} className="cw-header-avatar" />
            : <div className="cw-header-avatar-ph">
                {otherUser?.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
          }
          <div>
            <div className="cw-header-name">
              {otherUser?.full_name ?? 'Kullanıcı'}
              {isChef && <span className="cw-header-role">👩‍🍳 Aşçı</span>}
            </div>
            <div className={`cw-header-status ${connected ? 'cw-header-status--on' : ''}`}>
              <span className="cw-status-dot" />
              {connected ? 'Çevrimiçi' : 'Bağlanıyor…'}
            </div>
          </div>
        </div>

        <div className="cw-header-right">
          {orderNum && (
            <div className="cw-order-chip">#{orderNum}</div>
          )}
          {otherUser?.phone && (
            <a href={`tel:${otherUser.phone}`} className="cw-call-btn" title="Ara">📞</a>
          )}
          {onClose && (
            <button className="cw-close-btn" onClick={onClose} type="button" aria-label="Kapat">×</button>
          )}
        </div>
      </div>

      {/* ── Mesajlar ── */}
      <div className="cw-messages" role="log" aria-live="polite">
        {messages.length === 0 && !loading && (
          <div className="cw-empty">
            <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
            <div className="cw-empty-text">Henüz mesaj yok.</div>
            <div className="cw-empty-sub">Hızlı yanıtları kullanabilirsiniz 👇</div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine     = msg.sender_id === myId
          const showDay    = shouldShowDay(msg)
          // Avatar: ardışık kendi mesajlarda sadece ilkinde göster
          const prevMsg    = messages[i - 1]
          const showAvatar = !isMine && (
            !prevMsg || prevMsg.sender_id === myId ||
            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 120_000
          )

          return (
            <div key={msg.id}>
              {showDay && (
                <div className="cw-day-divider">
                  <span>{dayLabel(msg.created_at)}</span>
                </div>
              )}
              <MessageBubble
                msg={msg}
                isMine={isMine}
                showAvatar={showAvatar}
                onRetry={retryMessage}
              />
            </div>
          )
        })}

        {/* Yazıyor göstergesi */}
        {typingOther && otherUser && (
          <TypingIndicator name={otherUser.full_name} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Hızlı yanıtlar ── */}
      {showQuick && (
        <div className="cw-quick-replies">
          {quickReplies.map(qr => (
            <button
              key={qr.text}
              className="cw-quick-chip"
              onClick={() => handleSend(qr.text)}
              type="button"
            >
              {qr.emoji} {qr.text.length > 40 ? qr.text.slice(0, 38) + '…' : qr.text}
            </button>
          ))}
        </div>
      )}

      {/* ── Giriş alanı ── */}
      <div className="cw-input-bar">
        <button
          className={`cw-quick-btn ${showQuick ? 'cw-quick-btn--active' : ''}`}
          onClick={() => setShowQuick(!showQuick)}
          type="button"
          aria-label="Hızlı yanıtlar"
          title="Hızlı yanıtlar"
        >
          ⚡
        </button>

        <textarea
          ref={inputRef}
          className="cw-textarea"
          value={draft}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Mesaj yazın… (Enter gönderir)"
          rows={1}
          maxLength={1000}
          aria-label="Mesaj"
          disabled={sending}
        />

        <button
          className={`cw-send-btn ${draft.trim() ? 'cw-send-btn--active' : ''}`}
          onClick={() => handleSend()}
          disabled={!draft.trim() || sending}
          type="button"
          aria-label="Gönder"
        >
          {sending ? (
            <span className="cw-send-spinner" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <style>{`
        /* ── Sarmalayıcı ─────────────────── */
        .cw-wrap {
          display: flex; flex-direction: column;
          background: var(--white);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          border: 1.5px solid var(--gray-light);
          height: 580px;
        }

        .cw-wrap--embedded {
          height: 100%; border-radius: 0; box-shadow: none; border: none;
        }

        /* ── Yükleniyor / Hata ──────────── */
        .cw-loading, .cw-error {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; font-size: 13px; color: var(--gray);
        }

        .cw-spinner, .cw-send-spinner {
          border-radius: 50%;
          border: 3px solid var(--gray-light);
          border-top-color: var(--orange);
          animation: spin 0.8s linear infinite;
        }
        .cw-spinner      { width: 28px; height: 28px; }
        .cw-send-spinner { width: 16px; height: 16px; display: inline-block; }

        @keyframes spin { to { transform: rotate(360deg); } }

        .cw-retry-btn {
          padding: 8px 16px; background: var(--orange); color: white;
          border: none; border-radius: 8px; cursor: pointer;
          font-size: 12px; font-weight: 700; font-family: 'DM Sans', sans-serif;
        }

        /* ── Başlık ─────────────────────── */
        .cw-header {
          display: flex; align-items: center;
          justify-content: space-between; gap: 12px;
          padding: 14px 16px;
          background: var(--brown);
          color: white;
          flex-shrink: 0;
        }

        .cw-header-left { display: flex; align-items: center; gap: 10px; }

        .cw-header-avatar {
          width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
          border: 2px solid rgba(255,255,255,0.25); flex-shrink: 0;
        }

        .cw-header-avatar-ph {
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 800; flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.2);
        }

        .cw-header-name {
          font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px;
        }

        .cw-header-role {
          font-size: 11px; opacity: 0.7; font-weight: 500;
        }

        .cw-header-status {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; opacity: 0.65; margin-top: 2px;
        }
        .cw-header-status--on { opacity: 1; color: #6EE7B7; }

        .cw-status-dot {
          width: 7px; height: 7px; border-radius: 50%; background: currentColor;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

        .cw-header-right { display: flex; align-items: center; gap: 8px; }

        .cw-order-chip {
          font-size: 11px; font-weight: 700;
          background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 10px;
        }

        .cw-call-btn {
          font-size: 18px; text-decoration: none;
          padding: 4px; border-radius: 6px;
          transition: background 0.15s;
        }
        .cw-call-btn:hover { background: rgba(255,255,255,0.15); }

        .cw-close-btn {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.15); border: none;
          color: white; font-size: 18px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .cw-close-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Mesajlar ───────────────────── */
        .cw-messages {
          flex: 1; overflow-y: auto; padding: 16px 14px;
          display: flex; flex-direction: column; gap: 2px;
          background: var(--cream);
        }

        .cw-messages::-webkit-scrollbar { width: 4px; }
        .cw-messages::-webkit-scrollbar-thumb { background: var(--gray-light); border-radius: 4px; }

        /* Boş durum */
        .cw-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 40px 20px;
          opacity: 0.6;
        }
        .cw-empty-text { font-size: 14px; font-weight: 700; color: var(--brown); margin-bottom: 4px; }
        .cw-empty-sub  { font-size: 12px; color: var(--gray); }

        /* Gün ayırıcı */
        .cw-day-divider {
          display: flex; align-items: center;
          gap: 8px; margin: 10px 0;
        }
        .cw-day-divider::before, .cw-day-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--gray-light);
        }
        .cw-day-divider span {
          font-size: 11px; color: var(--gray); white-space: nowrap;
          background: var(--cream); padding: 0 8px;
        }

        /* ── Mesaj satırı ───────────────── */
        .cb-row {
          display: flex; align-items: flex-end; gap: 6px;
          margin-bottom: 4px;
        }
        .cb-row--mine  { flex-direction: row-reverse; }

        .cb-avatar-slot { width: 30px; flex-shrink: 0; }
        .cb-avatar, .cb-avatar-ph {
          width: 28px; height: 28px; border-radius: 50%;
          object-fit: cover;
        }
        .cb-avatar-ph {
          background: var(--warm); display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; color: var(--brown-mid);
        }

        /* Balon */
        .cb-bubble {
          max-width: 70%; padding: 9px 13px;
          border-radius: 18px; position: relative;
          line-height: 1.5;
          animation: cb-pop 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes cb-pop {
          from { opacity: 0; transform: scale(0.88) translateY(4px); }
          to   { opacity: 1; transform: none; }
        }

        .cb-bubble--mine {
          background: var(--orange); color: white;
          border-bottom-right-radius: 6px;
        }
        .cb-bubble--other {
          background: var(--white); color: var(--brown);
          border-bottom-left-radius: 6px;
          box-shadow: 0 1px 4px rgba(74,44,14,0.08);
        }
        .cb-bubble--pending { opacity: 0.65; }
        .cb-bubble--failed  { background: #FEF2F2 !important; color: #DC2626 !important; border: 1.5px solid #FECACA; }

        .cb-bubble--typing {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
        }

        .cb-content { font-size: 13.5px; word-break: break-word; white-space: pre-wrap; }

        .cb-meta {
          display: flex; align-items: center; gap: 4px;
          justify-content: flex-end; margin-top: 3px;
        }

        .cb-time   { font-size: 10px; opacity: 0.65; }
        .cb-status { font-size: 11px; }

        .cb-retry {
          display: block; margin-top: 6px; font-size: 11px; font-weight: 700;
          color: #DC2626; background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          text-decoration: underline;
        }

        /* Yazıyor dots */
        .cb-dots { display: flex; gap: 3px; }
        .cb-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--gray);
          animation: cb-bounce 1.2s infinite ease-in-out;
        }
        .cb-dot:nth-child(2) { animation-delay: 0.2s; }
        .cb-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes cb-bounce {
          0%,80%,100% { transform: translateY(0); }
          40%          { transform: translateY(-6px); }
        }

        .cb-typing-label { font-size: 12px; color: var(--gray); }

        /* ── Hızlı yanıtlar ─────────────── */
        .cw-quick-replies {
          display: flex; gap: 7px; flex-wrap: wrap;
          padding: 8px 14px;
          background: var(--white);
          border-top: 1px solid var(--gray-light);
          max-height: 90px; overflow-y: auto;
        }

        .cw-quick-chip {
          padding: 5px 12px; border-radius: 20px;
          border: 1.5px solid var(--gray-light);
          background: var(--warm); color: var(--brown);
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s;
          white-space: nowrap;
        }
        .cw-quick-chip:hover { border-color: var(--orange); color: var(--orange); }

        /* ── Giriş çubuğu ───────────────── */
        .cw-input-bar {
          display: flex; align-items: flex-end; gap: 8px;
          padding: 10px 12px;
          background: var(--white);
          border-top: 1.5px solid var(--gray-light);
          flex-shrink: 0;
        }

        .cw-quick-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--warm); border: 1.5px solid var(--gray-light);
          font-size: 16px; cursor: pointer; flex-shrink: 0;
          transition: all 0.15s; display: flex; align-items: center; justify-content: center;
        }
        .cw-quick-btn--active { background: #FFF5EF; border-color: var(--orange); }
        .cw-quick-btn:hover   { border-color: var(--orange); }

        .cw-textarea {
          flex: 1; resize: none;
          border: 1.5px solid var(--gray-light);
          border-radius: 18px; padding: 9px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; color: var(--brown);
          background: var(--cream);
          line-height: 1.5;
          max-height: 100px; overflow-y: auto;
          transition: border-color 0.15s;
        }
        .cw-textarea:focus { outline: none; border-color: var(--orange); background: var(--white); }
        .cw-textarea:disabled { opacity: 0.6; cursor: not-allowed; }

        .cw-send-btn {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--gray-light); border: none;
          cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: var(--gray); transition: all 0.2s;
        }
        .cw-send-btn--active { background: var(--orange); color: white; }
        .cw-send-btn--active:hover { background: #d4541e; transform: scale(1.07); }
        .cw-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
      `}</style>
    </div>
  )
}
