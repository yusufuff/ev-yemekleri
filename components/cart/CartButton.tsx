'use client'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { useRouter } from 'next/navigation'
import { MobileDrawer } from '@/components/layout/MobileDrawer'

const EMOJI: Record<string, string> = { main:'🍲', soup:'🥣', dessert:'🍮', pastry:'🥐', salad:'🥗' }

export function CartButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const cart = useCart()
  const { items, setQty, removeItem, itemCount } = cart
  const summary = cart.summary ?? { subtotal:0, delivery_fee:0, discount:0, total:0 }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{position:'relative',width:40,height:40,background:'#F5EDD8',border:'1.5px solid #E8E0D4',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
        <span style={{fontSize:18}}>🛒</span>
        {itemCount > 0 && (
          <span style={{position:'absolute',top:-6,right:-6,background:'#E8622A',color:'white',fontSize:10,fontWeight:800,minWidth:18,height:18,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px',border:'2px solid #FAF6EF'}}>
            {itemCount}
          </span>
        )}
      </button>

      <MobileDrawer open={open} onClose={() => setOpen(false)} title={`Sepetim${itemCount > 0 ? ` (${itemCount})` : ''}`} variant="auto" maxHeight="90vh">
        {items.length === 0 ? (
          <div style={{textAlign:'center',padding:'32px 16px'}}>
            <div style={{fontSize:48,marginBottom:8}}>🛒</div>
            <div style={{fontWeight:700,fontSize:18,marginBottom:8}}>Sepetiniz boş</div>
            <div style={{color:'#8A7B6B',fontSize:13,marginBottom:16}}>Aşçıların menülerini keşfederek sipariş verin</div>
            <button onClick={() => setOpen(false)} style={{padding:'10px 20px',background:'#E8622A',color:'white',border:'none',borderRadius:10,fontWeight:700,cursor:'pointer',fontSize:13}}>🔍 Keşfet</button>
          </div>
        ) : (
          <>
            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
              {items.map(item => (
                <div key={item.menu_item_id} style={{display:'flex',gap:12,alignItems:'flex-start',paddingBottom:12,borderBottom:'1px solid #E8E0D4'}}>
                  <div style={{width:52,height:52,borderRadius:10,background:'#F5EDD8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>
                    {EMOJI[item.category] ?? '🍽️'}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:'#4A2C0E'}}>{item.name}</div>
                    {item.chef_name && <div style={{fontSize:11,color:'#8A7B6B'}}>👩‍🍳 {item.chef_name}</div>}
                    <div style={{fontWeight:700,fontSize:15,color:'#E8622A',marginTop:4}}>₺{(item.price * item.quantity).toFixed(0)}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <button onClick={() => item.quantity <= 1 ? removeItem(item.menu_item_id) : setQty(item.menu_item_id, item.quantity-1)} style={{width:30,height:30,borderRadius:8,background:'#F5EDD8',border:'1.5px solid #E8E0D4',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {item.quantity <= 1 ? '🗑️' : '−'}
                    </button>
                    <span style={{minWidth:20,textAlign:'center',fontWeight:700}}>{item.quantity}</span>
                    <button onClick={() => setQty(item.menu_item_id, item.quantity+1)} style={{width:30,height:30,borderRadius:8,background:'#E8622A',border:'none',cursor:'pointer',fontSize:14,color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:'#F5EDD8',borderRadius:12,padding:'12px 14px',marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span>Ara Toplam</span><span>₺{summary.subtotal.toFixed(0)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:17,color:'#E8622A',borderTop:'1.5px solid #E8E0D4',paddingTop:8}}><span>Toplam</span><span>₺{summary.total.toFixed(0)}</span></div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button onClick={() => { setOpen(false); router.push('/odeme') }} style={{padding:14,background:'#E8622A',color:'white',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer'}}>
                🛒 Siparişi Tamamla — ₺{summary.total.toFixed(0)}
              </button>
              <button onClick={() => setOpen(false)} style={{padding:11,background:'transparent',color:'#8A7B6B',border:'1.5px solid #E8E0D4',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                Alışverişe Devam Et
              </button>
            </div>
          </>
        )}
      </MobileDrawer>
    </>
  )
}