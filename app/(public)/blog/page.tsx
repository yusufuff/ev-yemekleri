import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog & Tarifler — EV YEMEKLERİ',
  description: 'Ev yemekleri tarifleri, mutfak ipuçları ve aşçı hikayeleri.',
}

const POSTS = [
  {
    slug: 'mercimek-corbasi-tarifi',
    category: 'Tarif',
    emoji: '🥣',
    title: 'Ev Usulü Mercimek Çorbası',
    desc: 'Annenizin yaptığı gibi, gerçek ev mercimek çorbası. Sırrı baharatların ekleniş sırasında.',
    time: '25 dk',
    difficulty: 'Kolay',
    date: '15 Mart 2025',
    color: '#FEF3C7',
  },
  {
    slug: 'kuru-fasulye-pilav-sirlari',
    category: 'Tarif',
    emoji: '🍲',
    title: 'Kuru Fasulye & Pilav: Ustadan Sırlar',
    desc: 'Türk mutfağının vazgeçilmezi kuru fasulyeyi en lezzetli hale getirmenin püf noktaları.',
    time: '90 dk',
    difficulty: 'Orta',
    date: '10 Mart 2025',
    color: '#ECFDF5',
  },
  {
    slug: 'evde-asci-olmak',
    category: 'Hikaye',
    emoji: '👩‍🍳',
    title: 'Ev Aşçısı Olmak: Fatma Hanım\'ın Hikayesi',
    desc: 'Adana\'dan Fatma Hanım, emeklilikten sonra nasıl platform\'un en çok sipariş alan aşçısı oldu?',
    time: '5 dk okuma',
    difficulty: null,
    date: '5 Mart 2025',
    color: '#EFF6FF',
  },
  {
    slug: 'borek-cesitleri',
    category: 'Tarif',
    emoji: '🥐',
    title: 'Türkiye\'nin 5 Farklı Börek Çeşidi',
    desc: 'Su böreği\'nden sigara böreğine, pişi\'den tepsi böreyğine — Türk böreklerinin şampiyonları.',
    time: '60 dk',
    difficulty: 'Zor',
    date: '28 Şubat 2025',
    color: '#F3E8FF',
  },
  {
    slug: 'saglikli-ev-yemegi',
    category: 'İpuçları',
    emoji: '🥗',
    title: 'Sağlıklı Ev Yemeği Pişirmenin 7 Altın Kuralı',
    desc: 'Daha az yağ, daha fazla lezzet. Ev yemeğini hem sağlıklı hem de lezzetli yapmanın yolları.',
    time: '10 dk okuma',
    difficulty: null,
    date: '20 Şubat 2025',
    color: '#ECFDF5',
  },
  {
    slug: 'sutlac-tarifi',
    category: 'Tarif',
    emoji: '🍮',
    title: 'Fırında Sütlaç: Klasik Tarif',
    desc: 'Türk tatlı mutfağının incisi sütlacı, fırında üstü kızarık şekilde yapmanın tam tarifi.',
    time: '45 dk',
    difficulty: 'Kolay',
    date: '15 Şubat 2025',
    color: '#FEF3C7',
  },
]

const CATEGORIES = ['Tümü', 'Tarif', 'Hikaye', 'İpuçları']

const DIFFICULTY_COLOR: Record<string, string> = {
  'Kolay': '#3D6B47',
  'Orta':  '#D97706',
  'Zor':   '#DC2626',
}

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #4A2C0E, #7A4A20)',
        padding: '56px 24px 48px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: 'white', margin: '0 0 12px' }}>
          🍽️ Blog & Tarifler
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
          Tariflер, ipuçları ve aşçı hikayeleri
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* Kategori chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <span key={cat} style={{
              padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600,
              background: cat === 'Tümü' ? '#4A2C0E' : 'white',
              color: cat === 'Tümü' ? 'white' : '#4A2C0E',
              border: '1.5px solid',
              borderColor: cat === 'Tümü' ? '#4A2C0E' : '#E8E0D4',
              cursor: 'pointer',
            }}>{cat}</span>
          ))}
        </div>

        {/* Öne çıkan yazı */}
        <Link href={`/blog/${POSTS[0].slug}`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white', borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(74,44,14,0.08)',
            border: '1px solid rgba(232,224,212,0.4)',
            marginBottom: 24, display: 'flex', flexWrap: 'wrap',
          }}>
            <div style={{
              minWidth: 200, flex: '1 1 200px', minHeight: 200,
              background: POSTS[0].color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 80,
            }}>
              {POSTS[0].emoji}
            </div>
            <div style={{ flex: '2 1 300px', padding: '28px 32px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#E8622A', background: '#FEF0EB', padding: '3px 10px', borderRadius: 99 }}>
                  ⭐ ÖNE ÇIKAN
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8A7B6B', background: '#F5EDD8', padding: '3px 10px', borderRadius: 99 }}>
                  {POSTS[0].category}
                </span>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#4A2C0E', margin: '0 0 10px' }}>
                {POSTS[0].title}
              </h2>
              <p style={{ fontSize: 14, color: '#8A7B6B', lineHeight: 1.7, margin: '0 0 16px' }}>
                {POSTS[0].desc}
              </p>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#8A7B6B' }}>
                <span>⏱️ {POSTS[0].time}</span>
                {POSTS[0].difficulty && (
                  <span style={{ color: DIFFICULTY_COLOR[POSTS[0].difficulty], fontWeight: 600 }}>
                    ● {POSTS[0].difficulty}
                  </span>
                )}
                <span>📅 {POSTS[0].date}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Yazı grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {POSTS.slice(1).map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white', borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(74,44,14,0.07)',
                border: '1px solid rgba(232,224,212,0.4)',
                height: '100%', display: 'flex', flexDirection: 'column',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}>
                <div style={{
                  height: 120, background: post.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 52,
                }}>
                  {post.emoji}
                </div>
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#8A7B6B', background: '#F5EDD8', padding: '2px 8px', borderRadius: 99 }}>
                      {post.category}
                    </span>
                    {post.difficulty && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: DIFFICULTY_COLOR[post.difficulty], background: '#F5F5F5', padding: '2px 8px', borderRadius: 99 }}>
                        {post.difficulty}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#4A2C0E', margin: '0 0 8px', lineHeight: 1.3 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 12, color: '#8A7B6B', lineHeight: 1.6, margin: '0 0 12px', flex: 1 }}>
                    {post.desc}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8A7B6B' }}>
                    <span>⏱️ {post.time}</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
} 