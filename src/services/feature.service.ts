// ============================================
// Feature Service - خدمة الميزات
// ============================================

import { featureRepository } from '@/repositories/feature.repository'
import { 
  FeatureQueryParams,
  CheckFeatureInput,
  UpdateFeatureUsageInput,
  FeatureCheckResponse,
  CompanyFeaturesResponse,
  FeatureGroupResponse
} from '@/models/feature.model'

export const featureService = {
  // جلب ميزات الشركة
  async getCompanyFeatures(params: FeatureQueryParams): Promise<CompanyFeaturesResponse | { features: []; usage: [] }> {
    if (!params.companyId) {
      return { features: [], usage: [] }
    }

    const subscription = await featureRepository.findActiveSubscription(params.companyId)

    if (!subscription) {
      return { features: [], usage: [] }
    }

    // حساب الميزات مع الاستخدام
    let featuresWithUsage = featureRepository.calculateFeaturesWithUsage(subscription)

    // فلترة حسب الفئة
    if (params.category) {
      featuresWithUsage = featuresWithUsage.filter(f => f.category === params.category)
    }

    return {
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        planName: subscription.SubscriptionPlan.name,
        planNameAr: subscription.SubscriptionPlan.nameAr,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
      features: featuresWithUsage,
    }
  },

  // جلب قوالب الميزات
  async getFeatureTemplates(category?: string): Promise<FeatureGroupResponse[]> {
    const templates = await featureRepository.findTemplates(category)

    // تجميع حسب الفئة
    const groupedTemplates: Record<string, FeatureGroupResponse> = {}
    for (const template of templates) {
      if (!groupedTemplates[template.category]) {
        groupedTemplates[template.category] = {
          category: template.category,
          categoryAr: template.categoryAr,
          features: [],
        }
      }
      groupedTemplates[template.category].features.push(template)
    }

    return Object.values(groupedTemplates)
  },

  // التحقق من ميزة معينة
  async checkFeature(params: CheckFeatureInput): Promise<FeatureCheckResponse> {
    const subscription = await featureRepository.findActiveSubscription(params.companyId)

    if (!subscription) {
      return {
        hasAccess: false,
        error: 'لا يوجد اشتراك نشط',
      }
    }

    const feature = await featureRepository.findPlanFeature(subscription.id, params.featureKey)

    if (!feature) {
      return {
        hasAccess: false,
        error: 'الميزة غير موجودة',
      }
    }

    // التحقق من تفعيل الميزة
    if (!feature.enabled) {
      return {
        hasAccess: false,
        feature,
        error: 'الميزة غير مفعلة في خطتك الحالية',
      }
    }

    // جلب الاستخدام الحالي
    let usage = await featureRepository.findFeatureUsage(subscription.id, params.featureKey)

    // التحقق من الحد الأقصى
    if (feature.limitValue && feature.limitValue > 0) {
      const currentUsage = usage?.usedValue || 0

      if (currentUsage >= feature.limitValue) {
        return {
          hasAccess: false,
          feature,
          usage: usage || undefined,
          error: 'تم تجاوز الحد الأقصى لهذه الميزة',
        }
      }
    }

    // زيادة الاستخدام إذا طُلب
    if (params.incrementUsage) {
      const incrementValue = params.incrementValue || 1
      if (usage) {
        usage = await featureRepository.incrementFeatureUsage(usage.id, incrementValue)
      } else {
        usage = await featureRepository.createFeatureUsage({
          subscriptionId: subscription.id,
          featureKey: params.featureKey,
          usedValue: incrementValue,
          limitValue: feature.limitValue,
        })
      }
    }

    return {
      hasAccess: true,
      feature,
      usage: usage || undefined,
      remaining: feature.limitValue && feature.limitValue > 0
        ? feature.limitValue - (usage?.usedValue || 0)
        : null,
    }
  },

  // تحديث استخدام ميزة
  async updateFeatureUsage(params: UpdateFeatureUsageInput) {
    return featureRepository.upsertFeatureUsage(params)
  },
}
