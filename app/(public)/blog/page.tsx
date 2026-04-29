'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const CATEGORY_COLORS = ['#FEF3C7', '#ECFDF5', '#EFF6FF', '#F3E8FF', '#FEF0EB', '#F5EDD8']

export default function BlogPage() {
  const [yazilar, setYazilar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/blog')
      .then(r => r.json())
      .then(d => {
        setYazilar((d.posts ?? []).filter((p: any) => p.status === 'published'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#8A7B6B', fontSize: 14 }}>Yükleniyor...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg, #4A2C0E, #7A4A20)', padding: '56px 24px 48px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: 'white', margin: '0 0 12px' }}>
          🍽️ Blog & Tarifler
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
          Tarifler, ipuçları ve aşçı hikayeleri
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {yazilar.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#8A7B6B' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <div>Henüz blog yazısı yok</div>
          </div>
        ) : (
          <>
            {/* Öne çıkan yazı */}
            <Link href={`/blog/${yazilar[0].slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(74,44,14,0.08)', border: '1px solid rgba(232,224,212,0.4)', marginBottom: 24, display: 'flex', flexWrap: 'wrap' }}>
                {yazilar[0].cover_image ? (
                  <img src={yazilar[0].cover_image} alt={yazilar[0].title} style={{ width: 280, height: 220, objectFit: 'cover', display: 'block', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 280, height: 220, background: CATEGORY_COLORS[0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, flexShrink: 0 }}>📝</div>
                )}
                <div style={{ flex: '1 1 300px', padding: '28px 32px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#E8622A', background: '#FEF0EB', padding: '3px 10px', borderRadius: 99 }}>⭐ ÖNE ÇIKAN</span>
                    {(Array.isArray(yazilar[0].tags) ? yazilar[0].tags : [yazilar[0].tags]).filter(Boolean).slice(0, 1).map((t: string) => (
                      <span key={t} style={{ fontSize: 11, fontWeight: 700, color: '#8A7B6B', background: '#F5EDD8', padding: '3px 10px', borderRadius: 99 }}>{t}</span>
                    ))}
                  </div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#4A2C0E', margin: '0 0 10px' }}>
                    {yazilar[0].title}
                  </h2>
                  <p style={{ fontSize: 14, color: '#8A7B6B', lineHeight: 1.7, margin: '0 0 16px' }}>
                    {yazilar[0].excerpt}
                  </p>
                  <div style={{ fontSize: 12, color: '#8A7B6B' }}>
                    📅 {new Date(yazilar[0].created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </Link>

            {/* Yazı grid */}
            {yazilar.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                {yazilar.slice(1).map((post: any, i: number) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(74,44,14,0.07)', border: '1px solid rgba(232,224,212,0.4)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {post.cover_image ? (
                        <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block', flexShrink: 0 }} />
                      ) : (
                        <div style={{ height: 160, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, flexShrink: 0 }}>📝</div>
                      )}
                      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                          {(Array.isArray(post.tags) ? post.tags : [post.tags]).filter(Boolean).slice(0, 2).map((t: string) => (
                            <span key={t} style={{ fontSize: 10, fontWeight: 700, color: '#8A7B6B', background: '#F5EDD8', padding: '2px 8px', borderRadius: 99 }}>{t}</span>
                          ))}
                        </div>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#4A2C0E', margin: '0 0 8px', lineHeight: 1.3 }}>
                          {post.title}
                        </h3>
                        <p style={{ fontSize: 12, color: '#8A7B6B', lineHeight: 1.6, margin: '0 0 12px', flex: 1 }}>
                          {post.excerpt}
                        </p>
                        <div style={{ fontSize: 11, color: '#8A7B6B' }}>
                          📅 {new Date(post.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}