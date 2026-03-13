/**
 * Ana Sayfa
 */
import Link from 'next/link'
import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'

export const metadata: Metadata = {
  title: 'EV YEMEKLERİ — Mahallendeki Ev Aşçılarından Sipariş Ver',
}

const POPULAR_ITEMS = [
  { emoji: '🍲', name: 'Kuru Fasulye & Pilav', price: 55, chef: 'Fatma H.', rating: '4.9', km: '1.2' },
  { emoji: '🥙', name: 'İmam Bayıldı',         price: 45, chef: 'Ayşe K.',  rating: '4.7', km: '2.8' },
  { emoji: '🍮', name: 'Sütlaç',               price: 35, chef: 'Zeynep A.', rating: '5.0', km: '0.9' },
]

const HOW_STEPS = [
  { icon: '📍', title: 'Konumunu Paylaş',  desc: 'Yakınındaki ev aşçılarını görmek için konumunu belirle.' },
  { icon: '🔍', title: 'Menüleri Keşfet',  desc: 'Mutfak türü, mesafe ve puana göre filtrele.' },
  { icon: '🛒', title: 'Sipariş Ver',       desc: 'Güvenli ödeme yap, aşçı hazırlamaya başlasın.' },
  { icon: '🏠', title: 'Teslim Al',         desc: 'Kapına gelsin veya gel-al yöntemiyle teslim al.' },
]

const TESTIMONIALS = [
  { text: '"Fatma Hanım\'ın mercimek çorbası tam annem gibi. Her gün sipariş versem çekinmiyorum!"', author: 'Mehmet Y., Adana', stars: 5 },
  { text: '"İş yerinde yemek sorununu çözdü. Sıcak, ev yapımı, uygun fiyatlı. Herkese öneririm."',  author: 'Selin K., İzmir',  stars: 5 },
  { text: '"Aşçı olarak katıldım, ilk haftada 15 sipariş aldım. Platform çok kullanışlı."',          author: 'Gülay A., Aşçı',   stars: 5 },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF]">

      {/* Navbar */}
      <nav className="bg-white border-b border-[#E8E0D4] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif font-black text-xl text-[#4A2C0E] tracking-tight">
            EV YEMEKLERİ
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/kesif" className="text-sm font-medium text-[#8A7B6B] hover:text-[#4A2C0E] hidden sm:block">
              Keşfet
            </Link>
            <Link href="/giris"
              className="px-4 py-2 text-sm font-semibold text-[#4A2C0E] border border-[#E8E0D4] rounded-lg hover:border-[#E8622A] hover:text-[#E8622A] transition-colors">
              Giriş Yap
            </Link>
            <Link href="/kayit"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#E8622A] rounded-lg hover:bg-[#d4541e] transition-colors">
              ✨ Kayıt Ol
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <HeroSection />

      {/* Nasıl Çalışır */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-serif text-2xl font-bold text-[#4A2C0E] mb-10 text-center">
          Nasıl Çalışır?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {HOW_STEPS.map((step, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#F5EDD8] border-2 border-[#E8E0D4] flex items-center justify-center text-2xl mx-auto mb-3">
                {step.icon}
              </div>
              <div className="font-bold text-[#4A2C0E] text-sm mb-1">{step.title}</div>
              <div className="text-[#8A7B6B] text-xs leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Populer Menuler */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold text-[#4A2C0E]">
            Bugünün Popüler Menüleri
          </h2>
          <Link href="/kesif" className="text-[#E8622A] text-sm font-semibold hover:underline">
            Tümünü Gör →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {POPULAR_ITEMS.map((item, i) => (
            <Link href="/kesif" key={i}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E8E0D4]/60 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="h-36 bg-gradient-to-br from-[#FFECD2] to-[#FCB69F] flex items-center justify-center text-6xl">
                {item.emoji}
              </div>
              <div className="p-4">
                <div className="font-semibold text-[#4A2C0E] text-sm mb-2">{item.name}</div>
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xl font-bold text-[#E8622A]">₺{item.price}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#3D6B47] font-semibold">⭐ {item.rating}</span>
                </div>
                <div className="text-[#8A7B6B] text-xs mt-2">👩‍🍳 {item.chef} · {item.km} km</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Asci Ol CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #3D6B47, #2e5236)' }}>
          <div className="absolute right-8 text-[100px] opacity-10 select-none hidden sm:block">👩‍🍳</div>
          <div>
            <div className="text-[#6BA37A] text-xs font-bold tracking-[2px] uppercase mb-2">EV AŞÇILARI İÇİN</div>
            <h2 className="font-serif text-2xl sm:text-3xl font-black text-white mb-2">Mutfağın Sana Gelir Getirsin</h2>
            <p className="text-white/70 text-sm mb-6">Kendi saatlerinde çalış, kendi fiyatını belirle. Komisyon yalnızca başarılı siparişlerden.</p>
            <Link href="/kayit" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#3D6B47] font-bold rounded-xl hover:bg-white/90 transition-colors text-sm">
              🍳 Hemen Aşçı Ol →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-shrink-0">
            {[
              { n: '%90', label: 'Kazancın Sende' },
              { n: '0₺',  label: 'Üyelik Ücreti' },
              { n: '24s', label: 'Ödeme Süresi' },
              { n: '⭐',  label: 'Rozet Sistemi' },
            ].map(s => (
              <div key={s.n} className="bg-white/10 rounded-xl px-4 py-3 text-center">
                <div className="text-white font-serif text-xl font-black">{s.n}</div>
                <div className="text-white/60 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Yorumlar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <h2 className="font-serif text-2xl font-bold text-[#4A2C0E] mb-6">Kullanıcı Yorumları</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-[#F5EDD8] rounded-2xl p-5 border-l-4 border-[#E8622A]">
              <p className="text-[#4A2C0E] text-sm italic leading-relaxed mb-3">{t.text}</p>
              <div className="text-[#E8622A] text-sm font-bold mb-0.5">{'★'.repeat(t.stars)}</div>
              <div className="text-[#7A4A20] text-xs font-semibold">— {t.author}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#4A2C0E] text-white/60 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="font-serif font-black text-white text-lg">EV YEMEKLERİ</div>
          <div className="flex gap-6">
            <Link href="/kesif"      className="hover:text-white transition-colors">Keşfet</Link>
            <Link href="/kayit"      className="hover:text-white transition-colors">Aşçı Ol</Link>
            <Link href="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link>
            <Link href="/gizlilik"   className="hover:text-white transition-colors">Gizlilik</Link>
          </div>
          <div>© {new Date().getFullYear()} Ev Yemekleri</div>
        </div>
      </footer>

    </div>
  )
}