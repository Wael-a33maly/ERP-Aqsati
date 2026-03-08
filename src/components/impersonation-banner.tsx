'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, LogOut, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ImpersonationBannerProps {
  companyName: string
  onExit: () => void
}

export default function ImpersonationBanner({ companyName, onExit }: ImpersonationBannerProps) {
  const [loading, setLoading] = useState(false)

  const handleExit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        // استعادة المستخدم الأصلي من localStorage
        const impersonationData = localStorage.getItem('impersonation_session')
        if (impersonationData) {
          const sessionInfo = JSON.parse(impersonationData)
          
          // استعادة المستخدم الأصلي
          const originalUser = {
            id: sessionInfo.originalUserId,
            name: sessionInfo.originalUserName,
            role: 'SUPER_ADMIN',
            isImpersonating: false
          }
          
          localStorage.setItem('erp_user', JSON.stringify(originalUser))
          localStorage.removeItem('impersonation_session')
        }
        
        toast.success('تم الخروج من الوضع المتخفي')
        onExit()
        // تحديث الصفحة للعودة للوحة السوبر أدمن
        window.location.reload()
      } else {
        toast.error(result.error || 'فشل في الخروج')
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5" />
        <div>
          <span className="font-medium">أنت تعمل كمستخدم متخفي في شركة: </span>
          <span className="font-bold">{companyName}</span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="bg-white text-amber-600 border-white hover:bg-amber-50"
        onClick={handleExit}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin ml-2" />
        ) : (
          <LogOut className="h-4 w-4 ml-2" />
        )}
        خروج
      </Button>
    </div>
  )
}
