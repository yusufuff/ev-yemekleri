// @ts-nocheck
'use client'

import { useState, useRef, useCallback, useId } from 'react'

interface PhotoUploaderProps {
  photos:        string[]           // Mevcut URL'ler
  onAdd:         (file: File) => Promise<string>   // URL döndürür
  onRemove:      (url: string) => void
  onReorder?:    (photos: string[]) => void
  maxPhotos?:    number
  disabled?:     boolean
}

const MAX_SIZE = 5 * 1024 * 1024  // 5 MB

export function PhotoUploader({
  photos,
  onAdd,
  onRemove,
  onReorder,
  maxPhotos = 5,
  disabled  = false,
}: PhotoUploaderProps) {
  const inputId      = useId()
  const inputRef     = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState<string[]>([]) // yüklenen dosya adları
  const [error, setError]   = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null) // sıralama için

  // ── Dosya doğrulama ──────────────────────────────────────────────────────

  function validate(file: File): string | null {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      return 'Yalnızca JPEG, PNG veya WEBP yükleyebilirsiniz.'
    if (file.size > MAX_SIZE)
      return `Dosya boyutu 5 MB'ı geçemez (${(file.size / 1024 / 1024).toFixed(1)} MB).'`
    if (photos.length + uploading.length >= maxPhotos)
      return `En fazla ${maxPhotos} fotoğraf eklenebilir.`
    return null
  }

  // ── Yükleme ───────────────────────────────────────────────────────────────

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null)
    const arr = Array.from(files)

    for (const file of arr) {
      const err = validate(file)
      if (err) { setError(err); continue }

      setUploading(prev => [...prev, file.name])
      try {
        await onAdd(file)
      } catch (e: any) {
        setError(e.message ?? 'Yükleme başarısız.')
      } finally {
        setUploading(prev => prev.filter(n => n !== file.name))
      }
    }
  }, [onAdd, photos.length, uploading.length, maxPhotos])

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    handleFiles(e.dataTransfer.files)
  }, [disabled, handleFiles])

  // ── Sıralama (basit swap) ─────────────────────────────────────────────────

  const onDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('text/plain', String(idx))
  }

  const onDropPhoto = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    const srcIdx = parseInt(e.dataTransfer.getData('text/plain'))
    if (isNaN(srcIdx) || srcIdx === targetIdx) return

    const next = [...photos]
    const [moved] = next.splice(srcIdx, 1)
    next.splice(targetIdx, 0, moved)
    onReorder?.(next)
    setDragOver(null)
  }

  const canAdd = photos.length + uploading.length < maxPhotos && !disabled

  return (
    <div className="pu-wrap">

      {/* ── Fotoğraf ızgarası ── */}
      {photos.length > 0 && (
        <div className="pu-grid">
          {photos.map((url, i) => (
            <div
              key={url}
              className={`pu-photo ${dragOver === i ? 'pu-photo--dragover' : ''}`}
              draggable={!!onReorder}
              onDragStart={e => onDragStart(e, i)}
              onDragOver={e => { e.preventDefault(); setDragOver(i) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => onDropPhoto(e, i)}
            >
              {/* Kapak rozeti */}
              {i === 0 && (
                <div className="pu-cover-badge">Kapak</div>
              )}

              <img src={url} alt={`Fotoğraf ${i + 1}`} className="pu-img" />

              {/* Sil butonu */}
              {!disabled && (
                <button
                  className="pu-remove"
                  onClick={() => onRemove(url)}
                  aria-label="Fotoğrafı kaldır"
                  type="button"
                >
                  ×
                </button>
              )}

              {/* Sıra numarası */}
              {onReorder && (
                <div className="pu-order">⠿ {i + 1}</div>
              )}
            </div>
          ))}

          {/* Yükleniyor göstergeleri */}
          {uploading.map(name => (
            <div key={name} className="pu-photo pu-uploading">
              <div className="pu-spinner" />
              <div className="pu-uploading-name">{name.slice(0, 12)}…</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Drop zone ── */}
      {canAdd && (
        <label
          htmlFor={inputId}
          className={`pu-dropzone ${dragging ? 'pu-dropzone--active' : ''}`}
          onDragEnter={e => { e.preventDefault(); setDragging(true) }}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          aria-label="Fotoğraf yükle"
        >
          <div className="pu-dz-icon">📷</div>
          <div className="pu-dz-title">
            {dragging ? 'Bırakın!' : 'Fotoğraf Ekle'}
          </div>
          <div className="pu-dz-hint">
            Tıkla veya sürükle bırak<br/>
            JPEG / PNG / WEBP · Maks. 5 MB<br/>
            <strong>{photos.length}/{maxPhotos}</strong> fotoğraf
          </div>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={e => e.target.files && handleFiles(e.target.files)}
            disabled={disabled}
            aria-hidden
          />
        </label>
      )}

      {/* ── Hata mesajı ── */}
      {error && (
        <div className="pu-error" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* ── Yükleme durumu ── */}
      {uploading.length > 0 && (
        <div className="pu-status">
          ⏳ {uploading.length} fotoğraf yükleniyor…
        </div>
      )}

      {/* ── Yardım notu ── */}
      {onReorder && photos.length > 1 && (
        <div className="pu-reorder-hint">
          💡 İlk fotoğraf kapak görseli olarak kullanılır. Sürükleyerek sıralayın.
        </div>
      )}

      <style>{`
        .pu-wrap { display: flex; flex-direction: column; gap: 10px; }

        /* ── Izgara ─────────────── */
        .pu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
        }

        .pu-photo {
          position: relative;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid transparent;
          transition: all 0.2s;
          cursor: grab;
          background: var(--warm);
        }

        .pu-photo--dragover {
          border-color: var(--orange);
          transform: scale(1.04);
        }

        .pu-img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }

        .pu-cover-badge {
          position: absolute;
          top: 4px; left: 4px;
          background: var(--orange);
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          z-index: 2;
          letter-spacing: 0.3px;
        }

        .pu-remove {
          position: absolute;
          top: 4px; right: 4px;
          width: 22px; height: 22px;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          z-index: 2;
          line-height: 1;
          transition: background 0.15s;
        }

        .pu-remove:hover { background: #DC2626; }

        .pu-order {
          position: absolute;
          bottom: 4px; left: 4px;
          font-size: 9px;
          color: rgba(255,255,255,0.9);
          background: rgba(0,0,0,0.45);
          padding: 2px 5px;
          border-radius: 4px;
        }

        /* ── Yükleniyor placeholder ── */
        .pu-uploading {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 6px;
          background: var(--cream);
          border: 2px dashed var(--gray-light);
        }

        .pu-spinner {
          width: 24px; height: 24px;
          border: 3px solid var(--gray-light);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .pu-uploading-name {
          font-size: 9px; color: var(--gray);
          text-align: center; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
          max-width: 80px;
        }

        /* ── Drop zone ──────────── */
        .pu-dropzone {
          border: 2px dashed var(--gray-light);
          border-radius: 12px;
          padding: 24px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: var(--white);
        }

        .pu-dropzone:hover,
        .pu-dropzone--active {
          border-color: var(--orange);
          background: #FFF5EF;
        }

        .pu-dz-icon { font-size: 28px; }

        .pu-dz-title {
          font-weight: 700; font-size: 13px;
          color: var(--brown);
        }

        .pu-dz-hint {
          font-size: 11px;
          color: var(--gray);
          line-height: 1.6;
        }

        /* ── Mesajlar ─────────────── */
        .pu-error {
          font-size: 12px;
          color: #DC2626;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          padding: 8px 12px;
        }

        .pu-status {
          font-size: 12px;
          color: var(--brown-mid);
          background: var(--warm);
          border-radius: 8px;
          padding: 8px 12px;
        }

        .pu-reorder-hint {
          font-size: 11px;
          color: var(--gray);
          padding: 0 2px;
        }
      `}</style>
    </div>
  )
}
