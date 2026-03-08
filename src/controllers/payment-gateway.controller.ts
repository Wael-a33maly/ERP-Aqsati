/**
 * Payment Gateway Controller
 * متحكم بوابات الدفع
 */

import { NextRequest, NextResponse } from 'next/server'
import { paymentGatewayService } from '@/services/payment-gateway.service'
import { db } from '@/lib/db'

export const paymentGatewayController = {
  /**
   * GET - جلب بوابات الدفع
   */
  async getGateways(request: NextRequest) {
    try {
      // Get company ID from header or query params
      let companyId = request.headers.get('x-company-id')

      if (!companyId) {
        const { searchParams } = new URL(request.url)
        companyId = searchParams.get('companyId')
      }

      // If still no company ID, get the first active company (for demo/development)
      if (!companyId) {
        const firstCompany = await db.company.findFirst({
          where: { active: true },
          select: { id: true },
        })
        if (firstCompany) {
          companyId = firstCompany.id
        }
      }

      const result = await paymentGatewayService.getGateways({ companyId: companyId || '' })
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching payment gateways:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payment gateways' },
        { status: 500 }
      )
    }
  },

  /**
   * POST - إنشاء بوابة دفع
   */
  async createGateway(request: NextRequest) {
    try {
      // Get company ID from header or query params
      let companyId = request.headers.get('x-company-id')

      if (!companyId) {
        const { searchParams } = new URL(request.url)
        companyId = searchParams.get('companyId')
      }

      // If still no company ID, get the first active company (for demo/development)
      if (!companyId) {
        const firstCompany = await db.company.findFirst({
          where: { active: true },
          select: { id: true },
        })
        if (firstCompany) {
          companyId = firstCompany.id
        }
      }

      if (!companyId) {
        return NextResponse.json(
          { error: 'No company found. Please create a company first.' },
          { status: 400 }
        )
      }

      const body = await request.json()
      const result = await paymentGatewayService.createGateway({ ...body, companyId })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({ gateway: result.gateway })
    } catch (error) {
      console.error('Error creating payment gateway:', error)
      return NextResponse.json(
        { error: 'Failed to create payment gateway' },
        { status: 500 }
      )
    }
  },

  /**
   * PUT - تحديث بوابة دفع
   */
  async updateGateway(request: NextRequest) {
    try {
      // Get company ID from header or query params
      let companyId = request.headers.get('x-company-id')

      if (!companyId) {
        const { searchParams } = new URL(request.url)
        companyId = searchParams.get('companyId')
      }

      // If still no company ID, get the first active company (for demo/development)
      if (!companyId) {
        const firstCompany = await db.company.findFirst({
          where: { active: true },
          select: { id: true },
        })
        if (firstCompany) {
          companyId = firstCompany.id
        }
      }

      if (!companyId) {
        return NextResponse.json(
          { error: 'No company found. Please create a company first.' },
          { status: 400 }
        )
      }

      const body = await request.json()
      const { id, ...updateData } = body

      if (!id) {
        return NextResponse.json(
          { error: 'Gateway ID is required' },
          { status: 400 }
        )
      }

      const result = await paymentGatewayService.updateGateway({ id, companyId, ...updateData })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      return NextResponse.json({ gateway: result.gateway })
    } catch (error) {
      console.error('Error updating payment gateway:', error)
      return NextResponse.json(
        { error: 'Failed to update payment gateway' },
        { status: 500 }
      )
    }
  },

  /**
   * DELETE - حذف بوابة دفع
   */
  async deleteGateway(request: NextRequest) {
    try {
      // Get company ID from header or query params
      let companyId = request.headers.get('x-company-id')

      if (!companyId) {
        const { searchParams } = new URL(request.url)
        companyId = searchParams.get('companyId')
      }

      // If still no company ID, get the first active company (for demo/development)
      if (!companyId) {
        const firstCompany = await db.company.findFirst({
          where: { active: true },
          select: { id: true },
        })
        if (firstCompany) {
          companyId = firstCompany.id
        }
      }

      if (!companyId) {
        return NextResponse.json(
          { error: 'No company found. Please create a company first.' },
          { status: 400 }
        )
      }

      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json(
          { error: 'Gateway ID is required' },
          { status: 400 }
        )
      }

      const result = await paymentGatewayService.deleteGateway(id, companyId)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting payment gateway:', error)
      return NextResponse.json(
        { error: 'Failed to delete payment gateway' },
        { status: 500 }
      )
    }
  },
}
