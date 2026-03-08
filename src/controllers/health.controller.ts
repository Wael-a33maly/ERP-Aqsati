/**
 * Health Controller
 * متحكم فحص الصحة
 */

import { NextRequest, NextResponse } from 'next/server'
import { healthService } from '@/services/health.service'

export const healthController = {
  /**
   * فحص صحة التطبيق
   */
  async check(request: NextRequest) {
    try {
      const result = await healthService.check()
      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json({
        message: 'Error',
        status: 'error'
      }, { status: 500 })
    }
  },

  /**
   * فحص صحة التطبيق مع قاعدة البيانات
   */
  async checkWithDatabase(request: NextRequest) {
    try {
      const result = await healthService.checkWithDatabase()
      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json({
        message: 'Error',
        status: 'error',
        database: false
      }, { status: 500 })
    }
  }
}
