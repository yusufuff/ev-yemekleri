import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ chefs: [
    { id: 'chef-1', full_name: 'Fatma Hanım',   phone: '+90 555 444 55 66', badge: 'master',  avg_rating: 4.9, total_orders: 843,  is_active: true,  pending_approval: false },
    { id: 'chef-2', full_name: 'Zeynep Arslan', phone: '+90 555 123 45 67', badge: 'chef',    avg_rating: 5.0, total_orders: 1241, is_active: true,  pending_approval: false },
    { id: 'chef-3', full_name: 'Ayşe Kaya',     phone: '+90 532 888 99 00', badge: 'trusted', avg_rating: 4.7, total_orders: 312,  is_active: true,  pending_approval: false },
    { id: 'chef-4', full_name: 'Elif Demirci',  phone: '+90 532 111 22 33', badge: 'new',     avg_rating: 4.5, total_orders: 47,   is_active: false, pending_approval: true  },
  ], total: 4 })
}
export async function PATCH() {
  return NextResponse.json({ success: true })
}