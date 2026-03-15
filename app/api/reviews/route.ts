import { NextRequest, NextResponse } from 'next/server'

const reviews: any[] = []

export async function POST(req: NextRequest) {
  const body = await req.json()
  const review = { id: `rev-${Date.now()}`, ...body, created_at: new Date().toISOString() }
  reviews.push(review)
  return NextResponse.json({ review })
}

export async function GET() {
  return NextResponse.json({ reviews })
}