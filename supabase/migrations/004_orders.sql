-- ============================================================
-- 004_orders.sql
-- Sipariş ve sipariş kalemi tabloları
-- ============================================================

-- ── orders ───────────────────────────────────────────────────
CREATE TABLE public.orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        TEXT NOT NULL UNIQUE, -- EV-2024-001234

  buyer_id            UUID NOT NULL REFERENCES public.users(id),
  chef_id             UUID NOT NULL REFERENCES public.chef_profiles(id),

  status              order_status NOT NULL DEFAULT 'pending',
  delivery_type       delivery_type NOT NULL,

  -- Tutar ayrıştırması
  subtotal            NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  credit_used         NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (credit_used >= 0),
  total_amount        NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  platform_fee        NUMERIC(10,2) NOT NULL DEFAULT 0, -- %10
  chef_earning        NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Ödeme
  payment_status      payment_status NOT NULL DEFAULT 'pending',
  iyzico_payment_id   TEXT,
  iyzico_token        TEXT,

  -- Kupon
  coupon_id           UUID REFERENCES public.coupons(id),
  coupon_code         TEXT,

  -- Adres (sipariş anında snapshot — adres sonradan silinse bile kayıt kalır)
  delivery_address    JSONB,
  -- {"label":"Ev","full_address":"...","district":"Seyhan","city":"Adana","lat":37.0,"lng":35.3}

  -- İletişim
  notes               TEXT,                      -- Müşteri notu
  cancellation_reason TEXT,

  -- Zaman damgaları
  confirmed_at        TIMESTAMPTZ,
  preparing_at        TIMESTAMPTZ,
  ready_at            TIMESTAMPTZ,
  on_way_at           TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sık sorgulanan index'ler
CREATE INDEX orders_buyer_idx       ON public.orders (buyer_id, created_at DESC);
CREATE INDEX orders_chef_idx        ON public.orders (chef_id, created_at DESC);
CREATE INDEX orders_status_idx      ON public.orders (status) WHERE status NOT IN ('delivered','cancelled');
CREATE INDEX orders_number_idx      ON public.orders (order_number);
CREATE INDEX orders_payment_idx     ON public.orders (iyzico_payment_id) WHERE iyzico_payment_id IS NOT NULL;

-- ── order_items ───────────────────────────────────────────────
-- Sipariş kalemleri — menu_item snapshot'ı
-- (Menü fiyatı değişse bile eski sipariş doğru fiyatı gösterir)
CREATE TABLE public.order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id    UUID REFERENCES public.menu_items(id) ON DELETE SET NULL, -- Menü silinse bile kalemi koru

  -- Sipariş anındaki değerler (snapshot)
  item_name       TEXT NOT NULL,
  item_price      NUMERIC(10,2) NOT NULL CHECK (item_price >= 0),
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  line_total      NUMERIC(10,2) GENERATED ALWAYS AS (item_price * quantity) STORED,

  notes           TEXT, -- Kalem bazlı not ("az acılı lütfen")
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX order_items_order_idx ON public.order_items (order_id);

-- ── coupons ───────────────────────────────────────────────────
-- Kupon tablosu — orders tablosu referans ettiğinden burada tanımlanmalı
-- (FK çözünürlüğü için ALTER TABLE ile eklenecek)
CREATE TABLE public.coupons (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code              TEXT NOT NULL UNIQUE,
  description       TEXT,

  discount_type     discount_type NOT NULL,
  discount_value    NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  max_discount      NUMERIC(10,2),              -- Yüzdesel indirimde tavan

  min_order_amount  NUMERIC(10,2) DEFAULT 0,
  max_uses          INTEGER,                    -- NULL = sınırsız
  used_count        INTEGER NOT NULL DEFAULT 0,
  per_user_limit    INTEGER DEFAULT 1,          -- Kişi başı kullanım

  -- Kısıtlamalar
  chef_id           UUID REFERENCES public.chef_profiles(id), -- Belirli aşçıya özel kupon
  first_order_only  BOOLEAN NOT NULL DEFAULT false,

  is_active         BOOLEAN NOT NULL DEFAULT true,
  valid_from        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until       TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX coupons_code_idx    ON public.coupons (code) WHERE is_active = true;
CREATE INDEX coupons_valid_idx   ON public.coupons (valid_until) WHERE is_active = true;

-- Kupon kullanım log'u (kişi başı limit kontrolü için)
CREATE TABLE public.coupon_usages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id  UUID NOT NULL REFERENCES public.coupons(id),
  user_id    UUID NOT NULL REFERENCES public.users(id),
  order_id   UUID NOT NULL REFERENCES public.orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, user_id, order_id)
);

-- Şimdi orders tablosuna FK ekle (coupons tablosu artık var)
ALTER TABLE public.orders
  ADD CONSTRAINT orders_coupon_fk FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);
