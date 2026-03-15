import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ payouts: [
    { id: 'pay-1', chef_name: 'Fatma Hanım',   amount: 1200, status: 'completed', iban: '****4521', created_at: '2025-02-14' },
    { id: 'pay-2', chef_name: 'Zeynep Arslan', amount: 2100, status: 'completed', iban: '****7823', created_at: '2025-02-14' },
    { id: 'pay-3', chef_name: 'Fatma Hanım',   amount: 840,  status: 'pending',   iban: '****4521', created_at: '2025-03-14' },
  ], total: 3 })
}