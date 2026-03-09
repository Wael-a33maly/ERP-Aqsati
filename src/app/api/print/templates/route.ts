import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

// Valid template types
const TEMPLATE_TYPES = ['INVOICE', 'RECEIPT', 'CONTRACT', 'REPORT'] as const;
type TemplateType = typeof TEMPLATE_TYPES[number];

interface PrintTemplateBody {
  companyId: string;
  name: string;
  nameAr?: string;
  type: TemplateType;
  content: string;
  css?: string;
  paperSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'Thermal80mm' | 'Thermal58mm';
  orientation?: 'portrait' | 'landscape';
  isDefault?: boolean;
}

interface UpdatePrintTemplateBody {
  id: string;
  name?: string;
  nameAr?: string;
  type?: TemplateType;
  content?: string;
  css?: string;
  paperSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'Thermal80mm' | 'Thermal58mm';
  orientation?: 'portrait' | 'landscape';
  isDefault?: boolean;
  active?: boolean;
}

// GET /api/print/templates - List print templates
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

    // Apply company filter
    if (user.role !== 'SUPER_ADMIN') {
      if (!user.companyId) {
        return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
      where.companyId = user.companyId;
    } else if (companyId) {
      where.companyId = companyId;
    }

    if (type && TEMPLATE_TYPES.includes(type as TemplateType)) {
      where.type = type;
    }

    if (isDefault !== null && isDefault !== undefined) {
      where.isDefault = isDefault === 'true';
    }

    if (active !== null && active !== undefined) {
      where.active = active === 'true';
    }

    const [templates, total] = await Promise.all([
      db.printTemplate.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { printJobs: true },
          },
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      db.printTemplate.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching print templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch print templates' },
      { status: 500 }
    );
  }
}

// POST /api/print/templates - Create a new print template
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.SETTINGS_UPDATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body: PrintTemplateBody = await request.json();
    const {
      companyId,
      name,
      nameAr,
      type,
      content,
      css,
      paperSize = 'A4',
      orientation = 'portrait',
      isDefault = false,
    } = body;

    // Validate required fields
    if (!name || !type || !content) {
      return NextResponse.json(
        { success: false, error: 'Name, type, and content are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!TEMPLATE_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid template type. Must be one of: ${TEMPLATE_TYPES.join(', ')}` },
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
      await db.printTemplate.updateMany({
        where: { companyId: targetCompanyId, type },
        data: { isDefault: false },
      });
    }

    // Create template
    const template = await db.printTemplate.create({
      data: {
        companyId: targetCompanyId,
        name,
        nameAr,
        type,
        content,
        css: css || null,
        paperSize,
        orientation,
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
        entityType: 'PrintTemplate',
        entityId: template.id,
        newData: JSON.stringify({ name, type, paperSize, orientation }),
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Print template created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating print template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create print template' },
      { status: 500 }
    );
  }
}

// PUT /api/print/templates - Update a print template
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.SETTINGS_UPDATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body: UpdatePrintTemplateBody = await request.json();
    const {
      id,
      name,
      nameAr,
      type,
      content,
      css,
      paperSize,
      orientation,
      isDefault,
      active,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 });
    }

    // Get existing template
    const existingTemplate = await db.printTemplate.findUnique({
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
    if (type && !TEMPLATE_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid template type. Must be one of: ${TEMPLATE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults for this type
    if (isDefault) {
      await db.printTemplate.updateMany({
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
    if (content !== undefined) updateData.content = content;
    if (css !== undefined) updateData.css = css || null;
    if (paperSize !== undefined) updateData.paperSize = paperSize;
    if (orientation !== undefined) updateData.orientation = orientation;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (active !== undefined) updateData.active = active;

    // Update template
    const template = await db.printTemplate.update({
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
        entityType: 'PrintTemplate',
        entityId: template.id,
        oldData: JSON.stringify(existingTemplate),
        newData: JSON.stringify(template),
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Print template updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating print template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update print template' },
      { status: 500 }
    );
  }
}

// DELETE /api/print/templates - Delete a print template
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
    const existingTemplate = await db.printTemplate.findUnique({
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
    const template = await db.printTemplate.update({
      where: { id },
      data: { active: false },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        companyId: existingTemplate.companyId,
        userId: user.id,
        action: 'DELETE',
        entityType: 'PrintTemplate',
        entityId: template.id,
        oldData: JSON.stringify(existingTemplate),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Print template deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting print template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete print template' },
      { status: 500 }
    );
  }
}
