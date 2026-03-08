import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuditLog, ERROR_MESSAGES, getErrorMessage } from '@/lib/audit'

// GET /api/categories - List all categories with hierarchy support
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const parentId = searchParams.get('parentId')
    const includeProducts = searchParams.get('includeProducts') === 'true'
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    if (!companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.COMPANY_REQUIRED },
        { status: 400 }
      )
    }

    const where: any = {
      companyId,
      ...(activeOnly && { active: true }),
      ...(parentId === 'null' ? { parentId: null } : parentId ? { parentId } : {})
    }

    const categories = await db.productCategory.findMany({
      where,
      include: {
        children: {
          where: activeOnly ? { active: true } : {},
          include: {
            children: {
              where: activeOnly ? { active: true } : {}
            }
          }
        },
        parent: true,
        ...(includeProducts && {
          products: {
            where: activeOnly ? { active: true } : {},
            select: { id: true, name: true, sku: true }
          }
        }),
        _count: {
          select: {
            products: { where: activeOnly ? { active: true } : {} },
            children: { where: activeOnly ? { active: true } : {} }
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    })

    // Build hierarchical tree structure
    const rootCategories = categories.filter(c => !c.parentId)

    return NextResponse.json({
      success: true,
      data: categories,
      tree: rootCategories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyId,
      name,
      nameAr,
      code,
      parentId,
      userId
    } = body

    if (!companyId || !name || !code) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_DATA },
        { status: 400 }
      )
    }

    // Check if code already exists for this company
    const existingCategory = await db.productCategory.findFirst({
      where: { companyId, code }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.DUPLICATE_CODE },
        { status: 400 }
      )
    }

    // Verify parent category exists if specified
    if (parentId) {
      const parentCategory = await db.productCategory.findFirst({
        where: { id: parentId, companyId }
      })
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'الفئة الأب غير موجودة' },
          { status: 400 }
        )
      }
    }

    const category = await db.productCategory.create({
      data: {
        companyId,
        name,
        nameAr,
        code,
        parentId: parentId || null
      },
      include: {
        parent: true,
        children: true
      }
    })

    // Create audit log
    await createAuditLog({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'ProductCategory',
      entityId: category.id,
      newData: category
    })

    return NextResponse.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// PUT /api/categories - Update a category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      companyId,
      name,
      nameAr,
      code,
      parentId,
      active,
      userId
    } = body

    if (!id || !companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_DATA },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await db.productCategory.findFirst({
      where: { id, companyId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NOT_FOUND },
        { status: 404 }
      )
    }

    // Check if code is being changed and if it conflicts
    if (code && code !== existingCategory.code) {
      const categoryWithCode = await db.productCategory.findFirst({
        where: { companyId, code, id: { not: id } }
      })
      if (categoryWithCode) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.DUPLICATE_CODE },
          { status: 400 }
        )
      }
    }

    // Prevent setting parent to self or a descendant
    if (parentId) {
      if (parentId === id) {
        return NextResponse.json(
          { error: 'لا يمكن تعيين الفئة كأب لنفسها' },
          { status: 400 }
        )
      }

      // Check if new parent is a descendant
      const isDescendant = async (parentId: string, childId: string): Promise<boolean> => {
        const children = await db.productCategory.findMany({
          where: { parentId: childId }
        })
        for (const child of children) {
          if (child.id === parentId) return true
          if (await isDescendant(parentId, child.id)) return true
        }
        return false
      }

      if (await isDescendant(parentId, id)) {
        return NextResponse.json(
          { error: 'لا يمكن تعيين فئة فرعية كأب' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (nameAr !== undefined) updateData.nameAr = nameAr
    if (code !== undefined) updateData.code = code
    if (parentId !== undefined) updateData.parentId = parentId || null
    if (active !== undefined) updateData.active = active

    const category = await db.productCategory.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: true
      }
    })

    // Create audit log
    await createAuditLog({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'ProductCategory',
      entityId: category.id,
      oldData: existingCategory,
      newData: category
    })

    return NextResponse.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/categories - Soft delete a category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const companyId = searchParams.get('companyId')
    const userId = searchParams.get('userId')

    if (!id || !companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_DATA },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await db.productCategory.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: {
            children: true,
            products: true
          }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NOT_FOUND },
        { status: 404 }
      )
    }

    // Check if category has children
    if (existingCategory._count.children > 0) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.CATEGORY_HAS_CHILDREN },
        { status: 400 }
      )
    }

    // Soft delete by setting active = false
    const category = await db.productCategory.update({
      where: { id },
      data: { active: false }
    })

    // Create audit log
    await createAuditLog({
      companyId,
      userId: userId || undefined,
      action: 'DELETE',
      entityType: 'ProductCategory',
      entityId: category.id,
      oldData: existingCategory
    })

    return NextResponse.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
