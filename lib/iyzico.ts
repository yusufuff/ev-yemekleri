// @ts-nocheck
/**
 * İyzico Entegrasyonu
 * Paket: iyzipay (npm'de mevcut)
 *
 * Sandbox credential'ları:
 *   API Key:    sandbox-afXhgXL0biay8D14QCQG3dJK8mO3Mxkb
 *   Secret Key: sandbox-qL0biay8Dmxkb3M...
 *
 * .env.local'a ekleyin:
 *   IYZICO_API_KEY=sandbox-xxx
 *   IYZICO_SECRET_KEY=sandbox-xxx
 *   IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
 *   IYZICO_CALLBACK_URL=http://localhost:3000/api/payments/callback
 */
import Iyzipay from 'iyzipay'

// ── İstemci singleton ─────────────────────────────────────────────────────────
let _iyzipay: Iyzipay | null = null

export function getIyzipay(): Iyzipay {
  if (_iyzipay) return _iyzipay

  _iyzipay = new Iyzipay({
    apiKey:     process.env.IYZICO_API_KEY     ?? 'sandbox-afXhgXL0biay8D14QCQG3dJK8mO3Mxkb',
    secretKey:  process.env.IYZICO_SECRET_KEY  ?? 'sandbox-qL0biay8D14QCQG3dJK8mO3Mxkb',
    uri:        process.env.IYZICO_BASE_URL    ?? 'https://sandbox-api.iyzipay.com',
  })

  return _iyzipay
}

// ── Tür dönüşümleri ───────────────────────────────────────────────────────────

/**
 * Kuruşa dönüştür (İyzico kuruş bazlı çalışır)
 * ₺55.50 → "5550"
 */
export function toKurus(tl: number): string {
  return Math.round(tl * 100).toString()
}

/**
 * Kuruştan TL'ye
 * "5550" → 55.50
 */
export function fromKurus(kurus: string): number {
  return parseInt(kurus) / 100
}

// ── İyzico ödeme formu başlat ─────────────────────────────────────────────────

export interface InitPaymentParams {
  orderId:     string
  orderNumber: string
  amount:      number    // TL cinsinden
  buyerId:     string
  buyerName:   string
  buyerPhone:  string
  buyerEmail:  string
  city:        string
  address:     string
  items: {
    id:       string
    name:     string
    price:    number
    category: string
    quantity: number
  }[]
}

export async function initCheckoutForm(
  params: InitPaymentParams
): Promise<{ success: boolean; token?: string; content?: string; error?: string }> {
  const iyzipay = getIyzipay()

  const callbackUrl = process.env.IYZICO_CALLBACK_URL
    ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/payments/callback`

  const request: Record<string, unknown> = {
    locale:          Iyzipay.LOCALE.TR,
    conversationId:  params.orderId,
    price:           params.amount.toFixed(2),
    paidPrice:       params.amount.toFixed(2),
    currency:        Iyzipay.CURRENCY.TRY,
    basketId:        params.orderNumber,
    paymentGroup:    Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],

    buyer: {
      id:                  params.buyerId,
      name:                params.buyerName.split(' ')[0] ?? 'Ad',
      surname:             params.buyerName.split(' ').slice(1).join(' ') || 'Soyad',
      gsmNumber:           params.buyerPhone.replace(/\s/g, ''),
      email:               params.buyerEmail || `${params.buyerId}@evyemekleri.com`,
      identityNumber:      '11111111110',    // Sandbox: herhangi geçerli
      lastLoginDate:       new Date().toISOString().replace('T', ' ').slice(0, 19),
      registrationDate:    '2024-01-01 00:00:00',
      registrationAddress: params.address,
      ip:                  '85.34.78.112',   // Sandbox: sabit IP
      city:                params.city,
      country:             'Turkey',
    },

    shippingAddress: {
      contactName: params.buyerName,
      city:        params.city,
      country:     'Turkey',
      address:     params.address,
    },

    billingAddress: {
      contactName: params.buyerName,
      city:        params.city,
      country:     'Turkey',
      address:     params.address,
    },

    basketItems: params.items.flatMap(item =>
      // Her quantity için ayrı satır (İyzico'nun gerekliliği)
      Array.from({ length: item.quantity }, (_, qIdx) => ({
        id:              `${item.id}-${qIdx}`,
        name:            item.name,
        category1:       'Yemek',
        category2:       item.category,
        itemType:        Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price:           item.price.toFixed(2),
      }))
    ),
  }

  return new Promise((resolve) => {
    iyzipay.checkoutFormInitialize.create(request, (err: Error, result: any) => {
      if (err) {
        console.error('İyzico init error:', err)
        return resolve({ success: false, error: err.message })
      }

      if (result.status !== 'success') {
        console.error('İyzico error:', result.errorMessage, result.errorCode)
        return resolve({
          success: false,
          error: result.errorMessage ?? 'Ödeme başlatılamadı',
        })
      }

      resolve({
        success: true,
        token:   result.token,
        content: result.checkoutFormContent,
      })
    })
  })
}

// ── İyzico ödeme sonucunu doğrula ────────────────────────────────────────────

export async function retrieveCheckoutForm(
  token: string
): Promise<{ success: boolean; status?: string; paymentId?: string; error?: string }> {
  const iyzipay = getIyzipay()

  return new Promise((resolve) => {
    iyzipay.checkoutForm.retrieve(
      { locale: Iyzipay.LOCALE.TR, token },
      (err: Error, result: any) => {
        if (err) {
          return resolve({ success: false, error: err.message })
        }

        const paid = result.paymentStatus === 'SUCCESS'

        resolve({
          success:   paid,
          status:    result.paymentStatus,
          paymentId: result.paymentId,
          error:     paid ? undefined : result.errorMessage,
        })
      }
    )
  })
}
