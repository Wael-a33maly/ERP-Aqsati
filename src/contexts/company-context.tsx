'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

// أنواع البيانات
interface Company {
  id: string
  name: string
  nameAr?: string | null
  code: string
  logo?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  taxNumber?: string | null
  taxRate: number
  currency: string
  active: boolean
}

interface CompanyContextType {
  // الشركة النشطة
  activeCompany: Company | null
  companyId: string | null
  
  // جميع الشركات المتاحة للمستخدم
  companies: Company[]
  
  // حالة التحميل
  loading: boolean
  
  // تغيير الشركة النشطة
  setActiveCompany: (company: Company | null) => void
  
  // تحديث قائمة الشركات
  setCompanies: (companies: Company[]) => void
  
  // تحميل الشركات من API
  fetchCompanies: () => Promise<void>
  
  // التحقق من وجود شركة نشطة
  hasActiveCompany: boolean
}

// إنشاء السياق
const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

// مفتاح التخزين المحلي
const STORAGE_KEY = 'erp_active_company'

// Provider Component
export function CompanyProvider({ children }: { children: ReactNode }) {
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  // تحميل الشركة النشطة من localStorage عند التهيئة
  useEffect(() => {
    const loadActiveCompany = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          setActiveCompanyState(parsed)
        }
      } catch (error) {
        console.error('Error loading active company from storage:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    
    loadActiveCompany()
    setLoading(false)
  }, [])

  // تحديث الشركة النشطة وحفظها في localStorage
  const setActiveCompany = useCallback((company: Company | null) => {
    setActiveCompanyState(company)
    if (company) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(company))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // تحميل الشركات من API
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/companies')
      const result = await response.json()
      
      if (result.success && result.data) {
        const companyList = result.data.map((c: Company) => ({
          id: c.id,
          name: c.name,
          nameAr: c.nameAr,
          code: c.code,
          logo: c.logo,
          email: c.email,
          phone: c.phone,
          address: c.address,
          taxNumber: c.taxNumber,
          taxRate: c.taxRate || 15,
          currency: c.currency || 'SAR',
          active: c.active
        }))
        
        setCompanies(companyList)
        
        // إذا لم تكن هناك شركة نشطة وهناك شركات متاحة، اختر الأولى
        if (!activeCompany && companyList.length > 0) {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              const found = companyList.find((c: Company) => c.id === parsed.id)
              if (found) {
                setActiveCompanyState(found)
              } else {
                setActiveCompanyState(companyList[0])
                localStorage.setItem(STORAGE_KEY, JSON.stringify(companyList[0]))
              }
            } catch {
              setActiveCompanyState(companyList[0])
              localStorage.setItem(STORAGE_KEY, JSON.stringify(companyList[0]))
            }
          } else {
            setActiveCompanyState(companyList[0])
            localStorage.setItem(STORAGE_KEY, JSON.stringify(companyList[0]))
          }
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }, [activeCompany])

  // القيم المُصدرة
  const value: CompanyContextType = {
    activeCompany,
    companyId: activeCompany?.id || null,
    companies,
    loading,
    setActiveCompany,
    setCompanies,
    fetchCompanies,
    hasActiveCompany: !!activeCompany
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

// Hook لاستخدام السياق
export function useActiveCompany(): CompanyContextType {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useActiveCompany must be used within a CompanyProvider')
  }
  return context
}

// Hook مبسط للحصول على companyId فقط
export function useCompanyId(): string | null {
  const { companyId } = useActiveCompany()
  return companyId
}

// Hook للحصول على فلتر الشركة للاستعلامات
export function useCompanyFilter(): Record<string, string> {
  const { companyId } = useActiveCompany()
  return companyId ? { companyId } : {}
}

// Hook للتحقق من الوصول للشركة
export function useCompanyAccess(resourceCompanyId: string | null | undefined): boolean {
  const { companyId, activeCompany } = useActiveCompany()
  
  // إذا لم تكن هناك شركة نشطة، لا يوجد وصول
  if (!companyId) return false
  
  // إذا كان المورد غير مرتبط بشركة، السماح بالوصول
  if (!resourceCompanyId) return true
  
  // التحقق من تطابق الشركة
  return companyId === resourceCompanyId
}

export default CompanyContext
