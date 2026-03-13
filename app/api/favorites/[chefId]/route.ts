import { NextRequest, NextResponse } from 'next/server'

// Mock: favoriler session olmadan çalışmaz, 
// giriş yapılmamışsa false döndür
export async function GET() {
  return NextResponse.json({ favorited: false })
}

export async function POST() {
  return NextResponse.json({ favorited: true })
}

export async function DELETE() {
  return NextResponse.json({ favorited: false })
}