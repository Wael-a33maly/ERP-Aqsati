import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get company templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const branchId = searchParams.get('branchId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      )
    }

    const where: any = { companyId }
    
    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null }
      ]
    }

    if (!includeInactive) {
      where.isActive = true
    }

    const templates = await db.companyReceiptTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        globalTemplate: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            previewImage: true,
            templateType: true
          }
        }
      }
    })

    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        const printCount = await db.receiptPrintLog.count({
          where: { templateId: template.id }
        })

        return {
          ...template,
          printCount,
          isFromMarketplace: !!template.installedFromMarketplace,
          paperSizeLabel: getPaperSizeLabel(template.paperSize)
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: templatesWithStats
    })
  } catch (error) {
    console.error('Error fetching company templates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company templates' },
      { status: 500 }
    )
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyId,
      branchId,
      name,
      nameAr,
      templateJson,
      isDefault,
      paperSize,
      customWidth,
      customHeight,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      createdBy
    } = body

    if (!companyId || !name || !templateJson) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const settings = await db.companyMarketplaceSettings.findUnique({
      where: { companyId }
    })

    if (settings) {
      const currentCount = await db.companyReceiptTemplate.count({
        where: { companyId, installedFromMarketplace: null }
      })

      if (currentCount >= settings.maxCustomTemplates) {
        return NextResponse.json(
          { success: false, error: `Maximum custom templates limit reached (${settings.maxCustomTemplates})` },
          { status: 400 }
        )
      }
    }

    if (isDefault) {
      await db.companyReceiptTemplate.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false }
      })
    }

    const code = `TPL-${Date.now()}`

    const template = await db.companyReceiptTemplate.create({
      data: {
        companyId,
        branchId: branchId || null,
        name,
        nameAr: nameAr || name,
        code,
        templateJson: typeof templateJson === 'string' ? templateJson : JSON.stringify(templateJson),
        isDefault: isDefault || false,
        paperSize: paperSize || 'A4_THIRD',
        customWidth: customWidth || null,
        customHeight: customHeight || null,
        marginTop: marginTop || 5,
        marginBottom: marginBottom || 5,
        marginLeft: marginLeft || 5,
        marginRight: marginRight || 5,
        createdBy: createdBy || null
      }
    })

    if (settings) {
      await db.companyMarketplaceSettings.update({
        where: { companyId },
        data: { customTemplates: { increment: 1 } }
      })
    }

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Template created successfully'
    })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, companyId, ...updateData } = body

    if (!id || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Template ID and Company ID are required' },
        { status: 400 }
      )
    }

    const existing = await db.companyReceiptTemplate.findFirst({
      where: { id, companyId }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Template not found or you do not have permission to edit it' },
        { status: 404 }
      )
    }

    if (updateData.isDefault) {
      await db.companyReceiptTemplate.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false }
      })
    }

    const template = await db.companyReceiptTemplate.update({
      where: { id },
      data: {
        ...updateData,
        templateJson: updateData.templateJson 
          ? (typeof updateData.templateJson === 'string' 
              ? updateData.templateJson 
              : JSON.stringify(updateData.templateJson))
          : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const companyId = searchParams.get('companyId')

    if (!id || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Template ID and Company ID are required' },
        { status: 400 }
      )
    }

    const existing = await db.companyReceiptTemplate.findFirst({
      where: { id, companyId }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Template not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    if (existing.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the default template' },
        { status: 400 }
      )
    }

    await db.companyReceiptTemplate.delete({
      where: { id }
    })

    if (!existing.installedFromMarketplace) {
      await db.companyMarketplaceSettings.updateMany({
        where: { companyId },
        data: { customTemplates: { decrement: 1 } }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

function getPaperSizeLabel(size: string): string {
  const labels: Record<string, string> = {
    'A4': 'A4 Full',
    'A4_THIRD': 'A4 Third',
    'A5': 'A5',
    'THERMAL_80': 'Thermal 80mm',
    'CUSTOM': 'Custom'
  }
  return labels[size] || size
}
