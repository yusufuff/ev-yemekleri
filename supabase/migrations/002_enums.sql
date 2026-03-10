-- ============================================================
-- 002_enums.sql
-- Tüm platform enum tipleri — merkezi tanım
-- ============================================================

-- Kullanıcı rolleri
CREATE TYPE user_role AS ENUM ('buyer', 'chef', 'admin');

-- Aşçı rozet seviyeleri (sipariş sayısına göre otomatik güncellenir)
CREATE TYPE chef_badge AS ENUM ('new', 'trusted', 'master', 'chef');

-- Aşçı başvuru durumu
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Sipariş durumları (akış sırası önemli)
CREATE TYPE order_status AS ENUM (
  'pending',    -- Aşçı onayı bekleniyor
  'confirmed',  -- Aşçı onayladı
  'preparing',  -- Hazırlanıyor
  'ready',      -- Hazır (gel-al için)
  'on_way',     -- Yolda (teslimat için)
  'delivered',  -- Teslim edildi
  'cancelled'   -- İptal edildi
);

-- Ödeme durumu
CREATE TYPE payment_status AS ENUM (
  'pending',        -- Ödeme başlatıldı
  'paid',           -- Ödeme alındı
  'refunded',       -- Tam iade
  'partial_refund'  -- Kısmi iade
);

-- Teslimat türü
CREATE TYPE delivery_type AS ENUM ('pickup', 'delivery');

-- Menü kategorisi
CREATE TYPE menu_category AS ENUM (
  'main',    -- Ana yemek
  'soup',    -- Çorba
  'dessert', -- Tatlı
  'pastry',  -- Börek / hamur işi
  'salad',   -- Salata / meze
  'drink'    -- İçecek
);

-- Ödeme transferi durumu
CREATE TYPE payout_status AS ENUM (
  'pending',    -- Talep oluşturuldu
  'processing', -- İyzico işliyor
  'completed',  -- Aktarıldı
  'failed'      -- Başarısız
);

-- Belge tipi (kimlik doğrulama)
CREATE TYPE document_type AS ENUM (
  'id_front',       -- TC kimlik ön
  'id_back',        -- TC kimlik arka
  'kitchen_photo',  -- Mutfak fotoğrafı
  'certificate',    -- Sertifika
  'other'
);

-- İndirim tipi (kupon)
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- Bildirim tipi
CREATE TYPE notification_type AS ENUM (
  'new_order',        -- Aşçıya: yeni sipariş
  'order_confirmed',  -- Alıcıya: sipariş onaylandı
  'order_preparing',  -- Alıcıya: hazırlanıyor
  'order_ready',      -- Alıcıya: hazır
  'order_on_way',     -- Alıcıya: yolda
  'order_delivered',  -- Alıcıya: teslim edildi
  'order_cancelled',  -- Her iki tarafa
  'new_review',       -- Aşçıya: yeni yorum
  'payout_completed', -- Aşçıya: ödeme yapıldı
  'low_stock',        -- Aşçıya: stok azaldı
  'chef_opened',      -- Alıcıya: favori aşçı açıldı
  'promo',            -- Kampanya
  'system'            -- Sistem bildirimi
);
