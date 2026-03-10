/**
 * Menü yönetimi için tip tanımları.
 * database.ts'deki temel MenuItem tipini genişletir.
 */

import type { MenuItem, MenuCategory } from './database'

export type { MenuItem, MenuCategory }

// ── Kategori meta ─────────────────────────────────────────────────────────────

export const CATEGORY_META: Record<MenuCategory, { label: string; emoji: string }> = {
  main:    { label: 'Ana Yemek', emoji: '🍽️' },
  soup:    { label: 'Çorba',     emoji: '🥣' },
  dessert: { label: 'Tatlı',     emoji: '🍮' },
  pastry:  { label: 'Börek',     emoji: '🥐' },
  salad:   { label: 'Salata',    emoji: '🥗' },
}

export const CATEGORIES = Object.entries(CATEGORY_META) as [
  MenuCategory,
  { label: string; emoji: string }
][]

// ── Alerjen meta ──────────────────────────────────────────────────────────────

export const ALLERGEN_META: Record<string, { label: string; emoji: string }> = {
  gluten:    { label: 'Gluten',   emoji: '🌾' },
  dairy:     { label: 'Süt',      emoji: '🥛' },
  egg:       { label: 'Yumurta',  emoji: '🥚' },
  nut:       { label: 'Fındık',   emoji: '🥜' },
  fish:      { label: 'Balık',    emoji: '🐟' },
  shellfish: { label: 'Kabuklu',  emoji: '🦐' },
  soy:       { label: 'Soya',     emoji: '🫘' },
  sesame:    { label: 'Susam',    emoji: '🌱' },
}

export const ALLERGENS = Object.entries(ALLERGEN_META) as [
  string,
  { label: string; emoji: string }
][]

// ── Form tipi ─────────────────────────────────────────────────────────────────

export interface MenuItemForm {
  name:         string
  description:  string
  category:     MenuCategory
  price:        string          // string → parse edilecek
  daily_stock:  string
  prep_time_min: string
  allergens:    string[]
  is_active:    boolean
  // Porsiyon seçenekleri (opsiyonel)
  portions?: {
    label: string   // "Küçük" | "Orta" | "Büyük"
    price: string
  }[]
}

export const EMPTY_FORM: MenuItemForm = {
  name:          '',
  description:   '',
  category:      'main',
  price:         '',
  daily_stock:   '10',
  prep_time_min: '30',
  allergens:     [],
  is_active:     true,
  portions:      [],
}

// ── API tipleri ───────────────────────────────────────────────────────────────

export interface MenuListResponse {
  items: MenuItem[]
  total: number
}

export interface MenuItemResponse {
  item: MenuItem
}

export interface UploadPhotoResponse {
  url:  string
  path: string
}

// Stok güncelleme
export interface StockUpdatePayload {
  item_id:         string
  remaining_stock: number
}

// Validation hatası
export interface FormError {
  field:   keyof MenuItemForm | 'photos' | 'general'
  message: string
}

export function validateForm(form: MenuItemForm): FormError[] {
  const errors: FormError[] = []

  if (!form.name.trim())
    errors.push({ field: 'name', message: 'Yemek adı zorunludur.' })

  if (form.name.trim().length > 80)
    errors.push({ field: 'name', message: 'Yemek adı en fazla 80 karakter olabilir.' })

  const price = parseFloat(form.price)
  if (isNaN(price) || price <= 0)
    errors.push({ field: 'price', message: 'Geçerli bir fiyat girin.' })

  if (price > 10_000)
    errors.push({ field: 'price', message: 'Fiyat ₺10.000 üzerinde olamaz.' })

  const stock = parseInt(form.daily_stock)
  if (isNaN(stock) || stock < 0)
    errors.push({ field: 'daily_stock', message: 'Geçerli bir stok miktarı girin.' })

  if (stock > 9999)
    errors.push({ field: 'daily_stock', message: 'Stok 9999 üzerinde olamaz.' })

  const prep = parseInt(form.prep_time_min)
  if (!isNaN(prep) && (prep < 0 || prep > 480))
    errors.push({ field: 'prep_time_min', message: 'Hazırlık süresi 0–480 dk arası olmalıdır.' })

  return errors
}
