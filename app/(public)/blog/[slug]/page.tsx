import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const POSTS: Record<string, any> = {
  'mercimek-corbasi-tarifi': {
    title: 'Ev Usulü Mercimek Çorbası',
    category: 'Tarif', emoji: '🥣', time: '25 dk', difficulty: 'Kolay', date: '15 Mart 2025',
    desc: 'Annenizin yaptığı gibi, gerçek ev mercimek çorbası.',
    ingredients: [
      '1 su bardağı kırmızı mercimek',
      '1 adet soğan',
      '1 adet havuç',
      '2 diş sarımsak',
      '1 çorba kaşığı tereyağı',
      '1 çay kaşığı kimyon',
      '1 çay kaşığı kırmızı biber',
      'Tuz, karabiber',
      '1 limon (servis için)',
    ],
    steps: [
      'Mercimeği yıkayıp süzün. Soğanı, havucu ve sarımsağı küçük küçük doğrayın.',
      'Tencerede tereyağını eritin. Soğanları pembeleşene kadar kavurun.',
      'Havuç ve sarımsağı ekleyin, 2-3 dakika daha kavurun.',
      'Mercimeği ekleyin, üzerini geçecek kadar su ilave edin (yaklaşık 1.5 lt).',
      'Kaynayana kadar yüksek ateşte, sonra kısık ateşte 20 dakika pişirin.',
      'Blender ile pürüzsüz hale getirin. Kıvamı çok koyu ise biraz su ekleyin.',
      'Baharatları ekleyin, 5 dakika daha kaynatın.',
      'Servis ederken üzerine kızdırılmış tereyağı ve limon sıkın.',
    ],
    tips: 'Çorbanın sırrı kimyonu tereyağında kavurmak. Bu işlem çorbanın aromasını katlar.',
    color: '#FEF3C7',
  },
  'kuru-fasulye-pilav-sirlari': {
    title: 'Kuru Fasulye & Pilav: Ustadan Sırlar',
    category: 'Tarif', emoji: '🍲', time: '90 dk', difficulty: 'Orta', date: '10 Mart 2025',
    desc: 'Türk mutfağının vazgeçilmezi kuru fasulyeyi en lezzetli hale getirmenin püf noktaları.',
    ingredients: [
      '2 su bardağı kuru fasulye (bir gece önceden ıslatılmış)',
      '200 gr kuşbaşı dana eti',
      '1 adet büyük soğan',
      '2 adet domates',
      '2 çorba kaşığı domates salçası',
      '3 çorba kaşığı sıvıyağ',
      'Tuz, karabiber, pul biber',
    ],
    steps: [
      'Islatılmış fasulyeleri yıkayın. Bir tencerede su ile haşlayın, kaynayınca suyu dökün.',
      'Yağı ısıtın, eti kavurun. Soğanı ekleyin, pembeleşene kadar kavurun.',
      'Salça ve domatesleri ekleyin, 5 dakika daha kavurun.',
      'Fasulyeleri ekleyin. Üzerini geçecek kadar sıcak su ilave edin.',
      'Kısık ateşte 60-70 dakika pişirin. Fasulye yumuşayınca tuz ekleyin.',
      'Pilavı ayrıca buharda pişirin. Sadece tereyağı ve tuz ile sade tutun.',
    ],
    tips: 'Tuzu son 10 dakikada ekleyin — erkenden eklenirse fasulye sertleşir.',
    color: '#ECFDF5',
  },
  'evde-asci-olmak': {
    title: 'Ev Aşçısı Olmak: Fatma Hanım\'ın Hikayesi',
    category: 'Hikaye', emoji: '👩‍🍳', time: '5 dk okuma', difficulty: null, date: '5 Mart 2025',
    desc: 'Adana\'dan Fatma Hanım, emeklilikten sonra nasıl platformun en çok sipariş alan aşçısı oldu?',
    ingredients: null,
    steps: null,
    story: [
      '35 yıl okul kantinciliği yapan Fatma Hanım, emekliye ayrıldığında mutfağını bırakmadı. Aksine, daha büyük bir mutfak kitlesi için pişirmeye başladı.',
      '"Çocuklarım büyüdü, evden gitti. Sabahları kalkıp sadece kendim için yemek yapmak çok sıkıcıydı. Bir komşum Ev Yemekleri\'ni anlattı, denedim."',
      'İlk haftada 8 sipariş aldı. Mercimek çorbası, kuru fasulye ve sütlacı bu kadar hızlı bitmişti ki, ertesi gün erkenden kalkmak zorunda kaldı.',
      '"Şimdi sabah 6\'da kalkıyorum, mutlu kalkıyorum. Yemeklerimi sevenleri biliyorum artık. Bazıları her gün sipariş veriyor — artık onları tanıyorum."',
      'Bugün Fatma Hanım, platformda en yüksek puanlı aşçılardan biri. Ayda ortalama 180 sipariş alıyor ve her siparişe kişisel bir not ekliyor.',
    ],
    tips: null,
    color: '#EFF6FF',
  },
  'borek-cesitleri': {
    title: 'Türkiye\'nin 5 Farklı Börek Çeşidi',
    category: 'Tarif', emoji: '🥐', time: '60 dk', difficulty: 'Zor', date: '28 Şubat 2025',
    desc: 'Su böreğinden sigara böreğine, beş farklı börek tarifi.',
    ingredients: [
      'Su böreği için: Hazır yufka, yumurta, peynir, maydanoz',
      'Sigara böreği için: Yufka, beyaz peynir, maydanoz, kızartma yağı',
      'Tepsi böreği için: Yufka, kıyma, soğan, domates',
    ],
    steps: [
      'Su böreği: Yufkaları haşlayın, her katı ıslak bırakarak tepsiye dizin.',
      'Peynir-maydanoz harcını aralara yerleştirin.',
      'Üzerine yumurta-süt karışımı dökün, 180°C\'de 35-40 dk pişirin.',
      'Sigara böreği: İnce yufkayı üçgene kesin, harcı koyun, rulo yapın.',
      'Kızgın yağda altın rengi olana kadar kızartın.',
    ],
    tips: 'Su böreğinde sırrı yufkayı fazla kaynatmamak. 1-2 dakika yeterli.',
    color: '#F3E8FF',
  },
  'saglikli-ev-yemegi': {
    title: 'Sağlıklı Ev Yemeği Pişirmenin 7 Altın Kuralı',
    category: 'İpuçları', emoji: '🥗', time: '10 dk okuma', difficulty: null, date: '20 Şubat 2025',
    desc: 'Daha az yağ, daha fazla lezzet.',
    ingredients: null,
    steps: null,
    story: [
      '1. Yağı azaltın, baharatı artırın. Yağ lezzet verir ama baharatlar da verir. Zeytinyağını ölçerek kullanın.',
      '2. Tuz yerine limon. Birçok yemekte tuzun yarısını limon suyu ile değiştirebilirsiniz.',
      '3. Sebzeyi son ekleyin. Sebzeler uzun pişince vitamin kaybeder. Son 10 dakikada ekleyin.',
      '4. Buharda pişirmeyi deneyin. Haşlama yerine buharlı pişirme besin değerini korur.',
      '5. Porsiyon kontrolü. Büyük tabak küçük miktar yerine, küçük tabak tam dolu daha doyurucu hissettirir.',
      '6. Tam tahıl tercih edin. Beyaz pirinç yerine bulgur veya kahverengi pirinç kullanın.',
      '7. Hazır sos yerine ev yapımı. Hazır sosların içindeki şeker ve tuz miktarı genellikle yüksektir.',
    ],
    tips: null,
    color: '#ECFDF5',
  },
  'sutlac-tarifi': {
    title: 'Fırında Sütlaç: Klasik Tarif',
    category: 'Tarif', emoji: '🍮', time: '45 dk', difficulty: 'Kolay', date: '15 Şubat 2025',
    desc: 'Türk tatlı mutfağının incisi sütlacı, fırında üstü kızarık şekilde yapmanın tam tarifi.',
    ingredients: [
      '1 litre tam yağlı süt',
      '4 çorba kaşığı pirinç unu (veya ince çekilmiş pirinç)',
      '1 su bardağı şeker',
      '1 çay kaşığı vanilya',
      '1 çorba kaşığı nişasta',
    ],
    steps: [
      'Pirinç ununu soğuk süt ile karıştırın, topak kalmaması için çırpın.',
      'Orta ateşte sürekli karıştırarak kaynatın.',
      'Şekeri ekleyin, koyulaşana kadar pişirmeye devam edin (15-20 dk).',
      'Vanilyayı ekleyin, fırın kaplarına bölüştürün.',
      '180°C önceden ısıtılmış fırında üstü kızarana kadar 15-20 dk pişirin.',
      'Soğuduktan sonra buzdolabında en az 2 saat bekletin.',
    ],
    tips: 'Sütlacı karıştırırken dibinin tutmaması için ateşi orta tutun ve sürekli karıştırın.',
    color: '#FEF3C7',
  },
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = POSTS[params.slug]
  if (!post) return { title: 'Yazı Bulunamadı' }
  return {
    title: `${post.title} — EV YEMEKLERİ Blog`,
    description: post.desc,
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug]
  if (!post) notFound()

  const isRecipe = post.ingredients && post.steps

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

      {/* Hero */}
      <div style={{
        height: 220,
        background: post.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 100,
        position: 'relative',
      }}>
        {post.emoji}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(250,246,239,1), transparent)',
          height: 60,
        }} />
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#E8622A', background: '#FEF0EB', padding: '3px 10px', borderRadius: 99 }}>
            {post.category}
          </span>
          {post.difficulty && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8A7B6B', background: '#F5EDD8', padding: '3px 10px', borderRadius: 99 }}>
              {post.difficulty}
            </span>
          )}
          <span style={{ fontSize: 11, color: '#8A7B6B', padding: '3px 0' }}>⏱️ {post.time}</span>
          <span style={{ fontSize: 11, color: '#8A7B6B', padding: '3px 0' }}>📅 {post.date}</span>
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: '#4A2C0E', margin: '0 0 12px', lineHeight: 1.2 }}>
          {post.title}
        </h1>
        <p style={{ fontSize: 15, color: '#8A7B6B', lineHeight: 1.7, marginBottom: 32 }}>{post.desc}</p>

        {/* Tarif */}
        {isRecipe && (
          <>
            <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.06)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>
                🛒 Malzemeler
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {post.ingredients.map((ing: string, i: number) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < post.ingredients.length-1 ? '1px solid #F5EDD8' : 'none', fontSize: 14, color: '#4A2C0E' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8622A', flexShrink: 0 }} />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.06)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#4A2C0E', marginBottom: 16 }}>
                👩‍🍳 Yapılışı
              </h2>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {post.steps.map((step: string, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: 14, fontSize: 14, color: '#4A2C0E', lineHeight: 1.6 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#E8622A', color: 'white',
                      fontSize: 12, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 2,
                    }}>{i+1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}

        {/* Hikaye / İpuçları */}
        {post.story && (
          <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.06)' }}>
            {post.story.map((para: string, i: number) => (
              <p key={i} style={{ fontSize: 15, color: '#4A2C0E', lineHeight: 1.9, marginBottom: i < post.story.length-1 ? 16 : 0 }}>
                {para}
              </p>
            ))}
          </div>
        )}

        {/* İpucu */}
        {post.tips && (
          <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '16px 20px', marginBottom: 32, borderLeft: '4px solid #F59E0B' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#D97706', marginBottom: 4 }}>💡 İPUCU</div>
            <div style={{ fontSize: 14, color: '#4A2C0E', lineHeight: 1.7 }}>{post.tips}</div>
          </div>
        )}

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg, #3D6B47, #2e5236)', borderRadius: 16, padding: '24px', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>Bu tarifi yapmak zahmetli mi geliyor?</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 16 }}>
            Yakınındaki aşçıdan sipariş ver!
          </div>
          <Link href="/kesif" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: 'white', color: '#3D6B47', fontWeight: 700, borderRadius: 10, textDecoration: 'none', fontSize: 13 }}>
            🔍 Aşçıları Keşfet →
          </Link>
        </div>

        {/* Geri */}
        <Link href="/blog" style={{ fontSize: 13, color: '#E8622A', textDecoration: 'none', fontWeight: 600 }}>
          ← Tüm Yazılara Dön
        </Link>

      </div>
    </div>
  )
}