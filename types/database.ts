/**
 * Supabase veritabanı type tanımları.
 * Gerçek projede: `npm run db:types` komutu ile otomatik üretilir.
 * Şimdilik backend mimari dökümanındaki şemaya göre elle yazıldı.
 */

export type UserRole = 'buyer' | 'chef' | 'admin'

export type ChefBadge = 'new' | 'trusted' | 'master' | 'chef'

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'on_way'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partial_refund'

export type DeliveryType = 'pickup' | 'delivery'

export type MenuCategory = 'main' | 'soup' | 'dessert' | 'pastry' | 'salad'

// ─── Tablo Satır Tipleri ──────────────────────────────────────────────────────

export interface User {
  id:               string
  full_name:        string
  phone:            string
  role:             UserRole
  avatar_url:       string | null
  fcm_token:        string | null
  platform_credit:  number
  is_active:        boolean
  created_at:       string
}

export interface ChefProfile {
  id:                       string
  user_id:                  string
  bio:                      string | null
  location:                 unknown          // PostGIS geography — raw
  location_approx:          string | null    // Alıcıya gösterilen semt adı
  delivery_radius_km:       number
  delivery_types:           DeliveryType[]
  is_open:                  boolean
  vacation_until:           string | null
  avg_rating:               number | null
  total_orders:             number
  badge:                    ChefBadge | null
  iban:                     string | null    // pgcrypto ile şifreli
  iyzico_sub_merchant_key:  string | null
  verification_status:      VerificationStatus
  working_hours:            WorkingHours | null
}

export interface WorkingHours {
  mon?: { open: string; close: string } | null
  tue?: { open: string; close: string } | null
  wed?: { open: string; close: string } | null
  thu?: { open: string; close: string } | null
  fri?: { open: string; close: string } | null
  sat?: { open: string; close: string } | null
  sun?: { open: string; close: string } | null
}

export interface MenuItem {
  id:              string
  chef_id:         string
  name:            string
  description:     string | null
  price:           number
  daily_stock:     number | null
  remaining_stock: number | null
  category:        MenuCategory
  allergens:       string[]
  prep_time_min:   number | null
  is_active:       boolean
  photos:          string[]
  created_at:      string
}

export interface Order {
  id:                string
  order_number:      string
  buyer_id:          string
  chef_id:           string
  status:            OrderStatus
  delivery_type:     DeliveryType
  subtotal:          number
  platform_fee:      number
  chef_earning:      number
  payment_status:    PaymentStatus
  iyzico_payment_id: string | null
  delivery_address:  DeliveryAddress | null
  coupon_code:       string | null
  credit_used:       number
  notes:             string | null
  confirmed_at:      string | null
  delivered_at:      string | null
  created_at:        string
}

export interface DeliveryAddress {
  label:        string
  full_address: string
  district:     string
  city:         string
  lat:          number
  lng:          number
}

export interface OrderItem {
  id:          string
  order_id:    string
  menu_item_id:string
  name:        string    // Sipariş anındaki isim snapshot
  price:       number    // Sipariş anındaki fiyat snapshot
  quantity:    number
}

export interface Review {
  id:          string
  order_id:    string
  buyer_id:    string
  chef_id:     string
  rating:      1 | 2 | 3 | 4 | 5
  comment:     string | null
  chef_reply:  string | null
  replied_at:  string | null
  created_at:  string
}

export interface Message {
  id:          string
  order_id:    string
  sender_id:   string
  content:     string
  is_read:     boolean
  created_at:  string
}

export interface Address {
  id:           string
  user_id:      string
  label:        string         // 'home' | 'work' | 'other'
  full_address: string
  district:     string
  city:         string
  lat:          number
  lng:          number
  door_code:    string | null
  directions:   string | null
  is_default:   boolean
  created_at:   string
}

export interface Coupon {
  id:               string
  code:             string
  discount_type:    'percentage' | 'fixed'
  discount_value:   number
  min_order_amount: number | null
  max_uses:         number | null
  used_count:       number
  expires_at:       string | null
  is_active:        boolean
  created_at:       string
}

export interface Payout {
  id:          string
  chef_id:     string
  amount:      number
  iban_last4:  string
  status:      'pending' | 'processing' | 'completed' | 'failed'
  iyzico_ref:  string | null
  requested_at:string
  completed_at:string | null
}

// ─── API Response Tipleri ─────────────────────────────────────────────────────

/** Keşif sayfasında listelenen aşçı (mesafe dahil) */
export interface ChefWithDistance extends ChefProfile {
  distance_km: number
  user:         Pick<User, 'id' | 'full_name' | 'avatar_url'>
  menu_items:   MenuItem[]
}

/** Sipariş detay (ilişkili verilerle) */
export interface OrderWithDetails extends Order {
  items:  OrderItem[]
  buyer:  Pick<User, 'id' | 'full_name' | 'phone' | 'avatar_url'>
  chef:   ChefProfile & { user: Pick<User, 'full_name' | 'avatar_url'> }
  review: Review | null
}

// ─── Supabase Database tip wrapper ───────────────────────────────────────────
// `supabase gen types` çalıştırılınca bu dosyanın tamamı otomatik üretilir.
export type Database = {
  public: {
    Tables: {
      users:          { Row: User }
      chef_profiles:  { Row: ChefProfile }
      menu_items:     { Row: MenuItem }
      orders:         { Row: Order }
      order_items:    { Row: OrderItem }
      reviews:        { Row: Review }
      messages:       { Row: Message }
      addresses:      { Row: Address }
      coupons:        { Row: Coupon }
      payouts:        { Row: Payout }
    }
  }
}
