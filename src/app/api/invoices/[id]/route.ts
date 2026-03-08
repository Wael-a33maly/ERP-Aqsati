import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/invoices/[id] - Get a specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            nameAr: true,
            phone: true,
            phone2: true,
            email: true,
            address: true,
            balance: true,
            creditLimit: true,
            zone: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                code: true,
              },
            },
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            email: true,
            phone: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            code: true,
            address: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                nameAr: true,
                unit: true,
                barcode: true,
                costPrice: true,
                sellPrice: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        payments: {
          select: {
            id: true,
            paymentNumber: true,
            paymentDate: true,
            method: true,
            amount: true,
            status: true,
            reference: true,
            notes: true,
          },
          orderBy: {
            paymentDate: 'desc',
          },
        },
        installmentContract: {
          include: {
            installments: {
              orderBy: {
                installmentNumber: 'asc',
              },
            },
            agent: {
              select: {
                id: true,
                name: true,
                nameAr: true,
              },
            },
          },
        },
        returns: {
          select: {
            id: true,
            returnNumber: true,
            returnDate: true,
            status: true,
            total: true,
          },
        },
      },
    });
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Calculate additional metadata
    const paidPercentage = invoice.total > 0 ? (invoice.paidAmount / invoice.total) * 100 : 0;
    const isOverdue = invoice.dueDate && new Date() > new Date(invoice.dueDate) && invoice.remainingAmount > 0;
    
    // Calculate item totals for each item
    const itemsWithDetails = invoice.items.map(item => ({
      ...item,
      subtotal: item.quantity * item.unitPrice,
      taxableAmount: item.quantity * item.unitPrice - item.discount,
      profitMargin: item.unitPrice > 0 
        ? ((item.unitPrice - (item.product.costPrice || 0)) / item.unitPrice) * 100 
        : 0,
    }));
    
    // Calculate summary
    const summary = {
      itemCount: invoice.items.length,
      totalQuantity: invoice.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      paidAmount: invoice.paidAmount,
      remainingAmount: invoice.remainingAmount,
      paidPercentage,
      isOverdue,
      paymentCount: invoice.payments.length,
      returnCount: invoice.returns.length,
      totalReturned: invoice.returns.reduce((sum, r) => sum + r.total, 0),
    };
    
    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        items: itemsWithDetails,
        summary,
      },
    });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // التحقق من وجود الفاتورة
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        payments: true,
        returns: true,
        installmentContract: { include: { installments: true } },
      }
    });
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'الفاتورة غير موجودة' },
        { status: 404 }
      );
    }
    
    // التحقق من عدم وجود مدفوعات أو مرتجعات
    if (invoice.payments && invoice.payments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الفاتورة لوجود مدفوعات مرتبطة بها' },
        { status: 400 }
      );
    }
    
    if (invoice.returns && invoice.returns.length > 0) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف الفاتورة لوجود مرتجعات مرتبطة بها' },
        { status: 400 }
      );
    }
    
    // حذف أصناف الفاتورة أولاً
    await db.invoiceItem.deleteMany({
      where: { invoiceId: id }
    });
    
    // حذف أقساط عقد التقسيط إن وجد
    if (invoice.installmentContract) {
      await db.installment.deleteMany({
        where: { contractId: invoice.installmentContract.id }
      });
      await db.installmentContract.delete({
        where: { id: invoice.installmentContract.id }
      });
    }
    
    // حذف عمولات المندوب إن وجدت
    await db.agentCommission.deleteMany({
      where: { referenceId: id, referenceType: 'INVOICE' }
    });
    
    // حذف الفاتورة
    await db.invoice.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'تم حذف الفاتورة بنجاح' });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'فشل في حذف الفاتورة' },
      { status: 500 }
    );
  }
}
