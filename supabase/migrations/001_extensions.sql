-- ============================================================
-- 001_extensions.sql
-- Gerekli PostgreSQL eklentileri
-- Supabase'de çoğu zaten aktif — yine de idempotent olarak çalıştırılır
-- ============================================================

-- UUID üretimi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Coğrafi konum sorguları (yakın aşçı bul)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Şifreleme — IBAN'ı encrypt etmek için
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tam metin arama (aşçı/yemek arama için)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- unaccent — Türkçe karakter normalize (arama iyileştirme)
CREATE EXTENSION IF NOT EXISTS "unaccent";
