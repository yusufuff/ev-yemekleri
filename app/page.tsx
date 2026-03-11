import Link from `"next/link`"
export default function HomePage() {
  return (
    <div>
      <nav>
        <Link href="/">EV YEMEKLERİ</Link>
        <Link href="/giris">Giriş Yap</Link>
      </nav>
      <h1>Mahallendeki En İyi Ev Yemekleri</h1>
      <Link href="/kesif">Keşfet</Link>
    </div>
  )
}
