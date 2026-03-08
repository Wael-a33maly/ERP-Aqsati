'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Feature {
  id: string
  planId: string
  featureKey: string
  featureName: string
  featureNameAr: string
  category: string
  categoryAr: string
  enabled: boolean
  limitValue: number | null
  limitUnit: string | null
  price: number | null
  description: string | null
  descriptionAr: string | null
  icon: string | null
  usedValue?: number
  remainingValue?: number | null
  isOverLimit?: boolean
}

export interface Subscription {
  id: string
  planId: string
  planName: string
  planNameAr: string
  status: string
  startDate: Date
  endDate: Date
}

interface FeatureCheckResult {
  success: boolean
  hasAccess: boolean
  feature?: Feature
  usage?: { usedValue: number }
  remaining?: number | null
  error?: string
}

export function useFeatures(companyId: string | null) {
  const [features, setFeatures] = useState<Feature[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatures = useCallback(async () => {
    if (!companyId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/features?companyId=${companyId}`)
      const data = await response.json()

      if (data.success) {
        setFeatures(data.data.features || [])
        setSubscription(data.data.subscription || null)
      } else {
        setError(data.error || 'فشل في جلب الميزات')
      }
    } catch (err) {
      setError('فشل في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    fetchFeatures()
  }, [fetchFeatures])

  // التحقق من ميزة معينة
  const checkFeature = useCallback(async (
    featureKey: string, 
    incrementUsage = false
  ): Promise<FeatureCheckResult> => {
    if (!companyId) {
      return { success: false, hasAccess: false, error: 'لا توجد شركة محددة' }
    }

    try {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          featureKey,
          incrementUsage
        })
      })
      return await response.json()
    } catch {
      return { success: false, hasAccess: false, error: 'فشل في الاتصال' }
    }
  }, [companyId])

  // التحقق السريع (من الذاكرة)
  const hasFeature = useCallback((featureKey: string): boolean => {
    const feature = features.find(f => f.featureKey === featureKey)
    return feature?.enabled && !feature?.isOverLimit
  }, [features])

  // الحصول على حد الميزة
  const getFeatureLimit = useCallback((featureKey: string): number | null => {
    const feature = features.find(f => f.featureKey === featureKey)
    return feature?.limitValue ?? null
  }, [features])

  // الحصول على استخدام الميزة
  const getFeatureUsage = useCallback((featureKey: string): { used: number; limit: number | null; remaining: number | null } => {
    const feature = features.find(f => f.featureKey === featureKey)
    return {
      used: feature?.usedValue || 0,
      limit: feature?.limitValue ?? null,
      remaining: feature?.remainingValue ?? null
    }
  }, [features])

  // الحصول على ميزات حسب الفئة
  const getFeaturesByCategory = useCallback((category: string): Feature[] => {
    return features.filter(f => f.category === category)
  }, [features])

  // الميزات المفعلة فقط
  const enabledFeatures = features.filter(f => f.enabled)
  
  // الميزات المعطلة
  const disabledFeatures = features.filter(f => !f.enabled)

  // الميزات التي تجاوزت الحد
  const overLimitFeatures = features.filter(f => f.isOverLimit)

  return {
    features,
    subscription,
    loading,
    error,
    refetch: fetchFeatures,
    checkFeature,
    hasFeature,
    getFeatureLimit,
    getFeatureUsage,
    getFeaturesByCategory,
    enabledFeatures,
    disabledFeatures,
    overLimitFeatures
  }
}

// Hook مخصص للتحقق من ميزة واحدة
export function useFeature(companyId: string | null, featureKey: string) {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<FeatureCheckResult | null>(null)

  const check = useCallback(async (incrementUsage = false) => {
    if (!companyId) return

    setChecking(true)
    try {
      const response = await fetch('/api/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, featureKey, incrementUsage })
      })
      const data = await response.json()
      setResult(data)
      return data
    } finally {
      setChecking(false)
    }
  }, [companyId, featureKey])

  return {
    checking,
    result,
    check,
    hasAccess: result?.hasAccess ?? false
  }
}
