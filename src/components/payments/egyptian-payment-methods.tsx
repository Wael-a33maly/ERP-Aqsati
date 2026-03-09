'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Wallet, CreditCard, Building2, Smartphone, RefreshCw, CheckCircle2,
  XCircle, Clock, Copy, ExternalLink, QrCode, AlertCircle, Loader2,
  Phone, ArrowRight, Info
} from 'lucide-react'
import { toast } from 'sonner'

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

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

interface PaymentMethodConfig {
  id: PaymentMethod
  name: string
  nameEn: string
  description: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  category: 'wallet' | 'gateway' | 'card' | 'bank'
  instructions: string[]
  estimatedTime: string
}

interface PaymentResponse {
  success: boolean
  transactionId?: string
  referenceNumber?: string
  paymentUrl?: string
  qrCode?: string
  expiresAt?: string
  status: PaymentStatus
  message?: string
  gatewayResponse?: any
}

// ===================== PAYMENT METHODS CONFIG =====================
const paymentMethods: PaymentMethodConfig[] = [
  {
    id: 'FAWRY',
    name: 'فوري',
    nameEn: 'Fawry',
    description: 'الدفع الإلكتروني عبر فوري',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: <Wallet className="h-6 w-6" />,
    category: 'gateway',
    instructions: [
      'سيتم توجيهك لصفحة الدفع',
      'أدخل رقم الهاتف المحمول',
      'أدخل رمز التحقق المرسل لهاتفك',
      'أكد عملية الدفع'
    ],
    estimatedTime: 'فوري'
  },
  {
    id: 'FAWRY_PAY_AT_FAWRY',
    name: 'الدفع في منافذ فوري',
    nameEn: 'Pay at Fawry',
    description: 'ادفع في أقرب منفذ فوري',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: <Building2 className="h-6 w-6" />,
    category: 'gateway',
    instructions: [
      'سيظهر لك رقم مرجعي',
      'اذهب لأقرب منفذ فوري',
      'أعطي الموظف الرقم المرجعي',
      'ادفع المبلغ واستلم الإيصال'
    ],
    estimatedTime: 'خلال 24 ساعة'
  },
  {
    id: 'VODAFONE_CASH',
    name: 'فودافون كاش',
    nameEn: 'Vodafone Cash',
    description: 'الدفع عبر محفظة فودافون كاش',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: <Smartphone className="h-6 w-6" />,
    category: 'wallet',
    instructions: [
      'افتح قائمة فودافون كاش من هاتفك',
      'اختر "تحويل أموال"',
      'أدخل رقم المحفظة المستفيدة',
      'أدخل المبلغ ورقم العملية',
      'أكد العملية برقمك السري'
    ],
    estimatedTime: 'فوري'
  },
  {
    id: 'ORANGE_CASH',
    name: 'أورانج كاش',
    nameEn: 'Orange Cash',
    description: 'الدفع عبر محفظة أورانج كاش',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: <Smartphone className="h-6 w-6" />,
    category: 'wallet',
    instructions: [
      'افتح تطبيق أورانج كاش',
      'اختر "تحويل"',
      'أدخل رقم المحفظة المستفيدة',
      'أدخل المبلغ',
      'أكد العملية برقمك السري'
    ],
    estimatedTime: 'فوري'
  },
  {
    id: 'ETISALAT_CASH',
    name: 'اتصالات كاش',
    nameEn: 'Etisalat Cash',
    description: 'الدفع عبر محفظة اتصالات كاش',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: <Smartphone className="h-6 w-6" />,
    category: 'wallet',
    instructions: [
      'من هاتفك اتصل على #767#',
      'اختر "تحويل أموال"',
      'أدخل رقم المحفظة المستفيدة',
      'أدخل المبلغ',
      'أكد العملية برقمك السري'
    ],
    estimatedTime: 'فوري'
  },
  {
    id: 'WE_PAY',
    name: 'WE Pay',
    nameEn: 'WE Pay',
    description: 'الدفع عبر محفظة WE Pay',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: <Smartphone className="h-6 w-6" />,
    category: 'wallet',
    instructions: [
      'افتح تطبيق WE Pay',
      'اختر "تحويل"',
      'أدخل رقم المحفظة المستفيدة',
      'أدخل المبلغ ورقم العملية',
      'أكد العملية برقمك السري'
    ],
    estimatedTime: 'فوري'
  },
  {
    id: 'INSTAPAY',
    name: 'انستاباي',
    nameEn: 'InstaPay',
    description: 'التحويل البنكي الفوري',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-200 dark:border-purple-800',
    icon: <ArrowRight className="h-6 w-6" />,
    category: 'bank',
    instructions: [
      'افتح تطبيق انستاباي',
      'اختر "تحويل فوري"',
      'اختر البنك المستفيد',
      'أدخل رقم الحساب/IBAN',
      'أدخل المبلغ وأكد العملية'
    ],
    estimatedTime: 'فوري'
  },
  {
    id: 'BANK_TRANSFER',
    name: 'تحويل بنكي',
    nameEn: 'Bank Transfer',
    description: 'تحويل بنكي عادي',
    color: 'text-slate-600',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-200 dark:border-slate-800',
    icon: <Building2 className="h-6 w-6" />,
    category: 'bank',
    instructions: [
      'استخدم بيانات الحساب البنكي',
      'قم بالتحويل من حسابك البنكي',
      'احتفظ بإيصال التحويل',
      'سيتم التأكيد خلال 1-3 أيام عمل'
    ],
    estimatedTime: '1-3 أيام عمل'
  },
  {
    id: 'MEEZA_CARD',
    name: 'بطاقة ميزة',
    nameEn: 'Meeza Card',
    description: 'الدفع ببطاقة ميزة المصرية',
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-200 dark:border-teal-800',
    icon: <CreditCard className="h-6 w-6" />,
    category: 'card',
    instructions: [
      'سيتم توجيهك لصفحة الدفع الآمن',
      'أدخل رقم بطاقة ميزة',
      'أدخل تاريخ الانتهاء',
      'أدخل رمز التحقق (CVV)',
      'أكد العملية'
    ],
    estimatedTime: 'فوري'
  },
  {
    id: 'VISA',
    name: 'فيزا',
    nameEn: 'Visa',
    description: 'الدفع ببطاقة فيزا',
    color: 'text-blue-700',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-300 dark:border-blue-800',
    icon: <CreditCard className="h-6 w-6" />,
    category: 'card',
    instructions: [
      'سيتم توجيهك لصفحة الدفع الآمن',
      'أدخل رقم البطاقة',
      'أدخل تاريخ الانتهاء',
      'أدخل رمز التحقق (CVV)',
      'أكد العملية'
    ],
    estimatedTime: 'فوري'
  },
  {
    id: 'MASTERCARD',
    name: 'ماستركارد',
    nameEn: 'Mastercard',
    description: 'الدفع ببطاقة ماستركارد',
    color: 'text-orange-700',
    bgColor: 'bg-orange-600/10',
    borderColor: 'border-orange-300 dark:border-orange-800',
    icon: <CreditCard className="h-6 w-6" />,
    category: 'card',
    instructions: [
      'سيتم توجيهك لصفحة الدفع الآمن',
      'أدخل رقم البطاقة',
      'أدخل تاريخ الانتهاء',
      'أدخل رمز التحقق (CVV)',
      'أكد العملية'
    ],
    estimatedTime: 'فوري'
  }
]

// ===================== STATUS BADGE COMPONENT =====================
function StatusBadge({ status }: { status: PaymentStatus }) {
  const configs = {
    pending: { label: 'معلق', className: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: Clock },
    completed: { label: 'مكتمل', className: 'bg-green-500/10 text-green-600 border-green-200', icon: CheckCircle2 },
    failed: { label: 'فشل', className: 'bg-red-500/10 text-red-600 border-red-200', icon: XCircle },
    cancelled: { label: 'ملغي', className: 'bg-gray-500/10 text-gray-600 border-gray-200', icon: XCircle }
  }
  
  const config = configs[status]
  const Icon = config.icon
  
  return (
    <Badge variant="outline" className={`${config.className} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

// ===================== PAYMENT METHOD CARD =====================
function PaymentMethodCard({ 
  method, 
  onSelect, 
  selected 
}: { 
  method: PaymentMethodConfig
  onSelect: () => void
  selected: boolean
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        selected 
          ? `ring-2 ring-primary ${method.borderColor}` 
          : method.borderColor
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`h-12 w-12 rounded-xl ${method.bgColor} flex items-center justify-center flex-shrink-0`}>
            <span className={method.color}>{method.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm">{method.name}</h3>
              {selected && (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{method.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{method.estimatedTime}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===================== INSTRUCTIONS DIALOG =====================
function PaymentInstructionsDialog({
  open,
  onClose,
  method,
  paymentResponse,
  amount,
  onCheckStatus,
  checking,
  currency
}: {
  open: boolean
  onClose: () => void
  method: PaymentMethodConfig | null
  paymentResponse: PaymentResponse | null
  amount: number
  onCheckStatus: () => void
  checking: boolean
  currency: { code: string; symbol: string; name: string }
}) {
  const [copied, setCopied] = useState(false)
  
  if (!method || !paymentResponse) return null
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('تم نسخ الرقم')
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={method.color}>{method.icon}</span>
            تعليمات الدفع - {method.name}
          </DialogTitle>
          <DialogDescription>
            المبلغ: <strong className="text-primary">{amount.toLocaleString()} {currency.symbol}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* حالة الدفع */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium">حالة الدفع:</span>
            <StatusBadge status={paymentResponse.status} />
          </div>
          
          {/* الرقم المرجعي */}
          {paymentResponse.referenceNumber && (
            <div className="p-3 rounded-lg border bg-gradient-to-l from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">الرقم المرجعي</p>
                  <p className="font-mono font-bold text-lg" dir="ltr">{paymentResponse.referenceNumber}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(paymentResponse.referenceNumber!)}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          
          {/* رقم العملية */}
          {paymentResponse.transactionId && (
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">رقم العملية</p>
              <p className="font-mono font-medium" dir="ltr">{paymentResponse.transactionId}</p>
            </div>
          )}
          
          {/* رابط الدفع */}
          {paymentResponse.paymentUrl && (
            <Button 
              className="w-full bg-gradient-to-l from-primary to-primary/80"
              onClick={() => window.open(paymentResponse.paymentUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 ml-2" />
              انتقل لصفحة الدفع
            </Button>
          )}
          
          {/* تعليمات الدفع */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              خطوات الدفع
            </h4>
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              {method.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm">{instruction}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* زر التحقق من الحالة */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onCheckStatus}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 ml-2" />
            )}
            التحقق من حالة الدفع
          </Button>
          
          {/* رسالة */}
          {paymentResponse.message && (
            <p className="text-sm text-muted-foreground text-center">{paymentResponse.message}</p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===================== CURRENCY HOOK =====================
const defaultCurrencies = [
  { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س' },
  { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ' },
  { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م' },
  { code: 'USD', name: 'دولار أمريكي', symbol: '$' },
  { code: 'EUR', name: 'يورو', symbol: '€' },
  { code: 'KWD', name: 'دينار كويتي', symbol: 'د.ك' },
  { code: 'QAR', name: 'ريال قطري', symbol: 'ر.ق' },
  { code: 'BHD', name: 'دينار بحريني', symbol: 'د.ب' },
]

function useCurrency() {
  const [currency, setCurrency] = useState({ code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' })
  
  useEffect(() => {
    const loadCurrency = () => {
      const savedSettings = localStorage.getItem('erp_settings')
      const savedCurrencies = localStorage.getItem('erp_custom_currencies')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        const allCurrencies = [...defaultCurrencies, ...(savedCurrencies ? JSON.parse(savedCurrencies) : [])]
        const curr = allCurrencies.find((c: any) => c.code === settings.currency) || defaultCurrencies[0]
        setCurrency(curr)
      }
    }
    loadCurrency()
    
    window.addEventListener('storage', loadCurrency)
    const interval = setInterval(loadCurrency, 1000)
    
    return () => {
      window.removeEventListener('storage', loadCurrency)
      clearInterval(interval)
    }
  }, [])
  
  return currency
}

// ===================== MAIN COMPONENT =====================
export default function EgyptianPaymentMethods({
  amount: initialAmount = 0,
  customerId,
  customerPhone,
  customerName,
  description,
  invoiceId,
  companyId,
  branchId,
  userId,
  onPaymentComplete,
  currency: externalCurrency
}: {
  amount?: number
  customerId: string
  customerPhone?: string
  customerName?: string
  description?: string
  invoiceId?: string
  companyId?: string
  branchId?: string
  userId?: string
  onPaymentComplete?: (response: PaymentResponse) => void
  currency?: { code: string; symbol: string; name: string }
}) {
  // استخدام العملة الخارجية أو من الإعدادات
  const internalCurrency = useCurrency()
  const currency = externalCurrency || internalCurrency
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodConfig | null>(null)
  const [amount, setAmount] = useState(initialAmount.toString())
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  
  // تصنيف الطرق
  const wallets = paymentMethods.filter(m => m.category === 'wallet')
  const gateways = paymentMethods.filter(m => m.category === 'gateway')
  const cards = paymentMethods.filter(m => m.category === 'card')
  const banks = paymentMethods.filter(m => m.category === 'bank')
  
  // إنشاء دفعة جديدة
  const handleCreatePayment = async () => {
    if (!selectedMethod) {
      toast.error('يرجى اختيار طريقة الدفع')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/payments/egyptian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: selectedMethod.id,
          amount: parseFloat(amount),
          customerId,
          customerPhone,
          customerName,
          description: description || `دفعة عبر ${selectedMethod.name}`,
          invoiceId,
          companyId,
          branchId,
          userId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setPaymentResponse(result.data)
        setShowInstructions(true)
        toast.success('تم إنشاء طلب الدفع بنجاح')
        
        if (result.data.status === 'completed' && onPaymentComplete) {
          onPaymentComplete(result.data)
        }
      } else {
        toast.error(result.error || 'فشل في إنشاء طلب الدفع')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }
  
  // التحقق من حالة الدفع
  const handleCheckStatus = async () => {
    if (!selectedMethod || !paymentResponse?.referenceNumber) return
    
    setChecking(true)
    
    try {
      const response = await fetch(
        `/api/payments/egyptian?method=${selectedMethod.id}&reference=${paymentResponse.referenceNumber}&companyId=${companyId || ''}`
      )
      
      const result = await response.json()
      
      if (result.success) {
        setPaymentResponse(result.data)
        
        if (result.data.status === 'completed') {
          toast.success('تم تأكيد الدفع بنجاح!')
          if (onPaymentComplete) {
            onPaymentComplete(result.data)
          }
        } else if (result.data.status === 'failed') {
          toast.error('فشلت عملية الدفع')
        } else {
          toast.info('الدفع لا يزال معلقاً')
        }
      } else {
        toast.error(result.error || 'فشل في التحقق من الحالة')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setChecking(false)
    }
  }
  
  return (
    <div className="space-y-6" dir="rtl">
      {/* عنوان */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Wallet className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">طرق الدفع المصرية</h2>
          <p className="text-sm text-muted-foreground">اختر طريقة الدفع المناسبة لك</p>
        </div>
      </div>
      
      {/* حقل المبلغ */}
      <Card>
        <CardContent className="p-4">
          <Label htmlFor="amount" className="text-sm font-medium">المبلغ ({currency.symbol})</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="أدخل المبلغ"
            className="mt-2 text-lg font-bold"
            disabled={initialAmount > 0}
          />
        </CardContent>
      </Card>
      
      {/* بوابات الدفع */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-orange-500" />
          بوابات الدفع
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {gateways.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              selected={selectedMethod?.id === method.id}
              onSelect={() => setSelectedMethod(method)}
            />
          ))}
        </div>
      </div>
      
      {/* المحافظ الإلكترونية */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-purple-500" />
          المحافظ الإلكترونية
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {wallets.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              selected={selectedMethod?.id === method.id}
              onSelect={() => setSelectedMethod(method)}
            />
          ))}
        </div>
      </div>
      
      {/* البطاقات */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          البطاقات البنكية
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              selected={selectedMethod?.id === method.id}
              onSelect={() => setSelectedMethod(method)}
            />
          ))}
        </div>
      </div>
      
      {/* التحويل البنكي */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-slate-500" />
          التحويل البنكي
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {banks.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              selected={selectedMethod?.id === method.id}
              onSelect={() => setSelectedMethod(method)}
            />
          ))}
        </div>
      </div>
      
      {/* زر الدفع */}
      <Button 
        className="w-full h-12 text-lg bg-gradient-to-l from-primary to-primary/80"
        onClick={handleCreatePayment}
        disabled={!selectedMethod || loading || !amount || parseFloat(amount) <= 0}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin ml-2" />
        ) : (
          <Wallet className="h-5 w-5 ml-2" />
        )}
        {loading ? 'جاري المعالجة...' : `دفع ${parseFloat(amount || '0').toLocaleString()} ${currency.symbol}`}
      </Button>
      
      {/* نافذة التعليمات */}
      <PaymentInstructionsDialog
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        method={selectedMethod}
        paymentResponse={paymentResponse}
        amount={parseFloat(amount || '0')}
        onCheckStatus={handleCheckStatus}
        checking={checking}
        currency={currency}
      />
    </div>
  )
}
