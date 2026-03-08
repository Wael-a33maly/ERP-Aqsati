// نظام الذكاء الاصطناعي المتكامل
// AI Features - Prediction, Suggestions, Chatbot

import { db } from '@/lib/db'

// ===================== TYPES =====================
interface PredictionResult {
  risk: 'low' | 'medium' | 'high'
  score: number
  factors: string[]
  recommendation: string
}

interface PriceSuggestion {
  suggestedPrice: number
  confidence: number
  reasoning: string
  basedOn: string[]
}

interface CustomerBehavior {
  segment: string
  loyaltyScore: number
  predictedNextPurchase: Date | null
  recommendations: string[]
}

interface ChatbotResponse {
  success: boolean
  message: string
  action?: string
  data?: any
}

// ===================== PAYMENT DEFAULT PREDICTION =====================

// التنبؤ بالتخلف عن السداد
export async function predictPaymentDefault(customerId: string): Promise<PredictionResult> {
  try {
    // الحصول على بيانات العميل
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        Invoice: {
          where: { status: { not: 'cancelled' } },
          select: {
            total: true,
            paidAmount: true,
            status: true,
            createdAt: true,
            dueDate: true,
          }
        },
        Payment: {
          select: {
            amount: true,
            paymentDate: true,
            method: true,
          }
        },
        InstallmentContract: {
          include: {
            Installment: {
              select: {
                amount: true,
                paidAmount: true,
                status: true,
                dueDate: true,
              }
            }
          }
        }
      }
    })

    if (!customer) {
      throw new Error('العميل غير موجود')
    }

    // حساب المؤشرات
    const factors: string[] = []
    let score = 0

    // 1. نسبة السداد التاريخية
    const totalInvoiced = customer.Invoice.reduce((sum, inv) => sum + inv.total, 0)
    const totalPaid = customer.Invoice.reduce((sum, inv) => sum + inv.paidAmount, 0)
    const paymentRatio = totalInvoiced > 0 ? totalPaid / totalInvoiced : 1
    
    if (paymentRatio >= 0.9) {
      score += 10
      factors.push('سجل سداد ممتاز (90%+)')
    } else if (paymentRatio >= 0.7) {
      score += 5
      factors.push('سجل سداد جيد (70-90%)')
    } else if (paymentRatio >= 0.5) {
      score += 0
      factors.push('سجل سداد متوسط (50-70%)')
    } else {
      score -= 10
      factors.push('سجل سداد ضعيف (أقل من 50%)')
    }

    // 2. الأقساط المتأخرة
    const overdueInstallments = customer.InstallmentContract.flatMap(c => c.Installment)
      .filter(i => i.status === 'pending' && new Date(i.dueDate) < new Date())
    
    const overdueAmount = overdueInstallments.reduce((sum, i) => 
      sum + (i.amount - i.paidAmount), 0
    )
    
    if (overdueInstallments.length > 0) {
      score -= overdueInstallments.length * 5
      factors.push(`${overdueInstallments.length} أقساط متأخرة بإجمالي ${overdueAmount.toFixed(2)} ريال`)
    }

    // 3. عدد أيام التأخير
    const maxDelayDays = overdueInstallments.reduce((max, i) => {
      const days = Math.floor((Date.now() - new Date(i.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      return Math.max(max, days)
    }, 0)
    
    if (maxDelayDays > 60) {
      score -= 15
      factors.push(`تأخير كبير (${maxDelayDays} يوم)`)
    } else if (maxDelayDays > 30) {
      score -= 8
      factors.push(`تأخير متوسط (${maxDelayDays} يوم)`)
    } else if (maxDelayDays > 0) {
      score -= 3
      factors.push(`تأخير بسيط (${maxDelayDays} يوم)`)
    }

    // 4. حجم المعاملات
    const avgInvoiceAmount = customer.Invoice.length > 0 
      ? totalInvoiced / customer.Invoice.length 
      : 0
    
    if (avgInvoiceAmount > customer.creditLimit * 0.8) {
      score -= 5
      factors.push('متوسط قيمة الفواتير قريب من الحد الائتماني')
    }

    // 5. انتظام الدفع
    const payments = customer.Payment.sort((a, b) => 
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    )
    
    if (payments.length >= 3) {
      const intervals = []
      for (let i = 1; i < Math.min(6, payments.length); i++) {
        const days = Math.floor(
          (new Date(payments[i-1].paymentDate).getTime() - 
           new Date(payments[i].paymentDate).getTime()) / (1000 * 60 * 60 * 24)
        )
        intervals.push(days)
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length
      
      if (variance < 100) {
        score += 5
        factors.push('انتظام في الدفع')
      } else {
        score -= 3
        factors.push('عدم انتظام في الدفع')
      }
    }

    // تحديد مستوى المخاطرة
    let risk: 'low' | 'medium' | 'high'
    let recommendation: string
    
    if (score >= 10) {
      risk = 'low'
      recommendation = 'عميل موثوق - يمكن زيادة الحد الائتماني'
    } else if (score >= 0) {
      risk = 'medium'
      recommendation = 'مراقبة الوضع - لا حاجة لإجراءات خاصة'
    } else {
      risk = 'high'
      recommendation = 'يتطلب متابعة - تقليص الحد الائتماني أو طلب ضمانات'
    }

    return {
      risk,
      score,
      factors,
      recommendation
    }

  } catch (error: any) {
    throw error
  }
}

// ===================== PRICE SUGGESTION =====================

// اقتراح السعر الأمثل
export async function suggestProductPrice(productId: string): Promise<PriceSuggestion> {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        InvoiceItem: {
          select: {
            unitPrice: true,
            quantity: true,
            discount: true,
            Invoice: {
              select: {
                invoiceDate: true,
                status: true,
              }
            }
          }
        },
        ProductCategory: {
          include: {
            Product: {
              select: {
                sellPrice: true,
                costPrice: true,
              }
            }
          }
        }
      }
    })

    if (!product) {
      throw new Error('المنتج غير موجود')
    }

    const suggestions: string[] = []
    let suggestedPrice = product.sellPrice
    let totalWeight = 0

    // 1. تحليل أسعار البيع السابقة
    const soldItems = product.InvoiceItem.filter(i => i.Invoice.status !== 'cancelled')
    if (soldItems.length > 0) {
      const avgSoldPrice = soldItems.reduce((sum, i) => sum + i.unitPrice, 0) / soldItems.length
      const maxPrice = Math.max(...soldItems.map(i => i.unitPrice))
      const minPrice = Math.min(...soldItems.map(i => i.unitPrice))
      
      // استخدام المتوسط مع وزن 50%
      suggestedPrice = suggestedPrice * 0.5 + avgSoldPrice * 0.5
      totalWeight += 0.5
      
      suggestions.push(`متوسط سعر البيع السابق: ${avgSoldPrice.toFixed(2)} ريال`)
      suggestions.push(`أعلى سعر بيع: ${maxPrice.toFixed(2)}، أقل سعر: ${minPrice.toFixed(2)}`)
    }

    // 2. مقارنة مع منتجات نفس التصنيف
    if (product.ProductCategory && product.ProductCategory.Product.length > 1) {
      const categoryProducts = product.ProductCategory.Product.filter(p => p.id !== productId)
      const avgCategoryPrice = categoryProducts.reduce((sum, p) => sum + p.sellPrice, 0) / categoryProducts.length
      
      suggestedPrice = suggestedPrice * (1 - totalWeight) + avgCategoryPrice * 0.3
      totalWeight += 0.3
      
      suggestions.push(`متوسط سعر التصنيف: ${avgCategoryPrice.toFixed(2)} ريال`)
    }

    // 3. هامش الربح الموصى به
    const minMargin = 0.15 // 15% حد أدنى
    const targetMargin = 0.25 // 25% هدف
    const currentMargin = product.costPrice > 0 
      ? (product.sellPrice - product.costPrice) / product.costPrice 
      : 0
    
    if (currentMargin < minMargin) {
      const minPrice = product.costPrice * (1 + minMargin)
      suggestedPrice = Math.max(suggestedPrice, minPrice)
      suggestions.push(`السعر الحالي أقل من الحد الأدنى للربح (${(minMargin * 100).toFixed(0)}%)`)
    }

    // حساب الثقة في الاقتراح
    const confidence = Math.min(100, 40 + soldItems.length * 5 + (product.ProductCategory?.Product.length || 0) * 2)

    return {
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      confidence,
      reasoning: suggestions.join('. '),
      basedOn: ['سجل المبيعات', 'أسعار التصنيف', 'هامش الربح']
    }

  } catch (error: any) {
    throw error
  }
}

// ===================== CUSTOMER BEHAVIOR ANALYSIS =====================

// تحليل سلوك العملاء
export async function analyzeCustomerBehavior(customerId: string): Promise<CustomerBehavior> {
  try {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        Invoice: {
          select: {
            total: true,
            createdAt: true,
            type: true,
          }
        },
        Payment: {
          select: {
            amount: true,
            paymentDate: true,
          }
        }
      }
    })

    if (!customer) {
      throw new Error('العميل غير موجود')
    }

    // تحديد قطاع العميل
    const totalPurchases = customer.Invoice.reduce((sum, i) => sum + i.total, 0)
    const invoiceCount = customer.Invoice.length
    const avgPurchase = invoiceCount > 0 ? totalPurchases / invoiceCount : 0

    let segment: string
    const recommendations: string[] = []

    if (totalPurchases > 100000) {
      segment = 'VIP'
      recommendations.push('تقديم عروض حصرية')
      recommendations.push('خدمة أولوية')
    } else if (totalPurchases > 50000) {
      segment = 'مميز'
      recommendations.push('برنامج ولاء')
      recommendations.push('خصومات خاصة')
    } else if (totalPurchases > 10000) {
      segment = 'نشط'
      recommendations.push('عروض موسمية')
    } else {
      segment = 'عادي'
      recommendations.push('حملات تسويقية')
      recommendations.push('متابعة دورية')
    }

    // حساب نقاط الولاء
    let loyaltyScore = 0
    loyaltyScore += Math.min(50, invoiceCount * 5) // عدد الفواتير
    loyaltyScore += Math.min(30, customer.Payment.length * 3) // عدد الدفعات
    
    // التنبؤ بعملية الشراء التالية
    let predictedNextPurchase: Date | null = null
    if (customer.Invoice.length >= 2) {
      const sortedInvoices = customer.Invoice
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      const intervals = []
      for (let i = 1; i < sortedInvoices.length; i++) {
        const days = Math.floor(
          (new Date(sortedInvoices[i-1].createdAt).getTime() - 
           new Date(sortedInvoices[i].createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        intervals.push(days)
      }
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const lastPurchase = new Date(sortedInvoices[0].createdAt)
      predictedNextPurchase = new Date(lastPurchase.getTime() + avgInterval * 24 * 60 * 60 * 1000)
    }

    return {
      segment,
      loyaltyScore,
      predictedNextPurchase,
      recommendations
    }

  } catch (error: any) {
    throw error
  }
}

// ===================== AI CHATBOT =====================

const CHATBOT_RESPONSES: Record<string, { keywords: string[]; response: string }> = {
  greeting: {
    keywords: ['مرحبا', 'السلام', 'أهلا', 'صباح', 'مساء'],
    response: 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟'
  },
  help: {
    keywords: ['مساعدة', 'كيف', 'ما هي', 'شرح'],
    response: 'يمكنني مساعدتك في:\n• البحث عن العملاء والمنتجات\n• إنشاء فواتير جديدة\n• تسجيل المدفوعات\n• عرض تقارير\n\nما الذي تحتاج مساعدة فيه؟'
  },
  invoice: {
    keywords: ['فاتورة', 'فواتير', 'إنشاء فاتورة'],
    response: 'لإنشاء فاتورة جديدة:\n1. اذهب إلى قائمة الفواتير\n2. اضغط على "فاتورة جديدة"\n3. اختر العميل\n4. أضف المنتجات\n5. احفظ الفاتورة\n\nهل تريد مساعدة في شيء محدد؟'
  },
  payment: {
    keywords: ['دفعة', 'مدفوعات', 'سداد', 'دفع'],
    response: 'لتسجيل دفعة:\n1. اذهب إلى المدفوعات\n2. اضغط "دفعة جديدة"\n3. اختر العميل والفاتورة\n4. أدخل المبلغ وطريقة الدفع\n\nهل تحتاج مساعدة أخرى؟'
  },
  customer: {
    keywords: ['عميل', 'عملاء', 'زبون'],
    response: 'لإضافة عميل جديد:\n1. اذهب إلى قائمة العملاء\n2. اضغط "عميل جديد"\n3. أدخل بيانات العميل\n4. احفظ البيانات'
  },
  report: {
    keywords: ['تقرير', 'تقارير', 'إحصائيات'],
    response: 'يمكنك عرض التقارير من:\n• تقارير المبيعات\n• تقارير التحصيل\n• تقارير المخزون\n• تقارير العمولات\n\nأي تقرير تريد؟'
  }
}

// معالجة رسالة Chatbot
export async function processChatbotMessage(message: string): Promise<ChatbotResponse> {
  const normalizedMessage = message.toLowerCase().trim()
  
  // البحث عن رد مناسب
  for (const [, data] of Object.entries(CHATBOT_RESPONSES)) {
    if (data.keywords.some(keyword => normalizedMessage.includes(keyword))) {
      return {
        success: true,
        message: data.response
      }
    }
  }
  
  // رد افتراضي
  return {
    success: true,
    message: 'عذراً، لم أفهم سؤالك. هل يمكنك إعادة صياغته؟\n\nيمكنني مساعدتك في:\n• الفواتير والمدفوعات\n• العملاء والمنتجات\n• التقارير\n• الإعدادات'
  }
}

// ===================== BATCH PREDICTIONS =====================

// التنبؤ بجميع العملاء المعرضين للخطر
export async function getHighRiskCustomers(companyId: string): Promise<{
  customerId: string
  customerName: string
  risk: PredictionResult
}[]> {
  const customers = await db.customer.findMany({
    where: { companyId },
    select: { id: true, name: true }
  })
  
  const results = []
  
  for (const customer of customers) {
    const prediction = await predictPaymentDefault(customer.id)
    
    if (prediction.risk === 'high') {
      results.push({
        customerId: customer.id,
        customerName: customer.name,
        risk: prediction
      })
    }
  }
  
  return results.sort((a, b) => a.risk.score - b.risk.score)
}
