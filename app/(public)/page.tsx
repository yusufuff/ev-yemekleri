// @ts-nocheck
"use client"
import Link from "next/link"
import { useState, useEffect } from "react"

const popularMenus = [
  { emoji: "🍲", name: "Kuru Fasulye & Pilav", price: 55, chef: "Fatma H.", distance: "1.2 km", rating: 4.9, stock: 5, maxStock: 12, badge: "green" },
  { emoji: "🥙", name: "İmam Bayıldı", price: 45, chef: "Ayşe K.", distance: "2.8 km", rating: 4.7, stock: 2, maxStock: 12, badge: "orange" },
  { emoji: "🍰", name: "Sütlaç", price: 35, chef: "Zeynep A.", distance: "0.9 km", rating: 5.0, stock: 8, maxStock: 10, badge: "green" },
  { emoji: "🥗", name: "Mercimek Çorbası", price: 30, chef: "Gülay T.", distance: "3.1 km", rating: 4.8, stock: 6, maxStock: 10, badge: "green" },
  { emoji: "🥐", name: "Peynirli Börek", price: 40, chef: "Hatice K.", distance: "1.7 km", rating: 4.9, stock: 3, maxStock: 8, badge: "orange" },
  { emoji: "🍮", name: "Kazandibi", price: 38, chef: "Emine S.", distance: "2.2 km", rating: 4.6, stock: 7, maxStock: 10, badge: "green" },
]

const testimonials = [
  { text: "Fatma Hanım'ın mercimek çorbası tam annem gibi yapıyor. Her gün sipariş versem çekinmiyorum!", author: "Mehmet Y., Adana", stars: 5 },
  { text: "İş yerinde yemek sorunu çözdü. Sıcak, ev yapımı, uygun fiyatlı. Herkese öneririm.", author: "Selin K., İzmir", stars: 5 },
  { text: "Aşçı olarak katıldım, ilk haftada 15 sipariş aldım. Platform çok kullanışlı.", author: "Gülay A., Aşçı", stars: 5 },
]

const stats = [
  { value: "1.240+", label: "Ev Aşçısı" },
  { value: "48.000+", label: "Mutlu Sipariş" },
  { value: "12", label: "Şehir" },
  { value: "4.9", label: "Ortalama Puan" },
]

export default function HomePage() {
  const [searchLocation, setSearchLocation] = useState("")
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrentTestimonial(p => (p + 1) % testimonials.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <main className="min-h-screen bg-[#FAF6EF]">

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-[#4A2C0E] via-[#7A4A20] to-[#B87333] text-white py-24 px-6 overflow-hidden">
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[180px] opacity-10 select-none">🍽️</div>
        <div className="max-w-4xl mx-auto relative">
          <div className="inline-block bg-[#E8622A] text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            🟢 Şu an 24 aşçı aktif · Adana
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            Mahallendeki En İyi<br />
            <span className="text-[#F28B5E]">Ev Yemekleri</span>
          </h1>
          <p className="text-lg opacity-80 mb-8 max-w-lg">
            2–10 km çevrenizdeki ev aşçılarından taze, sıcak yemek sipariş edin. Katkısız, sağlıklı, lezzetli.
          </p>
          <div className="flex max-w-md bg-white rounded-xl overflow-hidden shadow-2xl">
            <input
              type="text"
              value={searchLocation}
              onChange={e => setSearchLocation(e.target.value)}
              placeholder="📍 Konumunuzu girin…"
              className="flex-1 px-4 py-4 text-[#4A2C0E] text-sm outline-none"
            />
            <Link href="/kesif" className="bg-[#E8622A] text-white px-6 py-4 font-bold text-sm whitespace-nowrap hover:bg-[#d4541e] transition">
              Keşfet →
            </Link>
          </div>
          <div className="flex gap-6 mt-8 flex-wrap">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-black text-[#F28B5E]">{s.value}</div>
                <div className="text-xs opacity-60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#4A2C0E] mb-2">Nasıl Çalışır?</h2>
          <p className="text-center text-[#8A7B6B] mb-12">4 basit adımda ev yemeği kapında</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "📍", title: "Konumunu Paylaş", desc: "Yakınındaki ev aşçılarını görmek için konumunu belirle" },
              { icon: "🔍", title: "Menüleri Keşfet", desc: "Mutfak türü, mesafe ve puana göre filtrele" },
              { icon: "🛒", title: "Sipariş Ver", desc: "Güvenli ödeme yap, aşçı hazırlamaya başlasın" },
              { icon: "🏠", title: "Teslim Al", desc: "Kapına gelsin veya gel-al yöntemiyle teslim al" },
            ].map((step, i) => (
              <div key={i} className="text-center p-6 bg-[#FAF6EF] rounded-2xl hover:shadow-md transition">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border-2 border-[#E8E0D4]">
                  {step.icon}
                </div>
                <div className="font-bold text-[#4A2C0E] mb-2">{step.title}</div>
                <div className="text-sm text-[#8A7B6B] leading-relaxed">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPÜLER MENÜLER */}
      <section className="py-16 px-6 bg-[#FAF6EF]">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#4A2C0E]">Bugünün Popüler Menüleri</h2>
              <p className="text-[#8A7B6B] mt-1">Çevrenizdeki aşçıların bugünkü özel yemekleri</p>
            </div>
            <Link href="/kesif" className="text-[#E8622A] font-bold text-sm hover:underline">Tümünü Gör →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {popularMenus.map((item, i) => (
              <Link href="/kesif" key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-[#E8E0D4]">
                <div className="h-36 bg-gradient-to-br from-[#F5DEB3] to-[#DEB887] flex items-center justify-center text-5xl">
                  {item.emoji}
                </div>
                <div className="p-4">
                  <div className="font-bold text-[#4A2C0E] mb-1">{item.name}</div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#E8622A] font-black text-xl">₺{item.price}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.badge === 'green' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                      ⭐ {item.rating}
                    </span>
                  </div>
                  <div className="text-xs text-[#8A7B6B] flex justify-between mb-2">
                    <span>👩‍🍳 {item.chef} · {item.distance}</span>
                    <span>{item.stock} porsiyon</span>
                  </div>
                  <div className="bg-[#E8E0D4] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.stock / item.maxStock < 0.25 ? 'bg-red-500' : item.stock / item.maxStock < 0.5 ? 'bg-[#E8622A]' : 'bg-[#3D6B47]'}`}
                      style={{ width: `${(item.stock / item.maxStock) * 100}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AŞÇI OL CTA */}
      <section className="py-16 px-6 bg-[#3D6B47]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-white">
            <div className="text-xs font-bold uppercase tracking-widest text-green-300 mb-2">Aşçılar İçin</div>
            <h2 className="text-3xl font-bold mb-3">Mutfağın Sana Gelir Getirsin</h2>
            <p className="opacity-80 mb-6 max-w-md">Kendi saatlerinde çalış, kendi fiyatını belirle. Kayıt tamamen ücretsiz, sadece satıştan %10 komisyon.</p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/giris" className="bg-white text-[#3D6B47] font-bold py-3 px-8 rounded-xl hover:bg-[#F5EDD8] transition">
                🍳 Hemen Aşçı Ol →
              </Link>
              <Link href="/hakkimizda" className="border border-white text-white font-bold py-3 px-8 rounded-xl hover:bg-white hover:text-[#3D6B47] transition">
                Daha Fazla Bilgi
              </Link>
            </div>
          </div>
          <div className="text-[120px] opacity-20 select-none hidden md:block">👩‍🍳</div>
        </div>
      </section>

      {/* KULLANICI YORUMLARI */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#4A2C0E] mb-10">Kullanıcı Yorumları</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#F5EDD8] rounded-2xl p-6 border-l-4 border-[#E8622A]">
                <p className="text-[#4A2C0E] italic text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="text-[#E8622A] text-sm mb-1">{"★".repeat(t.stars)}</div>
                <div className="text-xs font-bold text-[#7A4A20]">— {t.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#4A2C0E] text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-black text-lg mb-2">EV YEMEKLERİ</div>
              <div className="text-xs opacity-60 leading-relaxed">Mahallenizdeki en iyi ev yemeklerini kapınıza getiriyoruz.</div>
            </div>
            <div>
              <div className="font-bold mb-3 text-[#F28B5E]">Platform</div>
              <div className="flex flex-col gap-2 text-sm opacity-70">
                <Link href="/kesif" className="hover:opacity-100">Keşfet</Link>
                <Link href="/giris" className="hover:opacity-100">Giriş Yap</Link>
                <Link href="/hakkimizda" className="hover:opacity-100">Hakkımızda</Link>
              </div>
            </div>
            <div>
              <div className="font-bold mb-3 text-[#F28B5E]">Aşçılar</div>
              <div className="flex flex-col gap-2 text-sm opacity-70">
                <Link href="/giris" className="hover:opacity-100">Aşçı Ol</Link>
                <Link href="/hakkimizda" className="hover:opacity-100">SSS</Link>
              </div>
            </div>
            <div>
              <div className="font-bold mb-3 text-[#F28B5E]">İletişim</div>
              <div className="text-sm opacity-70">destek@evyemekleri.com</div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs opacity-40">
            © 2025 Ev Yemekleri. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>

    </main>
  )
}
