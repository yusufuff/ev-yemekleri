// @ts-nocheck
import Link from 'next/link'
import { Badge, Rozet } from '@/components/ui'
import type { ChefWithDistance } from '@/types/database'

interface ChefCardProps {
  chef: ChefWithDistance
}

/** Keşif sayfasında ve favorilerde kullanılan aşçı kartı */
export default function ChefCard({ chef }: ChefCardProps) {
  const ratingColor = chef.avg_rating && chef.avg_rating >= 4.8 ? 'green' : 'orange'

  return (
    <Link href={`/asci/${chef.id}`}>
      <div className="bg-white rounded-[14px] overflow-hidden shadow-card border border-gray-light/50
                      hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer">

        {/* Header renk bandı */}
        <div
          className="h-20 flex items-center justify-center text-[32px]"
          style={{ background: 'linear-gradient(135deg, #FDE68A, #F59E0B)' }}
        >
          {chef.user.avatar_url ? (
            <img
              src={chef.user.avatar_url}
              alt={chef.user.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white"
            />
          ) : (
            '👩‍🍳'
          )}
        </div>

        <div className="p-3.5">
          {/* İsim + puan */}
          <div className="font-bold text-[15px] text-brown">{chef.user.full_name}</div>
          <div className="text-sm text-orange font-semibold mt-0.5">
            ⭐ {chef.avg_rating?.toFixed(1) ?? '—'}
            <span className="text-gray font-normal text-xs ml-1">
              ({chef.total_orders} sipariş)
            </span>
          </div>

          {/* Mesafe + teslimat */}
          <div className="text-xs text-gray mt-1">
            📍 {chef.distance_km.toFixed(1)} km ·{' '}
            {chef.delivery_types.includes('delivery') ? 'Teslimat' : 'Gel-Al'}
          </div>

          {/* Mutfak etiketleri */}
          <div className="flex gap-1 flex-wrap mt-2">
            {chef.menu_items.slice(0, 3).map(item => (
              <span
                key={item.id}
                className="text-[10px] px-2 py-0.5 rounded-full bg-warm text-brown-mid font-medium"
              >
                {item.name}
              </span>
            ))}
          </div>

          {/* Rozet */}
          {chef.badge && (
            <div className="mt-2.5">
              {chef.badge === 'chef'    && <Rozet variant="crown">👑 Ev Şefi</Rozet>}
              {chef.badge === 'master'  && <Rozet variant="gold">🏅 Usta Eller</Rozet>}
              {chef.badge === 'trusted' && <Rozet variant="green">⭐ Güvenilir</Rozet>}
              {chef.badge === 'new'     && <Rozet variant="silver">🌱 Yeni Aşçı</Rozet>}
            </div>
          )}

          {/* Durum */}
          <div className="mt-2.5">
            {chef.is_open ? (
              <Badge variant="green">
                <span className="status-dot" />
                Şu an açık
              </Badge>
            ) : (
              <Badge variant="gray">Kapalı</Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
