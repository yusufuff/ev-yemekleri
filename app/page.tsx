// @ts-nocheck
import Link from "next/link"

export default function HomePage() {
  return (
    <main>
      <section className="bg-gradient-to-br from-[#4A2C0E] to-[#7A4A20] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-6">EV YEMEKLERI</h1>
          <p className="text-lg opacity-80 mb-8">Cevrenizden ev yapimi yemek siparis edin.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/kesif" className="bg-[#E8622A] text-white font-bold py-4 px-8 rounded-xl text-lg">Kesfet</Link>
            <Link href="/giris" className="bg-white text-[#4A2C0E] font-bold py-4 px-8 rounded-xl text-lg">Giris Yap</Link>
          </div>
        </div>
      </section>
      <section className="py-16 px-6 bg-[#FAF6EF]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm"><div className="text-4xl mb-3">📍</div><div className="font-bold">Konum</div></div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm"><div className="text-4xl mb-3">🔍</div><div className="font-bold">Kesfet</div></div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm"><div className="text-4xl mb-3">🛒</div><div className="font-bold">Siparis</div></div>
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm"><div className="text-4xl mb-3">🏠</div><div className="font-bold">Teslim</div></div>
        </div>
      </section>
      <section className="py-16 px-6 bg-[#3D6B47] text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Asci Ol, Kazanmaya Basla</h2>
        <Link href="/giris" className="bg-white text-[#3D6B47] font-bold py-4 px-8 rounded-xl text-lg inline-block mt-4">Asci Ol</Link>
      </section>
    </main>
  )
}