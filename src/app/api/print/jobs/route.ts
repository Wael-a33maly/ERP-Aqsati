import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

// Valid document types
const DOCUMENT_TYPES = ['INVOICE', 'RECEIPT', 'CONTRACT', 'REPORT', 'INSTALLMENT_SCHEDULE', 'PAYMENT_RECEIPT'] as const;
type DocumentType = typeof DOCUMENT_TYPES[number];

interface CreatePrintJobBody {
  templateId?: string;
  documentType: DocumentType;
  documentIds: string[];
  copies?: number;
}

// GET /api/print/jobs - List print jobs
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const documentType = searchParams.get('documentType');
    const status = searchParams.get('status');
    const printedBy = searchParams.get('printedBy');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Apply company filter
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.companyId) {
        return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
      where.companyId = user.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    if (documentType && DOCUMENT_TYPES.includes(documentType as DocumentType)) {
      where.documentType = documentType;
    }

    if (status) where.status = status;
    if (printedBy) where.printedBy = printedBy;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [jobs, total] = await Promise.all([
      db.printJob.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: {
            select: { id: true, name: true, type: true, paperSize: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.printJob.count({ where }),
    ]);

    // Parse document IDs and get user info
    const parsedJobs = await Promise.all(jobs.map(async (job) => {
      const documentIds = JSON.parse(job.documentIds);
      
      // Get user who printed
      const printedByUser = await db.user.findUnique({
        where: { id: job.printedBy },
        select: { id: true, name: true, email: true },
      });

      return {
        ...job,
        documentIds,
        printedByUser,
      };
    }));

    return NextResponse.json({
      success: true,
      data: parsedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching print jobs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch print jobs' },
      { status: 500 }
    );
  }
}

// POST /api/print/jobs - Create a new print job
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body: CreatePrintJobBody = await request.json();
    const { templateId, documentType, documentIds, copies = 1 } = body;

    // Validate required fields
    if (!documentType || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document type and document IDs are required' },
        { status: 400 }
      );
    }

    // Validate document type
    if (!DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { success: false, error: `Invalid document type. Must be one of: ${DOCUMENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Determine company
    const targetCompanyId = user.role === 'SUPER_ADMIN' 
      ? await getCompanyIdFromDocuments(documentType, documentIds)
      : user.companyId;

    if (!targetCompanyId) {
      return NextResponse.json({ success: false, error: 'Could not determine company' }, { status: 400 });
    }

    // Verify template if provided
    if (templateId) {
      const template = await db.printTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
      }
      if (template.companyId !== targetCompanyId && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ success: false, error: 'Template does not belong to your company' }, { status: 403 });
      }
    }

    // Create print job
    const printJob = await db.printJob.create({
      data: {
        templateId: templateId || null,
        companyId: targetCompanyId,
        documentType,
        documentIds: JSON.stringify(documentIds),
        printedBy: user.id,
        copies,
        status: 'pending',
      },
      include: {
        template: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        companyId: targetCompanyId,
        userId: user.id,
        action: 'PRINT',
        entityType: documentType,
        entityId: documentIds[0], // First document ID
        newData: JSON.stringify({
          printJobId: printJob.id,
          documentIds,
          copies,
        }),
      },
    });

    // If batch printing (multiple documents), log for each
    if (documentIds.length > 1) {
      for (const docId of documentIds) {
        await db.auditLog.create({
          data: {
            companyId: targetCompanyId,
            userId: user.id,
            action: 'PRINT',
            entityType: documentType,
            entityId: docId,
            newData: JSON.stringify({
              printJobId: printJob.id,
              batchIndex: documentIds.indexOf(docId),
            }),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...printJob,
        documentIds: JSON.parse(printJob.documentIds),
      },
      message: 'Print job created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating print job:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create print job' },
      { status: 500 }
    );
  }
}

// PUT /api/print/jobs - Update print job status (for marking as completed/failed)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, printedAt } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Print job ID and status are required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    // Get existing print job
    const existingJob = await db.printJob.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json({ success: false, error: 'Print job not found' }, { status: 404 });
    }

    // Check company access
    if (user.role !== 'SUPER_ADMIN' && user.companyId !== existingJob.companyId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Update print job
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.printedAt = printedAt ? new Date(printedAt) : new Date();
    }

    const printJob = await db.printJob.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...printJob,
        documentIds: JSON.parse(printJob.documentIds),
      },
      message: 'Print job updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating print job:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update print job' },
      { status: 500 }
    );
  }
}

// Helper function to get company ID from documents
async function getCompanyIdFromDocuments(documentType: string, documentIds: string[]): Promise<string | null> {
  switch (documentType) {
    case 'INVOICE':
      const invoice = await db.invoice.findFirst({
        where: { id: { in: documentIds } },
        select: { companyId: true },
      });
      return invoice?.companyId || null;

    case 'PAYMENT_RECEIPT':
      const payment = await db.payment.findFirst({
        where: { id: { in: documentIds } },
        select: { companyId: true },
      });
      return payment?.companyId || null;

    case 'CONTRACT':
    case 'INSTALLMENT_SCHEDULE':
      const contract = await db.installmentContract.findFirst({
        where: { id: { in: documentIds } },
        include: { invoice: { select: { companyId: true } } },
      });
      return contract?.invoice?.companyId || null;

    case 'REPORT':
      const report = await db.generatedReport.findFirst({
        where: { id: { in: documentIds } },
        select: { companyId: true },
      });
      return report?.companyId || null;

    default:
      return null;
  }
}
