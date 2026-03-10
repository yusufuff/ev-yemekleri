-- ============================================================
-- 005_supporting_tables.sql
-- Yardımcı tablolar: reviews, messages, addresses,
--   payouts, favorites, notifications, chef_documents,
--   referrals, disputes, audit_logs
-- ============================================================

-- ── reviews ──────────────────────────────────────────────────
CREATE TABLE public.reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL UNIQUE REFERENCES public.orders(id), -- Her siparişe 1 yorum
  buyer_id     UUID NOT NULL REFERENCES public.users(id),
  chef_id      UUID NOT NULL REFERENCES public.chef_profiles(id),
  menu_item_id UUID REFERENCES public.menu_items(id),

  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  photos       TEXT[] DEFAULT '{}',

  -- Aşçı yanıtı
  chef_reply   TEXT,
  replied_at   TIMESTAMPTZ,

  -- Moderasyon
  is_visible   BOOLEAN NOT NULL DEFAULT true,
  flagged_at   TIMESTAMPTZ,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reviews_chef_idx   ON public.reviews (chef_id, created_at DESC);
CREATE INDEX reviews_buyer_idx  ON public.reviews (buyer_id);
CREATE INDEX reviews_rating_idx ON public.reviews (chef_id, rating);

-- ── messages ──────────────────────────────────────────────────
-- Aşçı ↔ Alıcı mesajlaşma (sipariş bazlı)
CREATE TABLE public.messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES public.users(id),
  recipient_id UUID NOT NULL REFERENCES public.users(id),

  content      TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  read_at      TIMESTAMPTZ,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_order_idx     ON public.messages (order_id, created_at ASC);
CREATE INDEX messages_unread_idx    ON public.messages (recipient_id, is_read)
  WHERE is_read = false;

-- ── addresses ─────────────────────────────────────────────────
CREATE TABLE public.addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  label         TEXT NOT NULL DEFAULT 'home', -- 'home' | 'work' | 'other'
  recipient_name TEXT,                         -- Kapıdaki kişi
  full_address  TEXT NOT NULL,
  district      TEXT,
  city          TEXT,
  lat           NUMERIC(10,7),
  lng           NUMERIC(10,7),
  door_code     TEXT,
  floor         TEXT,
  directions    TEXT,                          -- "Sarı posta kutusu…"

  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX addresses_user_idx ON public.addresses (user_id);

-- Bir kullanıcının yalnızca 1 varsayılan adresi olabilir
CREATE UNIQUE INDEX addresses_default_idx ON public.addresses (user_id)
  WHERE is_default = true;

-- ── payouts ───────────────────────────────────────────────────
CREATE TABLE public.payouts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id         UUID NOT NULL REFERENCES public.chef_profiles(id),

  amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  iban_snapshot   TEXT NOT NULL,               -- Transfer anındaki IBAN son 4 hane
  status          payout_status NOT NULL DEFAULT 'pending',

  iyzico_ref      TEXT,                        -- İyzico transfer referansı
  failure_reason  TEXT,

  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

CREATE INDEX payouts_chef_idx   ON public.payouts (chef_id, requested_at DESC);
CREATE INDEX payouts_status_idx ON public.payouts (status) WHERE status IN ('pending','processing');

-- ── favorites ─────────────────────────────────────────────────
CREATE TABLE public.favorites (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chef_id      UUID REFERENCES public.chef_profiles(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  notify_on_open BOOLEAN NOT NULL DEFAULT true, -- Aşçı açıldığında bildir

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- En az biri dolu olmalı
  CONSTRAINT favorites_target_check CHECK (
    (chef_id IS NOT NULL AND menu_item_id IS NULL) OR
    (menu_item_id IS NOT NULL AND chef_id IS NULL)
  ),
  UNIQUE (user_id, chef_id),
  UNIQUE (user_id, menu_item_id)
);

CREATE INDEX favorites_user_idx  ON public.favorites (user_id);
CREATE INDEX favorites_chef_idx  ON public.favorites (chef_id) WHERE chef_id IS NOT NULL;

-- ── notifications ─────────────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB DEFAULT '{}'::jsonb,     -- {"order_id":"...", "chef_id":"..."}

  is_read     BOOLEAN NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  sent_via    TEXT[] DEFAULT '{}',           -- ['push','sms','email']

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_idx    ON public.notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx  ON public.notifications (user_id, is_read)
  WHERE is_read = false;

-- ── chef_documents ────────────────────────────────────────────
-- Kimlik doğrulama belgeleri — private Storage bucket
CREATE TABLE public.chef_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  doc_type      document_type NOT NULL,
  storage_path  TEXT NOT NULL,              -- Storage bucket path (private)
  file_name     TEXT,
  file_size     INTEGER,

  status        verification_status NOT NULL DEFAULT 'pending',
  reviewed_by   UUID REFERENCES public.users(id), -- Admin
  reviewed_at   TIMESTAMPTZ,
  review_note   TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chef_docs_user_idx   ON public.chef_documents (chef_user_id);
CREATE INDEX chef_docs_status_idx ON public.chef_documents (status) WHERE status = 'pending';

-- ── referrals ─────────────────────────────────────────────────
CREATE TABLE public.referrals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id   UUID NOT NULL REFERENCES public.users(id), -- Kodu paylaşan
  referred_id   UUID NOT NULL UNIQUE REFERENCES public.users(id), -- Kayıt olan

  -- Ödül
  referrer_credit NUMERIC(10,2) NOT NULL DEFAULT 25.00, -- ₺25
  referred_credit NUMERIC(10,2) NOT NULL DEFAULT 25.00, -- ₺25
  credited        BOOLEAN NOT NULL DEFAULT false,         -- Ödül verildi mi
  credited_at     TIMESTAMPTZ,

  -- Koşul: Referred kullanıcı ilk siparişini tamamlamalı
  first_order_id  UUID REFERENCES public.orders(id),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX referrals_referrer_idx ON public.referrals (referrer_id);

-- ── disputes ──────────────────────────────────────────────────
CREATE TABLE public.disputes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES public.orders(id),
  opened_by    UUID NOT NULL REFERENCES public.users(id),

  reason       TEXT NOT NULL,
  details      TEXT,
  evidence     TEXT[] DEFAULT '{}',         -- Storage URL'leri

  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
  resolution   TEXT,
  resolved_by  UUID REFERENCES public.users(id),
  resolved_at  TIMESTAMPTZ,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX disputes_order_idx  ON public.disputes (order_id);
CREATE INDEX disputes_status_idx ON public.disputes (status) WHERE status IN ('open','investigating');

-- ── audit_logs ────────────────────────────────────────────────
-- Admin aksiyonları için iz kaydı (KVKK / compliance)
CREATE TABLE public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id     UUID NOT NULL REFERENCES public.users(id),
  action       TEXT NOT NULL,               -- 'ban_user', 'approve_chef', 'issue_refund'...
  target_type  TEXT,                        -- 'user', 'order', 'chef'...
  target_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_actor_idx  ON public.audit_logs (actor_id, created_at DESC);
CREATE INDEX audit_logs_target_idx ON public.audit_logs (target_type, target_id);

-- ── blog_posts ────────────────────────────────────────────────
CREATE TABLE public.blog_posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id    UUID NOT NULL REFERENCES public.users(id),

  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  excerpt      TEXT,
  content      TEXT NOT NULL,
  cover_image  TEXT,
  tags         TEXT[] DEFAULT '{}',

  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','pending','published','rejected')),
  rejection_reason TEXT,
  published_at TIMESTAMPTZ,
  reviewed_by  UUID REFERENCES public.users(id),

  view_count   INTEGER NOT NULL DEFAULT 0,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX blog_slug_idx      ON public.blog_posts (slug);
CREATE INDEX blog_status_idx    ON public.blog_posts (status, published_at DESC);
CREATE INDEX blog_author_idx    ON public.blog_posts (author_id);
