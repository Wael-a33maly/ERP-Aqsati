# 🔄 آخر التحديثات - ERP-Aqsati v2.1.0

## ✅ إعادة تنظيم تبويب إدارة الأقساط

### التبويبات الثلاثة:

| التبويب | المحتوى | اللون |
|---------|---------|-------|
| **غير مدفوعة** | الأقساط المعلقة + الجزئية + المتأخرة (كل ما لم يُدفع بالكامل) | 🔴 أحمر |
| **مدفوعة** | الأقساط المدفوعة بالكامل فقط | 🟢 أخضر |
| **متأخرة (متابعة)** | الأقساط التي تجاوزت تاريخ الاستحقاق ولم تُدفع بالكامل - للمتابعة من المدير والمندوب | 🟠 برتقالي |

### منطق التصنيف:

```typescript
// حالات القسط
const isPaid = paidAmount >= amount           // مدفوع بالكامل
const isPartial = paidAmount > 0 && paidAmount < amount  // جزئي
const isOverdue = !isPaid && new Date(dueDate) < new Date()  // متأخر

// فلترة التبويبات
const unpaidTab = installments.filter(i => i.status !== 'paid')  // غير مدفوعة
const paidTab = installments.filter(i => i.status === 'paid')    // مدفوعة
const overdueTab = installments.filter(i => 
  i.status !== 'paid' && new Date(i.dueDate) < new Date()
)  // متأخرة
```

---

## ✅ إصلاح مشكلة الدفع المجمع

### المشكلة:
كان API تحصيل الأقساط يستخدم أسماء علاقات غير صحيحة في Prisma

### الإصلاحات في `/api/installments/collect/route.ts`:

```typescript
// ❌ قبل (خطأ)
const installment = await db.installment.findUnique({
  where: { id: installmentId },
  include: { 
    contract: { 
      include: { 
        customer: true, 
        invoice: true 
      } 
    } 
  }
})

// ✅ بعد (صحيح)
const installment = await db.installment.findUnique({
  where: { id: installmentId },
  include: { 
    InstallmentContract: { 
      include: { 
        Customer: true, 
        Invoice: true 
      } 
    } 
  }
})

// إضافة متغير للوصول السهل
const contract = installment.InstallmentContract
```

### ⚠️ قاعدة مهمة: أسماء العلاقات في Prisma

```typescript
// في prisma/schema.prisma:
model Installment {
  InstallmentContract InstallmentContract @relation(...)
}

model InstallmentContract {
  Customer Customer @relation(...)
  Invoice Invoice @relation(...)
}

// في API:
// يجب استخدام نفس الاسم المعرّف في Schema (بحرف كبير)
include: {
  InstallmentContract: {  // ✅ صحيح
    include: {
      Customer: true,     // ✅ صحيح
      Invoice: true       // ✅ صحيح
    }
  }
}

// ❌ خطأ شائع
include: {
  contract: true,      // خطأ - لن يعمل
  customer: true,      // خطأ - لن يعمل
  installmentContract: true  // خطأ - الحرف الأول يجب أن يكون كبير
}
```

---

## 📋 ملخص التغييرات في API

### الملف: `/src/app/api/installments/collect/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { installmentId, amount, method, notes } = body

    if (!installmentId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { status: 400 }
      )
    }

    // ⭐ جلب القسط مع العلاقات الصحيحة
    const installment = await db.installment.findUnique({
      where: { id: installmentId },
      include: {
        InstallmentContract: {
          include: {
            Customer: true,
            Invoice: true
          }
        }
      }
    })

    if (!installment) {
      return NextResponse.json(
        { success: false, error: 'القسط غير موجود' },
        { status: 404 }
      )
    }

    const contract = installment.InstallmentContract
    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'العقد غير موجود' },
        { status: 404 }
      )
    }

    // حساب المبالغ الجديدة
    const newPaidAmount = (installment.paidAmount || 0) + amount
    const newRemainingAmount = installment.amount - newPaidAmount
    const isFullyPaid = newRemainingAmount <= 0

    // تحديث القسط
    const updatedInstallment = await db.installment.update({
      where: { id: installmentId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, newRemainingAmount),
        status: isFullyPaid ? 'paid' : 'partial',
        paidDate: isFullyPaid ? new Date() : installment.paidDate
      }
    })

    // إنشاء سجل دفعة
    const paymentNumber = `PAY-${Date.now()}`
    await db.payment.create({
      data: {
        companyId: contract.Invoice?.companyId || 'default',
        invoiceId: contract.Invoice?.id || null,
        customerId: contract.customerId,
        paymentNumber,
        paymentDate: new Date(),
        method: method || 'CASH',
        amount: amount,
        status: 'completed',
        notes: `تحصيل قسط رقم ${installment.installmentNumber}`
      }
    })

    // إنشاء سجل دفعة قسط
    await db.installmentPayment.create({
      data: {
        installmentId: installment.id,
        paymentDate: new Date(),
        amount: amount,
        method: method || 'CASH',
        notes: notes || null
      }
    })

    // تحديث حالة العقد إذا اكتملت جميع الأقساط
    if (isFullyPaid) {
      const allInstallments = await db.installment.findMany({
        where: { contractId: installment.contractId }
      })
      
      const allPaid = allInstallments.every(inst => inst.status === 'paid')
      
      if (allPaid) {
        await db.installmentContract.update({
          where: { id: installment.contractId },
          data: { status: 'completed' }
        })
        
        if (contract.invoiceId) {
          await db.invoice.update({
            where: { id: contract.invoiceId },
            data: { 
              status: 'paid',
              paidAmount: contract.Invoice?.total || 0,
              remainingAmount: 0
            }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedInstallment,
      message: isFullyPaid ? 'تم تحصيل القسط بالكامل' : 'تم تسجيل الدفعة الجزئية'
    })
  } catch (error: any) {
    console.error('Collection error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

---

## 🎨 واجهة إدارة الأقساط المحسنة

```tsx
function InstallmentsManagement() {
  const [activeTab, setActiveTab] = useState('unpaid')
  
  // بطاقات الإحصائيات القابلة للنقر
  const statCards = [
    { 
      id: 'unpaid', 
      label: 'غير مدفوعة', 
      value: unpaidCount, 
      color: 'red',
      onClick: () => setActiveTab('unpaid')
    },
    { 
      id: 'paid', 
      label: 'مدفوعة', 
      value: paidCount, 
      color: 'green',
      onClick: () => setActiveTab('paid')
    },
    { 
      id: 'overdue', 
      label: 'متأخرة', 
      value: overdueCount, 
      color: 'amber',
      onClick: () => setActiveTab('overdue')
    }
  ]

  return (
    <div className="space-y-6">
      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="unpaid" className="text-red-600">
            غير مدفوعة
          </TabsTrigger>
          <TabsTrigger value="paid" className="text-green-600">
            مدفوعة
          </TabsTrigger>
          <TabsTrigger value="overdue" className="text-amber-600">
            متأخرة (متابعة)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid">
          {/* جدول الأقساط غير المدفوعة مع خانات اختيار وزر دفع مجمع */}
        </TabsContent>

        <TabsContent value="paid">
          {/* جدول الأقساط المدفوعة - بدون خانات اختيار أو زر دفع */}
        </TabsContent>

        <TabsContent value="overdue">
          {/* جدول الأقساط المتأخرة للمتابعة */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 📌 ملخص للنقل

### الملفات المعدلة:
1. `src/app/api/installments/collect/route.ts` - إصلاح أسماء العلاقات
2. `src/app/page.tsx` - إعادة تنظيم تبويبات الأقساط

### النقاط الحرجة:
- ⚠️ أسماء العلاقات في Prisma تبدأ بحرف كبير
- ⚠️ تبويب "غير مدفوعة" يشمل pending + partial + overdue
- ⚠️ تبويب "متأخرة" للمتابعة فقط (not paid && past due)

---

**هذا الملف يوثق آخر التغييرات. أضفه للبرومبت عند النقل لمحادثة جديدة.**
