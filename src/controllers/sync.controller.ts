// ============================================
// Sync Controller - متحكم المزامنة
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { syncService } from '@/services/sync.service'

export const syncController = {
  // POST - معالجة طلبات المزامنة
  async processSync(request: NextRequest) {
    try {
      const body = await request.json()
      const { operationType, data, operationId } = body

      if (!operationType || !data) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        )
      }

      const result = await syncService.processSync({
        operationType,
        data,
        operationId,
      })

      if (!result.success && result.conflict) {
        return NextResponse.json(result, { status: 409 })
      }

      if (!result.success) {
        return NextResponse.json(result, { status: 500 })
      }

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Sync error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  },

  // GET - الحصول على حالة المزامنة
  async getSyncStatus(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const agentId = searchParams.get('agentId') || undefined

      const result = await syncService.getSyncStatus(agentId)

      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  },
}
