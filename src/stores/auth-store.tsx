'use client'

import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { useState, useEffect } from 'react'

export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'BRANCH_MANAGER' | 'AGENT' | 'COLLECTOR'

export interface User {
  id: string
  email: string
  name: string
  nameAr?: string | null
  role: UserRole
  companyId?: string | null
  branchId?: string | null
  phone?: string | null
  avatar?: string | null
  company?: {
    id: string
    name: string
    nameAr?: string | null
    code: string
  } | null
  branch?: {
    id: string
    name: string
    nameAr?: string | null
    code: string
  } | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isHydrated: boolean
  locale: 'en' | 'ar'
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setHydrated: (hydrated: boolean) => void
  logout: () => void
  setLocale: (locale: 'en' | 'ar') => void
}

// Safe storage implementation for sandboxed iframes
const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window === 'undefined') return null
      return localStorage.getItem(name)
    } catch (e) {
      // localStorage not available in sandboxed iframe
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem(name, value)
    } catch (e) {
      // localStorage not available in sandboxed iframe
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window === 'undefined') return
      localStorage.removeItem(name)
    } catch (e) {
      // localStorage not available in sandboxed iframe
    }
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      locale: 'en',

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      setHydrated: (hydrated) =>
        set({ isHydrated: hydrated }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLocale: (locale) =>
        set({ locale }),
    }),
    {
      name: 'erp-auth-storage',
      storage: safeStorage,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        locale: state.locale,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)

// Hook to check if store is hydrated (prevents flash)
export function useHydration() {
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setHydrated(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])
  
  return hydrated
}

// Permission helpers based on role
export const rolePermissions: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    'companies.read', 'companies.write', 'companies.delete',
    'branches.read', 'branches.write', 'branches.delete',
    'users.read', 'users.write', 'users.delete',
    'customers.read', 'customers.write', 'customers.delete',
    'products.read', 'products.write', 'products.delete',
    'inventory.read', 'inventory.write',
    'invoices.read', 'invoices.write', 'invoices.delete',
    'payments.read', 'payments.write',
    'installments.read', 'installments.write',
    'returns.read', 'returns.write',
    'commissions.read', 'commissions.write',
    'reports.read', 'reports.write',
    'settings.read', 'settings.write',
  ],
  COMPANY_ADMIN: [
    'branches.read', 'branches.write',
    'users.read', 'users.write',
    'customers.read', 'customers.write', 'customers.delete',
    'products.read', 'products.write', 'products.delete',
    'inventory.read', 'inventory.write',
    'invoices.read', 'invoices.write', 'invoices.delete',
    'payments.read', 'payments.write',
    'installments.read', 'installments.write',
    'returns.read', 'returns.write',
    'commissions.read', 'commissions.write',
    'reports.read', 'reports.write',
    'settings.read', 'settings.write',
  ],
  BRANCH_MANAGER: [
    'users.read',
    'customers.read', 'customers.write',
    'products.read',
    'inventory.read', 'inventory.write',
    'invoices.read', 'invoices.write',
    'payments.read', 'payments.write',
    'installments.read', 'installments.write',
    'returns.read', 'returns.write',
    'commissions.read',
    'reports.read',
  ],
  AGENT: [
    'customers.read', 'customers.write',
    'products.read',
    'inventory.read',
    'invoices.read', 'invoices.write',
    'payments.read', 'payments.write',
    'installments.read', 'installments.write',
    'returns.read', 'returns.write',
    'commissions.read',
  ],
  COLLECTOR: [
    'customers.read',
    'payments.read', 'payments.write',
    'installments.read', 'installments.write',
  ],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function usePermission(permission: string): boolean {
  const user = useAuthStore((state) => state.user)
  if (!user) return false
  return hasPermission(user.role, permission)
}

export function usePermissions(): (permission: string) => boolean {
  const user = useAuthStore((state) => state.user)
  return (permission: string) => {
    if (!user) return false
    return hasPermission(user.role, permission)
  }
}

// Role Badge Component
export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    COMPANY_ADMIN: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    BRANCH_MANAGER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    AGENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    COLLECTOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    COMPANY_ADMIN: 'Company Admin',
    BRANCH_MANAGER: 'Branch Manager',
    AGENT: 'Agent',
    COLLECTOR: 'Collector',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[role] || 'bg-gray-100 text-gray-800'} ${className || ''}`}>
      {roleLabels[role] || role}
    </span>
  )
}
