import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/zones/[id] - Get a specific zone
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeBoundary = searchParams.get('includeBoundary') === 'true';
    
    const zone = await db.zone.findUnique({
      where: { id },
      include: {
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
        agents: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            email: true,
            phone: true,
            role: true,
            active: true,
          },
        },
        customers: {
          select: {
            id: true,
            code: true,
            name: true,
            nameAr: true,
            phone: true,
            balance: true,
            creditLimit: true,
            active: true,
          },
        },
        _count: {
          select: {
            customers: true,
            agents: true,
          },
        },
      },
    });
    
    if (!zone) {
      return NextResponse.json(
        { success: false, error: 'Zone not found' },
        { status: 404 }
      );
    }
    
    // Parse boundary if requested
    let boundary = null;
    if (includeBoundary && zone.boundary) {
      try {
        boundary = JSON.parse(zone.boundary);
      } catch (e) {
        console.error('Error parsing boundary JSON:', e);
      }
    }
    
    // Calculate customer statistics
    const customerStats = {
      total: zone.customers.length,
      active: zone.customers.filter(c => c.active).length,
      inactive: zone.customers.filter(c => !c.active).length,
      totalBalance: zone.customers.reduce((sum, c) => sum + c.balance, 0),
      totalCreditLimit: zone.customers.reduce((sum, c) => sum + c.creditLimit, 0),
      overCreditLimit: zone.customers.filter(c => c.balance > c.creditLimit && c.creditLimit > 0).length,
    };
    
    // Get invoice statistics for this zone's customers
    const customerIds = zone.customers.map(c => c.id);
    
    const invoiceStats = await db.invoice.aggregate({
      where: {
        customerId: { in: customerIds },
        status: { not: 'cancelled' },
      },
      _sum: {
        total: true,
        paidAmount: true,
        remainingAmount: true,
      },
      _count: {
        id: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...zone,
        boundary: includeBoundary ? boundary : undefined,
        boundaryRaw: includeBoundary ? zone.boundary : undefined,
        customerStats,
        invoiceStats: {
          totalInvoices: invoiceStats._count.id,
          totalAmount: invoiceStats._sum.total || 0,
          totalPaid: invoiceStats._sum.paidAmount || 0,
          totalRemaining: invoiceStats._sum.remainingAmount || 0,
        },
        customerCount: zone._count.customers,
        agentCount: zone._count.agents,
      },
    });
  } catch (error: any) {
    console.error('Error fetching zone:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch zone' },
      { status: 500 }
    );
  }
}
