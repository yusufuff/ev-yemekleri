-- ============================================================
-- 009_views.sql
-- API sorgularını basitleştiren view'lar
-- Bu view'lar Next.js API route'larında doğrudan kullanılır
-- ============================================================


-- ═══════════════════════════════════════════════════════════════
-- VIEW 1: chef_public_profiles
-- Keşif sayfası ve profil sayfası için aşçı kartı bilgileri
-- Hassas bilgiler (IBAN, belge detayları) hariç tutulur
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.chef_public_profiles AS
SELECT
  cp.id               AS chef_id,
  cp.user_id,
  u.full_name,
  u.avatar_url,
  cp.bio,
  cp.location_approx,
  cp.address_city,
  cp.address_district,
  cp.delivery_radius_km,
  cp.delivery_types,
  cp.min_order_amount,
  cp.working_hours,
  cp.is_open,
  cp.vacation_until,
  cp.avg_rating,
  cp.total_reviews,
  cp.total_orders,
  cp.badge,
  cp.verified_at,
  -- Bugünkü aktif menü sayısı (stoklu)
  COALESCE((
    SELECT COUNT(*)
    FROM public.menu_items mi
    WHERE mi.chef_id = cp.id
      AND mi.is_active = true
      AND mi.remaining_stock > 0
  ), 0) AS active_menu_count,
  -- Mutfak kategorileri (benzersiz)
  ARRAY(
    SELECT DISTINCT mi.category::TEXT
    FROM public.menu_items mi
    WHERE mi.chef_id = cp.id AND mi.is_active = true
    ORDER BY 1
  ) AS cuisine_types
FROM public.chef_profiles cp
JOIN public.users u ON u.id = cp.user_id
WHERE cp.verification_status = 'approved'
  AND u.is_active = true;

-- RLS: Herkese açık
ALTER VIEW public.chef_public_profiles OWNER TO authenticated;
GRANT SELECT ON public.chef_public_profiles TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════
-- VIEW 2: menu_items_with_chef
-- Yemek detay sayfası ve keşif kartları için
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.menu_items_with_chef AS
SELECT
  mi.id,
  mi.chef_id,
  mi.name,
  mi.description,
  mi.category,
  mi.price,
  mi.daily_stock,
  mi.remaining_stock,
  mi.allergens,
  mi.prep_time_min,
  mi.photos,
  mi.is_active,
  mi.created_at,
  -- Stok durumu hesapla
  CASE
    WHEN mi.remaining_stock = 0               THEN 'out_of_stock'
    WHEN mi.remaining_stock <= 2              THEN 'critical'
    WHEN mi.remaining_stock::FLOAT / NULLIF(mi.daily_stock, 0) <= 0.3 THEN 'low'
    ELSE 'ok'
  END AS stock_status,
  -- Stok yüzdesi
  CASE
    WHEN mi.daily_stock > 0
    THEN ROUND((mi.remaining_stock::NUMERIC / mi.daily_stock) * 100)
    ELSE 0
  END AS stock_pct,
  -- Aşçı özet bilgileri
  cp.id           AS chef_profile_id,
  u.full_name     AS chef_name,
  u.avatar_url    AS chef_avatar,
  cp.avg_rating   AS chef_rating,
  cp.badge        AS chef_badge,
  cp.is_open      AS chef_is_open,
  cp.address_district,
  cp.address_city
FROM public.menu_items mi
JOIN public.chef_profiles cp ON cp.id = mi.chef_id
JOIN public.users u ON u.id = cp.user_id
WHERE cp.verification_status = 'approved'
  AND u.is_active = true;

GRANT SELECT ON public.menu_items_with_chef TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════
-- VIEW 3: order_summary
-- Sipariş listesi (hem alıcı hem aşçı paneli için)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.order_summary AS
SELECT
  o.id,
  o.order_number,
  o.buyer_id,
  o.chef_id,
  o.status,
  o.delivery_type,
  o.subtotal,
  o.discount_amount,
  o.total_amount,
  o.platform_fee,
  o.chef_earning,
  o.payment_status,
  o.delivery_address,
  o.special_note,
  o.estimated_ready_at,
  o.created_at,
  o.confirmed_at,
  o.preparing_at,
  o.ready_at,
  o.on_way_at,
  o.delivered_at,
  o.cancelled_at,
  -- Alıcı bilgileri
  bu.full_name    AS buyer_name,
  bu.phone        AS buyer_phone,
  bu.avatar_url   AS buyer_avatar,
  -- Aşçı bilgileri
  cu.full_name    AS chef_name,
  cu.phone        AS chef_phone,
  cp.address_district AS chef_district,
  -- Sipariş yaşı (dakika)
  EXTRACT(EPOCH FROM (NOW() - o.created_at)) / 60 AS age_minutes,
  -- Ürün özeti (ilk 3 ürün)
  (
    SELECT STRING_AGG(oi.item_name || ' ×' || oi.quantity, ', ' ORDER BY oi.created_at)
    FROM public.order_items oi
    WHERE oi.order_id = o.id
    LIMIT 3
  ) AS items_summary,
  -- Yorum yapıldı mı?
  EXISTS(
    SELECT 1 FROM public.reviews r
    WHERE r.order_id = o.id
  ) AS has_review
FROM public.orders o
JOIN public.users bu   ON bu.id = o.buyer_id
JOIN public.chef_profiles cp ON cp.id = o.chef_id
JOIN public.users cu   ON cu.id = cp.user_id;

-- RLS uygulanmaz, API route'lar WHERE buyer_id/chef_id filtresi ekler
GRANT SELECT ON public.order_summary TO authenticated;


-- ═══════════════════════════════════════════════════════════════
-- VIEW 4: chef_dashboard_stats
-- Aşçı paneli dashboard için günlük/haftalık istatistikler
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.chef_dashboard_stats AS
SELECT
  cp.id                           AS chef_id,
  cp.user_id,
  cp.is_open,
  cp.avg_rating,
  cp.total_reviews,
  cp.total_orders,
  cp.badge,
  -- Bugünkü siparişler
  COUNT(o.id) FILTER (
    WHERE o.created_at >= CURRENT_DATE
  )                               AS today_order_count,
  -- Bugünkü kazanç
  COALESCE(SUM(o.chef_earning) FILTER (
    WHERE o.delivered_at >= CURRENT_DATE
      AND o.status = 'delivered'
  ), 0)                           AS today_earning,
  -- Bekleyen sipariş
  COUNT(o.id) FILTER (
    WHERE o.status = 'pending'
  )                               AS pending_count,
  -- Aktif sipariş (hazırlık + yolda)
  COUNT(o.id) FILTER (
    WHERE o.status IN ('confirmed', 'preparing', 'ready', 'on_way')
  )                               AS active_count,
  -- Bu haftaki kazanç
  COALESCE(SUM(o.chef_earning) FILTER (
    WHERE o.delivered_at >= DATE_TRUNC('week', CURRENT_DATE)
      AND o.status = 'delivered'
  ), 0)                           AS week_earning,
  -- Bu ayki kazanç
  COALESCE(SUM(o.chef_earning) FILTER (
    WHERE o.delivered_at >= DATE_TRUNC('month', CURRENT_DATE)
      AND o.status = 'delivered'
  ), 0)                           AS month_earning,
  -- Bekleyen bakiye (ödeme yapılmamış)
  COALESCE(SUM(o.chef_earning) FILTER (
    WHERE o.status = 'delivered'
      AND o.payment_status = 'paid'
      AND NOT EXISTS (
        SELECT 1 FROM public.payouts p
        WHERE p.chef_id = cp.id
          AND p.status = 'completed'
          AND p.period_end >= o.delivered_at
      )
  ), 0)                           AS pending_balance,
  -- Cevaplanmamış yorum sayısı
  (
    SELECT COUNT(*) FROM public.reviews r
    WHERE r.chef_id = cp.id
      AND r.reply IS NULL
      AND r.is_visible = true
      AND r.created_at >= NOW() - INTERVAL '30 days'
  )                               AS unanswered_reviews
FROM public.chef_profiles cp
LEFT JOIN public.orders o ON o.chef_id = cp.id
GROUP BY cp.id, cp.user_id, cp.is_open, cp.avg_rating,
         cp.total_reviews, cp.total_orders, cp.badge;

GRANT SELECT ON public.chef_dashboard_stats TO authenticated;


-- ═══════════════════════════════════════════════════════════════
-- VIEW 5: unread_message_counts
-- Mesajlaşma paneli için okunmamış mesaj sayıları
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.unread_message_counts AS
SELECT
  m.recipient_id                          AS user_id,
  m.order_id,
  COUNT(*)                                AS unread_count,
  MAX(m.created_at)                       AS last_message_at,
  (ARRAY_AGG(m.content ORDER BY m.created_at DESC))[1] AS last_message
FROM public.messages m
WHERE m.is_read = false
GROUP BY m.recipient_id, m.order_id;

GRANT SELECT ON public.unread_message_counts TO authenticated;


-- ═══════════════════════════════════════════════════════════════
-- VIEW 6: chef_earnings_by_day
-- Aşçı kazanç grafiği için (son 30 gün)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.chef_earnings_by_day AS
SELECT
  o.chef_id,
  DATE(o.delivered_at)   AS day,
  COUNT(*)               AS order_count,
  SUM(o.chef_earning)    AS earning,
  SUM(o.total_amount)    AS gross_amount
FROM public.orders o
WHERE o.status = 'delivered'
  AND o.delivered_at >= NOW() - INTERVAL '30 days'
GROUP BY o.chef_id, DATE(o.delivered_at)
ORDER BY day DESC;

GRANT SELECT ON public.chef_earnings_by_day TO authenticated;


-- ═══════════════════════════════════════════════════════════════
-- MATERIALIZED VIEW: popular_menu_items
-- Ana sayfa "Bugünkü Popüler Menüler" için (her saat yenilenir)
-- ═══════════════════════════════════════════════════════════════
CREATE MATERIALIZED VIEW IF NOT EXISTS public.popular_menu_items AS
SELECT
  mi.id,
  mi.chef_id,
  mi.name,
  mi.category,
  mi.price,
  mi.remaining_stock,
  mi.allergens,
  mi.photos,
  mi.prep_time_min,
  cp.avg_rating,
  cp.badge,
  cp.address_city,
  cp.address_district,
  u.full_name   AS chef_name,
  u.avatar_url  AS chef_avatar,
  -- Popülerlik skoru: son 7 gün sipariş sayısı
  COALESCE((
    SELECT SUM(oi.quantity)
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.menu_item_id = mi.id
      AND o.created_at >= NOW() - INTERVAL '7 days'
      AND o.status NOT IN ('cancelled')
  ), 0) AS weekly_orders
FROM public.menu_items mi
JOIN public.chef_profiles cp ON cp.id = mi.chef_id
JOIN public.users u ON u.id = cp.user_id
WHERE mi.is_active = true
  AND mi.remaining_stock > 0
  AND cp.is_open = true
  AND cp.verification_status = 'approved'
  AND (cp.vacation_until IS NULL OR cp.vacation_until < NOW())
ORDER BY weekly_orders DESC, cp.avg_rating DESC;

-- Benzersiz index (refresh için gerekli)
CREATE UNIQUE INDEX popular_menu_items_id_idx ON public.popular_menu_items (id);

GRANT SELECT ON public.popular_menu_items TO anon, authenticated;

-- Materialized view yenileme fonksiyonu (cron'dan çağrılır)
CREATE OR REPLACE FUNCTION public.refresh_popular_menu_items()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.popular_menu_items;
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- VIEW 7: admin_overview
-- Admin paneli genel istatistikler
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.admin_overview AS
SELECT
  -- Kullanıcı istatistikleri
  (SELECT COUNT(*) FROM public.users WHERE role = 'buyer' AND is_active) AS active_buyers,
  (SELECT COUNT(*) FROM public.users WHERE role = 'chef'  AND is_active) AS active_chefs,
  (SELECT COUNT(*) FROM public.users WHERE created_at >= CURRENT_DATE)   AS new_users_today,
  -- Aşçı onay bekleyenler
  (SELECT COUNT(*) FROM public.chef_profiles WHERE verification_status = 'pending') AS pending_verifications,
  -- Sipariş istatistikleri
  (SELECT COUNT(*) FROM public.orders WHERE status = 'pending')          AS pending_orders,
  (SELECT COUNT(*) FROM public.orders WHERE created_at >= CURRENT_DATE)  AS orders_today,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders
   WHERE status = 'delivered' AND delivered_at >= CURRENT_DATE)          AS gmv_today,
  (SELECT COALESCE(SUM(platform_fee), 0) FROM public.orders
   WHERE status = 'delivered' AND delivered_at >= CURRENT_DATE)          AS revenue_today,
  -- Ödeme bekleyenler
  (SELECT COUNT(*) FROM public.payouts WHERE status IN ('pending','processing')) AS pending_payouts,
  (SELECT COALESCE(SUM(amount), 0) FROM public.payouts
   WHERE status = 'pending')                                              AS pending_payout_amount,
  -- Uyuşmazlıklar
  (SELECT COUNT(*) FROM public.disputes WHERE status IN ('open','investigating')) AS open_disputes,
  -- Blog onay bekleyenler
  (SELECT COUNT(*) FROM public.blog_posts WHERE status = 'pending')      AS pending_blog_posts;

GRANT SELECT ON public.admin_overview TO authenticated;
