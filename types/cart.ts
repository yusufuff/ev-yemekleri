/**
 * Sepet ve ödeme akışı için tip tanımları.
 */

// ── Sepet ────────────────────────────────────────────────────────────────────

export interface CartItem {
  menu_item_id:    string
  chef_id:         string
  chef_name:       string
  name:            string
  price:           number          // Anlık fiyat (eklendiği andaki)
  quantity:        number
  remaining_stock: number | null   // Stok kontrolü için
  category:        string
  photo?:          string
  note?:           string          // Kalem bazlı not
}

export interface CartState {
  items:    CartItem[]
  chef_id:  string | null          // Sepet tek aşçıya ait
}

// ── Kupon ────────────────────────────────────────────────────────────────────

export interface CouponValidation {
  valid:          boolean
  code:           string
  discount_type:  'percentage' | 'fixed'
  discount_value: number
  max_discount:   number | null
  description:    string
  error?:         string
}

// ── Checkout form ─────────────────────────────────────────────────────────────

export interface CheckoutForm {
  delivery_type: 'pickup' | 'delivery'
  address_id?:   string
  coupon_code?:  string
  credit_amount: number
  notes:         string
}

// ── Fiyat özeti ───────────────────────────────────────────────────────────────

export interface PriceSummary {
  subtotal:       number
  delivery_fee:   number
  discount:       number
  credit_used:    number
  total:          number
  platform_fee:   number   // Gösterim için (alıcı bilgi amaçlı)
  chef_earning:   number
}

// ── İyzico ödeme başlatma yanıtı ─────────────────────────────────────────────

export interface PaymentInitResponse {
  success:              boolean
  order_id:             string
  order_number:         string
  checkout_form_content: string   // İyzico'nun embed HTML'i
  token:                string    // İyzico token (doğrulama için)
  error?:               string
}

// ── Sipariş başarı sayfası ───────────────────────────────────────────────────

export interface OrderSuccess {
  order_id:      string
  order_number:  string
  chef_name:     string
  items_summary: string
  total:         number
  delivery_type: 'pickup' | 'delivery'
  estimated_min: number
  estimated_max: number
}
