// نظام اختصارات لوحة المفاتيح
// Keyboard Shortcuts System

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
  category?: string
}

class KeyboardShortcutsManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this))
    }
  }

  // تسجيل اختصار جديد
  register(shortcut: KeyboardShortcut): void {
    const key = this.buildKey(shortcut)
    this.shortcuts.set(key, shortcut)
  }

  // إلغاء تسجيل اختصار
  unregister(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean): void {
    const keyString = this.buildKey({ key, ctrl, shift, alt } as KeyboardShortcut)
    this.shortcuts.delete(keyString)
  }

  // تفعيل/تعطيل الاختصارات
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  // الحصول على جميع الاختصارات
  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  // الحصول على الاختصارات حسب الفئة
  getByCategory(category: string): KeyboardShortcut[] {
    return this.getAll().filter(s => s.category === category)
  }

  // معالجة ضغط المفاتيح
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return

    // تجاهل إذا كان المستخدم يكتب في حقل إدخال
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // السماح ببعض الاختصارات في حقول الإدخال
      if (!event.ctrlKey && !event.metaKey) return
    }

    const key = this.buildKeyFromEvent(event)
    const shortcut = this.shortcuts.get(key)

    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }
  }

  // بناء مفتاح التخزين
  private buildKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.alt) parts.push('alt')
    parts.push(shortcut.key.toLowerCase())
    return parts.join('+')
  }

  // بناء مفتاح من حدث لوحة المفاتيح
  private buildKeyFromEvent(event: KeyboardEvent): string {
    const parts: string[] = []
    if (event.ctrlKey || event.metaKey) parts.push('ctrl')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')
    parts.push(event.key.toLowerCase())
    return parts.join('+')
  }
}

// إنشاء نسخة واحدة
export const keyboardShortcuts = new KeyboardShortcutsManager()

// فئات الاختصارات
export const ShortcutCategories = {
  NAVIGATION: 'التنقل',
  ACTIONS: 'الإجراءات',
  SEARCH: 'البحث',
  FORMS: 'النماذج',
  SYSTEM: 'النظام',
} as const

// الاختصارات الافتراضية
export const DefaultShortcuts: KeyboardShortcut[] = [
  // التنقل
  {
    key: '1',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' })),
    description: 'لوحة التحكم',
    category: ShortcutCategories.NAVIGATION,
  },
  {
    key: '2',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'customers' })),
    description: 'العملاء',
    category: ShortcutCategories.NAVIGATION,
  },
  {
    key: '3',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'products' })),
    description: 'المنتجات',
    category: ShortcutCategories.NAVIGATION,
  },
  {
    key: '4',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'invoices' })),
    description: 'الفواتير',
    category: ShortcutCategories.NAVIGATION,
  },
  {
    key: '5',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'payments' })),
    description: 'المدفوعات',
    category: ShortcutCategories.NAVIGATION,
  },
  {
    key: '6',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 'installments' })),
    description: 'الأقساط',
    category: ShortcutCategories.NAVIGATION,
  },

  // البحث
  {
    key: 'k',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('open-search')),
    description: 'فتح البحث الموحد',
    category: ShortcutCategories.SEARCH,
  },
  {
    key: '/',
    action: () => window.dispatchEvent(new CustomEvent('open-search')),
    description: 'فتح البحث الموحد',
    category: ShortcutCategories.SEARCH,
  },

  // الإجراءات
  {
    key: 'n',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('new-item')),
    description: 'عنصر جديد',
    category: ShortcutCategories.ACTIONS,
  },
  {
    key: 's',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('save')),
    description: 'حفظ',
    category: ShortcutCategories.ACTIONS,
  },
  {
    key: 'p',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('print')),
    description: 'طباعة',
    category: ShortcutCategories.ACTIONS,
  },
  {
    key: 'e',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('export')),
    description: 'تصدير',
    category: ShortcutCategories.ACTIONS,
  },

  // النظام
  {
    key: 'd',
    ctrl: true,
    shift: true,
    action: () => window.dispatchEvent(new CustomEvent('toggle-dark')),
    description: 'تبديل الوضع الداكن',
    category: ShortcutCategories.SYSTEM,
  },
  {
    key: '?',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('show-shortcuts')),
    description: 'عرض الاختصارات',
    category: ShortcutCategories.SYSTEM,
  },

  // النماذج
  {
    key: 'Enter',
    ctrl: true,
    action: () => window.dispatchEvent(new CustomEvent('submit-form')),
    description: 'إرسال النموذج',
    category: ShortcutCategories.FORMS,
  },
  {
    key: 'Escape',
    action: () => window.dispatchEvent(new CustomEvent('close-dialog')),
    description: 'إغلاق الحوار',
    category: ShortcutCategories.FORMS,
  },
]

// تسجيل الاختصارات الافتراضية
DefaultShortcuts.forEach(shortcut => {
  keyboardShortcuts.register(shortcut)
})

// Hook للاستخدام في React
export function useKeyboardShortcut(
  key: string,
  action: () => void,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean; enabled?: boolean } = {}
): void {
  if (typeof window !== 'undefined' && options.enabled !== false) {
    keyboardShortcuts.register({
      key,
      ctrl: options.ctrl,
      shift: options.shift,
      alt: options.alt,
      action,
      description: '',
    })
  }
}

// مكون لعرض الاختصارات
export function getShortcutsHelp(): { category: string; shortcuts: { keys: string; description: string }[] }[] {
  const categories = new Map<string, { keys: string; description: string }[]>()

  keyboardShortcuts.getAll().forEach(shortcut => {
    const category = shortcut.category || 'أخرى'
    if (!categories.has(category)) {
      categories.set(category, [])
    }

    const keys: string[] = []
    if (shortcut.ctrl) keys.push('Ctrl')
    if (shortcut.shift) keys.push('Shift')
    if (shortcut.alt) keys.push('Alt')
    keys.push(shortcut.key.toUpperCase())

    categories.get(category)!.push({
      keys: keys.join(' + '),
      description: shortcut.description,
    })
  })

  return Array.from(categories.entries()).map(([category, shortcuts]) => ({
    category,
    shortcuts,
  }))
}
