import { NextResponse } from 'next/server'
export async function GET() {
  const key = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? 'YOK'
  return NextResponse.json({ key, length: key.length })
}