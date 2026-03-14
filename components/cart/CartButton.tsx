'use client'
import { useState, useEffect } from 'react'
import { useCart } from '@/hooks/useCart'
import { useRouter } from 'next/navigation'

const EMOJI: Record<string, string> = { main:'🍲', soup:'🥣', dessert:'🍮', pastry:'🥐', salad:'🥗' }

export function CartButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const cart = useCart()
  const { items, setQty, removeItem, itemCount } = cart
  const summary = cart.summary ?? { subtotal:0, delivery_fee:0, discount:0, total:0 }

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

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

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{position:'fixed',inset:0,background:'rgba(74,44,14,0.4)',zIndex:300}} />
          <div style={{position:'fixed',top:0,right:0,bottom:0,width:420,maxWidth:'100vw',background:'white',zIndex:301,display:'flex',flexDirection:'column',boxShadow:'-4px 0 24px rgba(74,44,14,0.15)',overflowY:'auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #E8E0D4',flexShrink:0}}>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:18,fontWeight:700,color:'#4A2C0E'}}>Sepetim{itemCount > 0 ? ` (${itemCount})` : ''}</div>
              <button onClick={() => setOpen(false)} style={{width:32,height:32,background:'#F5EDD8',border:'1.5px solid #E8E0D4',borderRadius:8,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',color:'#8A7B6B'}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
              {items.length === 0 ? (
                <div style={{textAlign:'center',padding:'48px 16px'}}>
                  <div style={{fontSize:48,marginBottom:8}}>🛒</div>
                  <div style={{fontWeight:700,fontSize:18,marginBottom:8,color:'#4A2C0E'}}>Sepetiniz boş</div>
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
                        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
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
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6,color:'#4A2C0E'}}><span>Ara Toplam</span><span>₺{summary.subtotal.toFixed(0)}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:17,color:'#E8622A',borderTop:'1.5px solid #E8E0D4',paddingTop:8}}><span>Toplam</span><span>₺{summary.total.toFixed(0)}</span></div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <button onClick={() => { setOpen(false); router.push('/odeme') }} style={{padding:14,background:'#E8622A',color:'white',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',width:'100%'}}>
                      🛒 Siparişi Tamamla — ₺{summary.total.toFixed(0)}
                    </button>
                    <button onClick={() => setOpen(false)} style={{padding:11,background:'transparent',color:'#8A7B6B',border:'1.5px solid #E8E0D4',borderRadius:12,fontSize:13,fontWeight:600,cursor:'pointer',width:'100%'}}>
                      Alışverişe Devam Et
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}