import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await supabase.from('blog_posts').select('title, excerpt').eq('slug', params.slug).single()
  if (!data) return { title: 'Yazı Bulunamadı' }
  return { title: `${data.title} – EV YEMEKLERİ Blog`, description: data.excerpt }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: post } = await supabase.from('blog_posts').select('*').eq('slug', params.slug).eq('status', 'published').single()
  if (!post) notFound()

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

      {/* Hero */}
      <div style={{ minHeight: 200, background: post.cover_image ? 'transparent' : 'linear-gradient(135deg, #4A2C0E, #7A4A20)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {post.cover_image
          ? <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: 260, objectFit: 'cover' }} />
          : <div style={{ fontSize: 80 }}>📝</div>
        }
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(250,246,239,1), transparent)', height: 80 }} />
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {(post.tags ?? []).map((tag: string) => (
            <span key={tag} style={{ fontSize: 11, fontWeight: 700, color: '#E8622A', background: '#FEF0EB', padding: '3px 10px', borderRadius: 99 }}>{tag}</span>
          ))}
          <span style={{ fontSize: 11, color: '#8A7B6B', padding: '3px 0' }}>
            📅 {new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span style={{ fontSize: 11, color: '#8A7B6B', padding: '3px 0' }}>
            👁️ {post.view_count ?? 0} görüntülenme
          </span>
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: '#4A2C0E', margin: '0 0 12px', lineHeight: 1.2 }}>
          {post.title}
        </h1>

        {post.excerpt && (
          <p style={{ fontSize: 15, color: '#8A7B6B', lineHeight: 1.7, marginBottom: 32 }}>{post.excerpt}</p>
        )}

        {/* İçerik */}
        <div style={{ background: 'white', borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: '0 2px 12px rgba(74,44,14,0.06)' }}>
          <div style={{ fontSize: 15, color: '#4A2C0E', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg, #3D6B47, #2e5236)', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>Bu tarifi yapmak zahmetli mi geliyor?</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 16 }}>
            Yakınındaki aşçıdan sipariş ver!
          </div>
          <Link href="/kesif" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: 'white', color: '#3D6B47', fontWeight: 700, borderRadius: 10, textDecoration: 'none', fontSize: 13 }}>
            🔍 Aşçıları Keşfet →
          </Link>
        </div>

        <Link href="/blog" style={{ fontSize: 13, color: '#E8622A', textDecoration: 'none', fontWeight: 600 }}>
          ← Tüm Yazılara Dön
        </Link>
      </div>
    </div>
  )
}