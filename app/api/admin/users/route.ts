import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ users: [
    { id: 'u1', full_name: 'Mehmet Yılmaz', phone: '+90 532 111 22 33', role: 'buyer',  is_active: true,  created_at: '2024-11-01', order_count: 12 },
    { id: 'u2', full_name: 'Fatma Hanım',   phone: '+90 555 444 55 66', role: 'chef',   is_active: true,  created_at: '2024-10-15', order_count: 843 },
    { id: 'u3', full_name: 'Selin Kaya',    phone: '+90 532 777 88 99', role: 'buyer',  is_active: true,  created_at: '2024-12-03', order_count: 5 },
    { id: 'u4', full_name: 'Zeynep Arslan', phone: '+90 555 123 45 67', role: 'chef',   is_active: true,  created_at: '2024-09-20', order_count: 1241 },
    { id: 'u5', full_name: 'Ali Rıza',      phone: '+90 532 000 11 22', role: 'buyer',  is_active: false, created_at: '2025-01-10', order_count: 1 },
  ], total: 5 })
}