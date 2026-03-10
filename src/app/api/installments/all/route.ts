import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع الأقساط بشكل فردي
export async function GET() {
  try {
    const installments = await db.installment.findMany({
      include: {
        InstallmentContract: {
          include: {
            Customer: {
              include: {
                Zone: true,
                Governorate: true,
                City: true,
              }
            },
            User: {
              select: { id: true, name: true, phone: true }
            },
            Invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                branchId: true,
                companyId: true,
                Branch: { select: { id: true, name: true } },
                Company: { select: { id: true, name: true } }
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    // تحويل أسماء العلاقات لتتوافق مع الـ frontend
    const formattedInstallments = installments.map((inst: any) => ({
      ...inst,
      contract: {
        ...inst.InstallmentContract,
        customer: inst.InstallmentContract?.Customer,
        agent: inst.InstallmentContract?.User,
        invoice: inst.InstallmentContract?.Invoice,
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedInstallments
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Fetch installments error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
