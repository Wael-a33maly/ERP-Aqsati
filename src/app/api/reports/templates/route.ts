import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSIONS, getCompanyFilter } from '@/lib/rbac';

// Valid report types
const REPORT_TYPES = ['SALES', 'COLLECTION', 'INVENTORY', 'COMMISSION', 'FINANCIAL'] as const;
type ReportType = typeof REPORT_TYPES[number];

interface ReportTemplateConfig {
  title?: string;
  description?: string;
  groupBy?: string[];
  sortBy?: string;
  showTotals?: boolean;
  showSubtotals?: boolean;
  dateFormat?: string;
  currency?: string;
}

interface ReportTemplateFilter {
  field: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'number';
  options?: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string | number;
}

interface ReportTemplateColumn {
  field: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: 'number' | 'currency' | 'date' | 'percent';
  sortable?: boolean;
  visible?: boolean;
}

interface CreateReportTemplateBody {
  companyId: string;
  name: string;
  nameAr?: string;
  type: ReportType;
  config?: ReportTemplateConfig;
  filters?: ReportTemplateFilter[];
  columns?: ReportTemplateColumn[];
  isDefault?: boolean;
}

interface UpdateReportTemplateBody {
  id: string;
  name?: string;
  nameAr?: string;
  type?: ReportType;
  config?: ReportTemplateConfig;
  filters?: ReportTemplateFilter[];
  columns?: ReportTemplateColumn[];
  isDefault?: boolean;
  active?: boolean;
}

// GET /api/reports/templates - List report templates
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
    const type = searchParams.get('type');
    const isDefault = searchParams.get('isDefault');
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Apply company filter based on user role
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.companyId) {
        return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
      where.companyId = user.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    if (type && REPORT_TYPES.includes(type as ReportType)) {
      where.type = type;
    }

    if (isDefault !== null && isDefault !== undefined) {
      where.isDefault = isDefault === 'true';
    }

    if (active !== null && active !== undefined) {
      where.active = active === 'true';
    }

    const [templates, total] = await Promise.all([
      db.reportTemplate.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { reports: true },
          },
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      db.reportTemplate.count({ where }),
    ]);

    // Parse JSON fields
    const parsedTemplates = templates.map(template => ({
      ...template,
      config: JSON.parse(template.config),
      filters: template.filters ? JSON.parse(template.filters) : null,
      columns: template.columns ? JSON.parse(template.columns) : null,
    }));

    return NextResponse.json({
      success: true,
      data: parsedTemplates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching report templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch report templates' },
      { status: 500 }
    );
  }
}

// POST /api/reports/templates - Create a new report template
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.SETTINGS_UPDATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body: CreateReportTemplateBody = await request.json();
    const { companyId, name, nameAr, type, config, filters, columns, isDefault = false } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!REPORT_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid report type. Must be one of: ${REPORT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Determine company
    const targetCompanyId = user.role === 'SUPER_ADMIN' ? companyId : user.companyId;
    if (!targetCompanyId) {
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    // If setting as default, unset other defaults for this type
    if (isDefault) {
      await db.reportTemplate.updateMany({
        where: { companyId: targetCompanyId, type },
        data: { isDefault: false },
      });
    }

    // Create template
    const template = await db.reportTemplate.create({
      data: {
        companyId: targetCompanyId,
        name,
        nameAr,
        type,
        config: JSON.stringify(config || {}),
        filters: filters ? JSON.stringify(filters) : null,
        columns: columns ? JSON.stringify(columns) : null,
        isDefault,
        active: true,
      },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        companyId: targetCompanyId,
        userId: user.id,
        action: 'CREATE',
        entityType: 'ReportTemplate',
        entityId: template.id,
        newData: JSON.stringify(template),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...template,
        config: JSON.parse(template.config),
        filters: template.filters ? JSON.parse(template.filters) : null,
        columns: template.columns ? JSON.parse(template.columns) : null,
      },
      message: 'Report template created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating report template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create report template' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/templates - Update a report template
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.SETTINGS_UPDATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body: UpdateReportTemplateBody = await request.json();
    const { id, name, nameAr, type, config, filters, columns, isDefault, active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 });
    }

    // Get existing template
    const existingTemplate = await db.reportTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    // Check company access
    if (user.role !== 'SUPER_ADMIN' && user.companyId !== existingTemplate.companyId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Validate type if provided
    if (type && !REPORT_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid report type. Must be one of: ${REPORT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults for this type
    if (isDefault) {
      await db.reportTemplate.updateMany({
        where: {
          companyId: existingTemplate.companyId,
          type: type || existingTemplate.type,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (type !== undefined) updateData.type = type;
    if (config !== undefined) updateData.config = JSON.stringify(config);
    if (filters !== undefined) updateData.filters = filters ? JSON.stringify(filters) : null;
    if (columns !== undefined) updateData.columns = columns ? JSON.stringify(columns) : null;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (active !== undefined) updateData.active = active;

    // Update template
    const template = await db.reportTemplate.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        companyId: existingTemplate.companyId,
        userId: user.id,
        action: 'UPDATE',
        entityType: 'ReportTemplate',
        entityId: template.id,
        oldData: JSON.stringify(existingTemplate),
        newData: JSON.stringify(template),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...template,
        config: JSON.parse(template.config),
        filters: template.filters ? JSON.parse(template.filters) : null,
        columns: template.columns ? JSON.parse(template.columns) : null,
      },
      message: 'Report template updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating report template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update report template' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/templates - Delete a report template
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.SETTINGS_UPDATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 });
    }

    // Get existing template
    const existingTemplate = await db.reportTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    // Check company access
    if (user.role !== 'SUPER_ADMIN' && user.companyId !== existingTemplate.companyId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete by setting active to false
    const template = await db.reportTemplate.update({
      where: { id },
      data: { active: false },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        companyId: existingTemplate.companyId,
        userId: user.id,
        action: 'DELETE',
        entityType: 'ReportTemplate',
        entityId: template.id,
        oldData: JSON.stringify(existingTemplate),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report template deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting report template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete report template' },
      { status: 500 }
    );
  }
}
