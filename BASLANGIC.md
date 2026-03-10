# 🚀 EV YEMEKLERİ — Başlangıç Kılavuzu (Windows)

## ADIM 1 — Supabase Hesabı Aç
1. https://supabase.com → "Start your project"
2. GitHub ile giriş yap
3. "New Project" → İsim: `ev-yemekleri`
4. Region: **Frankfurt (eu-central-1)**
5. Güçlü bir veritabanı şifresi belirle → "Create new project"
6. ~2 dakika bekle (proje kurulunca)
7. Sol menü → Settings → API
   - "Project URL" → kopyala
   - "anon public" key → kopyala
   - "service_role" key → kopyala

## ADIM 2 — .env.local Dosyasını Doldur
1. `.env.local.example` dosyasını kopyala → `.env.local` olarak kaydet
2. Supabase'den kopyaladıklarını yerine yaz:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdef.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```
3. AUTH_SECRET için rastgele bir şey yaz (örn: `my-super-secret-key-2025`)
4. Şimdilik diğerlerini boş bırakabilirsin

## ADIM 3 — npm Kurulumu
Klasörde terminal aç ve:
```bash
npm install
```

## ADIM 4 — Veritabanını Kur
```bash
npx supabase login
# Tarayıcı açılır, Supabase'e giriş yap

npx supabase link --project-ref PROJE_ID
# Proje ID: Supabase URL'indeki kısım → https://PROJE_ID.supabase.co

npx supabase db push
# Tüm tablolar, RLS kuralları otomatik kurulur
```

## ADIM 5 — Test Et
```bash
npm run dev
```
Tarayıcıda aç: http://localhost:3000
- OTP test kodu: **123456** (Netgsm olmadan da çalışır)

## ADIM 6 — GitHub'a Yükle
```bash
git init
git add .
git commit -m "ilk commit"
git branch -M main
git remote add origin https://github.com/KULLANICI/ev-yemekleri.git
git push -u origin main
```

## ADIM 7 — Vercel'e Deploy Et
1. https://vercel.com → "Add New Project"
2. GitHub reposunu seç
3. Environment Variables bölümüne `.env.local`'daki değerleri gir
4. Deploy et!

---
⚠️ Sorun yaşarsan Claude'a sor!
