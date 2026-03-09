import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/invoices/[id]/items - Get invoice items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                nameAr: true,
                unit: true,
                costPrice: true,
                sellPrice: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
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
    
    // Calculate item totals
    const itemsWithTotals = invoice.items.map(item => ({
      ...item,
      subtotal: item.quantity * item.unitPrice,
      taxableAmount: item.quantity * item.unitPrice - item.discount,
    }));
    
    return NextResponse.json({
      success: true,
      data: itemsWithTotals,
      summary: {
        itemCount: invoice.items.length,
        totalQuantity: invoice.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: invoice.subtotal,
        totalDiscount: invoice.discount,
        totalTax: invoice.taxAmount,
        total: invoice.total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching invoice items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch invoice items' },
      { status: 500 }
    );
  }
}

// POST /api/invoices/[id]/items - Add item to invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      productId,
      description,
      quantity,
      unitPrice,
      discount = 0,
      taxRate = 0,
      notes,
    } = body;
    
    // Validate required fields
    if (!productId || !quantity || unitPrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'Product ID, quantity, and unit price are required' },
        { status: 400 }
      );
    }
    
    // Get invoice
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Only allow adding items to pending invoices
    if (invoice.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Items can only be added to pending invoices' },
        { status: 400 }
      );
    }
    
    // Get product
    const product = await db.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Calculate item totals
    const itemSubtotal = quantity * unitPrice;
    const itemDiscount = discount || 0;
    const itemTaxRate = taxRate || invoice.taxRate;
    const itemTaxableAmount = itemSubtotal - itemDiscount;
    const itemTaxAmount = itemTaxableAmount * (itemTaxRate / 100);
    const itemTotal = itemTaxableAmount + itemTaxAmount;
    
    // Create item and update invoice totals
    const result = await db.$transaction(async (tx) => {
      // Create invoice item
      const invoiceItem = await tx.invoiceItem.create({
        data: {
          invoiceId: id,
          productId,
          description: description || product.name,
          quantity,
          unitPrice,
          discount: itemDiscount,
          taxRate: itemTaxRate,
          taxAmount: itemTaxAmount,
          total: itemTotal,
          notes,
        },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              nameAr: true,
              unit: true,
            },
          },
        },
      });
      
      // Update invoice totals
      const newSubtotal = invoice.subtotal + itemSubtotal;
      const newTaxAmount = invoice.taxAmount + itemTaxAmount;
      const newTotal = newSubtotal - invoice.discount + newTaxAmount;
      
      await tx.invoice.update({
        where: { id },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          total: newTotal,
          remainingAmount: newTotal - invoice.paidAmount,
        },
      });
      
      return invoiceItem;
    });
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Item added to invoice',
    });
  } catch (error: any) {
    console.error('Error adding invoice item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add invoice item' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id]/items - Update item in invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      itemId,
      productId,
      description,
      quantity,
      unitPrice,
      discount,
      taxRate,
      notes,
    } = body;
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }
    
    // Get invoice
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Only allow updating items in pending invoices
    if (invoice.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Items can only be updated in pending invoices' },
        { status: 400 }
      );
    }
    
    // Get existing item
    const existingItem = await db.invoiceItem.findUnique({
      where: { id: itemId },
    });
    
    if (!existingItem || existingItem.invoiceId !== id) {
      return NextResponse.json(
        { success: false, error: 'Item not found in this invoice' },
        { status: 404 }
      );
    }
    
    // Calculate new item totals
    const newQuantity = quantity !== undefined ? quantity : existingItem.quantity;
    const newUnitPrice = unitPrice !== undefined ? unitPrice : existingItem.unitPrice;
    const newDiscount = discount !== undefined ? discount : existingItem.discount;
    const newTaxRate = taxRate !== undefined ? taxRate : existingItem.taxRate;
    
    const itemSubtotal = newQuantity * newUnitPrice;
    const itemTaxableAmount = itemSubtotal - newDiscount;
    const itemTaxAmount = itemTaxableAmount * (newTaxRate / 100);
    const itemTotal = itemTaxableAmount + itemTaxAmount;
    
    // Update item and invoice totals
    const result = await db.$transaction(async (tx) => {
      // Update invoice item
      const invoiceItem = await tx.invoiceItem.update({
        where: { id: itemId },
        data: {
          productId: productId !== undefined ? productId : existingItem.productId,
          description,
          quantity: newQuantity,
          unitPrice: newUnitPrice,
          discount: newDiscount,
          taxRate: newTaxRate,
          taxAmount: itemTaxAmount,
          total: itemTotal,
          notes,
        },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              nameAr: true,
              unit: true,
            },
          },
        },
      });
      
      // Recalculate invoice totals
      const allItems = await tx.invoiceItem.findMany({
        where: { invoiceId: id },
      });
      
      const newSubtotal = allItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const newTaxAmount = allItems.reduce((sum, item) => sum + item.taxAmount, 0);
      const newTotal = newSubtotal - invoice.discount + newTaxAmount;
      
      await tx.invoice.update({
        where: { id },
        data: {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          total: newTotal,
          remainingAmount: newTotal - invoice.paidAmount,
        },
      });
      
      return invoiceItem;
    });
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Item updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating invoice item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update invoice item' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id]/items - Remove item from invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }
    
    // Get invoice
    const invoice = await db.invoice.findUnique({
      where: { id },
    });
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Only allow deleting items from pending invoices
    if (invoice.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Items can only be deleted from pending invoices' },
        { status: 400 }
      );
    }
    
    // Get existing item
    const existingItem = await db.invoiceItem.findUnique({
      where: { id: itemId },
    });
    
    if (!existingItem || existingItem.invoiceId !== id) {
      return NextResponse.json(
        { success: false, error: 'Item not found in this invoice' },
        { status: 404 }
      );
    }
    
    // Delete item and update invoice totals
    await db.$transaction(async (tx) => {
      // Delete invoice item
      await tx.invoiceItem.delete({
        where: { id: itemId },
      });
      
      // Recalculate invoice totals
      const remainingItems = await tx.invoiceItem.findMany({
        where: { invoiceId: id },
      });
      
      if (remainingItems.length === 0) {
        await tx.invoice.update({
          where: { id },
          data: {
            subtotal: 0,
            taxAmount: 0,
            total: 0,
            remainingAmount: 0 - invoice.paidAmount,
          },
        });
      } else {
        const newSubtotal = remainingItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const newTaxAmount = remainingItems.reduce((sum, item) => sum + item.taxAmount, 0);
        const newTotal = newSubtotal - invoice.discount + newTaxAmount;
        
        await tx.invoice.update({
          where: { id },
          data: {
            subtotal: newSubtotal,
            taxAmount: newTaxAmount,
            total: newTotal,
            remainingAmount: newTotal - invoice.paidAmount,
          },
        });
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting invoice item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete invoice item' },
      { status: 500 }
    );
  }
}
