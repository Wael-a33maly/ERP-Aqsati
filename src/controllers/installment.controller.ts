/**
 * Installment Controller
 * متحكم الأقساط والعقود
 */

import { NextRequest, NextResponse } from 'next/server'
import { contractService, installmentService } from '@/services/installment.service'

// ============ Contract Controller ============

export const contractController = {
  /**
   * GET - جلب العقود
   */
  async getContracts(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)

      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
        search: searchParams.get('search') || undefined,
        companyId: searchParams.get('companyId') || undefined,
        customerId: searchParams.get('customerId') || undefined,
        agentId: searchParams.get('agentId') || undefined,
        status: searchParams.get('status') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        paymentFrequency: searchParams.get('paymentFrequency') || undefined,
      }

      const result = await contractService.getContracts(params)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching installment contracts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch installment contracts'
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
  },

  /**
   * POST - إنشاء عقد جديد
   */
  async createContract(request: NextRequest) {
    try {
      const body = await request.json()
      const result = await contractService.createContract(body)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error creating installment contract:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create installment contract'
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
  },

  /**
   * PUT - تحديث عقد
   */
  async updateContract(request: NextRequest) {
    try {
      const body = await request.json()
      const result = await contractService.updateContract(body)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error updating installment contract:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update installment contract'
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
  },

  /**
   * DELETE - إلغاء عقد
   */
  async cancelContract(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Contract ID is required' },
          { status: 400 }
        )
      }

      const result = await contractService.cancelContract(id)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error cancelling installment contract:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel installment contract'
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
  },
}

// ============ Installment Controller ============

export const installmentController = {
  /**
   * GET - جلب جميع الأقساط
   */
  async getAll(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('companyId') || undefined

      const result = await installmentService.getAll(companyId)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Fetch installments error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch installments'
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
  },

  /**
   * GET - جلب الأقساط مع التصفية
   */
  async getInstallments(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)

      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '10'),
        search: searchParams.get('search') || undefined,
        status: searchParams.get('status') || undefined,
        companyId: searchParams.get('companyId') || undefined,
      }

      const result = await installmentService.getInstallments(params)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching installments:', error)
      return NextResponse.json({ success: false, error: 'فشل في جلب الأقساط' }, { status: 500 })
    }
  },

  /**
   * GET - جلب مدفوعات قسط
   */
  async getInstallmentPayments(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const result = await installmentService.getInstallmentPayments(id)

      if (!result.success) {
        return NextResponse.json(result, { status: 404 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching installment payments:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch installment payments'
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
  },

  /**
   * POST - تسجيل دفعة قسط
   */
  async recordPayment(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const body = await request.json()
      const result = await installmentService.recordPayment(id, body)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error recording installment payment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to record installment payment'
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
  },

  /**
   * DELETE - إلغاء دفعة قسط
   */
  async reversePayment(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params
      const { searchParams } = new URL(request.url)
      const paymentId = searchParams.get('paymentId')

      if (!paymentId) {
        return NextResponse.json(
          { success: false, error: 'Payment ID is required' },
          { status: 400 }
        )
      }

      const result = await installmentService.reversePayment(id, paymentId)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error reversing installment payment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to reverse installment payment'
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
  },

  /**
   * POST - تحصيل قسط
   */
  async collectPayment(request: NextRequest) {
    try {
      const body = await request.json()
      const result = await installmentService.collectPayment(body)

      if (!result.success) {
        return NextResponse.json(result, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Collection error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  },
}
