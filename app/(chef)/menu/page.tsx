'use client'

import { useState } from 'react'
import { MenuCard } from '@/components/menu/MenuCard'
import { MenuItemFormComponent } from '@/components/menu/MenuItemFormComponent'
import { useMenu } from '@/hooks/useMenu'
import { CATEGORIES, CATEGORY_META, type MenuItem, type MenuCategory } from '@/types/menu'

// ── Modal sarmalayıcı ─────────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="mu-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal
    >
      <div className="mu-modal">
        <button className="mu-modal-close" onClick={onClose} aria-label="Kapat" type="button">
          ×
        </button>
        {children}
      </div>

      <style>{`
        .mu-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(74,44,14,0.4);
          backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: fade-in 0.15s ease;
        }

        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

        .mu-modal {
          background: var(--white);
          border-radius: 20px;
          padding: 28px;
          width: 100%; max-width: 860px;
          max-height: 90vh; overflow-y: auto;
          position: relative;
          box-shadow: 0 24px 80px rgba(74,44,14,0.25);
          animation: slide-up 0.25s cubic-bezier(0.34,1.1,0.64,1);
        }

        @keyframes slide-up {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        @media (max-width: 767px) {
          .mu-overlay { padding: 0; align-items: flex-end; }
          .mu-modal {
            border-radius: 20px 20px 0 0;
            max-height: 92vh; padding: 20px 16px;
          }
        }

        .mu-modal-close {
          position: absolute; top: 16px; right: 16px;
          width: 32px; height: 32px;
          background: var(--gray-light); border: none;
          border-radius: 50%; font-size: 20px; line-height: 1;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: var(--brown); transition: background 0.15s;
        }

        .mu-modal-close:hover { background: var(--orange); color: white; }
      `}</style>
    </div>
  )
}

// ── Ana sayfa ─────────────────────────────────────────────────────────────────

export default function MenuYonetimiPage() {
  const {
    items, loading, error, reload,
    create, update, remove, toggleActive, updateStock,
    uploadPhoto, deletePhoto,
  } = useMenu()

  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'all'>('all')
  const [showForm,        setShowForm]        = useState(false)
  const [editingItem,     setEditingItem]      = useState<MenuItem | null>(null)
  const [isSaving,        setIsSaving]         = useState(false)
  const [toast,           setToast]            = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleSave = async (data: Partial<MenuItem>, photos: string[]) => {
    setIsSaving(true)
    try {
      if (editingItem) {
        await update(editingItem.id, { ...data, photos })
        showToast('✅ Yemek güncellendi.')
      } else {
        await create({ ...data, photos })
        showToast('✅ Yemek menüye eklendi.')
      }
      setShowForm(false)
      setEditingItem(null)
    } catch (e: any) {
      showToast(e.message ?? 'Bir hata oluştu.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await remove(id)
      showToast('🗑️ Yemek silindi.')
    } catch (e: any) {
      showToast(e.message ?? 'Silinemedi.', 'error')
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await toggleActive(id)
    } catch (e: any) {
      showToast(e.message, 'error')
    }
  }

  const handleStockUpdate = async (id: string, stock: number) => {
    try {
      await updateStock(id, stock)
      showToast('📦 Stok güncellendi.')
    } catch {
      showToast('Stok güncellenemedi.', 'error')
    }
  }

  // ── Filtreleme ────────────────────────────────────────────────────────────

  const filtered = activeCategory === 'all'
    ? items
    : items.filter(i => i.category === activeCategory)

  const activeCount   = items.filter(i => i.is_active).length
  const inactiveCount = items.filter(i => !i.is_active).length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mu-page">

      {/* ── Başlık ── */}
      <div className="mu-header">
        <div>
          <h1 className="mu-title">Menü Yönetimi</h1>
          <div className="mu-subtitle">
            {activeCount} aktif · {inactiveCount} gizli · {items.length} toplam yemek
          </div>
        </div>
        <div className="mu-header-actions">
          <button
            className="mu-btn-secondary"
            onClick={reload}
            disabled={loading}
            type="button"
          >
            🔄 Yenile
          </button>
          <button
            className="mu-btn-primary"
            onClick={() => { setEditingItem(null); setShowForm(true) }}
            type="button"
          >
            + Yemek Ekle
          </button>
        </div>
      </div>

      {/* ── Kategori filtresi ── */}
      <div className="mu-filters">
        <button
          className={`mu-filter-chip ${activeCategory === 'all' ? 'mu-filter-chip--active' : ''}`}
          onClick={() => setActiveCategory('all')}
          type="button"
        >
          🍽️ Tümü ({items.length})
        </button>
        {CATEGORIES.map(([key, meta]) => {
          const count = items.filter(i => i.category === key).length
          if (count === 0) return null
          return (
            <button
              key={key}
              className={`mu-filter-chip ${activeCategory === key ? 'mu-filter-chip--active' : ''}`}
              onClick={() => setActiveCategory(key)}
              type="button"
            >
              {meta.emoji} {meta.label} ({count})
            </button>
          )
        })}
      </div>

      {/* ── İçerik ── */}
      {loading ? (
        <div className="mu-loading">
          <div className="mu-spinner" />
          <span>Menü yükleniyor…</span>
        </div>
      ) : error ? (
        <div className="mu-error">
          <div className="mu-error-icon">⚠️</div>
          <div>{error}</div>
          <button className="mu-btn-secondary" onClick={reload} type="button">Tekrar Dene</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mu-empty">
          <div className="mu-empty-icon">🍳</div>
          <div className="mu-empty-title">
            {items.length === 0 ? 'Henüz yemek eklemediniz' : 'Bu kategoride yemek yok'}
          </div>
          <div className="mu-empty-sub">
            {items.length === 0
              ? 'Menünüzü oluşturmak için ilk yemeğinizi ekleyin.'
              : 'Farklı bir kategori seçin veya yeni yemek ekleyin.'}
          </div>
          <button
            className="mu-btn-primary"
            onClick={() => { setEditingItem(null); setShowForm(true) }}
            type="button"
          >
            + İlk Yemeği Ekle
          </button>
        </div>
      ) : (
        <div className="mu-grid">
          {filtered.map(item => (
            <MenuCard
              key={item.id}
              item={item}
              onEdit={item => { setEditingItem(item); setShowForm(true) }}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onStockUpdate={handleStockUpdate}
            />
          ))}

          {/* Yeni yemek ekle kartı */}
          <button
            className="mu-add-card"
            onClick={() => { setEditingItem(null); setShowForm(true) }}
            type="button"
          >
            <div className="mu-add-icon">➕</div>
            <div className="mu-add-label">Yeni Yemek Ekle</div>
            <div className="mu-add-hint">Menünüzü genişletin</div>
          </button>
        </div>
      )}

      {/* ── Form modal ── */}
      {showForm && (
        <Modal onClose={() => { setShowForm(false); setEditingItem(null) }}>
          <h2 className="mu-modal-title">
            {editingItem ? `✏️ ${editingItem.name} — Düzenle` : '+ Yeni Yemek Ekle'}
          </h2>
          <MenuItemFormComponent
            initial={editingItem ?? undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null) }}
            uploadPhoto={(file, itemId) => uploadPhoto(file, itemId ?? editingItem?.id)}
            deletePhoto={(url, itemId) => deletePhoto(url, itemId ?? editingItem?.id)}
            isSaving={isSaving}
          />
        </Modal>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`mu-toast mu-toast--${toast.type}`} role="status" aria-live="polite">
          {toast.msg}
        </div>
      )}

      <style>{`
        .mu-page { padding: 28px 32px; max-width: 1280px; }

        @media (max-width: 767px) {
          .mu-page { padding: 0; }
        }

        /* ── Başlık ─────────────────── */
        .mu-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 20px; flex-wrap: wrap;
        }

        .mu-title {
          font-family: 'Playfair Display', serif;
          font-size: 24px; font-weight: 900; color: var(--brown);
          margin-bottom: 4px;
        }

        .mu-subtitle { font-size: 13px; color: var(--gray); }

        .mu-header-actions { display: flex; gap: 8px; flex-shrink: 0; }

        .mu-btn-primary {
          padding: 10px 18px;
          background: var(--orange); color: white;
          border: none; border-radius: 10px;
          font-size: 13.5px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .mu-btn-primary:hover { background: #d4541e; transform: translateY(-1px); }

        .mu-btn-secondary {
          padding: 10px 16px;
          background: var(--warm);
          border: 1.5px solid var(--gray-light);
          border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          color: var(--brown); transition: all 0.15s;
        }
        .mu-btn-secondary:hover { border-color: var(--orange); }
        .mu-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Filtreler ──────────────── */
        .mu-filters {
          display: flex; gap: 8px; flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .mu-filter-chip {
          padding: 7px 14px;
          border: 1.5px solid var(--gray-light);
          border-radius: 20px; font-size: 12px; font-weight: 600;
          background: var(--white); color: var(--gray);
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .mu-filter-chip:hover { border-color: var(--orange); color: var(--orange); }
        .mu-filter-chip--active {
          background: var(--orange); color: white; border-color: var(--orange);
        }

        /* ── Grid ───────────────────── */
        .mu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }

        @media (max-width: 767px) {
          .mu-grid { grid-template-columns: 1fr; }
        }

        /* ── Ekle kartı ─────────────── */
        .mu-add-card {
          background: var(--warm);
          border: 2px dashed var(--orange);
          border-radius: var(--radius);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 8px; min-height: 260px; cursor: pointer;
          transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .mu-add-card:hover { background: #FFF5EF; transform: translateY(-3px); }
        .mu-add-icon  { font-size: 36px; }
        .mu-add-label { font-weight: 700; font-size: 14px; color: var(--orange); }
        .mu-add-hint  { font-size: 12px; color: var(--gray); }

        /* ── Yükleniyor ─────────────── */
        .mu-loading {
          display: flex; align-items: center; gap: 12px;
          padding: 60px; justify-content: center;
          font-size: 14px; color: var(--gray);
        }

        .mu-spinner {
          width: 28px; height: 28px;
          border: 3px solid var(--gray-light);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Hata / boş ─────────────── */
        .mu-error, .mu-empty {
          text-align: center; padding: 60px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }

        .mu-error-icon, .mu-empty-icon { font-size: 48px; }
        .mu-empty-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--brown); }
        .mu-empty-sub { font-size: 13px; color: var(--gray); max-width: 320px; line-height: 1.6; }

        /* ── Modal başlık ─────────────── */
        .mu-modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 700; color: var(--brown);
          margin-bottom: 20px; padding-right: 40px;
        }

        /* ── Toast ──────────────────── */
        .mu-toast {
          position: fixed;
          bottom: calc(72px + env(safe-area-inset-bottom, 0px));
          left: 50%; transform: translateX(-50%);
          padding: 12px 22px;
          border-radius: 12px; font-size: 13.5px; font-weight: 700;
          box-shadow: var(--shadow-lg); z-index: 9999;
          white-space: nowrap;
          animation: toast-in 0.25s ease;
          font-family: 'DM Sans', sans-serif;
        }

        @keyframes toast-in {
          from { transform: translateX(-50%) translateY(16px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }

        .mu-toast--success { background: #ECFDF5; color: var(--green); border: 1px solid #A7F3D0; }
        .mu-toast--error   { background: #FEF2F2; color: #DC2626;      border: 1px solid #FECACA; }
      `}</style>
    </div>
  )
}
