import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni — EV YEMEKLERİ',
}

export default function KVKKPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: '#4A2C0E', marginBottom: 8 }}>
          KVKK Aydınlatma Metni
        </h1>
        <p style={{ fontSize: 13, color: '#8A7B6B', marginBottom: 40 }}>
          Son güncelleme: Mart 2025
        </p>

        {[
          {
            title: '1. Veri Sorumlusu',
            content: 'Ev Yemekleri Platformu ("Platform") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz. Platform, anneelim.com alan adı üzerinden hizmet vermektedir.',
          },
          {
            title: '2. Toplanan Kişisel Veriler',
            content: 'Platformumuz aracılığıyla aşağıdaki kişisel veriler toplanmaktadır: Ad-soyad, e-posta adresi, telefon numarası, teslimat adresi, sipariş geçmişi, ödeme bilgileri (kart bilgileri tarafımızca saklanmaz), konum bilgisi (yalnızca yakın aşçı gösterimi için), cihaz ve tarayıcı bilgileri.',
          },
          {
            title: '3. Kişisel Verilerin İşlenme Amaçları',
            content: 'Toplanan kişisel veriler; sipariş ve teslimat süreçlerinin yürütülmesi, kullanıcı hesabının oluşturulması ve yönetilmesi, müşteri hizmetleri ve destek sunulması, yasal yükümlülüklerin yerine getirilmesi, platform güvenliğinin sağlanması ve hizmet kalitesinin artırılması amaçlarıyla işlenmektedir.',
          },
          {
            title: '4. Kişisel Verilerin Aktarılması',
            content: 'Kişisel verileriniz; ödeme işlemleri için iyzico Ödeme Hizmetleri A.Ş., SMS bildirimleri için Netgsm, sunucu hizmetleri için Supabase ve Vercel ile yasal zorunluluk halinde yetkili kamu kurum ve kuruluşlarıyla paylaşılabilir. Bu aktarımlar KVKK\'nın 8. ve 9. maddeleri kapsamında gerçekleştirilmektedir.',
          },
          {
            title: '5. Kişisel Verilerin Saklanma Süresi',
            content: 'Kişisel verileriniz, hesap aktif olduğu sürece ve hesap silinmesinden itibaren yasal yükümlülükler çerçevesinde en fazla 10 yıl süreyle saklanmaktadır. Ödeme kayıtları Vergi Usul Kanunu gereği 5 yıl saklanır.',
          },
          {
            title: '6. Kişisel Veri Sahibinin Hakları',
            content: 'KVKK\'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz: Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, düzeltme/silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme, işlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme, kanuna aykırı işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.',
          },
          {
            title: '7. Çerezler (Cookies)',
            content: 'Platformumuz; oturum yönetimi, tercih hatırlama ve analitik amaçlarla çerez kullanmaktadır. Zorunlu çerezler hizmetin çalışması için gereklidir ve devre dışı bırakılamaz. Analitik çerezler kullanıcı davranışlarını anlamamıza yardımcı olur ve tarayıcı ayarlarından devre dışı bırakılabilir.',
          },
          {
            title: '8. Güvenlik',
            content: 'Kişisel verileriniz, yetkisiz erişime, değiştirilmeye, açıklanmaya veya imha edilmeye karşı korumak amacıyla SSL şifreleme, güvenli sunucu altyapısı ve erişim kontrolü gibi teknik ve idari önlemlerle korunmaktadır.',
          },
          {
            title: '9. İletişim',
            content: 'KVKK kapsamındaki haklarınızı kullanmak veya sorularınız için kvkk@anneelim.com adresine e-posta gönderebilirsiniz. Talepleriniz en geç 30 gün içinde yanıtlanacaktır.',
          },
        ].map(({ title, content }) => (
          <div key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#4A2C0E', marginBottom: 10 }}>{title}</h2>
            <p style={{ fontSize: 14, color: '#5A4A3A', lineHeight: 1.8, margin: 0 }}>{content}</p>
          </div>
        ))}

        <div style={{ marginTop: 40, padding: '20px 24px', background: '#F0EBE3', borderRadius: 12, fontSize: 13, color: '#8A7B6B' }}>
          Bu aydınlatma metni hakkında sorularınız için{' '}
          <a href="mailto:kvkk@anneelim.com" style={{ color: '#E8622A', textDecoration: 'none', fontWeight: 600 }}>
            kvkk@anneelim.com
          </a>{' '}
          adresine ulaşabilirsiniz.
        </div>

      </div>
    </div>
  )
}