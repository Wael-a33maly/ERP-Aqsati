// نظام اختصارات لوحة المفاتيح العالمي
// Global Keyboard Shortcuts System

'use client'

import { useEffect, useCallback, useRef } from 'react'

// ===================== TYPES =====================
type ShortcutAction = 
  | 'search' 
  | 'new' 
  | 'save' 
  | 'print' 
  | 'export'
  | 'refresh'
  | 'close'
  | 'help'
  | 'navigate.dashboard'
  | 'navigate.customers'
  | 'navigate.products'
  | 'navigate.invoices'
  | 'navigate.payments'
  | 'navigate.installments'
  | 'navigate.reports'
  | 'navigate.settings'
  | 'theme.toggle'
  | 'sidebar.toggle'
  | 'escape'
  | string

interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: ShortcutAction
  description: string
  category: string
}

interface ShortcutHandler {
  action: ShortcutAction
  handler: () => void
}

// ===================== SHORTCUTS CONFIG =====================
export const SHORTCUTS: Shortcut[] = [
  // عام
  { key: 'k', ctrl: true, action: 'search', description: 'البحث العالمي', category: 'عام' },
  { key: 'n', ctrl: true, action: 'new', description: 'إنشاء جديد', category: 'عام' },
  { key: 's', ctrl: true, action: 'save', description: 'حفظ', category: 'عام' },
  { key: 'p', ctrl: true, action: 'print', description: 'طباعة', category: 'عام' },
  { key: 'e', ctrl: true, action: 'export', description: 'تصدير', category: 'عام' },
  { key: 'r', ctrl: true, action: 'refresh', description: 'تحديث', category: 'عام' },
  { key: 'b', ctrl: true, action: 'sidebar.toggle', description: 'طي/توسيع السايدبار', category: 'عام' },
  
  // التنقل
  { key: '1', ctrl: true, action: 'navigate.dashboard', description: 'لوحة التحكم', category: 'التنقل' },
  { key: '2', ctrl: true, action: 'navigate.customers', description: 'العملاء', category: 'التنقل' },
  { key: '3', ctrl: true, action: 'navigate.products', description: 'المنتجات', category: 'التنقل' },
  { key: '4', ctrl: true, action: 'navigate.invoices', description: 'الفواتير', category: 'التنقل' },
  { key: '5', ctrl: true, action: 'navigate.payments', description: 'المدفوعات', category: 'التنقل' },
  { key: '6', ctrl: true, action: 'navigate.installments', description: 'الأقساط', category: 'التنقل' },
  { key: '7', ctrl: true, action: 'navigate.reports', description: 'التقارير', category: 'التنقل' },
  { key: '8', ctrl: true, action: 'navigate.settings', description: 'الإعدادات', category: 'التنقل' },
  
  // إضافي
  { key: 'd', ctrl: true, shift: true, action: 'theme.toggle', description: 'تبديل الوضع الداكن', category: 'إضافي' },
  { key: '/', action: 'search', description: 'البحث العالمي', category: 'عام' },
  { key: '?', shift: true, action: 'help', description: 'عرض الاختصارات', category: 'عام' },
  { key: 'Escape', action: 'escape', description: 'إغلاق/إلغاء', category: 'عام' },
]

// ===================== SHORTCUTS HOOK =====================
export function useKeyboardShortcuts(
  handlers: Partial<Record<ShortcutAction, () => void>>,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options
  const handlersRef = useRef(handlers)
  
  // تحديث المرجع عند تغيير المعالجات
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    // تجاهل إذا كان التركيز على حقل إدخال
    const target = event.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable
    
    // السماح ببعض الاختصارات حتى في حقول الإدخال
    const allowedInInput = ['escape', 'help']
    
    const matchingShortcut = SHORTCUTS.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()
      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey)
      const shiftMatch = !!shortcut.shift === event.shiftKey
      const altMatch = !!shortcut.alt === event.altKey
      
      return keyMatch && ctrlMatch && shiftMatch && altMatch
    })
    
    if (matchingShortcut) {
      // تجاهل إذا كان في حقل إدخال وليس من الاستثناءات
      if (isInput && !allowedInInput.includes(matchingShortcut.action)) {
        return
      }
      
      const handler = handlersRef.current[matchingShortcut.action]
      
      if (handler) {
        event.preventDefault()
        handler()
      }
    }
  }, [enabled])
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
  
  return { shortcuts: SHORTCUTS }
}

// ===================== SHORTCUTS DISPLAY COMPONENT =====================
export function getShortcutsByCategory(): Record<string, Shortcut[]> {
  return SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)
}

// تنسيق الاختصار للعرض
export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = []
  
  if (shortcut.ctrl) parts.push('⌃')
  if (shortcut.shift) parts.push('⇧')
  if (shortcut.alt) parts.push('⌥')
  
  // تحويل المفاتيح الخاصة
  const keyMap: Record<string, string> = {
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    ' ': 'Space',
    '/': '/',
    '?': '?',
  }
  
  parts.push(keyMap[shortcut.key] || shortcut.key.toUpperCase())
  
  return parts.join(' + ')
}

// ===================== GLOBAL SHORTCUTS PROVIDER =====================
export function createShortcutsManager() {
  const globalHandlers: Map<ShortcutAction, Set<() => void>> = new Map()
  
  return {
    register(action: ShortcutAction, handler: () => void): () => void {
      if (!globalHandlers.has(action)) {
        globalHandlers.set(action, new Set())
      }
      globalHandlers.get(action)!.add(handler)
      
      return () => {
        globalHandlers.get(action)?.delete(handler)
      }
    },
    
    execute(action: ShortcutAction): void {
      const handlers = globalHandlers.get(action)
      if (handlers) {
        handlers.forEach(handler => handler())
      }
    },
    
    getShortcuts(): Shortcut[] {
      return SHORTCUTS
    }
  }
}

// إنشاء مدير عام
export const shortcutsManager = createShortcutsManager()
