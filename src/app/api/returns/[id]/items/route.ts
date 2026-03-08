import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

interface RouteParams {
  params: {
    id: string;
  };
}

// Types
interface ReturnItemInput {
  productId: string;
  invoiceItemId?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxAmount?: number;
}

interface UpdateReturnItemInput {
  itemId: string;
  quantity?: number;
  unitPrice?: number;
  taxAmount?: number;
  description?: string;
}

// GET /api/returns/[id]/items - Get all items for a return
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if return exists
    const returnRecord = await db.return.findUnique({
      where: { id },
      select: { id: true, invoiceId: true, status: true },
    });

    if (!returnRecord) {
      return NextResponse.json(
        { success: false, error: 'Return not found' },
        { status: 404 }
      );
    }

    // Get return items with product details
    const items = await db.returnItem.findMany({
      where: { returnId: id },
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
      orderBy: { createdAt: 'asc' },
    });

    // If there's an invoice, get invoice items for reference
    let invoiceItems: any[] = [];
    if (returnRecord.invoiceId) {
      invoiceItems = await db.invoiceItem.findMany({
        where: { invoiceId: returnRecord.invoiceId },
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
    }

    // Get already returned quantities for each product
    const existingReturns = await db.return.findMany({
      where: {
        invoiceId: returnRecord.invoiceId,
        status: { not: 'rejected' },
        id: { not: id },
      },
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    const returnedQuantities: Record<string, number> = {};
    for (const ret of existingReturns) {
      for (const item of ret.items) {
        if (!returnedQuantities[item.productId]) {
          returnedQuantities[item.productId] = 0;
        }
        returnedQuantities[item.productId] += item.quantity;
      }
    }

    // Add available to return quantity for each item
    const itemsWithAvailability = items.map(item => {
      const invoiceItem = invoiceItems.find(ii => ii.productId === item.productId);
      const alreadyReturned = returnedQuantities[item.productId] || 0;
      const availableToReturn = invoiceItem
        ? invoiceItem.quantity - alreadyReturned + item.quantity
        : null;

      return {
        ...item,
        invoiceItem,
        availableToReturn,
        originalQuantity: invoiceItem?.quantity || null,
        originalUnitPrice: invoiceItem?.unitPrice || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: itemsWithAvailability,
      meta: {
        returnId: id,
        returnStatus: returnRecord.status,
        invoiceItems: invoiceItems.length > 0 ? invoiceItems : null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching return items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch return items' },
      { status: 500 }
    );
  }
}

// POST /api/returns/[id]/items - Add items to a pending return
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const { items, userId } = body as { items: ReturnItemInput[]; userId?: string };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Get existing return
    const existingReturn = await db.return.findUnique({
      where: { id },
      include: {
        items: true,
        invoice: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!existingReturn) {
      return NextResponse.json(
        { success: false, error: 'Return not found' },
        { status: 404 }
      );
    }

    // Only allow adding items to pending returns
    if (existingReturn.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Can only add items to pending returns' },
        { status: 400 }
      );
    }

    // Validate items against invoice if exists
    const validationErrors: string[] = [];

    if (existingReturn.invoiceId && existingReturn.invoice) {
      // Calculate already returned quantities
      const existingReturns = await db.return.findMany({
        where: {
          invoiceId: existingReturn.invoiceId,
          status: { not: 'rejected' },
        },
        include: {
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      const returnedQuantities: Record<string, number> = {};
      for (const ret of existingReturns) {
        for (const item of ret.items) {
          if (!returnedQuantities[item.productId]) {
            returnedQuantities[item.productId] = 0;
          }
          returnedQuantities[item.productId] += item.quantity;
        }
      }

      for (const item of items) {
        const invoiceItem = existingReturn.invoice.items.find(
          (ii: any) => ii.productId === item.productId
        );

        if (!invoiceItem) {
          validationErrors.push(
            `Product ${item.productId} was not in the original invoice`
          );
          continue;
        }

        const alreadyReturned = returnedQuantities[item.productId] || 0;
        const currentReturnQty = existingReturn.items
          .filter(i => i.productId === item.productId)
          .reduce((sum, i) => sum + i.quantity, 0);
        const availableToReturn = invoiceItem.quantity - alreadyReturned + currentReturnQty;

        if (item.quantity > availableToReturn) {
          validationErrors.push(
            `Cannot return ${item.quantity} of product. Only ${availableToReturn} available to return`
          );
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, errors: validationErrors },
        { status: 400 }
      );
    }

    // Add items and recalculate totals
    const returnRecord = await db.$transaction(async (tx) => {
      // Create new items
      const newItems = await tx.returnItem.createMany({
        data: items.map(item => ({
          returnId: id,
          productId: item.productId,
          invoiceItemId: item.invoiceItemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxAmount: item.taxAmount || 0,
          total: item.quantity * item.unitPrice + (item.taxAmount || 0),
          restocked: false,
        })),
      });

      // Recalculate return totals
      const allItems = await tx.returnItem.findMany({
        where: { returnId: id },
      });

      const subtotal = allItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const taxAmount = allItems.reduce(
        (sum, item) => sum + item.taxAmount,
        0
      );
      const total = subtotal + taxAmount;

      // Update return
      const updatedReturn = await tx.return.update({
        where: { id },
        data: {
          subtotal,
          taxAmount,
          total,
          type: existingReturn.invoiceId
            ? await determineReturnType(tx, existingReturn.invoiceId, allItems)
            : 'PARTIAL',
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  nameAr: true,
                },
              },
            },
          },
        },
      });

      return updatedReturn;
    });

    // Create audit log
    await createAuditLog({
      companyId: existingReturn.companyId,
      branchId: existingReturn.branchId,
      userId,
      action: 'UPDATE',
      entityType: 'Return',
      entityId: id,
      newData: { action: 'items_added', items },
    });

    return NextResponse.json({
      success: true,
      data: returnRecord,
      message: 'Items added to return successfully',
    });
  } catch (error: any) {
    console.error('Error adding return items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add return items' },
      { status: 500 }
    );
  }
}

// PUT /api/returns/[id]/items - Update return items
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const { items, userId } = body as { items: UpdateReturnItemInput[]; userId?: string };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      );
    }

    // Get existing return
    const existingReturn = await db.return.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingReturn) {
      return NextResponse.json(
        { success: false, error: 'Return not found' },
        { status: 404 }
      );
    }

    // Only allow updating items in pending returns
    if (existingReturn.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Can only update items in pending returns' },
        { status: 400 }
      );
    }

    // Update items and recalculate totals
    const returnRecord = await db.$transaction(async (tx) => {
      // Update each item
      for (const updateItem of items) {
        const existingItem = existingReturn.items.find(
          i => i.id === updateItem.itemId
        );

        if (!existingItem) {
          throw new Error(`Item ${updateItem.itemId} not found in return`);
        }

        const quantity = updateItem.quantity ?? existingItem.quantity;
        const unitPrice = updateItem.unitPrice ?? existingItem.unitPrice;
        const taxAmount = updateItem.taxAmount ?? existingItem.taxAmount;

        await tx.returnItem.update({
          where: { id: updateItem.itemId },
          data: {
            quantity,
            unitPrice,
            taxAmount,
            total: quantity * unitPrice + taxAmount,
            description: updateItem.description,
          },
        });
      }

      // Recalculate return totals
      const allItems = await tx.returnItem.findMany({
        where: { returnId: id },
      });

      const subtotal = allItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const taxAmount = allItems.reduce(
        (sum, item) => sum + item.taxAmount,
        0
      );
      const total = subtotal + taxAmount;

      // Update return
      const updatedReturn = await tx.return.update({
        where: { id },
        data: {
          subtotal,
          taxAmount,
          total,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  nameAr: true,
                },
              },
            },
          },
        },
      });

      return updatedReturn;
    });

    // Create audit log
    await createAuditLog({
      companyId: existingReturn.companyId,
      branchId: existingReturn.branchId,
      userId,
      action: 'UPDATE',
      entityType: 'Return',
      entityId: id,
      newData: { action: 'items_updated', items },
    });

    return NextResponse.json({
      success: true,
      data: returnRecord,
      message: 'Return items updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating return items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update return items' },
      { status: 500 }
    );
  }
}

// DELETE /api/returns/[id]/items - Remove items from a pending return
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const itemIds = searchParams.get('itemIds')?.split(',') || [];
    const userId = searchParams.get('userId');

    if (itemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Item IDs are required' },
        { status: 400 }
      );
    }

    // Get existing return
    const existingReturn = await db.return.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingReturn) {
      return NextResponse.json(
        { success: false, error: 'Return not found' },
        { status: 404 }
      );
    }

    // Only allow removing items from pending returns
    if (existingReturn.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Can only remove items from pending returns' },
        { status: 400 }
      );
    }

    // Check if removing all items
    if (itemIds.length >= existingReturn.items.length) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove all items from a return. Delete the return instead.' },
        { status: 400 }
      );
    }

    // Remove items and recalculate totals
    const returnRecord = await db.$transaction(async (tx) => {
      // Delete items
      await tx.returnItem.deleteMany({
        where: {
          id: { in: itemIds },
          returnId: id,
        },
      });

      // Recalculate return totals
      const remainingItems = await tx.returnItem.findMany({
        where: { returnId: id },
      });

      const subtotal = remainingItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const taxAmount = remainingItems.reduce(
        (sum, item) => sum + item.taxAmount,
        0
      );
      const total = subtotal + taxAmount;

      // Update return
      const updatedReturn = await tx.return.update({
        where: { id },
        data: {
          subtotal,
          taxAmount,
          total,
          type: 'PARTIAL', // After removing items, it's definitely partial
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  nameAr: true,
                },
              },
            },
          },
        },
      });

      return updatedReturn;
    });

    // Create audit log
    await createAuditLog({
      companyId: existingReturn.companyId,
      branchId: existingReturn.branchId,
      userId: userId || undefined,
      action: 'UPDATE',
      entityType: 'Return',
      entityId: id,
      newData: { action: 'items_removed', itemIds },
    });

    return NextResponse.json({
      success: true,
      data: returnRecord,
      message: 'Items removed from return successfully',
    });
  } catch (error: any) {
    console.error('Error removing return items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove return items' },
      { status: 500 }
    );
  }
}

// Helper function to determine return type
async function determineReturnType(
  tx: any,
  invoiceId: string,
  returnItems: any[]
): Promise<'FULL' | 'PARTIAL'> {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });

  if (!invoice) return 'PARTIAL';

  // Check if all invoice items are fully returned
  for (const invoiceItem of invoice.items) {
    const returnedQty = returnItems
      .filter((ri: any) => ri.productId === invoiceItem.productId)
      .reduce((sum: number, ri: any) => sum + ri.quantity, 0);

    if (returnedQty < invoiceItem.quantity) {
      return 'PARTIAL';
    }
  }

  return 'FULL';
}
