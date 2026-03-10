-- ============================================================
-- 010_cron.sql
-- Zamanlanmış görevler — pg_cron (Supabase'de dahili)
-- Supabase Dashboard > Database > Extensions > pg_cron
-- ============================================================

-- pg_cron extension aktif et
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;


-- ── Görev 1: Gece yarısı günlük stok sıfırla ─────────────────
-- Her gün 00:00 (Europe/Istanbul = UTC+3 → 21:00 UTC)
SELECT cron.schedule(
  'reset-daily-stock',
  '0 21 * * *',  -- UTC 21:00 = TR 00:00
  $$SELECT public.reset_daily_stock()$$
);


-- ── Görev 2: Popüler menü materialized view'ı yenile ─────────
-- Her saat yenilenir (ana sayfa için)
SELECT cron.schedule(
  'refresh-popular-menus',
  '0 * * * *',  -- Her saatin başında
  $$SELECT public.refresh_popular_menu_items()$$
);


-- ── Görev 3: Süresi dolmuş kuponları kapat ───────────────────
-- Her gün 02:00 UTC
SELECT cron.schedule(
  'deactivate-expired-coupons',
  '0 2 * * *',
  $$
    UPDATE public.coupons
    SET is_active = false
    WHERE valid_until < NOW()
      AND is_active = true;
  $$
);


-- ── Görev 4: Tatil modundan çıkış kontrolü ───────────────────
-- Her saat çalışır, tatili biten aşçıları aktif eder
SELECT cron.schedule(
  'check-vacation-end',
  '30 * * * *',
  $$
    UPDATE public.chef_profiles
    SET vacation_until = NULL
    WHERE vacation_until IS NOT NULL
      AND vacation_until < NOW();
  $$
);


-- ── Görev 5: Eski bildirimleri temizle ────────────────────────
-- Her Pazar 03:00 UTC — 90 günden eski okunmuş bildirimleri sil
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * 0',  -- Her Pazar
  $$
    DELETE FROM public.notifications
    WHERE is_read = true
      AND created_at < NOW() - INTERVAL '90 days';
  $$
);


-- ── Görev 6: Eski audit logları arşivle ───────────────────────
-- Her ay 1'inde 04:00 UTC — 1 yıldan eski kayıtları sil
SELECT cron.schedule(
  'cleanup-old-audit-logs',
  '0 4 1 * *',  -- Her ayın 1'i
  $$
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '1 year';
  $$
);


-- ── Görev 7: Onay 30 dk geçen siparişleri otomatik iptal et ──
-- Her 15 dakikada bir çalışır
SELECT cron.schedule(
  'auto-cancel-pending-orders',
  '*/15 * * * *',
  $$
    UPDATE public.orders
    SET
      status = 'cancelled',
      cancelled_at = NOW(),
      cancel_reason = 'Aşçı 30 dakika içinde yanıt vermedi — sistem tarafından otomatik iptal'
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '30 minutes';
  $$
);


-- Mevcut cron görevlerini listele
-- SELECT * FROM cron.job ORDER BY jobname;
