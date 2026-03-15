import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    is_open: true,
    stats: {
      today_orders: 3,
      today_earnings: 420,
      pending_count: 2,
      avg_rating: 4.9,
      total_reviews: 127,
    },
    pending_orders: [
      {
        id: 'ord-p1',
        created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        buyer_name: 'Ayşe Y.',
        distance_km: 1.8,
        delivery_type: 'delivery',
        total_amount: 110,
        items: [{ name: 'Kuru Fasulye & Pilav', quantity: 2 }],
      },
      {
        id: 'ord-p2',
        created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
        buyer_name: 'Mehmet A.',
        distance_km: 0.6,
        delivery_type: 'pickup',
        total_amount: 90,
        items: [{ name: 'Sütlaç', quantity: 1 }, { name: 'Kuru Fasulye', quantity: 1 }],
      },
    ],
    active_orders: [
      {
        id: 'ord-a1',
        buyer_name: 'Selin K.',
        status: 'preparing',
        total_amount: 45,
        items: [{ name: 'İmam Bayıldı', quantity: 1 }],
      },
    ],
    stock: [
      { id: 'mi-1', name: 'Kuru Fasulye & Pilav', remaining_stock: 5, daily_stock: 12 },
      { id: 'mi-2', name: 'Sütlaç', remaining_stock: 8, daily_stock: 10 },
      { id: 'mi-10', name: 'İmam Bayıldı', remaining_stock: 0, daily_stock: 8 },
    ],
    weekly_earnings: [320, 480, 390, 550, 490, 620, 420],
  })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  return NextResponse.json({ success: true, ...body })
}