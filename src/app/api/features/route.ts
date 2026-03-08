import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع قوالب الميزات أو ميزات شركة معينة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const category = searchParams.get('category')

    // جلب ميزات شركة معينة
    if (companyId) {
      const subscription = await db.subscription.findFirst({
        where: { 
          companyId,
          status: 'active'
        },
        include: {
          SubscriptionPlan: {
            include: {
              PlanFeature: true
            }
          },
          FeatureUsage: true
        }
      })

      if (!subscription) {
        return NextResponse.json({ 
          success: false, 
          error: 'لا يوجد اشتراك نشط',
          features: [],
          usage: []
        })
      }

      // دمج الميزات مع الاستخدام
      const featuresWithUsage = subscription.SubscriptionPlan.PlanFeature.map(feature => {
        const usage = subscription.FeatureUsage.find(u => u.featureKey === feature.featureKey)
        return {
          ...feature,
          usedValue: usage?.usedValue || 0,
          remainingValue: feature.limitValue && feature.limitValue > 0 
            ? feature.limitValue - (usage?.usedValue || 0)
            : null,
          isOverLimit: feature.limitValue && feature.limitValue > 0 
            ? (usage?.usedValue || 0) >= feature.limitValue
            : false
        }
      })

      // فلترة حسب الفئة
      const filteredFeatures = category 
        ? featuresWithUsage.filter(f => f.category === category)
        : featuresWithUsage

      return NextResponse.json({ 
        success: true, 
        data: {
          subscription: {
            id: subscription.id,
            planId: subscription.planId,
            planName: subscription.SubscriptionPlan.name,
            planNameAr: subscription.SubscriptionPlan.nameAr,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate
          },
          features: filteredFeatures
        }
      })
    }

    // جلب جميع قوالب الميزات
    const templates = await db.featureTemplate.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
    })

    // تجميع حسب الفئة
    const groupedTemplates = {}
    for (const template of templates) {
      if (!groupedTemplates[template.category]) {
        groupedTemplates[template.category] = {
          category: template.category,
          categoryAr: template.categoryAr,
          features: []
        }
      }
      groupedTemplates[template.category].features.push(template)
    }

    return NextResponse.json({ 
      success: true, 
      data: Object.values(groupedTemplates)
    })
  } catch (error) {
    console.error('Error fetching features:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب الميزات' }, { status: 500 })
  }
}

// POST - التحقق من ميزة معينة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, featureKey, incrementUsage = false, incrementValue = 1 } = body

    if (!companyId || !featureKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'معرف الشركة ومفتاح الميزة مطلوبان' 
      }, { status: 400 })
    }

    // جلب الاشتراك والميزة
    const subscription = await db.subscription.findFirst({
      where: { 
        companyId,
        status: 'active'
      },
      include: {
        SubscriptionPlan: {
          include: {
            PlanFeature: {
              where: { featureKey }
            }
          }
        }
      }
    })

    if (!subscription) {
      return NextResponse.json({ 
        success: false, 
        hasAccess: false,
        error: 'لا يوجد اشتراك نشط' 
      })
    }

    const feature = subscription.SubscriptionPlan.PlanFeature[0]

    if (!feature) {
      return NextResponse.json({ 
        success: false, 
        hasAccess: false,
        error: 'الميزة غير موجودة' 
      })
    }

    // التحقق من تفعيل الميزة
    if (!feature.enabled) {
      return NextResponse.json({ 
        success: true, 
        hasAccess: false,
        feature: feature,
        error: 'الميزة غير مفعلة في خطتك الحالية' 
      })
    }

    // جلب الاستخدام الحالي
    let usage = await db.featureUsage.findUnique({
      where: {
        subscriptionId_featureKey: {
          subscriptionId: subscription.id,
          featureKey
        }
      }
    })

    // التحقق من الحد الأقصى
    if (feature.limitValue && feature.limitValue > 0) {
      const currentUsage = usage?.usedValue || 0
      
      if (currentUsage >= feature.limitValue) {
        return NextResponse.json({ 
          success: true, 
          hasAccess: false,
          feature: feature,
          usage: usage,
          error: 'تم تجاوز الحد الأقصى لهذه الميزة' 
        })
      }
    }

    // زيادة الاستخدام إذا طُلب
    if (incrementUsage) {
      if (usage) {
        usage = await db.featureUsage.update({
          where: { id: usage.id },
          data: { 
            usedValue: { increment: incrementValue },
            lastUpdated: new Date()
          }
        })
      } else {
        usage = await db.featureUsage.create({
          data: {
            
            subscriptionId: subscription.id,
            featureKey,
            usedValue: incrementValue,
            limitValue: feature.limitValue
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      hasAccess: true,
      feature: feature,
      usage: usage,
      remaining: feature.limitValue && feature.limitValue > 0 
        ? feature.limitValue - (usage?.usedValue || 0)
        : null
    })
  } catch (error) {
    console.error('Error checking feature:', error)
    return NextResponse.json({ success: false, error: 'فشل في التحقق من الميزة' }, { status: 500 })
  }
}

// PUT - تحديث استخدام ميزة (للمدير)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, featureKey, usedValue, resetDate } = body

    if (!subscriptionId || !featureKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'معرف الاشتراك ومفتاح الميزة مطلوبان' 
      }, { status: 400 })
    }

    const usage = await db.featureUsage.upsert({
      where: {
        subscriptionId_featureKey: {
          subscriptionId,
          featureKey
        }
      },
      update: {
        usedValue,
        resetDate: resetDate ? new Date(resetDate) : undefined,
        lastUpdated: new Date()
      },
      create: {
        
        subscriptionId,
        featureKey,
        usedValue: usedValue || 0,
        resetDate: resetDate ? new Date(resetDate) : undefined
      }
    })

    return NextResponse.json({ success: true, data: usage })
  } catch (error) {
    console.error('Error updating feature usage:', error)
    return NextResponse.json({ success: false, error: 'فشل في تحديث استخدام الميزة' }, { status: 500 })
  }
}
