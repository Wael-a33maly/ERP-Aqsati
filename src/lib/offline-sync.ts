// نظام المزامنة للوضع غير المتصل
import { db } from '@/lib/db'

// أنواع العمليات للمزامنة
export const SyncOperationTypes = {
  CREATE_CUSTOMER: 'create_customer',
  UPDATE_CUSTOMER: 'update_customer',
  CREATE_INVOICE: 'create_invoice',
  CREATE_PAYMENT: 'create_payment',
  COLLECT_INSTALLMENT: 'collect_installment',
  UPDATE_INVENTORY: 'update_inventory',
} as const

// حالة المزامنة
export const SyncStatus = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CONFLICT: 'conflict',
} as const

// تخزين العمليات المحلية
interface OfflineOperation {
  id: string
  type: string
  data: any
  timestamp: number
  status: string
  retryCount: number
  error?: string
}

// تخزين محلي للعمليات
const offlineQueue: OfflineOperation[] = []

// إضافة عملية للطابور
export function queueOfflineOperation(type: string, data: any): string {
  const operation: OfflineOperation = {
    id: crypto.randomUUID(),
    type,
    data,
    timestamp: Date.now(),
    status: SyncStatus.PENDING,
    retryCount: 0,
  }
  
  offlineQueue.push(operation)
  
  // تخزين في localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('offline_queue', JSON.stringify(offlineQueue))
    } catch (e) {
      console.error('Failed to save offline queue:', e)
    }
  }
  
  return operation.id
}

// تحميل الطابور من localStorage
export function loadOfflineQueue(): void {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem('offline_queue')
    if (stored) {
      const operations = JSON.parse(stored)
      offlineQueue.length = 0
      offlineQueue.push(...operations)
    }
  } catch (e) {
    console.error('Failed to load offline queue:', e)
  }
}

// الحصول على العمليات المعلقة
export function getPendingOperations(): OfflineOperation[] {
  return offlineQueue.filter(op => op.status === SyncStatus.PENDING)
}

// مزامنة عمليات معلقة واحدة
async function syncOperation(operation: OfflineOperation): Promise<boolean> {
  try {
    operation.status = SyncStatus.SYNCING
    
    switch (operation.type) {
      case SyncOperationTypes.CREATE_CUSTOMER:
        await db.customer.create({ data: operation.data })
        break
        
      case SyncOperationTypes.UPDATE_CUSTOMER:
        await db.customer.update({
          where: { id: operation.data.id },
          data: operation.data.updates,
        })
        break
        
      case SyncOperationTypes.CREATE_INVOICE:
        await db.invoice.create({ data: operation.data })
        break
        
      case SyncOperationTypes.CREATE_PAYMENT:
        await db.payment.create({ data: operation.data })
        break
        
      case SyncOperationTypes.COLLECT_INSTALLMENT:
        await db.installment.update({
          where: { id: operation.data.installmentId },
          data: operation.data.updates,
        })
        break
        
      case SyncOperationTypes.UPDATE_INVENTORY:
        await db.inventory.update({
          where: { id: operation.data.inventoryId },
          data: operation.data.updates,
        })
        break
        
      default:
        throw new Error(`Unknown operation type: ${operation.type}`)
    }
    
    operation.status = SyncStatus.COMPLETED
    return true
    
  } catch (error: any) {
    operation.retryCount++
    operation.error = error.message
    
    if (operation.retryCount >= 3) {
      operation.status = SyncStatus.FAILED
    } else {
      operation.status = SyncStatus.PENDING
    }
    
    return false
  }
}

// مزامنة جميع العمليات المعلقة
export async function syncAllOperations(): Promise<{
  synced: number
  failed: number
  pending: number
}> {
  const pending = getPendingOperations()
  let synced = 0
  let failed = 0
  
  for (const operation of pending) {
    const success = await syncOperation(operation)
    if (success) {
      synced++
    } else if (operation.status === SyncStatus.FAILED) {
      failed++
    }
  }
  
  // إزالة العمليات المكتملة
  const remainingOperations = offlineQueue.filter(
    op => op.status !== SyncStatus.COMPLETED
  )
  offlineQueue.length = 0
  offlineQueue.push(...remainingOperations)
  
  // تحديث localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('offline_queue', JSON.stringify(offlineQueue))
    } catch (e) {
      console.error('Failed to update offline queue:', e)
    }
  }
  
  return {
    synced,
    failed,
    pending: getPendingOperations().length,
  }
}

// إزالة عملية من الطابور
export function removeOperation(operationId: string): void {
  const index = offlineQueue.findIndex(op => op.id === operationId)
  if (index !== -1) {
    offlineQueue.splice(index, 1)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('offline_queue', JSON.stringify(offlineQueue))
    }
  }
}

// مسح جميع العمليات
export function clearAllOperations(): void {
  offlineQueue.length = 0
  if (typeof window !== 'undefined') {
    localStorage.removeItem('offline_queue')
  }
}

// حالة الاتصال
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

// تسجيل مستمعي الأحداث للمزامنة التلقائية
export function setupAutoSync(onSync: (result: any) => void): void {
  if (typeof window === 'undefined') return
  
  // المزامنة عند العودة للاتصال
  window.addEventListener('online', async () => {
    console.log('[Offline] Back online, syncing...')
    const result = await syncAllOperations()
    onSync(result)
  })
  
  // تحميل الطابور المحفوظ
  loadOfflineQueue()
  
  // تسجيل في Service Worker
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      return (registration as any).sync.register('sync-data')
    }).catch(err => {
      console.error('[Offline] Background sync registration failed:', err)
    })
  }
}

// إحصائيات المزامنة
export function getSyncStats(): {
  total: number
  pending: number
  syncing: number
  completed: number
  failed: number
} {
  return {
    total: offlineQueue.length,
    pending: offlineQueue.filter(op => op.status === SyncStatus.PENDING).length,
    syncing: offlineQueue.filter(op => op.status === SyncStatus.SYNCING).length,
    completed: offlineQueue.filter(op => op.status === SyncStatus.COMPLETED).length,
    failed: offlineQueue.filter(op => op.status === SyncStatus.FAILED).length,
  }
}

// Client-side hook
export function useOfflineSync(): {
  isOnline: boolean
  pendingCount: number
  syncNow: () => Promise<any>
  queueOperation: (type: string, data: any) => string
} {
  return {
    isOnline: isOnline(),
    pendingCount: getPendingOperations().length,
    syncNow: syncAllOperations,
    queueOperation: queueOfflineOperation,
  }
}
