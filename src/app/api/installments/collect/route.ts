import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - تحصيل قسط
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { installmentId, amount, method, notes, paymentDate } = body

    if (!installmentId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة' },
        { status: 400 }
      )
    }

    // تاريخ الدفع (الافتراضي اليوم)
    const actualPaymentDate = paymentDate ? new Date(paymentDate) : new Date()

    // جلب القسط مع العلاقات الصحيحة (أسماء بحرف كبير)
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
        paidDate: isFullyPaid ? actualPaymentDate : installment.paidDate,
        notes: notes ? `${installment.notes || ''}\n${notes}` : installment.notes
      }
    })

    // إنشاء سجل دفعة
    const paymentNumber = `PAY-${Date.now()}`
    await db.payment.create({
      data: {
        companyId: contract.Invoice?.companyId || 'default',
        branchId: contract.Invoice?.branchId || null,
        invoiceId: contract.Invoice?.id || null,
        customerId: contract.customerId,
        paymentNumber,
        paymentDate: actualPaymentDate,
        method: method || 'CASH',
        amount: amount,
        status: 'completed',
        notes: `تحصيل قسط رقم ${installment.installmentNumber} - ${contract.contractNumber}`
      }
    })

    // إنشاء سجل دفعة قسط
    await db.installmentPayment.create({
      data: {
        installmentId: installment.id,
        agentId: contract.agentId || null,
        paymentDate: actualPaymentDate,
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
        
        // تحديث حالة الفاتورة أيضاً
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

    // تحديث رصيد العميل
    await db.customer.update({
      where: { id: contract.customerId },
      data: {
        balance: {
          decrement: amount
        }
      }
    })

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
