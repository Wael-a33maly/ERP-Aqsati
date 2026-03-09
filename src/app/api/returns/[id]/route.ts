import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/returns/[id] - Get a single return with full details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const returnRecord = await db.return.findUnique({
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
          },
        },
        invoice: {
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
                costPrice: true,
                sellPrice: true,
              },
            },
          },
        },
      },
    });

    if (!returnRecord) {
      return NextResponse.json(
        { success: false, error: 'Return not found' },
        { status: 404 }
      );
    }

    // Calculate additional details
    const itemsWithInvoiceLink = returnRecord.items.map(item => {
      const invoiceItem = returnRecord.invoice?.items.find(
        ii => ii.productId === item.productId
      );
      return {
        ...item,
        originalQuantity: invoiceItem?.quantity || 0,
        originalUnitPrice: invoiceItem?.unitPrice || 0,
        originalTotal: invoiceItem?.total || 0,
      };
    });

    // Get inventory movements for this return
    const inventoryMovements = await db.inventoryMovement.findMany({
      where: {
        referenceType: 'RETURN',
        referenceId: id,
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...returnRecord,
        items: itemsWithInvoiceLink,
        inventoryMovements,
      },
    });
  } catch (error: any) {
    console.error('Error fetching return:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch return' },
      { status: 500 }
    );
  }
}

// PUT /api/returns/[id] - Update return status (approve/reject)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      status,
      warehouseId,
      userId,
      notes,
    } = body;

    // Get existing return
    const existingReturn = await db.return.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        invoice: true,
      },
    });

    if (!existingReturn) {
      return NextResponse.json(
        { success: false, error: 'Return not found' },
        { status: 404 }
      );
    }

    // Validate status transition
    if (existingReturn.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Cannot change status from ${existingReturn.status}` },
        { status: 400 }
      );
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status (approved or rejected) is required' },
        { status: 400 }
      );
    }

    // If approving, need warehouse for inventory
    if (status === 'approved' && !warehouseId) {
      return NextResponse.json(
        { success: false, error: 'Warehouse ID is required for approving returns' },
        { status: 400 }
      );
    }

    // Process the return based on status
    const returnRecord = await db.$transaction(async (tx) => {
      const updatedReturn = await tx.return.update({
        where: { id },
        data: {
          status,
          notes: notes || existingReturn.notes,
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
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
              nameAr: true,
              phone: true,
              balance: true,
            },
          },
        },
      });

      // If approving, update inventory and customer balance
      if (status === 'approved' && warehouseId) {
        for (const item of existingReturn.items) {
          // Update inventory (IN movement for returns)
          const inventory = await tx.inventory.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId,
              },
            },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: {
                  increment: item.quantity,
                },
              },
            });
          } else {
            // Create inventory record if it doesn't exist
            await tx.inventory.create({
              data: {
                productId: item.productId,
                warehouseId,
                quantity: item.quantity,
              },
            });
          }

          // Create inventory movement record
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              warehouseId,
              type: 'RETURN',
              quantity: item.quantity,
              referenceType: 'RETURN',
              referenceId: id,
              notes: `Return: ${existingReturn.returnNumber}`,
              createdBy: userId,
            },
          });

          // Mark return item as restocked
          await tx.returnItem.update({
            where: { id: item.id },
            data: { restocked: true },
          });
        }

        // Update customer balance (reduce balance since it's a return/refund)
        await tx.customer.update({
          where: { id: existingReturn.customerId },
          data: {
            balance: {
              decrement: existingReturn.total,
            },
          },
        });

        // Update invoice if exists
        if (existingReturn.invoiceId && existingReturn.invoice) {
          // Recalculate invoice amounts
          const invoice = await tx.invoice.findUnique({
            where: { id: existingReturn.invoiceId },
            include: { items: true, payments: true },
          });

          if (invoice) {
            // Check if this makes the invoice fully returned
            const allReturns = await tx.return.findMany({
              where: {
                invoiceId: existingReturn.invoiceId,
                status: 'approved',
              },
              include: { items: true },
            });

            const totalReturned = allReturns.reduce((sum, r) => sum + r.total, 0);

            if (totalReturned >= invoice.total) {
              // Full return - mark invoice as cancelled
              await tx.invoice.update({
                where: { id: existingReturn.invoiceId },
                data: {
                  paidAmount: 0,
                  remainingAmount: 0,
                  status: 'cancelled',
                },
              });
            } else {
              // Partial return
              const newRemainingAmount = invoice.total - invoice.paidAmount + existingReturn.total;
              await tx.invoice.update({
                where: { id: existingReturn.invoiceId },
                data: {
                  remainingAmount: Math.max(0, newRemainingAmount),
                  status: 'partial',
                },
              });
            }
          }
        }
      }

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
      oldData: { status: existingReturn.status },
      newData: { status, notes },
    });

    return NextResponse.json({
      success: true,
      data: returnRecord,
      message: status === 'approved'
        ? 'Return approved and inventory updated successfully'
        : 'Return rejected successfully',
    });
  } catch (error: any) {
    console.error('Error updating return:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update return' },
      { status: 500 }
    );
  }
}

// DELETE /api/returns/[id] - Cancel/delete a pending return
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    const userId = searchParams.get('userId');

    // Get existing return
    const existingReturn = await db.return.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!existingReturn) {
      return NextResponse.json(
        { success: false, error: 'Return not found' },
        { status: 404 }
      );
    }

    // Check if return can be deleted
    if (existingReturn.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete approved returns. Use cancellation instead.' },
        { status: 400 }
      );
    }

    if (existingReturn.status === 'rejected') {
      return NextResponse.json(
        { success: false, error: 'Return is already rejected' },
        { status: 400 }
      );
    }

    // Delete return with transaction
    await db.$transaction(async (tx) => {
      // Delete return items
      await tx.returnItem.deleteMany({
        where: { returnId: id },
      });

      // Delete return
      await tx.return.delete({
        where: { id },
      });
    });

    // Create audit log
    await createAuditLog({
      companyId: existingReturn.companyId,
      branchId: existingReturn.branchId,
      userId: userId || undefined,
      action: 'DELETE',
      entityType: 'Return',
      entityId: id,
      oldData: existingReturn,
    });

    return NextResponse.json({
      success: true,
      message: 'Return deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting return:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete return' },
      { status: 500 }
    );
  }
}
