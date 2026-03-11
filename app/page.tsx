// @ts-nocheck
import Link from "next/link"

export default function HomePage() {
  return (
    <main>
      <section className="bg-gradient-to-br from-[#4A2C0E] to-[#7A4A20] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-6">Mahallendeki En İyi Ev Yemekleri</h1>
          <p className="text-lg opacity-80 mb-8">2-10 km çevrenizdeki ev aşçılarından taze, sıcak yemek sipariş edin.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/kesif" className="bg-[#E8622A] text-white font-bold py-4 px-8 rounded-xl text-lg">🔍 Keşfet</Link>
            <Link href="/giris" className="bg-white text-[#4A2C0E] font-bold py-4 px-8 rounded-xl text-lg">Giriş Yap</Link>
          </div>
        </div>
      </section>
      <section className="py-16 px-6 bg-[#FAF6EF]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#4A2C0E] mb-12">Nasıl Çalışır?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm"><div className="text-4xl mb-3">📍</div><div className="font-bold text-[#4A2C0E] mb-2">Konumunu Paylaş</div><div className="text-sm text-[#8A7B6B]">Yakınındaki aşçıları gör</div></div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm"><div className="text-4xl mb-3">🔍</div><div className="font-bold text-[#4A2C0E] mb-2">Menüleri Keşfet</div><div className="text-sm text-[#8A7B6B]">Filtrele ve seç</div></div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm"><div className="text-4xl mb-3">🛒</div><div className="font-bold text-[#4A2C0E] mb-2">Sipariş Ver</div><div className="text-sm text-[#8A7B6B]">Güvenli ödeme yap</div></div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm"><div className="text-4xl mb-3">🏠</div><div className="font-bold text-[#4A2C0E] mb-2">Teslim Al</div><div className="text-sm text-[#8A7B6B]">Kapına gelsin</div></div>
          </div>
        </div>
      </section>
      <section className="py-16 px-6 bg-[#3D6B47] text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Mutfağın Sana Gelir Getirsin</h2>
        <p className="opacity-80 mb-6">Kendi saatlerinde çalış, kendi fiyatını belirle.</p>
        <Link href="/giris" className="bg-white text-[#3D6B47] font-bold py-4 px-8 rounded-xl text-lg inline-block">🍳 Hemen Aşçı Ol →</Link>
      </section>
    </main>
  )
}
