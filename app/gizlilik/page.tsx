export default function GizlilikPolitikasi() {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto', padding: '40px 24px', color: '#3D2B1A', background: '#FAF6EF', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, color: '#E67E22', marginBottom: 8 }}>🔒 Gizlilik Politikası</h1>
        <p style={{ color: '#888' }}>Kişisel verilerinizin güvenliği bizim için önceliktir.</p>
      </div>

      {[
        { baslik: '1. Genel Bilgiler', icerik: 'Anneelim ("biz", "platform"), kullanıcılarının gizliliğini korumayı taahhüt eder. Bu Gizlilik Politikası, anneelim.com web sitesi ve mobil uygulaması aracılığıyla toplanan kişisel verilerin nasıl işlendiğini açıklamaktadır. Platformumuzu kullanarak bu politikayı kabul etmiş sayılırsınız.' },
        { baslik: '2. Toplanan Veriler', liste: ['Ad, soyad ve e-posta adresi', 'Telefon numarası', 'Teslimat adresi bilgileri', 'Konum bilgisi (yalnızca yakındaki aşçıları göstermek için)', 'Sipariş geçmişi ve tercihler', 'Uygulama kullanım verileri'] },
        { baslik: '3. Verilerin Kullanım Amacı', liste: ['Sipariş oluşturma ve teslimat hizmetlerinin sağlanması', 'Kullanıcı hesabının yönetilmesi', 'Müşteri desteği sağlanması', 'Platform güvenliğinin korunması', 'Yasal yükümlülüklerin yerine getirilmesi'] },
        { baslik: '4. Veri Güvenliği', icerik: 'Kişisel verileriniz SSL şifreleme ile korunmakta ve güvenli sunucularda saklanmaktadır. Ödeme bilgileriniz iyzico güvencesiyle işlenmekte olup platformumuzda saklanmamaktadır.' },
        { baslik: '5. Üçüncü Taraflarla Paylaşım', liste: ['Siparişin tamamlanması için aşçı ile teslimat bilgilerinin paylaşılması', 'Ödeme işlemleri için iyzico ile bilgi paylaşımı', 'Yasal zorunluluk halinde yetkili makamlarla paylaşım'] },
        { baslik: '6. Konum Bilgisi', icerik: 'Uygulama yalnızca yakınındaki ev aşçılarını göstermek amacıyla konum bilginize erişim talep eder. Konum bilgisi kesin adresinizi aşçılarla paylaşmaz. Konum iznini istediğiniz zaman telefon ayarlarından kaldırabilirsiniz.' },
        { baslik: '7. Çerezler', icerik: 'Web sitemiz oturum yönetimi ve kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanmaktadır. Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz.' },
        { baslik: '8. Kullanıcı Hakları', liste: ['Kişisel verilerinizin işlenip işlenmediğini öğrenme', 'İşlenen verileriniz hakkında bilgi talep etme', 'Yanlış verilerin düzeltilmesini isteme', 'Verilerinizin silinmesini talep etme', 'Verilerinizin aktarıldığı üçüncü kişileri öğrenme'] },
        { baslik: '9. Veri Saklama Süresi', icerik: 'Kişisel verileriniz hesabınız aktif olduğu sürece saklanmaktadır. Hesabınızı silmeniz halinde verileriniz yasal saklama süreleri dışında 30 gün içinde silinmektedir.' },
        { baslik: '10. İletişim', icerik: 'Gizlilik politikamız hakkında sorularınız için: info@anneelim.com' },
      ].map((b, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 28, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: 20, color: '#E67E22', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #FFF5EC' }}>{b.baslik}</h2>
          {b.icerik && <p style={{ color: '#555', lineHeight: 1.8, fontSize: 15 }}>{b.icerik}</p>}
          {b.liste && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {b.liste.map((m, j) => (
                <li key={j} style={{ padding: '8px 0 8px 24px', position: 'relative', color: '#555', fontSize: 15, borderBottom: j < b.liste.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#E67E22', fontWeight: 700 }}>✓</span>
                  {m}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 40 }}>
        Son güncelleme: Nisan 2026 · © 2026 Anneelim
      </p>
    </div>
  )
}