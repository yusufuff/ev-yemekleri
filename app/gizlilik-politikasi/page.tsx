export default function GizlilikPolitikasi() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', fontFamily: 'sans-serif', color: '#4A2C0E' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 24 }}>Gizlilik Politikası</h1>
      <p style={{ marginBottom: 16, color: '#666' }}>Son güncelleme: Nisan 2026</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>1. Toplanan Veriler</h2>
      <p>Anneelim olarak; ad, soyad, telefon numarası, e-posta adresi, teslimat adresi ve konum bilgilerini topluyoruz.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>2. Verilerin Kullanımı</h2>
      <p>Toplanan veriler; sipariş işleme, teslimat, bildirim gönderme ve hizmet kalitesini artırma amacıyla kullanılır.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>3. Kamera İzni</h2>
      <p>Uygulamamız, aşçıların yemek fotoğrafı yükleyebilmesi için kamera erişimi talep eder. Bu izin yalnızca fotoğraf yüklemek amacıyla kullanılır.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>4. Konum İzni</h2>
      <p>Yakınındaki aşçıları gösterebilmek için konum bilginize ihtiyaç duyulur. Konum verisi üçüncü taraflarla paylaşılmaz.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>5. Veri Güvenliği</h2>
      <p>Verileriniz SSL şifrelemesiyle korunur ve Supabase altyapısında güvenli biçimde saklanır.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>6. İletişim</h2>
      <p>Gizlilik ile ilgili sorularınız için: <a href="mailto:info@anneelim.com" style={{ color: '#E8622A' }}>info@anneelim.com</a></p>
    </div>
  )
}