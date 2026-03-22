import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kullanım Koşulları — EV YEMEKLERİ',
}

export default function KullanimKosullariPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: '#4A2C0E', marginBottom: 8 }}>
          Kullanım Koşulları
        </h1>
        <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 40 }}>
          Son güncelleme: Mart 2025
        </p>

        {[
          {
            title: '1. Genel',
            content: 'Bu kullanım koşulları, anneelim.com ("Platform") üzerinden sunulan hizmetlerin kullanımına ilişkin kuralları düzenlemektedir. Platforma erişim sağlayarak bu koşulları kabul etmiş sayılırsınız.',
          },
          {
            title: '2. Hizmet Tanımı',
            content: 'Platform; ev aşçıları ile yemek sipariş etmek isteyen kullanıcıları buluşturan bir aracı platformdur. Platform, yemek satışını doğrudan gerçekleştirmez; aşçı ve alıcı arasındaki iletişimi ve ödeme altyapısını sağlar.',
          },
          {
            title: '3. Kullanıcı Yükümlülükleri',
            content: 'Kullanıcılar; gerçek ve güncel bilgilerle kayıt olmayı, hesap güvenliğini sağlamayı, platformu yasalara aykırı amaçlarla kullanmamayı, başka kullanıcıların haklarına saygı göstermeyi ve platform kurallarına uymayı kabul eder.',
          },
          {
            title: '4. Aşçı Yükümlülükleri',
            content: 'Aşçı olarak kayıt olan kullanıcılar; sattıkları yemeklerin gıda güvenliği standartlarına uygun olduğunu, malzemeleri doğru beyan ettiklerini, alerjen bilgilerini eksiksiz paylaştıklarını ve siparişleri zamanında hazırlayıp teslim edeceklerini kabul eder. Platform, gıda üretiminin yasal koşullarına uygunluktan kullanıcıyı sorumlu tutar.',
          },
          {
            title: '5. Ödeme Koşulları',
            content: 'Ödemeler iyzico altyapısı üzerinden güvenli biçimde işlenir. Platform her sipariş üzerinden %10 hizmet bedeli tahsil eder. Aşçı kazançları sipariş tesliminin ardından 24 saat içinde bildirilen IBAN\'a aktarılır. İptal edilen siparişlerde ödeme koşulları iptal politikasına göre belirlenir.',
          },
          {
            title: '6. İptal ve İade',
            content: 'Sipariş onaylanmadan önce iptal ücretsizdir. Hazırlık aşamasına geçmiş siparişlerin iptali aşçının onayına bağlıdır. Teslim edilen siparişlerde iade, ürünün bozuk veya yanlış teslim edilmesi durumunda 24 saat içinde talepte bulunulması halinde değerlendirilir.',
          },
          {
            title: '7. Sorumluluk Sınırlaması',
            content: 'Platform, aşçılar tarafından üretilen yemeklerin kalitesi, hijyeni veya içeriğinden doğrudan sorumlu tutulamaz. Platform, teknik arızalar, internet kesintileri veya üçüncü taraf hizmet sağlayıcılarından kaynaklanan aksaklıklardan sorumlu değildir.',
          },
          {
            title: '8. Fikri Mülkiyet',
            content: 'Platform üzerindeki tüm içerik, tasarım ve yazılım Ev Yemekleri Platformu\'na aittir. Kullanıcıların yüklediği fotoğraf ve içerikler için gerekli hakların sahibi olduğu kabul edilir. İzinsiz kopyalama ve dağıtım yasaktır.',
          },
          {
            title: '9. Hesap Askıya Alma',
            content: 'Platform; kurallara aykırı davranış, sahte içerik paylaşımı, kullanıcı şikayetleri veya yasal gereklilikler nedeniyle herhangi bir kullanıcı hesabını önceden bildirmeksizin askıya alma veya silme hakkını saklı tutar.',
          },
          {
            title: '10. Uygulanacak Hukuk',
            content: 'Bu koşullar Türkiye Cumhuriyeti kanunlarına tabidir. Uyuşmazlıkların çözümünde Türk mahkemeleri yetkilidir.',
          },
          {
            title: '11. Değişiklikler',
            content: 'Platform, kullanım koşullarını dilediği zaman güncelleme hakkını saklı tutar. Güncellemeler platform üzerinden duyurulur. Güncel koşullar yayımlandıktan sonra platformu kullanmaya devam etmek, yeni koşulların kabulü anlamına gelir.',
          },
        ].map(({ title, content }) => (
          <div key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#4A2C0E', marginBottom: 10 }}>{title}</h2>
            <p style={{ fontSize: 14, color: '#5A4A3A', lineHeight: 1.8, margin: 0 }}>{content}</p>
          </div>
        ))}

        <div style={{ marginTop: 40, padding: '20px 24px', background: '#F0EBE3', borderRadius: 12, fontSize: 13, color: '#8A7B6B' }}>
          Sorularınız için{' '}
          <a href="mailto:destek@anneelim.com" style={{ color: '#E8622A', textDecoration: 'none', fontWeight: 600 }}>
            destek@anneelim.com
          </a>{' '}
          adresine ulaşabilirsiniz.
        </div>

      </div>
    </div>
  )
}