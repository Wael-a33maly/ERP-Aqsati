// ============================================
// Feature Controller - متحكم الميزات
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { featureService } from '@/services/feature.service'

export const featureController = {
  // GET - جلب الميزات
  async getFeatures(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const companyId = searchParams.get('companyId')
      const category = searchParams.get('category') || undefined

      if (companyId) {
        // جلب ميزات شركة معينة
        const result = await featureService.getCompanyFeatures({ companyId, category })

        if ('features' in result && result.features.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'لا يوجد اشتراك نشط',
            features: [],
            usage: [],
          })
        }

        return NextResponse.json({
          success: true,
          data: result,
        })
      }

      // جلب جميع قوالب الميزات
      const templates = await featureService.getFeatureTemplates(category)

      return NextResponse.json({
        success: true,
        data: templates,
      })
    } catch (error) {
      console.error('Error fetching features:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في جلب الميزات' },
        { status: 500 }
      )
    }
  },

  // POST - التحقق من ميزة معينة
  async checkFeature(request: NextRequest) {
    try {
      const body = await request.json()
      const { companyId, featureKey, incrementUsage = false, incrementValue = 1 } = body

      if (!companyId || !featureKey) {
        return NextResponse.json({
          success: false,
          error: 'معرف الشركة ومفتاح الميزة مطلوبان',
        }, { status: 400 })
      }

      const result = await featureService.checkFeature({
        companyId,
        featureKey,
        incrementUsage,
        incrementValue,
      })

      return NextResponse.json({
        success: true,
        ...result,
      })
    } catch (error) {
      console.error('Error checking feature:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في التحقق من الميزة' },
        { status: 500 }
      )
    }
  },

  // PUT - تحديث استخدام ميزة
  async updateFeatureUsage(request: NextRequest) {
    try {
      const body = await request.json()
      const { subscriptionId, featureKey, usedValue, resetDate } = body

      if (!subscriptionId || !featureKey) {
        return NextResponse.json({
          success: false,
          error: 'معرف الاشتراك ومفتاح الميزة مطلوبان',
        }, { status: 400 })
      }

      const usage = await featureService.updateFeatureUsage({
        subscriptionId,
        featureKey,
        usedValue,
        resetDate: resetDate ? new Date(resetDate) : undefined,
      })

      return NextResponse.json({ success: true, data: usage })
    } catch (error) {
      console.error('Error updating feature usage:', error)
      return NextResponse.json(
        { success: false, error: 'فشل في تحديث استخدام الميزة' },
        { status: 500 }
      )
    }
  },
}
