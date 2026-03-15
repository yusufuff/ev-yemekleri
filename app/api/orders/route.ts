import { NextResponse } from 'next/server'

const MOCK_ORDERS = [
  {
    id: 'ord-1',
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    status: 'preparing',
    delivery_type: 'delivery',
    total_amount: 110,
    chef_name: 'Fatma Hanım',
    chef_id: 'chef-1',
    items: [
      { name: 'Kuru Fasulye & Pilav', quantity: 2, price: 55 }
    ],
    estimated_minutes: 25,
  },
  {
    id: 'ord-2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'delivered',
    delivery_type: 'pickup',
    total_amount: 70,
    chef_name: 'Fatma Hanım',
    chef_id: 'chef-1',
    items: [
      { name: 'Sütlaç', quantity: 2, price: 35 }
    ],
    estimated_minutes: 0,
  },
  {
    id: 'ord-3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'delivered',
    delivery_type: 'delivery',
    total_amount: 40,
    chef_name: 'Zeynep Arslan',
    chef_id: 'chef-2',
    items: [
      { name: 'Peynirli Börek', quantity: 1, price: 40 }
    ],
    estimated_minutes: 0,
  },
]

export async function GET() {
  return NextResponse.json({ orders: MOCK_ORDERS })
}

export async function POST(req: Request) {
  const body = await req.json()
  const newOrder = {
    id: `ord-${Date.now()}`,
    created_at: new Date().toISOString(),
    status: 'pending',
    ...body,
  }
  return NextResponse.json({ order: newOrder, payment_url: '/siparis-basari?order_id=' + newOrder.id })
}