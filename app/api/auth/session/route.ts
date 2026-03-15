import { NextResponse } from 'next/server'

// Demo: mock oturum - gerçek kullanıcı gibi davran
export async function GET() {
  return NextResponse.json({
    user: {
      id: 'user-demo',
      full_name: 'Demo Kullanıcı',
      phone: '+90 532 000 00 00',
      role: 'buyer',
      avatar_url: null,
    }
  })
}