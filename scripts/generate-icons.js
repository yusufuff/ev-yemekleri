#!/usr/bin/env node
/**
 * PWA İkon Üretici
 *
 * Kullanım:
 *   node scripts/generate-icons.js
 *
 * Gereksinim: sharp
 *   npm install sharp --save-dev
 *
 * Üretilen dosyalar → public/icons/
 */

const path  = require('path')
const fs    = require('fs')

const SIZES = [32, 72, 96, 128, 144, 152, 180, 192, 384, 512]
const OUT   = path.join(__dirname, '..', 'public', 'icons')

// SVG kaynak ikon (EV YEMEKLERİ logosu)
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#E8622A"/>
  <text x="256" y="300" font-family="serif" font-size="280" font-weight="900"
        text-anchor="middle" fill="white">🍽</text>
</svg>`

async function generateIcons() {
  let sharp
  try {
    sharp = require('sharp')
  } catch {
    console.error('❌ sharp yüklü değil: npm install sharp --save-dev')
    process.exit(1)
  }

  fs.mkdirSync(OUT, { recursive: true })

  for (const size of SIZES) {
    const outPath = path.join(OUT, `icon-${size}.png`)
    await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toFile(outPath)
    console.log(`✅ icon-${size}.png`)
  }

  // Apple Touch Icon (180x180)
  await sharp(Buffer.from(SVG))
    .resize(180, 180)
    .png()
    .toFile(path.join(OUT, 'apple-touch-icon.png'))
  console.log('✅ apple-touch-icon.png')

  // Badge (72x72 — bildirim rozeti)
  const BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72">
    <circle cx="36" cy="36" r="36" fill="#E8622A"/>
    <text x="36" y="48" font-family="serif" font-size="40" font-weight="900"
          text-anchor="middle" fill="white">🍽</text>
  </svg>`
  await sharp(Buffer.from(BADGE_SVG))
    .resize(72, 72)
    .png()
    .toFile(path.join(OUT, 'badge-72.png'))
  console.log('✅ badge-72.png')

  console.log('\n✅ Tüm ikonlar üretildi → public/icons/')
}

generateIcons().catch(console.error)
