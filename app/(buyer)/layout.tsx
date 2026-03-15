import Link from 'next/link'

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {children}
    </div>
  )
}