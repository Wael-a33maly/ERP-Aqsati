// نظام المزامنة المتقدم للوضع غير المتصل
// Enhanced Offline Sync with IndexedDB Support

'use client'

import { db } from '@/lib/db'

// ===================== TYPES =====================
export const SyncOperationTypes = {
  CREATE_CUSTOMER: 'create_customer',
  UPDATE_CUSTOMER: 'update_customer',
  DELETE_CUSTOMER: 'delete_customer',
  CREATE_INVOICE: 'create_invoice',
  UPDATE_INVOICE: 'update_invoice',
  CREATE_PAYMENT: 'create_payment',
  COLLECT_INSTALLMENT: 'collect_installment',
  UPDATE_INVENTORY: 'update_inventory',
  CREATE_RETURN: 'create_return',
  UPDATE_PRODUCT: 'update_product',
} as const

export const SyncStatus = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CONFLICT: 'conflict',
  CANCELLED: 'cancelled',
} as const

interface OfflineOperation {
  id: string
  type: string
  data: any
  timestamp: number
  status: string
  retryCount: number
  maxRetries: number
  error?: string
  lastAttempt?: number
  priority: 'high' | 'medium' | 'low'
  entityType: string
  entityId?: string
}

interface SyncResult {
  success: boolean
  synced: number
  failed: number
  pending: number
  errors: { id: string; error: string }[]
}

interface ConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual'
  serverData?: any
  clientData?: any
}

// ===================== INDEXED DB SETUP =====================
const DB_NAME = 'ERP_Aqsati_Offline'
const DB_VERSION = 1
const STORE_NAME = 'offline_operations'

let indexedDB: IDBDatabase | null = null

// فتح قاعدة البيانات
async function openDatabase(): Promise<IDBDatabase> {
  if (indexedDB) return indexedDB
  
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    
    request.onsuccess = () => {
      indexedDB = request.result
      resolve(indexedDB)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('priority', 'priority', { unique: false })
      }
    }
  })
}

// ===================== OPERATIONS =====================
// إضافة عملية للطابور
export async function queueOfflineOperation(
  type: string,
  data: any,
  options?: {
    priority?: 'high' | 'medium' | 'low'
    entityId?: string
    entityType?: string
  }
): Promise<string> {
  const operation: OfflineOperation = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
    status: SyncStatus.PENDING,
    retryCount: 0,
    maxRetries: 5,
    priority: options?.priority || 'medium',
    entityType: options?.entityType || 'unknown',
    entityId: options?.entityId,
  }
  
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add(operation)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    
    // إشعار Service Worker - تسجيل الـ sync فقط عند وجود بيانات
    try {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready
        // استخدام اسم قصير للـ sync tag (الحد الأقصى 20 حرف تقريباً)
        await (registration as any).sync.register('sync-data')
      }
    } catch (syncError) {
      // لا نريد إيقاف العملية إذا فشل تسجيل الـ sync
      console.warn('Background sync registration failed:', syncError)
    }
    
    return operation.id
  } catch (error) {
    console.error('Failed to queue offline operation:', error)
    throw error
  }
}

// الحصول على العمليات المعلقة
export async function getPendingOperations(): Promise<OfflineOperation[]> {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('status')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(SyncStatus.PENDING)
      request.onsuccess = () => {
        // ترتيب حسب الأولوية والوقت
        const operations = request.result as OfflineOperation[]
        operations.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
          if (priorityDiff !== 0) return priorityDiff
          return a.timestamp - b.timestamp
        })
        resolve(operations)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to get pending operations:', error)
    return []
  }
}

// الحصول على جميع العمليات
export async function getAllOperations(): Promise<OfflineOperation[]> {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to get all operations:', error)
    return []
  }
}

// تحديث حالة العملية
async function updateOperationStatus(
  id: string,
  status: string,
  error?: string
): Promise<void> {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    
    const operation = await new Promise<OfflineOperation>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    if (operation) {
      operation.status = status
      operation.lastAttempt = Date.now()
      if (error) operation.error = error
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(operation)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
  } catch (err) {
    console.error('Failed to update operation:', err)
  }
}

// حذف عملية
export async function deleteOperation(id: string): Promise<void> {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to delete operation:', error)
  }
}

// مسح جميع العمليات المكتملة
export async function clearCompletedOperations(): Promise<void> {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('status')
    
    const completed = await new Promise<OfflineOperation[]>((resolve, reject) => {
      const request = index.getAll(SyncStatus.COMPLETED)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    for (const op of completed) {
      store.delete(op.id)
    }
  } catch (error) {
    console.error('Failed to clear completed operations:', error)
  }
}

// ===================== SYNC LOGIC =====================
// مزامنة عملية واحدة
async function syncOperation(operation: OfflineOperation): Promise<boolean> {
  try {
    await updateOperationStatus(operation.id, SyncStatus.SYNCING)
    
    const response = await fetch(operation.data.url || '/api/sync', {
      method: operation.data.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Sync': 'true',
        'X-Operation-Id': operation.id,
        'X-Operation-Type': operation.type,
      },
      body: JSON.stringify(operation.data),
    })
    
    if (!response.ok) {
      // تحقق من Conflict
      if (response.status === 409) {
        const conflict = await response.json()
        await updateOperationStatus(
          operation.id,
          SyncStatus.CONFLICT,
          JSON.stringify(conflict)
        )
        return false
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    // تحديث العملية كـ مكتملة
    await updateOperationStatus(operation.id, SyncStatus.COMPLETED)
    
    // إرسال إشعار للـ UI
    notifySyncProgress({
      type: 'operation_completed',
      operationId: operation.id,
      result,
    })
    
    return true
    
  } catch (error: any) {
    operation.retryCount++
    
    if (operation.retryCount >= operation.maxRetries) {
      await updateOperationStatus(
        operation.id,
        SyncStatus.FAILED,
        error.message
      )
      return false
    }
    
    // إعادة للمعلقة مع زيادة محاولات
    await updateOperationStatus(
      operation.id,
      SyncStatus.PENDING,
      error.message
    )
    
    return false
  }
}

// مزامنة جميع العمليات المعلقة
export async function syncAllOperations(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    pending: 0,
    errors: [],
  }
  
  const pending = await getPendingOperations()
  
  for (const operation of pending) {
    const success = await syncOperation(operation)
    
    if (success) {
      result.synced++
    } else {
      result.failed++
      result.errors.push({
        id: operation.id,
        error: operation.error || 'Unknown error',
      })
    }
  }
  
  result.pending = (await getPendingOperations()).length
  result.success = result.failed === 0
  
  // إشعار النتيجة النهائية
  notifySyncProgress({
    type: 'sync_completed',
    result,
  })
  
  return result
}

// ===================== NOTIFICATIONS =====================
type SyncProgressCallback = (data: any) => void
const syncCallbacks: Set<SyncProgressCallback> = new Set()

export function onSyncProgress(callback: SyncProgressCallback): () => void {
  syncCallbacks.add(callback)
  return () => syncCallbacks.delete(callback)
}

function notifySyncProgress(data: any): void {
  syncCallbacks.forEach(callback => {
    try {
      callback(data)
    } catch (error) {
      console.error('Sync callback error:', error)
    }
  })
}

// ===================== NETWORK STATUS =====================
let wasOffline = false

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export function setupNetworkListeners(): void {
  if (typeof window === 'undefined') return
  
  window.addEventListener('online', async () => {
    console.log('[Offline] Back online')
    
    if (wasOffline) {
      // إشعار المستخدم
      notifySyncProgress({ type: 'back_online' })
      
      // بدء المزامنة
      setTimeout(async () => {
        notifySyncProgress({ type: 'sync_started' })
        const result = await syncAllOperations()
        notifySyncProgress({ type: 'sync_completed', result })
      }, 1000)
    }
    
    wasOffline = false
  })
  
  window.addEventListener('offline', () => {
    console.log('[Offline] Gone offline')
    wasOffline = true
    notifySyncProgress({ type: 'gone_offline' })
  })
}

// ===================== STATISTICS =====================
export async function getSyncStats(): Promise<{
  total: number
  pending: number
  syncing: number
  completed: number
  failed: number
  conflicts: number
}> {
  const operations = await getAllOperations()
  
  return {
    total: operations.length,
    pending: operations.filter(op => op.status === SyncStatus.PENDING).length,
    syncing: operations.filter(op => op.status === SyncStatus.SYNCING).length,
    completed: operations.filter(op => op.status === SyncStatus.COMPLETED).length,
    failed: operations.filter(op => op.status === SyncStatus.FAILED).length,
    conflicts: operations.filter(op => op.status === SyncStatus.CONFLICT).length,
  }
}

// ===================== HOOK =====================
export function useOfflineSync(): {
  isOnline: boolean
  stats: ReturnType<typeof getSyncStats>
  syncNow: () => Promise<SyncResult>
  queueOperation: typeof queueOfflineOperation
  onProgress: typeof onSyncProgress
} {
  const [stats, setStats] = useState<ReturnType<typeof getSyncStats>>({
    total: 0,
    pending: 0,
    syncing: 0,
    completed: 0,
    failed: 0,
    conflicts: 0,
  })
  
  const [online, setOnline] = useState(isOnline())
  
  useEffect(() => {
    // تحميل الإحصائيات
    getSyncStats().then(setStats)
    
    // مراقبة حالة الشبكة
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // مراقبة التقدم
    const unsubscribe = onSyncProgress((data) => {
      if (data.type === 'sync_completed') {
        getSyncStats().then(setStats)
      }
    })
    
    // تحديث دوري
    const interval = setInterval(() => {
      getSyncStats().then(setStats)
    }, 5000)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
      clearInterval(interval)
    }
  }, [])
  
  return {
    isOnline: online,
    stats,
    syncNow: syncAllOperations,
    queueOperation: queueOfflineOperation,
    onProgress: onSyncProgress,
  }
}

// ===================== INITIALIZE =====================
if (typeof window !== 'undefined') {
  openDatabase().then(() => {
    console.log('[Offline] IndexedDB initialized')
    setupNetworkListeners()
  }).catch(console.error)
}

// Need to import useState and useEffect for the hook
import { useState, useEffect } from 'react'
