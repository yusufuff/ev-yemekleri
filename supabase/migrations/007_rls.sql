-- ============================================================
-- 007_rls.sql
-- Row Level Security — tüm tablolar için erişim politikaları
-- Her tablo için önce RLS aktive edilir, sonra politikalar tanımlanır
-- ============================================================

-- ── Yardımcı: JWT'den rol oku ─────────────────────────────────
-- auth.jwt() ->> 'role' Supabase'de custom claim olarak set edilmeli
-- (handle_new_user trigger'ı user_metadata'ya ekliyor)

-- ═══════════════════════════════════════════════════════════════
-- users
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Herkes kendi profilini görebilir
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Herkes diğer kullanıcıların temel bilgilerini görebilir (profil sayfası)
CREATE POLICY "users_read_public" ON public.users
  FOR SELECT USING (true);

-- Sadece kendi profilini güncelleyebilir
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin her şeyi yapabilir
CREATE POLICY "users_admin_all" ON public.users
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- ═══════════════════════════════════════════════════════════════
-- chef_profiles
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.chef_profiles ENABLE ROW LEVEL SECURITY;

-- Onaylı aşçı profilleri herkese açık (keşif sayfası)
-- Dikkat: location (GPS) sütunu SELECT'te döndürülmemeli — API katmanında filtrele
CREATE POLICY "chefs_read_approved" ON public.chef_profiles
  FOR SELECT USING (verification_status = 'approved');

-- Aşçı kendi profilini görebilir (onaylı olmasa da)
CREATE POLICY "chefs_read_own" ON public.chef_profiles
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Aşçı kendi profilini güncelleyebilir
CREATE POLICY "chefs_update_own" ON public.chef_profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Yeni aşçı profili oluşturabilir (kayıt akışında)
CREATE POLICY "chefs_insert_own" ON public.chef_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admin
CREATE POLICY "chefs_admin_all" ON public.chef_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- menu_items
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Aktif menü öğeleri herkese açık
CREATE POLICY "menu_read_active" ON public.menu_items
  FOR SELECT USING (is_active = true);

-- Aşçı kendi menüsünü tam görebilir (pasifler dahil)
CREATE POLICY "menu_read_own" ON public.menu_items
  FOR SELECT USING (
    chef_id IN (
      SELECT id FROM public.chef_profiles WHERE user_id = auth.uid()
    )
  );

-- Aşçı kendi menüsünü yönetebilir
CREATE POLICY "menu_insert_own" ON public.menu_items
  FOR INSERT WITH CHECK (
    chef_id IN (
      SELECT id FROM public.chef_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "menu_update_own" ON public.menu_items
  FOR UPDATE USING (
    chef_id IN (
      SELECT id FROM public.chef_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "menu_delete_own" ON public.menu_items
  FOR DELETE USING (
    chef_id IN (
      SELECT id FROM public.chef_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "menu_admin_all" ON public.menu_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- orders
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Alıcı kendi siparişlerini görebilir
CREATE POLICY "orders_read_buyer" ON public.orders
  FOR SELECT USING (buyer_id = auth.uid());

-- Aşçı kendi siparişlerini görebilir
CREATE POLICY "orders_read_chef" ON public.orders
  FOR SELECT USING (
    chef_id IN (
      SELECT id FROM public.chef_profiles WHERE user_id = auth.uid()
    )
  );

-- Alıcı sipariş oluşturabilir
CREATE POLICY "orders_insert_buyer" ON public.orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Aşçı sipariş durumunu güncelleyebilir (status alanı)
CREATE POLICY "orders_update_chef" ON public.orders
  FOR UPDATE USING (
    chef_id IN (
      SELECT id FROM public.chef_profiles WHERE user_id = auth.uid()
    )
  );

-- Alıcı iptal edebilir (sadece pending/confirmed durumda — uygulama katmanı kontrol eder)
CREATE POLICY "orders_cancel_buyer" ON public.orders
  FOR UPDATE USING (buyer_id = auth.uid());

CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- order_items
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_read" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE buyer_id = auth.uid()
         OR chef_id IN (SELECT id FROM public.chef_profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid())
  );

CREATE POLICY "order_items_admin" ON public.order_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- reviews
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Görünür yorumlar herkese açık
CREATE POLICY "reviews_read_visible" ON public.reviews
  FOR SELECT USING (is_visible = true);

-- Alıcı kendi yorumunu görebilir
CREATE POLICY "reviews_read_own" ON public.reviews
  FOR SELECT USING (buyer_id = auth.uid());

-- Alıcı teslim edilen siparişe yorum yapabilir
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    buyer_id = auth.uid() AND
    order_id IN (
      SELECT id FROM public.orders
      WHERE buyer_id = auth.uid() AND status = 'delivered'
    )
  );

-- Aşçı sadece chef_reply alanını güncelleyebilir
CREATE POLICY "reviews_chef_reply" ON public.reviews
  FOR UPDATE USING (
    chef_id IN (SELECT id FROM public.chef_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    chef_id IN (SELECT id FROM public.chef_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "reviews_admin_all" ON public.reviews
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- messages
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_read" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_mark_read" ON public.messages
  FOR UPDATE USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "messages_admin" ON public.messages
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- addresses
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_own" ON public.addresses
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "addresses_admin" ON public.addresses
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- coupons — Sadece geçerli kuponlar alıcıya görünür
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_read_active" ON public.coupons
  FOR SELECT USING (
    is_active = true AND
    (valid_until IS NULL OR valid_until > NOW())
  );

CREATE POLICY "coupons_admin" ON public.coupons
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- payouts
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payouts_chef_own" ON public.payouts
  FOR SELECT USING (
    chef_id IN (SELECT id FROM public.chef_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "payouts_chef_insert" ON public.payouts
  FOR INSERT WITH CHECK (
    chef_id IN (SELECT id FROM public.chef_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "payouts_admin" ON public.payouts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- favorites
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_own" ON public.favorites
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- notifications
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_mark_read" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sistem bildirimleri ekleme: sadece service_role (API routes)
CREATE POLICY "notifications_service_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "notifications_admin" ON public.notifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- chef_documents — HASSAS: sadece ilgili aşçı ve admin
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.chef_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_chef_own" ON public.chef_documents
  FOR SELECT USING (chef_user_id = auth.uid());

CREATE POLICY "docs_chef_insert" ON public.chef_documents
  FOR INSERT WITH CHECK (chef_user_id = auth.uid());

-- Admin tüm belgeleri görebilir ve güncelleyebilir
CREATE POLICY "docs_admin" ON public.chef_documents
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- referrals
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_own" ON public.referrals
  FOR SELECT USING (
    referrer_id = auth.uid() OR referred_id = auth.uid()
  );

-- ═══════════════════════════════════════════════════════════════
-- disputes
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disputes_own" ON public.disputes
  FOR SELECT USING (opened_by = auth.uid());

CREATE POLICY "disputes_insert" ON public.disputes
  FOR INSERT WITH CHECK (opened_by = auth.uid());

CREATE POLICY "disputes_admin" ON public.disputes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- audit_logs — sadece admin
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_admin_only" ON public.audit_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- blog_posts
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_read_published" ON public.blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "blog_author_own" ON public.blog_posts
  FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "blog_author_insert" ON public.blog_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "blog_author_update" ON public.blog_posts
  FOR UPDATE USING (author_id = auth.uid() AND status IN ('draft','rejected'));

CREATE POLICY "blog_admin" ON public.blog_posts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
