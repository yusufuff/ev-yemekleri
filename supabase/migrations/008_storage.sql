-- ============================================================
-- 008_storage.sql
-- Supabase Storage bucket tanımları ve erişim politikaları
-- ============================================================

-- ── Bucket'ları oluştur ───────────────────────────────────────
-- NOT: Supabase Dashboard > Storage'da da yapılabilir.
-- SQL ile yapmak migration'ları tekrar çalıştırılabilir kılar.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Profil fotoğrafları — herkese açık CDN
  ('avatars',
   'avatars',
   true,
   2097152,   -- 2 MB
   ARRAY['image/jpeg','image/png','image/webp']),

  -- Menü yemek fotoğrafları — herkese açık CDN
  ('menu-photos',
   'menu-photos',
   true,
   5242880,   -- 5 MB
   ARRAY['image/jpeg','image/png','image/webp']),

  -- Kimlik belgeleri — ÖZEL (signed URL ile erişim)
  ('chef-documents',
   'chef-documents',
   false,
   10485760,  -- 10 MB
   ARRAY['image/jpeg','image/png','application/pdf']),

  -- Mutfak fotoğrafları — ÖZEL
  ('kitchen-photos',
   'kitchen-photos',
   false,
   5242880,
   ARRAY['image/jpeg','image/png','image/webp']),

  -- Blog görselleri — herkese açık
  ('blog-images',
   'blog-images',
   true,
   3145728,   -- 3 MB
   ARRAY['image/jpeg','image/png','image/webp'])

ON CONFLICT (id) DO NOTHING;


-- ── Storage RLS Politikaları ──────────────────────────────────
-- Storage politikaları storage.objects tablosuna uygulanır

-- ══ avatars (public bucket) ══════════════════════════════════

-- Herkes okuyabilir
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Sadece kendi klasörüne yükleyebilir: avatars/{user_id}/...
CREATE POLICY "avatars_user_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_user_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );


-- ══ menu-photos (public bucket) ══════════════════════════════

CREATE POLICY "menu_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-photos');

-- Aşçı kendi menü klasörüne yükler: menu-photos/{chef_profile_id}/...
CREATE POLICY "menu_photos_chef_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'menu-photos' AND
    EXISTS (
      SELECT 1 FROM public.chef_profiles
      WHERE id::text = (storage.foldername(name))[1]
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "menu_photos_chef_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'menu-photos' AND
    EXISTS (
      SELECT 1 FROM public.chef_profiles
      WHERE id::text = (storage.foldername(name))[1]
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "menu_photos_admin"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'menu-photos' AND
    auth.jwt() ->> 'role' = 'admin'
  );


-- ══ chef-documents (PRIVATE bucket) ═════════════════════════
-- Signed URL ile erişim — direkt URL çalışmaz

-- Aşçı kendi belgelerini yükleyebilir
CREATE POLICY "docs_chef_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chef-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Aşçı kendi belgelerini görebilir
CREATE POLICY "docs_chef_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chef-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin tümünü görebilir
CREATE POLICY "docs_admin_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chef-documents' AND
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "docs_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chef-documents' AND
    auth.jwt() ->> 'role' = 'admin'
  );


-- ══ kitchen-photos (PRIVATE) ═════════════════════════════════

CREATE POLICY "kitchen_chef_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kitchen-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "kitchen_chef_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kitchen-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "kitchen_admin"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'kitchen-photos' AND
    auth.jwt() ->> 'role' = 'admin'
  );


-- ══ blog-images (public bucket) ══════════════════════════════

CREATE POLICY "blog_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "blog_images_author_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "blog_images_admin"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'blog-images' AND
    auth.jwt() ->> 'role' = 'admin'
  );
