/**
 * Product Controller
 */

import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product.service'
import { getCurrentUser, isSuperAdmin } from '@/lib/auth'

export const productController = {
  async getProducts(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      const { searchParams } = new URL(request.url)
      const companyId = isSuperAdmin(user) ? searchParams.get('companyId') : user.companyId

      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        companyId: companyId || undefined,
        categoryId: searchParams.get('categoryId') || undefined,
        active: searchParams.get('active') === 'true' ? true : 
                searchParams.get('active') === 'false' ? false : undefined
      }

      const result = await productService.getProducts(params)
      return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  },

  async getProductById(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      const product = await productService.getProductById(id)
      return NextResponse.json({ success: true, data: product })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 })
    }
  },

  async createProduct(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      const body = await request.json()
      const product = await productService.createProduct({
        ...body,
        companyId: isSuperAdmin(user) ? body.companyId : user.companyId
      })
      return NextResponse.json({ success: true, data: product })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async updateProduct(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      const body = await request.json()
      const product = await productService.updateProduct(id, body)
      return NextResponse.json({ success: true, data: product })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
  },

  async deleteProduct(request: NextRequest, id: string) {
    try {
      const user = await getCurrentUser()
      if (!user) return NextResponse.json({ success: false, error: 'غير مصارح' }, { status: 401 })

      await productService.deleteProduct(id)
      return NextResponse.json({ success: true, message: 'تم حذف المنتج' })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }
}
