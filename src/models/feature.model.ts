// ============================================
// Feature Model - نموذج الميزات
// ============================================

export interface FeatureTemplate {
  id: string
  featureKey: string
  featureName: string
  featureNameAr: string
  category: string
  categoryAr: string
  description: string | null
  descriptionAr: string | null
  defaultValue: number | null
  unit: string | null
  sortOrder: number
  createdAt: Date
}

export interface PlanFeature {
  id: string
  planId: string
  featureKey: string
  enabled: boolean
  limitValue: number | null
  unit: string | null
}

export interface FeatureUsage {
  id: string
  subscriptionId: string
  featureKey: string
  usedValue: number
  limitValue: number | null
  resetDate: Date | null
  lastUpdated: Date
}

export interface FeatureWithUsage extends PlanFeature {
  usedValue: number
  remainingValue: number | null
  isOverLimit: boolean
}

// Query Parameters
export interface FeatureQueryParams {
  companyId?: string
  category?: string
}

// Input Types
export interface CheckFeatureInput {
  companyId: string
  featureKey: string
  incrementUsage?: boolean
  incrementValue?: number
}

export interface UpdateFeatureUsageInput {
  subscriptionId: string
  featureKey: string
  usedValue?: number
  resetDate?: Date
}

// Response Types
export interface FeatureCheckResponse {
  hasAccess: boolean
  feature?: PlanFeature
  usage?: FeatureUsage
  remaining?: number | null
  error?: string
}

export interface CompanyFeaturesResponse {
  subscription: {
    id: string
    planId: string
    planName: string
    planNameAr: string
    status: string
    startDate: Date
    endDate: Date
  }
  features: FeatureWithUsage[]
}

export interface FeatureGroupResponse {
  category: string
  categoryAr: string
  features: FeatureTemplate[]
}
