-- ============================================================
-- 006_functions_triggers.sql
-- DB fonksiyonları ve otomatik tetikleyiciler
-- ============================================================

-- ── Yardımcı: updated_at otomatik güncelle ────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- updated_at trigger'ı olan tüm tablolar
DO $$ DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','chef_profiles','menu_items','orders',
    'reviews','addresses','disputes','blog_posts'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at_%I
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END $$;


-- ── Fonksiyon 1: Kullanıcı kaydında profil oluştur ────────────
-- auth.users'a kayıt olunca public.users otomatik oluşur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ref_code TEXT;
BEGIN
  -- Benzersiz referans kodu üret (6 karakter, büyük harf)
  LOOP
    ref_code := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = ref_code);
  END LOOP;

  INSERT INTO public.users (id, full_name, phone, role, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanıcı'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer'),
    ref_code
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── Fonksiyon 2: Yorum sonrası aşçı puanını güncelle ─────────
CREATE OR REPLACE FUNCTION public.update_chef_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  new_avg  NUMERIC(3,2);
  new_count INTEGER;
BEGIN
  -- Görünür yorumların ortalamasını hesapla
  SELECT
    ROUND(AVG(rating)::NUMERIC, 2),
    COUNT(*)
  INTO new_avg, new_count
  FROM public.reviews
  WHERE chef_id = COALESCE(NEW.chef_id, OLD.chef_id)
    AND is_visible = true;

  UPDATE public.chef_profiles
  SET
    avg_rating    = new_avg,
    total_reviews = new_count
  WHERE id = COALESCE(NEW.chef_id, OLD.chef_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_chef_rating();


-- ── Fonksiyon 3: Sipariş tamamlanınca rozet güncelle ─────────
CREATE OR REPLACE FUNCTION public.update_chef_badge()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Sadece 'delivered' → badge hesapla
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE public.chef_profiles
    SET
      total_orders   = total_orders + 1,
      total_earnings = total_earnings + NEW.chef_earning,
      badge = CASE
        WHEN total_orders + 1 >= 500 THEN 'chef'
        WHEN total_orders + 1 >= 100 THEN 'master'
        WHEN total_orders + 1 >= 20  THEN 'trusted'
        ELSE 'new'
      END
    WHERE id = NEW.chef_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_delivered
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_chef_badge();


-- ── Fonksiyon 4: Sipariş no otomatik üret ─────────────────────
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'EV-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                        LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();


-- ── Fonksiyon 5: Stok sıfırlanınca menü öğesini kapat ─────────
CREATE OR REPLACE FUNCTION public.auto_deactivate_zero_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.remaining_stock IS NOT NULL AND NEW.remaining_stock <= 0 THEN
    NEW.is_active = false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_stock_update
  BEFORE UPDATE OF remaining_stock ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.auto_deactivate_zero_stock();


-- ── Fonksiyon 6: Kupon kullanım sayısını artır ────────────────
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE id = NEW.coupon_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_with_coupon
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_coupon_usage();


-- ── Fonksiyon 7: Varsayılan adres — tek olmasını garantile ────
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_address_default_change
  AFTER INSERT OR UPDATE OF is_default ON public.addresses
  FOR EACH ROW WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_address();


-- ── Fonksiyon 8: Referans ödülü — ilk sipariş tamamlanınca ───
CREATE OR REPLACE FUNCTION public.process_referral_reward()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ref_record RECORD;
BEGIN
  -- Sadece ilk teslimat
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    SELECT * INTO ref_record
    FROM public.referrals
    WHERE referred_id = NEW.buyer_id
      AND credited = false
      AND first_order_id IS NULL
    LIMIT 1;

    IF FOUND THEN
      -- İki tarafa da kredi ekle
      UPDATE public.users SET platform_credit = platform_credit + ref_record.referrer_credit
        WHERE id = ref_record.referrer_id;
      UPDATE public.users SET platform_credit = platform_credit + ref_record.referred_credit
        WHERE id = ref_record.referred_id;

      -- Referansı tamamlandı işaretle
      UPDATE public.referrals
      SET credited = true, credited_at = NOW(), first_order_id = NEW.id
      WHERE id = ref_record.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_first_order_delivered
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.process_referral_reward();


-- ── Fonksiyon 9: Yakın aşçıları bul (API'den çağrılır) ────────
CREATE OR REPLACE FUNCTION public.find_nearby_chefs(
  user_lat    FLOAT,
  user_lng    FLOAT,
  radius_km   FLOAT DEFAULT 5.0,
  category    menu_category DEFAULT NULL,
  sort_by     TEXT DEFAULT 'distance' -- 'distance' | 'rating' | 'price'
)
RETURNS TABLE (
  chef_id          UUID,
  user_id          UUID,
  full_name        TEXT,
  avatar_url       TEXT,
  location_approx  TEXT,
  avg_rating       NUMERIC,
  total_reviews    INTEGER,
  total_orders     INTEGER,
  badge            chef_badge,
  is_open          BOOLEAN,
  delivery_types   delivery_type[],
  distance_km      FLOAT,
  min_price        NUMERIC,
  menu_count       BIGINT
) LANGUAGE sql STABLE AS $$
  SELECT
    cp.id                 AS chef_id,
    u.id                  AS user_id,
    u.full_name,
    u.avatar_url,
    cp.location_approx,
    cp.avg_rating,
    cp.total_reviews,
    cp.total_orders,
    cp.badge,
    cp.is_open,
    cp.delivery_types,
    ROUND(
      ST_Distance(
        cp.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
      ) / 1000.0
    , 1)                  AS distance_km,
    MIN(mi.price)         AS min_price,
    COUNT(mi.id)          AS menu_count
  FROM public.chef_profiles cp
  JOIN public.users u ON u.id = cp.user_id
  LEFT JOIN public.menu_items mi
    ON mi.chef_id = cp.id
    AND mi.is_active = true
    AND (category IS NULL OR mi.category = category)
  WHERE
    cp.verification_status = 'approved'
    AND u.is_active = true
    AND (cp.vacation_until IS NULL OR cp.vacation_until < CURRENT_DATE)
    AND ST_DWithin(
      cp.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
  GROUP BY cp.id, u.id, u.full_name, u.avatar_url
  ORDER BY
    CASE WHEN sort_by = 'distance' THEN ST_Distance(cp.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) END ASC,
    CASE WHEN sort_by = 'rating'   THEN cp.avg_rating END DESC NULLS LAST,
    CASE WHEN sort_by = 'price'    THEN MIN(mi.price)  END ASC NULLS LAST;
$$;


-- ── Fonksiyon 10: Günlük stoku sıfırla (gece yarısı cron) ─────
CREATE OR REPLACE FUNCTION public.reset_daily_stock()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.menu_items
  SET
    remaining_stock = daily_stock,
    is_active = (daily_stock > 0)
  WHERE daily_stock IS NOT NULL;
END;
$$;
-- Çağrı: Supabase Dashboard > Database > Cron Jobs
-- Schedule: "0 0 * * *" (her gece 00:00)
-- Command: SELECT public.reset_daily_stock();
