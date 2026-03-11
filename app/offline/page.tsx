// @ts-nocheck
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Ã‡evrimdÄ±ÅŸÄ± â€” Ev Yemekleri' }

export default function OfflinePage() {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family: system-ui, sans-serif;
            background: #FAF6EF;
            color: #4A2C0E;
            min-height: 100svh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            text-align: center;
          }
          .icon { font-size: 72px; margin-bottom: 24px; opacity: 0.6; }
          h1 { font-size: 24px; font-weight: 800; margin-bottom: 10px; }
          p { font-size: 15px; color: #8A7B6B; line-height: 1.6; max-width: 320px; }
          .btn {
            display: inline-block;
            margin-top: 28px;
            padding: 14px 32px;
            background: #E8622A;
            color: white;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            border: none;
            cursor: pointer;
          }
          .cached-note {
            margin-top: 20px;
            font-size: 12px;
            color: #8A7B6B;
          }
        `}</style>
      </head>
      <body>
        <div className="icon">ğŸ½ï¸</div>
        <h1>Åu an Ã‡evrimdÄ±ÅŸÄ±sÄ±n</h1>
        <p>Ä°nternet baÄŸlantÄ±n yok gibi gÃ¶rÃ¼nÃ¼yor. BaÄŸlantÄ±n dÃ¼zeldiÄŸinde kaldÄ±ÄŸÄ±n yerden devam edebilirsin.</p>
        <button className="btn" onClick={() => window.location.reload()}>
          ğŸ”„ Tekrar Dene
        </button>
        <p className="cached-note">
          Daha Ã¶nce gÃ¶rÃ¼ntÃ¼lediÄŸin sayfalar Ã§evrimdÄ±ÅŸÄ±nda da aÃ§Ä±labilir.
        </p>
      </body>
    </html>
  )
}

