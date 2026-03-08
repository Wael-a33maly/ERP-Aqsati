// ============================================
// Commission Controller - متحكم العمولات
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { commissionService } from '@/services/commission.service'
import { getCurrentUser } from '@/lib/auth'

export const commissionController = {
  // ==================== Agent Commissions ====================

  // GET - جلب العمولات
  async getCommissions(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        status: searchParams.get('status') as any || undefined,
        type: searchParams.get('type') as any || undefined,
        agentId: searchParams.get('agentId') || undefined,
        companyId: searchParams.get('companyId') || undefined,
        branchId: searchParams.get('branchId') || undefined
      }

      const result = await commissionService.getCommissions(params)

      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      console.error('Error fetching commissions:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب العمولات' },
        { status: 500 }
      )
    }
  },

  // GET - جلب عمولات المندوب
  async getAgentCommissions(request: NextRequest) {
    try {
      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') || undefined

      const commissions = await commissionService.getAgentCommissions(user.id, status)

      return NextResponse.json({
        success: true,
        data: commissions
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في جلب العمولات' },
        { status: 500 }
      )
    }
  },

  // POST - الموافقة على عمولة
  async approveCommission(id: string) {
    try {
      const commission = await commissionService.approveCommission(id)
      return NextResponse.json({
        success: true,
        data: commission
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في الموافقة على العمولة' },
        { status: 500 }
      )
    }
  },

  // POST - دفع عمولة
  async payCommission(id: string) {
    try {
      const commission = await commissionService.payCommission(id)
      return NextResponse.json({
        success: true,
        data: commission
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في دفع العمولة' },
        { status: 500 }
      )
    }
  },

  // ==================== Commission Policies ====================

  // GET - جلب سياسات العمولات
  async getPolicies(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        companyId: searchParams.get('companyId') || undefined,
        type: searchParams.get('type') as any || undefined,
        isActive: searchParams.get('isActive') === 'true' ? true : 
                  searchParams.get('isActive') === 'false' ? false : undefined
      }

      const result = await commissionService.getPolicies(params)

      return NextResponse.json({
        success: true,
        ...result
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'فشل في جلب سياسات العمولات' },
        { status: 500 }
      )
    }
  },

  // POST - إنشاء سياسة عمولة
  async createPolicy(request: NextRequest) {
    try {
      const body = await request.json()
      const policy = await commissionService.createPolicy(body)

      return NextResponse.json({
        success: true,
        data: policy
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في إنشاء سياسة العمولة' },
        { status: 500 }
      )
    }
  },

  // PUT - تحديث سياسة عمولة
  async updatePolicy(id: string, request: NextRequest) {
    try {
      const body = await request.json()
      const policy = await commissionService.updatePolicy(id, body)

      return NextResponse.json({
        success: true,
        data: policy
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في تحديث سياسة العمولة' },
        { status: 500 }
      )
    }
  },

  // DELETE - حذف سياسة عمولة
  async deletePolicy(id: string) {
    try {
      await commissionService.deletePolicy(id)
      return NextResponse.json({
        success: true,
        message: 'تم حذف سياسة العمولة بنجاح'
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'فشل في حذف سياسة العمولة' },
        { status: 500 }
      )
    }
  }
}
