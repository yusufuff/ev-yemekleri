// @ts-nocheck
import crypto from 'crypto'

const API_KEY    = process.env.IYZICO_API_KEY    ?? 'sandbox-kfx2yf81BXoqJY3lTssW5dwpzUfsklz0'
const SECRET_KEY = process.env.IYZICO_SECRET_KEY ?? 'sandbox-HSgied94OYtlUAW5nkrKJlsUUCbRf9E3'
const BASE_URL   = process.env.IYZICO_BASE_URL   ?? 'https://sandbox-api.iyzipay.com'

// ── HMAC Auth ──────────────────────────────────────────────────────────────
function generateAuthHeader(path: string, body: string): string {
  const randomKey   = Date.now().toString() + Math.random().toString(36).substring(2)
  const payload     = randomKey + path + body
  const signature   = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex')
  const authStr     = `apiKey:${API_KEY}&randomKey:${randomKey}&signature:${signature}`
  const encoded     = Buffer.from(authStr).toString('base64')
  return { authorization: `IYZWSv2 ${encoded}`, randomKey }
}

async function iyzicoPost(path: string, body: object): Promise<any> {
  const bodyStr = JSON.stringify(body)
  const { authorization, randomKey } = generateAuthHeader(path, bodyStr)
  const res = await fetch(`${BASE_URL}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': authorization,
      'x-iyzi-rnd':    randomKey,
    },
    body: bodyStr,
  })
  return res.json()
}

// ── Kuruş dönüşümleri ──────────────────────────────────────────────────────
export function toKurus(tl: number): string { return Math.round(tl * 100).toString() }
export function fromKurus(kurus: string): number { return parseInt(kurus) / 100 }

// ── Ödeme formu başlat ─────────────────────────────────────────────────────
export interface InitPaymentParams {
  orderId:          string
  orderNumber:      string
  amount:           number
  buyerId:          string
  buyerName:        string
  buyerPhone:       string
  buyerEmail:       string
  city:             string
  address:          string
  subMerchantKey?:  string
  subMerchantPrice?: number
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
  const callbackUrl = process.env.IYZICO_CALLBACK_URL
    ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.anneelim.com'}/api/payments/callback`

  const body: any = {
    locale:          'tr',
    conversationId:  params.orderId,
    price:           params.amount.toFixed(2),
    paidPrice:       params.amount.toFixed(2),
    currency:        'TRY',
    basketId:        params.orderNumber,
    paymentGroup:    'PRODUCT',
    callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id:                  params.buyerId,
      name:                params.buyerName.split(' ')[0] || 'Ad',
      surname:             params.buyerName.split(' ').slice(1).join(' ') || 'Soyad',
      gsmNumber:           params.buyerPhone.replace(/\s/g, ''),
      email:               params.buyerEmail || `${params.buyerId}@anneelim.com`,
      identityNumber:      '11111111110',
      lastLoginDate:       new Date().toISOString().replace('T', ' ').slice(0, 19),
      registrationDate:    '2024-01-01 00:00:00',
      registrationAddress: params.address,
      ip:                  '85.34.78.112',
      city:                params.city,
      country:             'Turkey',
    },
    shippingAddress: { contactName: params.buyerName, city: params.city, country: 'Turkey', address: params.address },
    billingAddress:  { contactName: params.buyerName, city: params.city, country: 'Turkey', address: params.address },
    basketItems: params.items.flatMap(item =>
      Array.from({ length: item.quantity }, (_, i) => ({
        id:        `${item.id}-${i}`,
        name:      item.name,
        category1: 'Yemek',
        category2: item.category,
        itemType:  'PHYSICAL',
        price:     item.price.toFixed(2),
      }))
    ),
  }

  if (params.subMerchantKey && params.subMerchantPrice !== undefined) {
    body.subMerchantKey   = params.subMerchantKey
    body.subMerchantPrice = params.subMerchantPrice.toFixed(2)
  }

  try {
    const result = await iyzicoPost('/payment/iyzipos/checkoutform/initialize/auth/ecom', body)
    if (result.status !== 'success') {
      console.error('iyzico init error:', result.errorMessage, result.errorCode)
      return { success: false, error: result.errorMessage ?? 'Ödeme başlatılamadı' }
    }
    return { success: true, token: result.token, content: result.checkoutFormContent }
  } catch (e: any) {
    console.error('iyzico fetch error:', e)
    return { success: false, error: e.message }
  }
}

// ── Ödeme sonucunu doğrula ─────────────────────────────────────────────────
export async function retrieveCheckoutForm(
  token: string
): Promise<{ success: boolean; status?: string; paymentId?: string; paymentTransactionId?: string; error?: string }> {
  try {
    const result = await iyzicoPost('/payment/iyzipos/checkoutform/auth/ecom/detail', {
      locale: 'tr',
      token,
    })
    const paid = result.paymentStatus === 'SUCCESS'
    return {
      success:              paid,
      status:               result.paymentStatus,
      paymentId:            result.paymentId,
      paymentTransactionId: result.paymentTransactionId,
      error:                paid ? undefined : result.errorMessage,
    }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ── Sub-merchant kaydı ─────────────────────────────────────────────────────
export interface SubMerchantParams {
  referenceCode:  string
  name:           string
  iban:           string
  identityNumber: string
  taxNumber?:     string
  address:        string
  city:           string
  phone:          string
  email:          string
}

export async function createSubMerchant(
  params: SubMerchantParams
): Promise<{ success: boolean; subMerchantKey?: string; error?: string }> {
  try {
    const result = await iyzicoPost('/onboarding/submerchant', {
      locale:               'tr',
      conversationId:       params.referenceCode,
      subMerchantExternalId: params.referenceCode,
      subMerchantType:      'PERSONAL',
      address:              params.address,
      taxOffice:            'Vergi Dairesi',
      taxNumber:            params.taxNumber ?? params.identityNumber,
      legalCompanyTitle:    params.name,
      email:                params.email,
      gsmNumber:            params.phone.replace(/\s/g, ''),
      name:                 params.name,
      iban:                 params.iban.replace(/\s/g, ''),
      identityNumber:       params.identityNumber,
      currency:             'TRY',
      city:                 params.city,
      country:              'Turkey',
      contactName:          params.name.split(' ')[0] ?? params.name,
      contactSurname:       params.name.split(' ').slice(1).join(' ') || params.name,
    })

    if (result.status !== 'success') {
      console.error('Sub-merchant error:', result.errorMessage, result.errorCode)
      return { success: false, error: result.errorMessage ?? 'Sub-merchant oluşturulamadı' }
    }
    return { success: true, subMerchantKey: result.subMerchantKey }
  } catch (e: any) {
    console.error('Sub-merchant fetch error:', e)
    return { success: false, error: e.message }
  }
}

// ── Ödeme onaylama (escrow → aşçı) ────────────────────────────────────────
export async function approvePayment(
  paymentTransactionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await iyzicoPost('/payment/iyzipos/approve', {
      locale:               'tr',
      conversationId:       paymentTransactionId,
      paymentTransactionId,
    })
    if (result.status !== 'success') {
      console.error('Approve failed:', result.errorMessage)
      return { success: false, error: result.errorMessage }
    }
    return { success: true }
  } catch (e: any) {
    console.error('Approve fetch error:', e)
    return { success: false, error: e.message }
  }
}