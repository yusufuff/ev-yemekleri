/**
 * Firebase Admin SDK başlatıcı.
 * send-notification.ts tarafından import edilir.
 *
 * Production'da gerçek Firebase Admin SDK kullanmak için:
 *   npm install firebase-admin
 *   FIREBASE_PRIVATE_KEY ve FIREBASE_CLIENT_EMAIL env ekle
 *
 * Şu an stub — FCM gönderimi send-notification.ts'deki REST API ile yapılıyor.
 */

export function initFirebaseAdmin() {
  // firebase-admin kuruluysa buraya başlatma kodu gelir:
  // import { initializeApp, getApps, cert } from 'firebase-admin/app'
  // if (!getApps().length) {
  //   initializeApp({
  //     credential: cert({
  //       projectId:   process.env.FIREBASE_PROJECT_ID,
  //       privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  //       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  //     }),
  //   })
  // }
  return null
}

export function getFirebaseAdminApp() {
  return null
}
