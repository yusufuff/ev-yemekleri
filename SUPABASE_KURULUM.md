# 🗄️ EV YEMEKLERİ — Supabase Kurulum Kılavuzu

> **Hedef:** Sıfırdan production-ready Supabase projesi kurmak  
> **Süre:** ~45 dakika  
> **Gereksinimler:** Node.js 18+, Supabase CLI, Git

---

## İçindekiler

1. [Supabase CLI Kurulumu](#1-supabase-cli-kurulumu)
2. [Local Development Başlatma](#2-local-development-başlatma)
3. [Migration'ları Çalıştırma](#3-migrationları-çalıştırma)
4. [Seed Data Yükleme](#4-seed-data-yükleme)
5. [Supabase Cloud Projesi Oluşturma](#5-supabase-cloud-projesi-oluşturma)
6. [Cloud'a Push Etme](#6-clouda-push-etme)
7. [Auth Ayarları](#7-auth-ayarları)
8. [Storage Bucket'ları Oluşturma](#8-storage-bucketları-oluşturma)
9. [Edge Functions & Cron](#9-edge-functions--cron)
10. [Next.js .env Ayarları](#10-nextjs-env-ayarları)
11. [Kontrol Listesi](#11-kontrol-listesi)
12. [Sık Karşılaşılan Sorunlar](#12-sık-karşılaşılan-sorunlar)

---

## 1. Supabase CLI Kurulumu

```bash
# macOS
brew install supabase/tap/supabase

# Windows (scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# npm (cross-platform)
npm install -g supabase

# Versiyon kontrol (en az 1.150+ olmalı)
supabase --version
```

---

## 2. Local Development Başlatma

```bash
# Proje dizinine git
cd ev-yemekleri

# Docker Desktop çalışıyor olmalı!
# İlk çalıştırmada Docker image'ları indirilir (~2 dakika)
supabase start

# Çıktı şöyle görünür:
# Started supabase local development setup.
#
#          API URL: http://127.0.0.1:54321
#      GraphQL URL: http://127.0.0.1:54321/graphql/v1
#           DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
#       Studio URL: http://127.0.0.1:54323      ← Tarayıcıda aç!
#     Inbucket URL: http://127.0.0.1:54324      ← Test e-postalar
#         anon key: eyJhbGci...
#  service_role key: eyJhbGci...
```

> 💡 **Not:** `supabase start` yavaşsa Docker'da kaynak artır (Settings > Resources > 4 CPU, 4GB RAM)

---

## 3. Migration'ları Çalıştırma

Migration dosyaları `supabase/migrations/` klasöründe sıralıdır:

```
001_extensions.sql    — PostGIS, pgcrypto, pg_trgm, unaccent
002_enums.sql         — Tüm enum tipleri
003_core_tables.sql   — users, chef_profiles, menu_items
004_orders.sql        — orders, order_items, coupons
005_supporting_tables.sql — reviews, messages, addresses, payouts...
006_functions_triggers.sql — 10 DB fonksiyonu + trigger'lar
007_rls.sql           — Row Level Security politikaları
008_storage.sql       — Storage bucket tanımları
009_views.sql         — API view'ları (chef_public_profiles, order_summary...)
010_cron.sql          — Zamanlanmış görevler (pg_cron)
```

```bash
# Tüm migration'ları tek seferde çalıştır
supabase db reset

# Sadece yeni migration'ları çalıştır (mevcut datayı korur)
supabase db push

# Belirli bir migration'ı manuel çalıştır
supabase db execute --file supabase/migrations/009_views.sql
```

> ⚠️ `db reset` tüm datayı siler ve seed çalıştırır. **Local geliştirmede** kullanın.

**Migration başarısını doğrula:**

```bash
# Studio'da kontrol et → http://localhost:54323
# Table Editor'da şu tablolar görünmeli:
# users, chef_profiles, menu_items, orders, order_items,
# coupons, reviews, messages, addresses, payouts, favorites,
# notifications, chef_documents, referrals, disputes,
# audit_logs, blog_posts

# Veya psql ile:
supabase db execute --sql "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
```

---

## 4. Seed Data Yükleme

```bash
# Seed otomatik çalışır (supabase db reset ile birlikte)
# Manuel çalıştırmak için:
supabase db execute --file supabase/seed/dev_seed.sql

# Başarılı çıktı:
# NOTICE:  🌱 Seed başlıyor...
# NOTICE:  ✅ Seed tamamlandı! 4 aşçı, 10 menü, 1 sipariş, 3 kupon eklendi.
```

**Seed data içeriği:**
- 4 aşçı (Fatma Hanım, Ayşe Kaya, Zeynep Arslan, Elif Demirci)
- 3 alıcı (Mehmet Yılmaz, Selin Koç, Hüseyin Demir)
- 10 menü öğesi (farklı kategorilerde)
- 3 kupon (ILK10, HOSGELDIN25, YAZA25)
- 1 tamamlanmış sipariş + yorum
- 2 adres

**Test kullanıcı telefonları (OTP: 123456):**
```
Admin:    +905551000001
Aşçı 1:   +905551000010  (Fatma Hanım)
Aşçı 2:   +905551000011  (Ayşe Kaya)
Alıcı 1:  +905551000020  (Mehmet Yılmaz)
```

---

## 5. Supabase Cloud Projesi Oluşturma

1. **https://supabase.com** → Dashboard → New Project

2. **Proje ayarları:**
   ```
   Organization: [şirket adın]
   Name: ev-yemekleri
   Database Password: [güçlü şifre oluştur, kaydet!]
   Region: eu-central-1 (Frankfurt) ← KVKK için önemli
   ```

3. **Proje oluşturulunca** şu bilgileri kaydet:
   - Project URL: `https://xxxxxxxxxxxx.supabase.co`
   - anon key: `eyJhbGci...`
   - service_role key: `eyJhbGci...` (⚠️ gizli tut!)

4. **CLI ile projeye bağlan:**
   ```bash
   supabase login   # browser açılır, token al

   supabase link --project-ref xxxxxxxxxxxx
   # Örnek: supabase link --project-ref abcdefghijklmnop

   # Bağlantıyı doğrula
   supabase projects list
   ```

---

## 6. Cloud'a Push Etme

```bash
# Migration'ları cloud'a gönder
supabase db push

# İlerlemeyi takip et — her migration sırayla çalışır
# ✔ applied 001_extensions.sql
# ✔ applied 002_enums.sql
# ...
# ✔ applied 010_cron.sql

# Durumu kontrol et
supabase migration list
```

> ⚠️ **PostGIS notu:** Supabase Cloud'da PostGIS varsayılan olarak aktiftir.  
> Ama `001_extensions.sql` zaten `IF NOT EXISTS` kullanıyor — güvenli.

---

## 7. Auth Ayarları

Supabase Dashboard → Authentication → Settings:

### 7a. SMS (OTP) — Netgsm

```
Provider: Custom SMS
API URL: https://api.netgsm.com.tr/sms/send/get
# Headers: Content-Type: application/json
# Body: (Netgsm formatı — lib/netgsm/ içinde hazır)
```

**Local geliştirmede** sahte OTP kullan:
```bash
# supabase/config.toml zaten ayarlı:
# [auth.sms]
# enable_confirmations = false
# Local'de her OTP "123456" olarak kabul edilir
```

### 7b. JWT Custom Claims (Rol bazlı erişim için)

Dashboard → Authentication → Hooks → **Custom Access Token**

```sql
-- Bu fonksiyon 007_rls.sql'de tanımlandı
-- JWT'ye role claim ekler: { "role": "chef" }
-- RLS politikaları bunu kullanır
```

Alternatif olarak handle_new_user trigger'ı `app_metadata` ekler:

```sql
-- 006_functions_triggers.sql'deki handle_new_user'a ekle:
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data ||
  jsonb_build_object('role', raw_user_meta_data->>'role')
WHERE id = NEW.id;
```

### 7c. Email (Resend)

Dashboard → Project Settings → Auth → SMTP:
```
SMTP Host: smtp.resend.com
Port: 465
Username: resend
Password: re_xxxxxxxxxxxx  ← Resend API key
Sender: noreply@evyemekleri.com
```

### 7d. Redirect URLs

Dashboard → Authentication → URL Configuration:
```
Site URL: https://evyemekleri.com
Redirect URLs:
  https://evyemekleri.com/**
  https://www.evyemekleri.com/**
  http://localhost:3000/**      ← Local geliştirme için
```

---

## 8. Storage Bucket'ları Oluşturma

`008_storage.sql` migration'ı bucket'ları otomatik oluşturur. Kontrol et:

```bash
supabase db execute --sql "SELECT * FROM storage.buckets;"

# Şu bucket'lar görünmeli:
# avatars          — public
# menu-photos      — public
# chef-documents   — private (kimlik belgeleri)
# blog-images      — public
```

**Cloud'da manuel kontrol:** Dashboard → Storage

Bucket'lar yoksa manuel oluştur:
```bash
# Supabase CLI ile (opsiyonel)
supabase storage create avatars --public
supabase storage create menu-photos --public
supabase storage create chef-documents  # private (default)
supabase storage create blog-images --public
```

---

## 9. Edge Functions & Cron

### pg_cron Aktifleştirme

Dashboard → Database → Extensions → **pg_cron** → Enable

```bash
# Cron görevleri 010_cron.sql'de tanımlı
# Migration push'tan sonra kontrol et:
supabase db execute --sql "SELECT jobname, schedule FROM cron.job ORDER BY jobname;"

# Beklenen çıktı:
# auto-cancel-pending-orders  | */15 * * * *
# check-vacation-end          | 30 * * * *
# cleanup-old-audit-logs      | 0 4 1 * *
# cleanup-old-notifications   | 0 3 * * 0
# deactivate-expired-coupons  | 0 2 * * *
# refresh-popular-menus       | 0 * * * *
# reset-daily-stock           | 0 21 * * *
```

### FCM Push (Firebase)

`.env.local`'a ekle:
```bash
FIREBASE_PROJECT_ID=ev-yemekleri-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@ev-yemekleri-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## 10. Next.js .env Ayarları

`.env.example` dosyasını kopyala ve doldur:

```bash
cp .env.example .env.local
```

**Minimum gerekli değişkenler (local geliştirme):**
```bash
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  ← supabase start çıktısından
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...      ← supabase start çıktısından

# Diğerleri local'de opsiyonel (OTP fake, ödeme sandbox)
```

**Production değerleri:**
```bash
# Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # ASLA client'a verme!

# İyzico Sandbox (önce test, sonra production)
IYZICO_API_KEY=sandbox-xxxxx
IYZICO_SECRET_KEY=sandbox-xxxxx
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# Netgsm
NETGSM_USERCODE=xxxx
NETGSM_PASSWORD=xxxx

# Resend
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 11. Kontrol Listesi

Migration tamamlandıktan sonra şunları doğrula:

### Veritabanı
- [ ] `supabase db reset` hatasız çalıştı
- [ ] 17 tablo oluştu (pg_tables sorgusu)
- [ ] Seed data yüklendi (Studio → Table Editor → users)
- [ ] RLS aktif (Studio → Table Editor → users → RLS aktif)

### Auth
- [ ] Phone auth aktif
- [ ] Test OTP çalışıyor (local'de her zaman geçer)
- [ ] handle_new_user trigger var

### Storage
- [ ] 4 bucket oluştu
- [ ] avatars ve menu-photos public

### Fonksiyonlar
- [ ] `find_nearby_chefs` çalışıyor
- [ ] `generate_order_number` çalışıyor

```sql
-- Hızlı test:
SELECT public.generate_order_number();
-- Çıktı: EV-2024-00001

SELECT public.find_nearby_chefs(37.002, 35.321, 5000);
-- Çıktı: Adana çevresindeki aşçılar
```

### View'lar
- [ ] 009_views.sql uygulandı
- [ ] `popular_menu_items` materialized view var

```sql
SELECT COUNT(*) FROM public.popular_menu_items;
-- Çıktı: 8 (açık aşçıların stoklu menüleri)
```

---

## 12. Sık Karşılaşılan Sorunlar

### "PostGIS extension not found"
```bash
# Supabase Pro planında olmayabilir
# Dashboard → Database → Extensions → postgis → Enable
# Sonra migration'ı tekrar çalıştır
```

### "RLS policy violation" hataları
```sql
-- Service role key kullandığını doğrula (RLS bypass eder)
-- lib/supabase/server.ts → supabaseAdmin kullan
-- NOT: Next.js client'ta service_role KEY'i asla kullanma!
```

### Migration sırası hatası (foreign key)
```bash
# Migration'lar 001→010 sırayla çalışmalı
# "supabase db push" bunu otomatik yapar
# Manuel çalıştırıyorsan sırayı koru
```

### Seed "ON CONFLICT" hatası
```sql
-- Zaten seed yapıldıysa ve tekrar çalıştırıyorsan:
-- ON CONFLICT (id) DO NOTHING sayesinde hata vermez
-- Güvenli, tekrar çalıştırılabilir
```

### Local Supabase durmuyor
```bash
supabase stop       # Docker container'ları durdur
supabase start      # Yeniden başlat
supabase status     # Durumu kontrol et
```

### "Permission denied for table users"
```sql
-- anon key ile INSERT yapmaya çalışıyorsundur
-- Auth gerektiren endpoint'lerde authenticated token kullan
-- Veya service_role ile çalıştır (SADECE sunucu tarafında)
```

---

## Referans

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Ref](https://supabase.com/docs/reference/cli)
- [PostGIS Docs](https://postgis.net/docs/)
- [pg_cron GitHub](https://github.com/citusdata/pg_cron)
- [İyzico API Docs](https://dev.iyzipay.com)

---

*Son güncelleme: Mart 2026 — EV YEMEKLERİ v1.0 MVP*
