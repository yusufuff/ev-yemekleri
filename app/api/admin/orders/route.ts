import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ orders: [
    { id: 'ord-1', buyer_name: 'Mehmet Y.', chef_name: 'Fatma Hanım',   status: 'delivered', total_amount: 110, created_at: new Date(Date.now()-3600000).toISOString() },
    { id: 'ord-2', buyer_name: 'Selin K.',  chef_name: 'Zeynep Arslan', status: 'preparing', total_amount: 40,  created_at: new Date(Date.now()-1800000).toISOString() },
    { id: 'ord-3', buyer_name: 'Ali R.',    chef_name: 'Fatma Hanım',   status: 'pending',   total_amount: 70,  created_at: new Date(Date.now()-600000).toISOString()  },
  ], total: 3 })
}