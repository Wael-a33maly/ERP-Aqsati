'use client'

import { Badge } from '@/components/ui/badge'
import { cva, type VariantProps } from 'class-variance-authority'

const statusBadgeVariants = cva('', {
  variants: {
    variant: {
      default: '',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200',
      destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200',
      secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
      outline: 'border',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

type StatusType = 
  | 'pending' 
  | 'active' 
  | 'inactive' 
  | 'completed' 
  | 'cancelled' 
  | 'paid' 
  | 'partial' 
  | 'overdue' 
  | 'approved' 
  | 'rejected'
  | 'draft'

interface StatusBadgeProps {
  status: StatusType | string
  label?: string
  labelAr?: string
  className?: string
}

const statusConfig: Record<StatusType, { variant: 'success' | 'warning' | 'destructive' | 'info' | 'secondary' | 'outline'; label: string; labelAr: string }> = {
  pending: { variant: 'warning', label: 'Pending', labelAr: 'قيد الانتظار' },
  active: { variant: 'success', label: 'Active', labelAr: 'نشط' },
  inactive: { variant: 'secondary', label: 'Inactive', labelAr: 'غير نشط' },
  completed: { variant: 'success', label: 'Completed', labelAr: 'مكتمل' },
  cancelled: { variant: 'destructive', label: 'Cancelled', labelAr: 'ملغي' },
  paid: { variant: 'success', label: 'Paid', labelAr: 'مدفوع' },
  partial: { variant: 'info', label: 'Partial', labelAr: 'جزئي' },
  overdue: { variant: 'destructive', label: 'Overdue', labelAr: 'متأخر' },
  approved: { variant: 'success', label: 'Approved', labelAr: 'معتمد' },
  rejected: { variant: 'destructive', label: 'Rejected', labelAr: 'مرفوض' },
  draft: { variant: 'outline', label: 'Draft', labelAr: 'مسودة' },
}

export function StatusBadge({ status, label, labelAr, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || { 
    variant: 'secondary' as const, 
    label: status, 
    labelAr: status 
  }
  
  const displayLabel = label || config.label
  const displayLabelAr = labelAr || config.labelAr

  return (
    <Badge 
      variant="outline" 
      className={`${statusBadgeVariants({ variant: config.variant })} ${className}`}
    >
      {displayLabel}
      {displayLabelAr && (
        <span className="opacity-70 ml-1 text-xs">({displayLabelAr})</span>
      )}
    </Badge>
  )
}

// Role Badge
interface RoleBadgeProps {
  role: string
  className?: string
}

const roleConfig: Record<string, { variant: 'success' | 'warning' | 'destructive' | 'info' | 'secondary' | 'outline'; label: string; labelAr: string }> = {
  SUPER_ADMIN: { variant: 'destructive', label: 'Super Admin', labelAr: 'مدير النظام' },
  COMPANY_ADMIN: { variant: 'warning', label: 'Company Admin', labelAr: 'مدير الشركة' },
  BRANCH_MANAGER: { variant: 'info', label: 'Branch Manager', labelAr: 'مدير الفرع' },
  AGENT: { variant: 'success', label: 'Agent', labelAr: 'مندوب' },
  COLLECTOR: { variant: 'secondary', label: 'Collector', labelAr: 'محصل' },
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role] || { 
    variant: 'secondary' as const, 
    label: role, 
    labelAr: role 
  }

  return (
    <Badge 
      variant="outline" 
      className={`${statusBadgeVariants({ variant: config.variant })} ${className}`}
    >
      {config.label}
      <span className="opacity-70 ml-1 text-xs">({config.labelAr})</span>
    </Badge>
  )
}

// Payment Method Badge
interface PaymentMethodBadgeProps {
  method: string
  className?: string
}

const paymentMethodConfig: Record<string, { variant: 'success' | 'warning' | 'destructive' | 'info' | 'secondary' | 'outline'; label: string; labelAr: string }> = {
  CASH: { variant: 'success', label: 'Cash', labelAr: 'نقدي' },
  BANK: { variant: 'info', label: 'Bank Transfer', labelAr: 'تحويل بنكي' },
  CHECK: { variant: 'warning', label: 'Check', labelAr: 'شيك' },
  MOBILE: { variant: 'info', label: 'Mobile Payment', labelAr: 'دفع إلكتروني' },
}

export function PaymentMethodBadge({ method, className }: PaymentMethodBadgeProps) {
  const config = paymentMethodConfig[method] || { 
    variant: 'secondary' as const, 
    label: method, 
    labelAr: method 
  }

  return (
    <Badge 
      variant="outline" 
      className={`${statusBadgeVariants({ variant: config.variant })} ${className}`}
    >
      {config.label}
      <span className="opacity-70 ml-1 text-xs">({config.labelAr})</span>
    </Badge>
  )
}
