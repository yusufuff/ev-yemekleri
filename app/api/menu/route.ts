import { NextRequest, NextResponse } from 'next/server'
import { MOCK_MENU } from '@/lib/mock/data'

const CHEF_ID = 'chef-1'
let menuItems = [...(MOCK_MENU[CHEF_ID] ?? [])]

export async function GET() {
  return NextResponse.json({ items: menuItems })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const newItem = { id: `mi-${Date.now()}`, chef_id: CHEF_ID, is_active: true, photos: [], stock_status: 'ok', ...body }
  menuItems.push(newItem)
  return NextResponse.json({ item: newItem })
}