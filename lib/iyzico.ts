// @ts-nocheck
import Iyzipay from 'iyzipay'

// ── İstemci singleton ──────────────────────────────────────────────────────
let _iyzipay: Iyzipay | null = null

export function getIyzipay(): Iyzipay {
  if (_iyzipay) return _iyzipay
  _iyzipay = new Iyzipay({
    apiKey:    process.env.IYZICO_API_KEY    ?? 'sandbox-kfx2yf81BXoqJY3lTssW5dwpzUfsklz0',
    secretKey: process.env.IYZICO_SECRET_KEY ?? 'sandbox-HSgied94OYtlUAW5nkrKJlsUUCbRf9E3',
    uri:       process.env.IYZICO_BASE_URL   ?? 'https://sandbox-api.iyzipay.com',
  })
  return _iyzipay
}

// ── Kuruş dönüşümleri ──────────────────────────────────────────────────────
export function toKurus(tl: number): string { return Math.round(tl * 100).toString() }
export function fromKurus(kurus: string): number { return parseInt(kurus) / 100 }

// ── Ödeme formu başlat ─────────────────────────────────────────────────────
export interface InitPaymentParams {
  orderId:     string
  orderNumber: string
  amount:      number
  buyerId:     string
  buyerName:   string
  buyerPhone:  string
  buyerEmail:  string
  city:        string
  address:     string
  // Marketplace için sub-merchant key (opsiyonel - Marketplace aktifse dolu gelir)
  subMerchantKey?: string
  subMerchantPrice?: number // Aşçıya gidecek tutar
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
      email:               params.buyerEmail || `${params.buyerId}@anneelim.com`,
      identityNumber:      '11111111110',
      lastLoginDate:       new Date().toISOString().replace('T', ' ').slice(0, 19),
      registrationDate:    '2024-01-01 00:00:00',
      registrationAddress: params.address,
      ip:                  '85.34.78.112',
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
      Array.from({ length: item.quantity }, (_, qIdx) => ({
        id:        `${item.id}-${qIdx}`,
        name:      item.name,
        category1: 'Yemek',
        category2: item.category,
        itemType:  Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price:     item.price.toFixed(2),
      }))
    ),
  }

  // Marketplace aktifse sub-merchant bilgilerini ekle
  if (params.subMerchantKey && params.subMerchantPrice !== undefined) {
    request.subMerchantKey   = params.subMerchantKey
    request.subMerchantPrice = params.subMerchantPrice.toFixed(2)
  }

  return new Promise((resolve) => {
    iyzipay.checkoutFormInitialize.create(request, (err: Error, result: any) => {
      if (err) {
        console.error('İyzico init error:', err)
        return resolve({ success: false, error: err.message })
      }
      if (result.status !== 'success') {
        console.error('İyzico error:', result.errorMessage, result.errorCode)
        return resolve({ success: false, error: result.errorMessage ?? 'Ödeme başlatılamadı' })
      }
      resolve({ success: true, token: result.token, content: result.checkoutFormContent })
    })
  })
}

// ── Ödeme sonucunu doğrula ─────────────────────────────────────────────────
export async function retrieveCheckoutForm(
  token: string
): Promise<{ success: boolean; status?: string; paymentId?: string; paymentTransactionId?: string; error?: string }> {
  const iyzipay = getIyzipay()

  return new Promise((resolve) => {
    iyzipay.checkoutForm.retrieve(
      { locale: Iyzipay.LOCALE.TR, token },
      (err: Error, result: any) => {
        if (err) return resolve({ success: false, error: err.message })
        const paid = result.paymentStatus === 'SUCCESS'
        resolve({
          success:               paid,
          status:                result.paymentStatus,
          paymentId:             result.paymentId,
          paymentTransactionId:  result.paymentTransactionId,
          error:                 paid ? undefined : result.errorMessage,
        })
      }
    )
  })
}

// ── Sub-merchant kaydı (Marketplace) ───────────────────────────────────────
export interface SubMerchantParams {
  referenceCode: string   // chef_id
  name:          string   // Aşçı adı
  iban:          string   // Aşçının IBAN'ı
  identityNumber: string  // TC Kimlik
  taxNumber?:    string
  address:       string
  city:          string
  phone:         string
  email:         string
}

export async function createSubMerchant(
  params: SubMerchantParams
): Promise<{ success: boolean; subMerchantKey?: string; error?: string }> {
  const iyzipay = getIyzipay()

  const request = {
    locale:          Iyzipay.LOCALE.TR,
    conversationId:  params.referenceCode,
    subMerchantExternalId: params.referenceCode,
    subMerchantType: 'PERSONAL', // Bireysel aşçı
    address:         params.address,
    taxOffice:       'Vergi Dairesi',
    taxNumber:       params.taxNumber ?? params.identityNumber,
    legalCompanyTitle: params.name,
    email:           params.email,
    gsmNumber:       params.phone.replace(/\s/g, ''),
    name:            params.name,
    iban:            params.iban.replace(/\s/g, ''),
    identityNumber:  params.identityNumber,
    currency:        Iyzipay.CURRENCY.TRY,
    city:            params.city,
    country:         'Turkey',
    contactName:     params.name.split(' ')[0] ?? params.name,
    contactSurname:  params.name.split(' ').slice(1).join(' ') || params.name,
  }

  return new Promise((resolve) => {
    iyzipay.subMerchant.create(request, (err: Error, result: any) => {
      if (err) {
        console.error('Sub-merchant create error:', err)
        return resolve({ success: false, error: err.message })
      }
      if (result.status !== 'success') {
        console.error('Sub-merchant error:', result.errorMessage)
        return resolve({ success: false, error: result.errorMessage ?? 'Sub-merchant oluşturulamadı' })
      }
      resolve({ success: true, subMerchantKey: result.subMerchantKey })
    })
  })
}

// ── Ödeme onaylama (escrow → aşçı) ────────────────────────────────────────
export async function approvePayment(
  paymentTransactionId: string
): Promise<{ success: boolean; error?: string }> {
  const iyzipay = getIyzipay()

  return new Promise((resolve) => {
    iyzipay.approval.create(
      {
        locale:               Iyzipay.LOCALE.TR,
        conversationId:       paymentTransactionId,
        paymentTransactionId,
      },
      (err: Error, result: any) => {
        if (err) {
          console.error('Approve error:', err)
          return resolve({ success: false, error: err.message })
        }
        if (result.status !== 'success') {
          console.error('Approve failed:', result.errorMessage)
          return resolve({ success: false, error: result.errorMessage })
        }
        resolve({ success: true })
      }
    )
  })
}