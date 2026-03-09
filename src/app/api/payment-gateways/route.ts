import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

// GET - Get all payment gateways for a company
export async function GET(request: NextRequest) {
  try {
    // Get company ID from header or query params
    let companyId = request.headers.get('x-company-id');
    
    // If no company ID in header, try to get from URL params
    if (!companyId) {
      const { searchParams } = new URL(request.url);
      companyId = searchParams.get('companyId');
    }
    
    // If still no company ID, get the first active company (for demo/development)
    if (!companyId) {
      const firstCompany = await db.company.findFirst({
        where: { active: true },
        select: { id: true }
      });
      if (firstCompany) {
        companyId = firstCompany.id;
      }
    }
    
    if (!companyId) {
      // No companies exist, return empty array
      return NextResponse.json({ gateways: [] });
    }

    const gateways = await db.companyPaymentGateway.findMany({
      where: { companyId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    // Mask sensitive data for security
    const maskedGateways = gateways.map(gateway => ({
      ...gateway,
      merchantSecret: gateway.merchantSecret ? '••••••••' : null,
      apiSecret: gateway.apiSecret ? '••••••••' : null,
      webhookSecret: gateway.webhookSecret ? '••••••••' : null,
    }));

    return NextResponse.json({ gateways: maskedGateways });
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment gateways' },
      { status: 500 }
    );
  }
}

// POST - Create a new payment gateway
export async function POST(request: NextRequest) {
  try {
    // Get company ID from header or query params
    let companyId = request.headers.get('x-company-id');
    
    // If no company ID in header, try to get from URL params
    if (!companyId) {
      const { searchParams } = new URL(request.url);
      companyId = searchParams.get('companyId');
    }
    
    // If still no company ID, get the first active company (for demo/development)
    if (!companyId) {
      const firstCompany = await db.company.findFirst({
        where: { active: true },
        select: { id: true }
      });
      if (firstCompany) {
        companyId = firstCompany.id;
      }
    }
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'No company found. Please create a company first.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      gatewayType,
      name,
      nameAr,
      merchantId,
      merchantSecret,
      apiKey,
      apiSecret,
      walletNumber,
      accountNumber,
      bankCode,
      callbackUrl,
      webhookSecret,
      isLive,
      isActive,
      isDefault,
      feesPercent,
      feesFixed,
      minAmount,
      maxAmount,
      settlementDays,
      settings
    } = body;

    // Check if gateway already exists for this company
    const existing = await db.companyPaymentGateway.findUnique({
      where: {
        companyId_gatewayType: {
          companyId,
          gatewayType
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Gateway of this type already exists for this company' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.companyPaymentGateway.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const gateway = await db.companyPaymentGateway.create({
      data: {
        id: nanoid(),
        companyId,
        gatewayType,
        name,
        nameAr,
        merchantId,
        merchantSecret,
        apiKey,
        apiSecret,
        walletNumber,
        accountNumber,
        bankCode,
        callbackUrl,
        webhookSecret,
        isLive: isLive ?? false,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        feesPercent: feesPercent ?? 0,
        feesFixed: feesFixed ?? 0,
        minAmount,
        maxAmount,
        settlementDays: settlementDays ?? 1,
        settings
      }
    });

    return NextResponse.json({ gateway });
  } catch (error) {
    console.error('Error creating payment gateway:', error);
    return NextResponse.json(
      { error: 'Failed to create payment gateway' },
      { status: 500 }
    );
  }
}

// PUT - Update a payment gateway
export async function PUT(request: NextRequest) {
  try {
    // Get company ID from header or query params
    let companyId = request.headers.get('x-company-id');
    
    // If no company ID in header, try to get from URL params
    if (!companyId) {
      const { searchParams } = new URL(request.url);
      companyId = searchParams.get('companyId');
    }
    
    // If still no company ID, get the first active company (for demo/development)
    if (!companyId) {
      const firstCompany = await db.company.findFirst({
        where: { active: true },
        select: { id: true }
      });
      if (firstCompany) {
        companyId = firstCompany.id;
      }
    }
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'No company found. Please create a company first.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Gateway ID is required' },
        { status: 400 }
      );
    }

    // Verify the gateway belongs to this company
    const existing = await db.companyPaymentGateway.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Payment gateway not found' },
        { status: 404 }
      );
    }

    // If this is set as default, unset other defaults
    if (updateData.isDefault) {
      await db.companyPaymentGateway.updateMany({
        where: { companyId, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    // Filter out undefined values and fields that shouldn't be updated
    const dataToUpdate: Record<string, unknown> = {};
    const allowedFields = [
      'name', 'nameAr', 'merchantId', 'merchantSecret', 'apiKey', 'apiSecret',
      'walletNumber', 'accountNumber', 'bankCode', 'callbackUrl', 'webhookSecret',
      'isLive', 'isActive', 'isDefault', 'feesPercent', 'feesFixed',
      'minAmount', 'maxAmount', 'settlementDays', 'settings'
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = updateData[field];
      }
    }

    dataToUpdate.updatedAt = new Date();

    const gateway = await db.companyPaymentGateway.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ gateway });
  } catch (error) {
    console.error('Error updating payment gateway:', error);
    return NextResponse.json(
      { error: 'Failed to update payment gateway' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a payment gateway
export async function DELETE(request: NextRequest) {
  try {
    // Get company ID from header or query params
    let companyId = request.headers.get('x-company-id');
    
    // If no company ID in header, try to get from URL params
    if (!companyId) {
      const { searchParams } = new URL(request.url);
      companyId = searchParams.get('companyId');
    }
    
    // If still no company ID, get the first active company (for demo/development)
    if (!companyId) {
      const firstCompany = await db.company.findFirst({
        where: { active: true },
        select: { id: true }
      });
      if (firstCompany) {
        companyId = firstCompany.id;
      }
    }
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'No company found. Please create a company first.' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Gateway ID is required' },
        { status: 400 }
      );
    }

    // Verify the gateway belongs to this company
    const existing = await db.companyPaymentGateway.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Payment gateway not found' },
        { status: 404 }
      );
    }

    await db.companyPaymentGateway.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment gateway:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment gateway' },
      { status: 500 }
    );
  }
}
