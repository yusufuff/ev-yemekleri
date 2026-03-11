// @ts-nocheck
import Link from "next/link"

export default function HomePage() {
  return (
    <main>
      <section className="bg-gradient-to-br from-[#4A2C0E] to-[#7A4A20] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-4">Mahallendeki En İyi Ev Yemekleri</h1>
          <p className="text-lg opacity-80 mb-8">2-10 km çevrenizdeki ev aşçılarından taze yemek sipariş edin.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/kesif" className="bg-[#E8622A] text-white font-bold py-4 px-8 rounded-xl text-lg">Keşfet</Link>
            <Link href="/giris" className="bg-white text-[#4A2C0E] font-bold py-4 px-8 rounded-xl text-lg">Giriş Yap</Link>
          </div>
        </div>
      </section>
      <section className="py-16 px-6 bg-[#3D6B47] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Mutfağın Sana Gelir Getirsin</h2>
          <Link href="/giris" className="bg-white text-[#3D6B47] font-bold py-4 px-8 rounded-xl text-lg inline-block mt-4">Aşçı Ol</Link>
        </div>
      </section>
    </main>
  )
}