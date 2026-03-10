/**
 * Keşif sayfası tip tanımları
 * find_nearby_chefs() SQL fonksiyonu dönüş tipiyle eşleşir.
 */

export type SortBy     = 'distance' | 'rating' | 'price'
export type MenuCategory = 'main' | 'soup' | 'dessert' | 'pastry' | 'salad'
export type DeliveryFilter = 'all' | 'delivery' | 'pickup'

export interface NearbyChef {
  chef_id:         string
  user_id:         string
  full_name:       string
  avatar_url:      string | null
  location_approx: string | null
  avg_rating:      number | null
  total_reviews:   number
  total_orders:    number
  badge:           'new' | 'trusted' | 'master' | 'chef' | null
  is_open:         boolean
  delivery_types:  ('pickup' | 'delivery')[]
  distance_km:     number
  min_price:       number | null
  menu_count:      number
  // Menü önizleme (API'nin eklediği)
  preview_items:   PreviewMenuItem[]
}

export interface PreviewMenuItem {
  id:              string
  name:            string
  price:           number
  category:        MenuCategory
  remaining_stock: number | null
  stock_status:    'ok' | 'low' | 'critical' | 'out_of_stock'
  photos:          string[]
}

export interface DiscoverFilters {
  lat:        number
  lng:        number
  radius_km:  number
  category?:  MenuCategory | null
  sort_by:    SortBy
  delivery:   DeliveryFilter
  open_only:  boolean
}

export interface DiscoverResult {
  chefs:       NearbyChef[]
  total:       number
  locationStr: string  // "Adana, Seyhan"
}

/** Harita pin için minimal veri */
export interface MapPin {
  chef_id:    string
  full_name:  string
  lat:        number
  lng:        number
  is_open:    boolean
  avg_rating: number | null
  distance_km: number
}
