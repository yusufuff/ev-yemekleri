-- ============================================================
-- 003_core_tables.sql
-- Temel tablolar: users, chef_profiles, menu_items
-- ============================================================

-- ── users ────────────────────────────────────────────────────
-- auth.users'ı extend eder — Supabase Auth ile senkron çalışır
CREATE TABLE public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  phone            TEXT NOT NULL,
  role             user_role NOT NULL DEFAULT 'buyer',
  avatar_url       TEXT,
  fcm_token        TEXT,                          -- Firebase push token
  platform_credit  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (platform_credit >= 0),
  referral_code    TEXT UNIQUE,                   -- Benzersiz referans kodu
  referred_by      UUID REFERENCES public.users(id),
  is_active        BOOLEAN NOT NULL DEFAULT true, -- Admin banlama
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Telefon numarası benzersiz olmalı
CREATE UNIQUE INDEX users_phone_idx ON public.users (phone);

-- Arama için trigram index
CREATE INDEX users_name_trgm_idx ON public.users
  USING GIN (full_name gin_trgm_ops);

-- ── chef_profiles ─────────────────────────────────────────────
CREATE TABLE public.chef_profiles (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- Profil
  bio                       TEXT,
  kitchen_description       TEXT,              -- Mutfak hakkında

  -- Konum (PostGIS)
  location                  GEOGRAPHY(POINT, 4326),  -- GPS koordinatı (gizli)
  location_approx           TEXT,             -- Alıcıya gösterilen: "Seyhan, Adana"
  address_city              TEXT,
  address_district          TEXT,

  -- Teslimat
  delivery_radius_km        NUMERIC(4,1) NOT NULL DEFAULT 5.0
                              CHECK (delivery_radius_km BETWEEN 1 AND 30),
  delivery_types            delivery_type[] NOT NULL DEFAULT '{pickup}',
  min_order_amount          NUMERIC(10,2) DEFAULT 0,

  -- Çalışma saatleri (JSONB — esnek yapı)
  -- {"mon":{"open":"10:00","close":"19:00"},"tue":...,"sun":null}
  working_hours             JSONB DEFAULT '{}'::jsonb,

  -- Durum
  is_open                   BOOLEAN NOT NULL DEFAULT false,
  vacation_until            DATE,              -- Tatil modu bitiş

  -- İstatistikler (trigger ile güncellenir)
  avg_rating                NUMERIC(3,2) CHECK (avg_rating BETWEEN 1 AND 5),
  total_reviews             INTEGER NOT NULL DEFAULT 0,
  total_orders              INTEGER NOT NULL DEFAULT 0,
  total_earnings            NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Rozet (trigger ile güncellenir)
  badge                     chef_badge NOT NULL DEFAULT 'new',

  -- Başvuru
  verification_status       verification_status NOT NULL DEFAULT 'pending',
  verified_at               TIMESTAMPTZ,
  rejected_reason           TEXT,

  -- Ödeme
  iban                      TEXT,              -- pgcrypto ile encrypt edilmeli (uygulama katmanı)
  iban_holder_name          TEXT,
  iyzico_sub_merchant_key   TEXT,             -- İyzico marketplace anahtarı

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PostGIS spatial index (yakın aşçı sorgusu için kritik)
CREATE INDEX chef_location_idx ON public.chef_profiles
  USING GIST (location);

-- Açık ve onaylı aşçıları hızlı bul
CREATE INDEX chef_open_verified_idx ON public.chef_profiles (is_open, verification_status)
  WHERE is_open = true AND verification_status = 'approved';

-- Şehir/semt filtresi
CREATE INDEX chef_location_text_idx ON public.chef_profiles (address_city, address_district);

-- ── menu_items ────────────────────────────────────────────────
CREATE TABLE public.menu_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id          UUID NOT NULL REFERENCES public.chef_profiles(id) ON DELETE CASCADE,

  name             TEXT NOT NULL,
  description      TEXT,
  category         menu_category NOT NULL DEFAULT 'main',
  price            NUMERIC(10,2) NOT NULL CHECK (price > 0),

  -- Stok yönetimi
  daily_stock      INTEGER CHECK (daily_stock >= 0),     -- Günlük maksimum
  remaining_stock  INTEGER CHECK (remaining_stock >= 0), -- Anlık kalan

  -- Meta
  allergens        TEXT[] NOT NULL DEFAULT '{}',
  prep_time_min    INTEGER CHECK (prep_time_min >= 0),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  photos           TEXT[] NOT NULL DEFAULT '{}',          -- Storage URL'leri

  -- Sipariş istatistikleri
  total_sold       INTEGER NOT NULL DEFAULT 0,
  avg_rating       NUMERIC(3,2),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Stok tutarsızlığını engelle
  CONSTRAINT stock_check CHECK (
    remaining_stock IS NULL OR daily_stock IS NULL OR remaining_stock <= daily_stock
  )
);

CREATE INDEX menu_items_chef_idx    ON public.menu_items (chef_id, is_active);
CREATE INDEX menu_items_cat_idx     ON public.menu_items (category) WHERE is_active = true;
CREATE INDEX menu_items_name_trgm   ON public.menu_items USING GIN (name gin_trgm_ops);
