// ============================================
// Feature Repository - مستودع الميزات
// ============================================

import { db } from '@/lib/db'
import { 
  FeatureQueryParams,
  CheckFeatureInput,
  UpdateFeatureUsageInput,
  FeatureWithUsage
} from '@/models/feature.model'

export const featureRepository = {
  // جلب اشتراك الشركة النشط
  async findActiveSubscription(companyId: string) {
    return db.subscription.findFirst({
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
  },

  // جلب قوالب الميزات
  async findTemplates(category?: string) {
    return db.featureTemplate.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
    })
  },

  // جلب ميزة معينة من الخطة
  async findPlanFeature(subscriptionId: string, featureKey: string) {
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
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
    
    return subscription?.SubscriptionPlan.PlanFeature[0] || null
  },

  // جلب استخدام ميزة
  async findFeatureUsage(subscriptionId: string, featureKey: string) {
    return db.featureUsage.findUnique({
      where: {
        subscriptionId_featureKey: {
          subscriptionId,
          featureKey
        }
      }
    })
  },

  // إنشاء سجل استخدام جديد
  async createFeatureUsage(data: { subscriptionId: string; featureKey: string; usedValue: number; limitValue: number | null }) {
    return db.featureUsage.create({
      data
    })
  },

  // تحديث استخدام ميزة
  async updateFeatureUsage(id: string, data: { usedValue?: number; resetDate?: Date }) {
    return db.featureUsage.update({
      where: { id },
      data: { 
        ...data,
        lastUpdated: new Date()
      }
    })
  },

  // زيادة استخدام ميزة
  async incrementFeatureUsage(id: string, incrementValue: number) {
    return db.featureUsage.update({
      where: { id },
      data: { 
        usedValue: { increment: incrementValue },
        lastUpdated: new Date()
      }
    })
  },

  // تحديث أو إنشاء استخدام ميزة (upsert)
  async upsertFeatureUsage(params: UpdateFeatureUsageInput) {
    return db.featureUsage.upsert({
      where: {
        subscriptionId_featureKey: {
          subscriptionId: params.subscriptionId,
          featureKey: params.featureKey
        }
      },
      update: {
        usedValue: params.usedValue,
        resetDate: params.resetDate,
        lastUpdated: new Date()
      },
      create: {
        subscriptionId: params.subscriptionId,
        featureKey: params.featureKey,
        usedValue: params.usedValue || 0,
        resetDate: params.resetDate
      }
    })
  },

  // حساب الميزات مع الاستخدام
  calculateFeaturesWithUsage(subscription: any): FeatureWithUsage[] {
    return subscription.SubscriptionPlan.PlanFeature.map((feature: any) => {
      const usage = subscription.FeatureUsage.find((u: any) => u.featureKey === feature.featureKey)
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
  },
}
