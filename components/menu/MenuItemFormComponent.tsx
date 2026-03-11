// @ts-nocheck
'use client'

import { useState, useCallback } from 'react'
import { PhotoUploader } from './PhotoUploader'
import {
  CATEGORIES,
  ALLERGENS,
  EMPTY_FORM,
  validateForm,
  type MenuItemForm as FormData,
  type MenuItem,
  type FormError,
} from '@/types/menu'

interface MenuItemFormProps {
  initial?:   Partial<MenuItem>      // Düzenleme modunda mevcut değerler
  onSave:     (data: Partial<MenuItem>, photos: string[]) => Promise<void>
  onCancel:   () => void
  uploadPhoto: (file: File, itemId?: string) => Promise<string>
  deletePhoto: (url: string, itemId?: string) => Promise<void>
  isSaving?:  boolean
}

export function MenuItemFormComponent({
  initial,
  onSave,
  onCancel,
  uploadPhoto,
  deletePhoto,
  isSaving = false,
}: MenuItemFormProps) {
  // ── Form state ────────────────────────────────────────────────────────────

  const [form, setForm] = useState<FormData>({
    ...EMPTY_FORM,
    name:          initial?.name          ?? '',
    description:   initial?.description   ?? '',
    category:      initial?.category      ?? 'main',
    price:         initial?.price         != null ? String(initial.price) : '',
    daily_stock:   initial?.daily_stock   != null ? String(initial.daily_stock) : '10',
    prep_time_min: initial?.prep_time_min != null ? String(initial.prep_time_min) : '30',
    allergens:     initial?.allergens     ?? [],
    is_active:     initial?.is_active     ?? true,
  })

  const [photos,  setPhotos]  = useState<string[]>(initial?.photos ?? [])
  const [errors,  setErrors]  = useState<FormError[]>([])
  const [touched, setTouched] = useState<Set<string>>(new Set())

  // ── Helpers ───────────────────────────────────────────────────────────────

  const fieldError = (field: string) =>
    errors.find(e => e.field === field)?.message

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setTouched(prev => new Set(prev).add(field))
    }

  const toggleAllergen = (key: string) => {
    setForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(key)
        ? prev.allergens.filter(a => a !== key)
        : [...prev.allergens, key],
    }))
  }

  // ── Fotoğraf ──────────────────────────────────────────────────────────────

  const handleAddPhoto = useCallback(async (file: File): Promise<string> => {
    const url = await uploadPhoto(file, initial?.id)
    setPhotos(prev => [...prev, url])
    return url
  }, [uploadPhoto, initial?.id])

  const handleRemovePhoto = useCallback(async (url: string) => {
    await deletePhoto(url, initial?.id)
    setPhotos(prev => prev.filter(p => p !== url))
  }, [deletePhoto, initial?.id])

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errs = validateForm(form)
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])

    await onSave({
      name:          form.name.trim(),
      description:   form.description.trim(),
      category:      form.category,
      price:         parseFloat(form.price),
      daily_stock:   parseInt(form.daily_stock),
      prep_time_min: form.prep_time_min ? parseInt(form.prep_time_min) : undefined,
      allergens:     form.allergens,
      is_active:     form.is_active,
      photos,
    }, photos)
  }

  return (
    <form onSubmit={handleSubmit} className="mif-form" noValidate>

      {/* ── Genel hata ── */}
      {fieldError('general') && (
        <div className="mif-alert" role="alert">{fieldError('general')}</div>
      )}

      <div className="mif-grid">

        {/* ── Sol sütun ── */}
        <div className="mif-col">

          {/* Yemek adı */}
          <div className="mif-group">
            <label className="mif-label" htmlFor="name">
              Yemek Adı <span aria-hidden>*</span>
            </label>
            <input
              id="name"
              className={`mif-input ${fieldError('name') ? 'mif-input--error' : ''}`}
              value={form.name}
              onChange={set('name')}
              placeholder="Örn: Kuru Fasulye & Pilav"
              maxLength={80}
              aria-required
              aria-describedby={fieldError('name') ? 'name-err' : undefined}
            />
            {fieldError('name') && (
              <div id="name-err" className="mif-field-error">{fieldError('name')}</div>
            )}
            <div className="mif-char-count">{form.name.length}/80</div>
          </div>

          {/* Açıklama */}
          <div className="mif-group">
            <label className="mif-label" htmlFor="desc">Açıklama</label>
            <textarea
              id="desc"
              className="mif-input"
              value={form.description}
              onChange={set('description')}
              placeholder="Yemeğin içeriği, lezzet notu, özelliği…"
              rows={3}
              maxLength={500}
            />
            <div className="mif-char-count">{form.description.length}/500</div>
          </div>

          {/* Kategori */}
          <div className="mif-group">
            <label className="mif-label">Kategori *</label>
            <div className="mif-cat-grid">
              {CATEGORIES.map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  className={`mif-cat-btn ${form.category === key ? 'mif-cat-btn--active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, category: key }))}
                >
                  <span className="mif-cat-icon">{meta.emoji}</span>
                  <span className="mif-cat-label">{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Alerjenler */}
          <div className="mif-group">
            <label className="mif-label">Alerjenler</label>
            <div className="mif-allergen-grid">
              {ALLERGENS.map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  className={`mif-allergen-btn ${form.allergens.includes(key) ? 'mif-allergen-btn--active' : ''}`}
                  onClick={() => toggleAllergen(key)}
                  aria-pressed={form.allergens.includes(key)}
                >
                  {meta.emoji} {meta.label}
                </button>
              ))}
            </div>
            <div className="mif-hint">
              Seçilen alerjenler yemek kartında gösterilir.
              {form.allergens.length === 0 && ' Alerjen bulunmuyorsa boş bırakın.'}
            </div>
          </div>
        </div>

        {/* ── Sağ sütun ── */}
        <div className="mif-col">

          {/* Fiyat & Stok */}
          <div className="mif-row-2">
            <div className="mif-group">
              <label className="mif-label" htmlFor="price">Fiyat (₺) *</label>
              <div className="mif-input-wrap">
                <span className="mif-prefix">₺</span>
                <input
                  id="price"
                  className={`mif-input mif-input--prefix ${fieldError('price') ? 'mif-input--error' : ''}`}
                  type="number"
                  value={form.price}
                  onChange={set('price')}
                  placeholder="55"
                  min={1}
                  max={10000}
                  step={0.5}
                  aria-required
                />
              </div>
              {fieldError('price') && (
                <div className="mif-field-error">{fieldError('price')}</div>
              )}
            </div>

            <div className="mif-group">
              <label className="mif-label" htmlFor="stock">Günlük Stok *</label>
              <input
                id="stock"
                className={`mif-input ${fieldError('daily_stock') ? 'mif-input--error' : ''}`}
                type="number"
                value={form.daily_stock}
                onChange={set('daily_stock')}
                placeholder="10"
                min={0}
                max={9999}
              />
              {fieldError('daily_stock') && (
                <div className="mif-field-error">{fieldError('daily_stock')}</div>
              )}
            </div>
          </div>

          {/* Hazırlık süresi */}
          <div className="mif-group">
            <label className="mif-label" htmlFor="prep">Hazırlık Süresi (dakika)</label>
            <div className="mif-prep-btns">
              {[15, 20, 30, 45, 60].map(min => (
                <button
                  key={min}
                  type="button"
                  className={`mif-prep-btn ${form.prep_time_min === String(min) ? 'mif-prep-btn--active' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, prep_time_min: String(min) }))}
                >
                  {min} dk
                </button>
              ))}
              <input
                id="prep"
                className="mif-input mif-prep-custom"
                type="number"
                value={form.prep_time_min}
                onChange={set('prep_time_min')}
                placeholder="Özel"
                min={0}
                max={480}
              />
            </div>
          </div>

          {/* Aktif toggle */}
          <div className="mif-group">
            <div className="mif-toggle-row">
              <div>
                <div className="mif-label" style={{ marginBottom: 2 }}>Menüde Göster</div>
                <div className="mif-hint">
                  {form.is_active ? '✅ Alıcılar bu yemeği görebilir.' : '⏸️ Bu yemek gizli.'}
                </div>
              </div>
              <button
                type="button"
                className={`mif-toggle ${form.is_active ? 'mif-toggle--on' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                role="switch"
                aria-checked={form.is_active}
              />
            </div>
          </div>

          {/* Fotoğraf yükleyici */}
          <div className="mif-group">
            <div className="mif-label">Fotoğraflar</div>
            <PhotoUploader
              photos={photos}
              onAdd={handleAddPhoto}
              onRemove={handleRemovePhoto}
              onReorder={setPhotos}
              maxPhotos={5}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      {/* ── Butonlar ── */}
      <div className="mif-actions">
        <button
          type="button"
          className="mif-btn-cancel"
          onClick={onCancel}
          disabled={isSaving}
        >
          İptal
        </button>
        <button
          type="submit"
          className="mif-btn-save"
          disabled={isSaving}
          aria-busy={isSaving}
        >
          {isSaving
            ? '⏳ Kaydediliyor…'
            : initial?.id ? '💾 Değişiklikleri Kaydet' : '✅ Yemeği Ekle'}
        </button>
      </div>

      <style>{`
        .mif-form { display: flex; flex-direction: column; gap: 20px; }

        .mif-alert {
          background: #FEF2F2; border: 1px solid #FECACA;
          color: #DC2626; padding: 10px 14px; border-radius: 10px;
          font-size: 13px;
        }

        /* ── İki sütunlu grid ── */
        .mif-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 767px) {
          .mif-grid { grid-template-columns: 1fr; }
        }

        .mif-col { display: flex; flex-direction: column; gap: 16px; }

        /* ── Grup ── */
        .mif-group { display: flex; flex-direction: column; gap: 6px; }

        .mif-label {
          font-size: 12px; font-weight: 700;
          color: var(--brown-mid); letter-spacing: 0.2px;
        }

        .mif-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid var(--gray-light);
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          color: var(--brown);
          background: var(--white);
          transition: border-color 0.15s, box-shadow 0.15s;
          resize: vertical;
        }

        .mif-input:focus {
          outline: none;
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(232,98,42,0.1);
        }

        .mif-input--error {
          border-color: #DC2626;
          background: #FFF5F5;
        }

        .mif-input--prefix { padding-left: 28px; }

        .mif-input-wrap { position: relative; }
        .mif-prefix {
          position: absolute; left: 10px; top: 50%;
          transform: translateY(-50%);
          font-size: 13px; color: var(--gray); font-weight: 600;
        }

        .mif-field-error {
          font-size: 11.5px; color: #DC2626; margin-top: -2px;
        }

        .mif-char-count {
          font-size: 10px; color: var(--gray);
          text-align: right; margin-top: -2px;
        }

        .mif-hint {
          font-size: 11.5px; color: var(--gray); line-height: 1.5;
        }

        /* ── Kategori grid ── */
        .mif-cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 6px;
        }

        .mif-cat-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 4px; padding: 10px 6px;
          border: 1.5px solid var(--gray-light);
          border-radius: 10px; background: var(--white);
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }

        .mif-cat-btn:hover { border-color: var(--orange); background: #FFF5EF; }

        .mif-cat-btn--active {
          border-color: var(--orange);
          background: var(--orange);
          color: white;
        }

        .mif-cat-icon { font-size: 20px; }
        .mif-cat-label { font-size: 10px; font-weight: 700; text-align: center; }

        /* ── Alerjen grid ── */
        .mif-allergen-grid {
          display: flex; flex-wrap: wrap; gap: 6px;
        }

        .mif-allergen-btn {
          padding: 5px 10px;
          border: 1.5px solid var(--gray-light);
          border-radius: 20px;
          font-size: 12px; font-weight: 600;
          background: var(--white); cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
          color: var(--brown);
        }

        .mif-allergen-btn:hover { border-color: var(--orange); }

        .mif-allergen-btn--active {
          border-color: #DC2626;
          background: #FEF2F2;
          color: #DC2626;
        }

        /* ── İki kolonlu satır ── */
        .mif-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* ── Hazırlık süresi ── */
        .mif-prep-btns {
          display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
        }

        .mif-prep-btn {
          padding: 6px 12px;
          border: 1.5px solid var(--gray-light);
          border-radius: 8px; font-size: 12px; font-weight: 600;
          background: var(--white); cursor: pointer;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
          color: var(--brown);
        }

        .mif-prep-btn:hover { border-color: var(--orange); }
        .mif-prep-btn--active { background: var(--orange); color: white; border-color: var(--orange); }

        .mif-prep-custom { width: 70px; flex-shrink: 0; }

        /* ── Toggle ── */
        .mif-toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--warm); border-radius: 10px; padding: 12px 14px;
        }

        .mif-toggle {
          width: 44px; height: 24px;
          background: var(--gray-light);
          border-radius: 12px; position: relative;
          cursor: pointer; transition: background 0.2s;
          border: none; flex-shrink: 0;
        }

        .mif-toggle--on { background: var(--green); }

        .mif-toggle::after {
          content: '';
          width: 18px; height: 18px;
          background: white; border-radius: 50%;
          position: absolute; top: 3px; left: 3px;
          transition: left 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }

        .mif-toggle--on::after { left: 23px; }

        /* ── Butonlar ── */
        .mif-actions {
          display: flex; gap: 10px; justify-content: flex-end;
          border-top: 1px solid var(--gray-light);
          padding-top: 16px; margin-top: 4px;
        }

        .mif-btn-cancel {
          padding: 11px 20px;
          background: var(--warm);
          border: 1.5px solid var(--gray-light);
          border-radius: 10px; cursor: pointer;
          font-size: 13.5px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          color: var(--brown); transition: all 0.15s;
        }

        .mif-btn-cancel:hover { border-color: var(--brown); }

        .mif-btn-save {
          padding: 11px 24px;
          background: var(--orange); color: white;
          border: none; border-radius: 10px;
          cursor: pointer; font-size: 13.5px; font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }

        .mif-btn-save:hover:not(:disabled) {
          background: #d4541e;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(232,98,42,0.35);
        }

        .mif-btn-save:disabled {
          opacity: 0.65; cursor: not-allowed;
        }
      `}</style>
    </form>
  )
}
