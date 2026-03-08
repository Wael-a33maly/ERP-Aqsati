/**
 * Seed Controller
 * متحكم البيانات التجريبية
 */

import { NextRequest, NextResponse } from 'next/server'
import { seedService } from '@/services/seed.service'

export const seedController = {
  async seedDatabase(request: NextRequest) {
    try {
      const counts = await seedService.seedDatabase()
      
      return NextResponse.json({
        success: true,
        message: 'تم إنشاء البيانات التجريبية بنجاح',
        data: counts
      })
    } catch (error: any) {
      console.error('Error seeding database:', error)
      return NextResponse.json({
        success: false,
        error: error.message || 'فشل في إنشاء البيانات التجريبية'
      }, { status: 500 })
    }
  }
}
