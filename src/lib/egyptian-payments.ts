// نظام بوابات الدفع المصرية
// Egyptian Payment Gateways Integration - Fawry, Mobile Wallets, Meeza

import { db } from '@/lib/db'
import crypto from 'crypto'

// ===================== TYPES =====================
type PaymentMethod = 
  | 'FAWRY' 
  | 'FAWRY_PAY_AT_FAWRY'
  | 'VODAFONE_CASH' 
  | 'ORANGE_CASH' 
  | 'ETISALAT_CASH' 
  | 'WE_PAY'
  | 'MEEZA_CARD'
  | 'VISA'
  | 'MASTERCARD'
  | 'INSTAPAY'
  | 'BANK_TRANSFER'

interface PaymentRequest {
  amount: number
  currency: string
  customerId: string
  customerPhone?: string
  customerEmail?: string
  customerName?: string
  description?: string
  referenceId?: string
  metadata?: any
}

interface PaymentResponse {
  success: boolean
  transactionId?: string
  referenceNumber?: string
  paymentUrl?: string
  qrCode?: string
  expiresAt?: Date
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  message?: string
  gatewayResponse?: any
}

interface GatewayConfig {
  merchantCode: string
  securityKey: string
  sandbox: boolean
  callbackUrl: string
}

// ===================== GATEWAY CONFIGURATIONS =====================
const GATEWAY_CONFIGS = {
  FAWRY: {
    name: 'فوري',
    nameEn: 'Fawry',
    logo: '/payment/fawry.svg',
    sandboxUrl: 'https://atfawry.fawrystaging.com',
    productionUrl: 'https://www.atfawry.com',
    methods: ['FAWRY', 'FAWRY_PAY_AT_FAWRY', 'VISA', 'MASTERCARD', 'MEEZA_CARD']
  },
  VODAFONE_CASH: {
    name: 'فودافون كاش',
    nameEn: 'Vodafone Cash',
    logo: '/payment/vodafone.svg',
    sandboxUrl: '',
    productionUrl: 'https://api.vodafone.com.eg',
    methods: ['VODAFONE_CASH']
  },
  ORANGE_CASH: {
    name: 'أورانج كاش',
    nameEn: 'Orange Cash',
    logo: '/payment/orange.svg',
    sandboxUrl: '',
    productionUrl: 'https://api.orange.eg',
    methods: ['ORANGE_CASH']
  },
  INSTAPAY: {
    name: 'انستاباي',
    nameEn: 'InstaPay',
    logo: '/payment/instapay.svg',
    sandboxUrl: '',
    productionUrl: 'https://api.instapay.eg',
    methods: ['INSTAPAY', 'BANK_TRANSFER']
  }
}

// ===================== FAWRY GATEWAY =====================
class FawryGateway {
  private config: GatewayConfig
  private baseUrl: string

  constructor(config: GatewayConfig) {
    this.config = config
    this.baseUrl = config.sandbox 
      ? GATEWAY_CONFIGS.FAWRY.sandboxUrl 
      : GATEWAY_CONFIGS.FAWRY.productionUrl
  }

  // إنشاء دفعة جديدة
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const merchantRefNum = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // حساب التوقيع
      const signatureString = this.config.merchantCode + 
                              merchantRefNum + 
                              request.amount.toFixed(2) + 
                              this.config.securityKey
      
      const signature = crypto
        .createHash('sha256')
        .update(signatureString)
        .digest('hex')

      const payload = {
        merchantCode: this.config.merchantCode,
        merchantRefNum,
        customerMobile: request.customerPhone,
        customerEmail: request.customerEmail,
        paymentMethod: 'PAYATFAWRY', // أو 'CARD' للبطاقات
        amount: request.amount,
        currencyCode: request.currency || 'EGP',
        description: request.description || 'دفعة عبر نظام أقساطي',
        chargeItems: [
          {
            itemId: request.referenceId || 'ITEM-001',
            description: request.description || 'دفعة',
            price: request.amount,
            quantity: 1
          }
        ],
        signature,
        returnUrl: this.config.callbackUrl
      }

      // إرسال الطلب لفوري
      const response = await fetch(`${this.baseUrl}/ECommerceWeb/Fawry/payments/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.statusCode === 200 || result.status === 'SUCCESS') {
        return {
          success: true,
          transactionId: result.fawryRefNumber,
          referenceNumber: merchantRefNum,
          paymentUrl: `${this.baseUrl}/ECommerceWeb/Fawry/payments/redirect?merchantCode=${this.config.merchantCode}&merchantRefNumber=${merchantRefNum}`,
          status: 'pending',
          message: 'تم إنشاء الدفعة بنجاح',
          gatewayResponse: result
        }
      }

      return {
        success: false,
        status: 'failed',
        message: result.statusDescription || 'فشل في إنشاء الدفعة',
        gatewayResponse: result
      }

    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        message: error.message || 'خطأ في الاتصال ببوابة فوري'
      }
    }
  }

  // التحقق من حالة الدفعة
  async checkPaymentStatus(merchantRefNum: string): Promise<PaymentResponse> {
    try {
      const signatureString = this.config.merchantCode + 
                              merchantRefNum + 
                              this.config.securityKey
      
      const signature = crypto
        .createHash('sha256')
        .update(signatureString)
        .digest('hex')

      const response = await fetch(
        `${this.baseUrl}/ECommerceWeb/Fawry/payments/status/${this.config.merchantCode}/${merchantRefNum}?signature=${signature}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      )

      const result = await response.json()

      const statusMap: Record<string, PaymentResponse['status']> = {
        'UNPAID': 'pending',
        'PAID': 'completed',
        'EXPIRED': 'cancelled',
        'FAILED': 'failed',
        'REFUNDED': 'cancelled',
        'PARTIAL_REFUNDED': 'completed'
      }

      return {
        success: result.statusCode === 200,
        transactionId: result.fawryRefNumber,
        referenceNumber: merchantRefNum,
        status: statusMap[result.paymentStatus] || 'pending',
        message: result.statusDescription,
        gatewayResponse: result
      }

    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        message: error.message
      }
    }
  }

  // استرداد الدفعة (Refund)
  async refundPayment(merchantRefNum: string, amount: number, reason: string): Promise<PaymentResponse> {
    try {
      const refundRefNum = `REFUND-${Date.now()}`
      
      const signatureString = this.config.merchantCode + 
                              refundRefNum + 
                              merchantRefNum + 
                              amount.toFixed(2) + 
                              this.config.securityKey
      
      const signature = crypto
        .createHash('sha256')
        .update(signatureString)
        .digest('hex')

      const payload = {
        merchantCode: this.config.merchantCode,
        referenceNumber: refundRefNum,
        refundAmount: amount,
        reason,
        fawryRefNumber: merchantRefNum,
        signature
      }

      const response = await fetch(`${this.baseUrl}/ECommerceWeb/Fawry/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      return {
        success: result.statusCode === 200,
        transactionId: result.fawryRefNumber,
        referenceNumber: refundRefNum,
        status: result.statusCode === 200 ? 'completed' : 'failed',
        message: result.statusDescription,
        gatewayResponse: result
      }

    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        message: error.message
      }
    }
  }
}

// ===================== MOBILE WALLET GATEWAY =====================
class MobileWalletGateway {
  private provider: 'VODAFONE_CASH' | 'ORANGE_CASH' | 'ETISALAT_CASH' | 'WE_PAY'
  private config: any

  constructor(provider: 'VODAFONE_CASH' | 'ORANGE_CASH' | 'ETISALAT_CASH' | 'WE_PAY', config: any) {
    this.provider = provider
    this.config = config
  }

  // إنشاء طلب دفع للمحفظة
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // في الإنتاج، يجب الاتصال بـ API المحفظة الفعلي
      // هنا نحاكي الاستجابة للعرض
      
      const providerConfig = GATEWAY_CONFIGS[this.provider]
      
      // محاكاة إنشاء طلب دفع
      const payload = {
        merchantId: this.config.merchantId,
        amount: request.amount,
        currency: request.currency || 'EGP',
        customerPhone: request.customerPhone,
        description: request.description,
        reference: transactionId,
        callbackUrl: this.config.callbackUrl
      }

      // في الإنتاج:
      // const response = await fetch(`${providerConfig.productionUrl}/api/v1/payment`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.config.apiKey}`
      //   },
      //   body: JSON.stringify(payload)
      // })

      // محاكاة الاستجابة
      const simulatedResponse = {
        transactionId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 دقيقة
        instructions: this.getPaymentInstructions()
      }

      return {
        success: true,
        transactionId,
        referenceNumber: transactionId,
        status: 'pending',
        expiresAt: simulatedResponse.expiresAt,
        message: `تم إنشاء طلب الدفع. ${simulatedResponse.instructions}`,
        gatewayResponse: simulatedResponse
      }

    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        message: error.message
      }
    }
  }

  // تعليمات الدفع لكل محفظة
  private getPaymentInstructions(): string {
    const instructions: Record<string, string> = {
      VODAFONE_CASH: 'للدفع عبر فودافون كاش: #9*رقم المحفظة*المبلغ#',
      ORANGE_CASH: 'للدفع عبر أورانج كاش: #142*المبلغ*رقم المحفظة#',
      ETISALAT_CASH: 'للدفع عبر اتصالات كاش: #767*المبلغ*رقم المحفظة#',
      WE_PAY: 'للدفع عبر WE Pay: افتح التطبيق واختر تحويل'
    }
    return instructions[this.provider] || ''
  }
}

// ===================== INSTAPAY GATEWAY =====================
class InstaPayGateway {
  private config: any

  constructor(config: any) {
    this.config = config
  }

  // إنشاء طلب تحويل
  async createTransferRequest(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const transactionId = `INSTA-${Date.now()}`
      
      // معلومات الحساب البنكي
      const bankInfo = {
        bankName: this.config.bankName || 'البنك الأهلي المصري',
        accountNumber: this.config.accountNumber,
        accountName: this.config.accountName || 'شركة أقساطي',
        IBAN: this.config.IBAN
      }

      return {
        success: true,
        transactionId,
        referenceNumber: transactionId,
        status: 'pending',
        message: `يرجى التحويل إلى الحساب البنكي التالي:\n` +
                 `البنك: ${bankInfo.bankName}\n` +
                 `رقم الحساب: ${bankInfo.accountNumber}\n` +
                 `اسم الحساب: ${bankInfo.accountName}\n` +
                 `IBAN: ${bankInfo.IBAN}`,
        gatewayResponse: { bankInfo }
      }

    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        message: error.message
      }
    }
  }
}

// ===================== PAYMENT MANAGER =====================
export class EgyptianPaymentManager {
  private fawry: FawryGateway | null = null
  private vodafoneCash: MobileWalletGateway | null = null
  private orangeCash: MobileWalletGateway | null = null
  private etisalatCash: MobileWalletGateway | null = null
  private wePay: MobileWalletGateway | null = null
  private instaPay: InstaPayGateway | null = null

  constructor(configs: {
    fawry?: GatewayConfig
    vodafoneCash?: any
    orangeCash?: any
    etisalatCash?: any
    wePay?: any
    instaPay?: any
  }) {
    if (configs.fawry) {
      this.fawry = new FawryGateway(configs.fawry)
    }
    if (configs.vodafoneCash) {
      this.vodafoneCash = new MobileWalletGateway('VODAFONE_CASH', configs.vodafoneCash)
    }
    if (configs.orangeCash) {
      this.orangeCash = new MobileWalletGateway('ORANGE_CASH', configs.orangeCash)
    }
    if (configs.etisalatCash) {
      this.etisalatCash = new MobileWalletGateway('ETISALAT_CASH', configs.etisalatCash)
    }
    if (configs.wePay) {
      this.wePay = new MobileWalletGateway('WE_PAY', configs.wePay)
    }
    if (configs.instaPay) {
      this.instaPay = new InstaPayGateway(configs.instaPay)
    }
  }

  // إنشاء دفعة
  async createPayment(method: PaymentMethod, request: PaymentRequest): Promise<PaymentResponse> {
    switch (method) {
      case 'FAWRY':
      case 'FAWRY_PAY_AT_FAWRY':
        if (!this.fawry) throw new Error('بوابة فوري غير مفعلة')
        return this.fawry.createPayment(request)

      case 'VODAFONE_CASH':
        if (!this.vodafoneCash) throw new Error('فودافون كاش غير مفعلة')
        return this.vodafoneCash.createPayment(request)

      case 'ORANGE_CASH':
        if (!this.orangeCash) throw new Error('أورانج كاش غير مفعلة')
        return this.orangeCash.createPayment(request)

      case 'ETISALAT_CASH':
        if (!this.etisalatCash) throw new Error('اتصالات كاش غير مفعلة')
        return this.etisalatCash.createPayment(request)

      case 'WE_PAY':
        if (!this.wePay) throw new Error('WE Pay غير مفعلة')
        return this.wePay.createPayment(request)

      case 'INSTAPAY':
      case 'BANK_TRANSFER':
        if (!this.instaPay) throw new Error('انستاباي غير مفعلة')
        return this.instaPay.createTransferRequest(request)

      default:
        throw new Error(`طريقة الدفع ${method} غير مدعومة`)
    }
  }

  // التحقق من حالة الدفعة
  async checkStatus(method: PaymentMethod, referenceNumber: string): Promise<PaymentResponse> {
    if (method === 'FAWRY' && this.fawry) {
      return this.fawry.checkPaymentStatus(referenceNumber)
    }
    
    // للطرق الأخرى، نحتاج لتخزين الحالة محلياً
    const transaction = await db.paymentTransaction.findFirst({
      where: { referenceNumber }
    })
    
    if (transaction) {
      return {
        success: true,
        transactionId: transaction.transactionId || undefined,
        referenceNumber,
        status: transaction.status as PaymentResponse['status'],
        gatewayResponse: transaction.metadata ? JSON.parse(transaction.metadata) : null
      }
    }
    
    return {
      success: false,
      status: 'failed',
      message: 'المعاملة غير موجودة'
    }
  }

  // استرداد دفعة
  async refundPayment(method: PaymentMethod, referenceNumber: string, amount: number, reason: string): Promise<PaymentResponse> {
    if (method === 'FAWRY' && this.fawry) {
      return this.fawry.refundPayment(referenceNumber, amount, reason)
    }
    
    throw new Error(`الاسترداد غير مدعوم لطريقة الدفع ${method}`)
  }

  // الحصول على الطرق المتاحة
  getAvailableMethods(): { method: PaymentMethod; name: string; logo: string }[] {
    const methods: { method: PaymentMethod; name: string; logo: string }[] = []
    
    if (this.fawry) {
      methods.push(
        { method: 'FAWRY', name: 'فوري', logo: GATEWAY_CONFIGS.FAWRY.logo },
        { method: 'FAWRY_PAY_AT_FAWRY', name: 'الدفع في منافذ فوري', logo: GATEWAY_CONFIGS.FAWRY.logo }
      )
    }
    
    if (this.vodafoneCash) {
      methods.push({ method: 'VODAFONE_CASH', name: 'فودافون كاش', logo: GATEWAY_CONFIGS.VODAFONE_CASH.logo })
    }
    
    if (this.orangeCash) {
      methods.push({ method: 'ORANGE_CASH', name: 'أورانج كاش', logo: GATEWAY_CONFIGS.ORANGE_CASH.logo })
    }
    
    if (this.etisalatCash) {
      methods.push({ method: 'ETISALAT_CASH', name: 'اتصالات كاش', logo: '/payment/etisalat.svg' })
    }
    
    if (this.wePay) {
      methods.push({ method: 'WE_PAY', name: 'WE Pay', logo: '/payment/we.svg' })
    }
    
    if (this.instaPay) {
      methods.push(
        { method: 'INSTAPAY', name: 'انستاباي', logo: GATEWAY_CONFIGS.INSTAPAY.logo },
        { method: 'BANK_TRANSFER', name: 'تحويل بنكي', logo: '/payment/bank.svg' }
      )
    }
    
    return methods
  }
}

// ===================== FACTORY FUNCTION =====================
export async function createPaymentManagerForCompany(companyId: string): Promise<EgyptianPaymentManager> {
  // جلب إعدادات بوابات الدفع الخاصة بالشركة من قاعدة البيانات
  const companyGateways = await db.companyPaymentGateway.findMany({
    where: { 
      companyId,
      isActive: true 
    }
  })

  const configs: {
    fawry?: {
      merchantCode: string
      securityKey: string
      sandbox: boolean
      callbackUrl: string
    }
    vodafoneCash?: {
      merchantId?: string
      apiKey?: string
      walletNumber?: string
      callbackUrl?: string
    }
    orangeCash?: {
      merchantId?: string
      apiKey?: string
      walletNumber?: string
      callbackUrl?: string
    }
    etisalatCash?: {
      merchantId?: string
      apiKey?: string
      walletNumber?: string
      callbackUrl?: string
    }
    wePay?: {
      merchantId?: string
      apiKey?: string
      walletNumber?: string
      callbackUrl?: string
    }
    instaPay?: {
      bankName?: string
      accountNumber?: string
      accountName?: string
      IBAN?: string
      apiKey?: string
    }
    meeza?: {
      merchantId?: string
      apiKey?: string
    }
    visa?: {
      merchantId?: string
      apiKey?: string
      apiSecret?: string
    }
  } = {}

  // تجهيز الإعدادات لكل بوابة مفعلة
  for (const gateway of companyGateways) {
    switch (gateway.gatewayType) {
      case 'fawry':
        configs.fawry = {
          merchantCode: gateway.merchantId || '',
          securityKey: gateway.merchantSecret || '',
          sandbox: !gateway.isLive,
          callbackUrl: gateway.callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback/fawry`
        }
        break
      
      case 'vodafone_cash':
        configs.vodafoneCash = {
          merchantId: gateway.merchantId || undefined,
          apiKey: gateway.apiKey || undefined,
          walletNumber: gateway.walletNumber || undefined,
          callbackUrl: gateway.callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback/vodafone`
        }
        break
      
      case 'orange_cash':
        configs.orangeCash = {
          merchantId: gateway.merchantId || undefined,
          apiKey: gateway.apiKey || undefined,
          walletNumber: gateway.walletNumber || undefined,
          callbackUrl: gateway.callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback/orange`
        }
        break
      
      case 'etisalat_cash':
        configs.etisalatCash = {
          merchantId: gateway.merchantId || undefined,
          apiKey: gateway.apiKey || undefined,
          walletNumber: gateway.walletNumber || undefined,
          callbackUrl: gateway.callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback/etisalat`
        }
        break
      
      case 'we_pay':
        configs.wePay = {
          merchantId: gateway.merchantId || undefined,
          apiKey: gateway.apiKey || undefined,
          walletNumber: gateway.walletNumber || undefined,
          callbackUrl: gateway.callbackUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback/we`
        }
        break
      
      case 'instapay':
        configs.instaPay = {
          bankName: gateway.name,
          accountNumber: gateway.accountNumber || undefined,
          accountName: gateway.nameAr || undefined,
          IBAN: gateway.settings ? JSON.parse(gateway.settings).iban : undefined,
          apiKey: gateway.apiKey || undefined
        }
        break
      
      case 'meeza':
        configs.meeza = {
          merchantId: gateway.merchantId || undefined,
          apiKey: gateway.apiKey || undefined
        }
        break
      
      case 'visa':
        configs.visa = {
          merchantId: gateway.merchantId || undefined,
          apiKey: gateway.apiKey || undefined,
          apiSecret: gateway.apiSecret || undefined
        }
        break
    }
  }
  
  return new EgyptianPaymentManager(configs)
}

// Legacy function for backward compatibility
export function createPaymentManager(companyId?: string): EgyptianPaymentManager {
  // في الإنتاج، نحضر الإعدادات من قاعدة البيانات
  const configs = {
    fawry: {
      merchantCode: process.env.FAWRY_MERCHANT_CODE || 'test-merchant',
      securityKey: process.env.FAWRY_SECURITY_KEY || 'test-security-key',
      sandbox: process.env.NODE_ENV !== 'production',
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/callback/fawry`
    },
    vodafoneCash: {
      merchantId: process.env.VODAFONE_MERCHANT_ID,
      apiKey: process.env.VODAFONE_API_KEY,
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/callback/vodafone`
    },
    orangeCash: {
      merchantId: process.env.ORANGE_MERCHANT_ID,
      apiKey: process.env.ORANGE_API_KEY,
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/callback/orange`
    },
    instaPay: {
      bankName: process.env.BANK_NAME,
      accountNumber: process.env.BANK_ACCOUNT_NUMBER,
      accountName: process.env.BANK_ACCOUNT_NAME,
      IBAN: process.env.BANK_IBAN
    }
  }
  
  return new EgyptianPaymentManager(configs)
}

// دالة للحصول على البوابة الافتراضية للشركة
export async function getCompanyDefaultGateway(companyId: string) {
  const gateway = await db.companyPaymentGateway.findFirst({
    where: {
      companyId,
      isActive: true,
      isDefault: true
    }
  })
  
  return gateway
}

// دالة للحصول على جميع بوابات الدفع النشطة للشركة
export async function getCompanyActiveGateways(companyId: string) {
  const gateways = await db.companyPaymentGateway.findMany({
    where: {
      companyId,
      isActive: true
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'asc' }
    ]
  })
  
  return gateways
}

// تصدير الأنواع
export type { PaymentMethod, PaymentRequest, PaymentResponse }
