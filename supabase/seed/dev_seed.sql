-- ============================================================
-- seed/dev_seed.sql
-- Geliştirme ortamı için örnek veri
-- SADECE geliştirme/staging'de çalıştır, PRODUCTION'da çalıştırma!
-- ============================================================

-- ── Önce auth.users'a sahte kullanıcılar ekle ─────────────────
-- Gerçek projede bu Supabase Auth üzerinden yapılır.
-- Seed için service_role ile direkt insert yapıyoruz.

DO $$
BEGIN
  -- Supabase local'de uuid'ler sabit — her çalıştırmada aynı
  RAISE NOTICE '🌱 Seed başlıyor...';
END $$;


-- ── Kullanıcılar ──────────────────────────────────────────────
-- NOT: auth.users insert'i Supabase local dev'de çalışır.
-- Supabase Cloud'da bu adımı Dashboard > Auth > Users'dan yap.

INSERT INTO public.users (id, full_name, phone, role, platform_credit, referral_code)
VALUES
  -- Admin
  ('00000000-0000-0000-0000-000000000001',
   'Platform Admin', '+905551000001', 'admin', 0, 'ADMIN1'),

  -- Aşçılar
  ('00000000-0000-0000-0000-000000000010',
   'Fatma Hanım',   '+905551000010', 'chef',  0, 'FATMA1'),
  ('00000000-0000-0000-0000-000000000011',
   'Ayşe Kaya',     '+905551000011', 'chef',  0, 'AYSE11'),
  ('00000000-0000-0000-0000-000000000012',
   'Zeynep Arslan', '+905551000012', 'chef',  0, 'ZEYNEP'),
  ('00000000-0000-0000-0000-000000000013',
   'Elif Demirci',  '+905551000013', 'chef',  0, 'ELIF13'),

  -- Alıcılar
  ('00000000-0000-0000-0000-000000000020',
   'Mehmet Yılmaz', '+905551000020', 'buyer', 25, 'MEHMET'),
  ('00000000-0000-0000-0000-000000000021',
   'Selin Koç',     '+905551000021', 'buyer', 0,  'SELIN1'),
  ('00000000-0000-0000-0000-000000000022',
   'Hüseyin Demir', '+905551000022', 'buyer', 50, 'HUSEYY')

ON CONFLICT (id) DO NOTHING;


-- ── Aşçı Profilleri ───────────────────────────────────────────
INSERT INTO public.chef_profiles (
  id, user_id, bio,
  location, location_approx, address_city, address_district,
  delivery_radius_km, delivery_types, min_order_amount,
  working_hours, is_open, avg_rating, total_reviews, total_orders,
  badge, verification_status, verified_at
)
VALUES
  (
    'aa000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    'Annemden öğrendiğim tariflerle 8 yıldır ev yemekleri yapıyorum. Katkısız, sağlıklı malzemeler.',
    ST_SetSRID(ST_MakePoint(35.321, 37.002), 4326),  -- Adana Seyhan
    'Seyhan, Adana', 'Adana', 'Seyhan',
    5.0, '{pickup,delivery}', 40,
    '{"mon":{"open":"10:00","close":"19:00"},"tue":{"open":"10:00","close":"19:00"},"wed":{"open":"10:00","close":"19:00"},"thu":{"open":"10:00","close":"19:00"},"fri":{"open":"10:00","close":"19:00"},"sat":{"open":"10:00","close":"17:00"},"sun":null}'::jsonb,
    true, 4.9, 127, 312,
    'master', 'approved', NOW() - INTERVAL '6 months'
  ),
  (
    'aa000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000011',
    'Vegan ve vejetaryen mutfak uzmanıyım. Organik malzemeler kullanıyorum.',
    ST_SetSRID(ST_MakePoint(35.330, 37.010), 4326),
    'Yüreğir, Adana', 'Adana', 'Yüreğir',
    3.0, '{pickup}', 30,
    '{"mon":{"open":"09:00","close":"17:00"},"tue":{"open":"09:00","close":"17:00"},"wed":{"open":"09:00","close":"17:00"},"thu":{"open":"09:00","close":"17:00"},"fri":{"open":"09:00","close":"17:00"},"sat":null,"sun":null}'::jsonb,
    true, 4.7, 58, 89,
    'trusted', 'approved', NOW() - INTERVAL '3 months'
  ),
  (
    'aa000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000012',
    'Börek ve hamur işleri konusunda uzmanım. Günlük taze börek yapıyorum.',
    ST_SetSRID(ST_MakePoint(35.310, 36.998), 4326),
    'Çukurova, Adana', 'Adana', 'Çukurova',
    7.0, '{pickup,delivery}', 50,
    '{"mon":{"open":"08:00","close":"20:00"},"tue":{"open":"08:00","close":"20:00"},"wed":{"open":"08:00","close":"20:00"},"thu":{"open":"08:00","close":"20:00"},"fri":{"open":"08:00","close":"20:00"},"sat":{"open":"09:00","close":"18:00"},"sun":{"open":"09:00","close":"14:00"}}'::jsonb,
    false, 5.0, 203, 548,
    'chef', 'approved', NOW() - INTERVAL '1 year'
  ),
  (
    'aa000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000013',
    'Pastacılık kursunu yeni bitirdim, taze pasta ve tatlılar yapıyorum.',
    ST_SetSRID(ST_MakePoint(35.340, 37.015), 4326),
    'Sarıçam, Adana', 'Adana', 'Sarıçam',
    4.0, '{pickup}', 20,
    '{"mon":null,"tue":{"open":"12:00","close":"18:00"},"wed":{"open":"12:00","close":"18:00"},"thu":{"open":"12:00","close":"18:00"},"fri":{"open":"12:00","close":"20:00"},"sat":{"open":"10:00","close":"20:00"},"sun":null}'::jsonb,
    true, 4.5, 12, 18,
    'new', 'approved', NOW() - INTERVAL '1 month'
  )
ON CONFLICT (id) DO NOTHING;


-- ── Menü Öğeleri ──────────────────────────────────────────────
INSERT INTO public.menu_items (
  id, chef_id, name, description, category, price,
  daily_stock, remaining_stock, allergens, prep_time_min, is_active
)
VALUES
  -- Fatma Hanım menüsü
  ('bb000000-0000-0000-0000-000000000001',
   'aa000000-0000-0000-0000-000000000001',
   'Kuru Fasulye & Pilav',
   'Domates sulu kuru fasulye, tereyağlı pirinç pilavı. Klasik ev yemeği.',
   'main', 55, 12, 5, '{}', 30, true),

  ('bb000000-0000-0000-0000-000000000002',
   'aa000000-0000-0000-0000-000000000001',
   'Sütlaç',
   'Fırında karamelize sütlaç. Günlük taze yapılır.',
   'dessert', 35, 10, 8, '{"süt","gluten"}', 0, true),

  ('bb000000-0000-0000-0000-000000000003',
   'aa000000-0000-0000-0000-000000000001',
   'Mercimek Çorbası',
   'Geleneksel kırmızı mercimek çorbası, limon ve nane ile servis edilir.',
   'soup', 30, 15, 15, '{}', 20, true),

  ('bb000000-0000-0000-0000-000000000004',
   'aa000000-0000-0000-0000-000000000001',
   'İmam Bayıldı',
   'Zeytinyağlı patlıcan yemeği, domates ve soğan ile.',
   'main', 45, 8, 0, '{}', 40, false),  -- stok bitti

  -- Ayşe Kaya menüsü (vegan)
  ('bb000000-0000-0000-0000-000000000010',
   'aa000000-0000-0000-0000-000000000002',
   'Nohutlu Ispanak',
   'Zeytinyağlı ıspanak yemeği, organik nohut ile.',
   'main', 42, 10, 7, '{}', 25, true),

  ('bb000000-0000-0000-0000-000000000011',
   'aa000000-0000-0000-0000-000000000002',
   'Tahin Soslu Semizotu Salatası',
   'Taze semizotu, tahin-limon sos, organik zeytinler.',
   'salad', 28, 12, 12, '{"susam"}', 10, true),

  -- Zeynep Arslan menüsü (börek)
  ('bb000000-0000-0000-0000-000000000020',
   'aa000000-0000-0000-0000-000000000003',
   'Peynirli Su Böreği',
   'Haşlama yufka ile hazırlanmış geleneksel su böreği.',
   'pastry', 65, 5, 3, '{"gluten","süt","yumurta"}', 45, true),

  ('bb000000-0000-0000-0000-000000000021',
   'aa000000-0000-0000-0000-000000000003',
   'Ispanaklı Gözleme',
   'Taze ıspanak ve beyaz peynirli sacda pişirilmiş gözleme (2 adet).',
   'pastry', 38, 20, 14, '{"gluten","süt"}', 15, true),

  -- Elif Demirci menüsü (pasta/tatlı)
  ('bb000000-0000-0000-0000-000000000030',
   'aa000000-0000-0000-0000-000000000004',
   'Çikolatalı Pasta Dilimi',
   'Belçika çikolatalı ıslak kek, ganaj kaplama.',
   'dessert', 55, 8, 6, '{"gluten","süt","yumurta"}', 0, true),

  ('bb000000-0000-0000-0000-000000000031',
   'aa000000-0000-0000-0000-000000000004',
   'Cheesecake',
   'New York style cheesecake, orman meyveli sos.',
   'dessert', 65, 6, 4, '{"gluten","süt","yumurta"}', 0, true)

ON CONFLICT (id) DO NOTHING;


-- ── Adresler (alıcılar için) ───────────────────────────────────
INSERT INTO public.addresses (id, user_id, label, full_address, district, city, lat, lng, is_default)
VALUES
  ('cc000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000020',
   'home', 'Mimar Sinan Mah. Atatürk Cad. No:42 D:3', 'Seyhan', 'Adana',
   37.002, 35.325, true),

  ('cc000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000020',
   'work', 'Çakmak Mah. Turhan Cemal Beriker Bul. No:145', 'Seyhan', 'Adana',
   37.008, 35.318, false)

ON CONFLICT (id) DO NOTHING;


-- ── Kuponlar ──────────────────────────────────────────────────
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, min_order_amount, max_uses, is_active, valid_until)
VALUES
  ('dd000000-0000-0000-0000-000000000001',
   'ILK10', 'İlk siparişte %10 indirim',
   'percentage', 10, 30, 1000, true, NOW() + INTERVAL '1 year'),

  ('dd000000-0000-0000-0000-000000000002',
   'HOSGELDIN25', 'Hoş geldin kampanyası ₺25 indirim',
   'fixed', 25, 60, 500, true, NOW() + INTERVAL '6 months'),

  ('dd000000-0000-0000-0000-000000000003',
   'YAZA25', 'Yaz kampanyası ₺25 indirim',
   'fixed', 25, 50, NULL, false, NOW() - INTERVAL '1 day')  -- süresi dolmuş

ON CONFLICT (id) DO NOTHING;


-- ── Örnek Sipariş ─────────────────────────────────────────────
INSERT INTO public.orders (
  id, buyer_id, chef_id, status, delivery_type,
  subtotal, total_amount, platform_fee, chef_earning,
  payment_status,
  delivery_address, created_at, confirmed_at, preparing_at, delivered_at
)
VALUES (
  'ee000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000020',
  'aa000000-0000-0000-0000-000000000001',
  'delivered', 'delivery',
  110, 110, 11, 99,
  'paid',
  '{"label":"Ev","full_address":"Mimar Sinan Mah. No:42","district":"Seyhan","city":"Adana","lat":37.002,"lng":35.325}'::jsonb,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days' + INTERVAL '5 minutes',
  NOW() - INTERVAL '2 days' + INTERVAL '10 minutes',
  NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (order_id, menu_item_id, item_name, item_price, quantity)
VALUES
  ('ee000000-0000-0000-0000-000000000001',
   'bb000000-0000-0000-0000-000000000001',
   'Kuru Fasulye & Pilav', 55, 2)
ON CONFLICT DO NOTHING;

-- ── Yorum (tamamlanan sipariş için) ───────────────────────────
INSERT INTO public.reviews (order_id, buyer_id, chef_id, rating, comment)
VALUES (
  'ee000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000020',
  'aa000000-0000-0000-0000-000000000001',
  5,
  'Tam annemin yaptığı gibi. Fasulye mükemmeldi, tekrar sipariş vereceğim.'
)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✅ Seed tamamlandı! 4 aşçı, 10 menü, 1 sipariş, 3 kupon eklendi.';
END $$;
