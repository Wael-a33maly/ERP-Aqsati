'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Plus,
  Save,
  Printer,
  Download,
  PanelRightClose,
  Moon,
  Home,
  FileText,
  Users,
  Package,
  Settings,
  BarChart3,
  Receipt,
  Wallet,
  ArrowRight,
  Keyboard,
} from 'lucide-react'

// تعريف نوع الاختصار
interface Shortcut {
  keys: string[]
  description: string
  icon?: React.ReactNode
  action?: () => void
}

// تعريف نوع الفئة
interface ShortcutCategory {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  bgColor: string
  shortcuts: Shortcut[]
}

// مكون عرض مفتاح واحد
function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge 
      variant="outline" 
      className="px-2 py-1 font-mono text-xs bg-gradient-to-b from-muted/50 to-muted border-border shadow-sm min-w-[28px] justify-center"
    >
      {children}
    </Badge>
  )
}

// مكون عرض مجموعة مفاتيح
function KeysDisplay({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1 flex-row-reverse">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center gap-1 flex-row-reverse">
          <KeyBadge>{key}</KeyBadge>
          {index < keys.length - 1 && (
            <span className="text-muted-foreground text-xs mx-0.5">+</span>
          )}
        </span>
      ))}
    </div>
  )
}

// مكون بطاقة الاختصار
function ShortcutCard({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-3">
        {shortcut.icon && (
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            {shortcut.icon}
          </div>
        )}
        <span className="text-sm font-medium text-right">{shortcut.description}</span>
      </div>
      <KeysDisplay keys={shortcut.keys} />
    </div>
  )
}

// مكون فئة الاختصارات
function CategorySection({ category }: { category: ShortcutCategory }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
        <div className={`h-8 w-8 rounded-lg ${category.bgColor} flex items-center justify-center`}>
          {category.icon}
        </div>
        <h3 className="font-semibold text-base">{category.title}</h3>
        <Badge variant="secondary" className="text-xs">
          {category.shortcuts.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {category.shortcuts.map((shortcut, index) => (
          <ShortcutCard key={index} shortcut={shortcut} />
        ))}
      </div>
    </div>
  )
}

// الاختصارات المتاحة
const shortcutCategories: ShortcutCategory[] = [
  {
    id: 'general',
    title: 'عام',
    icon: <Settings className="h-4 w-4 text-primary" />,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    shortcuts: [
      {
        keys: ['Ctrl', 'K'],
        description: 'البحث العالمي',
        icon: <Search className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', 'N'],
        description: 'إنشاء جديد',
        icon: <Plus className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', 'S'],
        description: 'حفظ',
        icon: <Save className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', 'P'],
        description: 'طباعة',
        icon: <Printer className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', 'E'],
        description: 'تصدير',
        icon: <Download className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'navigation',
    title: 'التنقل',
    icon: <ArrowRight className="h-4 w-4 text-emerald-500" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    shortcuts: [
      {
        keys: ['Ctrl', '1'],
        description: 'لوحة التحكم',
        icon: <Home className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', '2'],
        description: 'الفواتير',
        icon: <Receipt className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', '3'],
        description: 'المدفوعات',
        icon: <Wallet className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', '4'],
        description: 'العملاء',
        icon: <Users className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', '5'],
        description: 'المنتجات',
        icon: <Package className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', '6'],
        description: 'التقارير',
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', '7'],
        description: 'الإعدادات',
        icon: <Settings className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', '8'],
        description: 'الملفات',
        icon: <FileText className="h-4 w-4" />,
      },
    ],
  },
  {
    id: 'extra',
    title: 'إضافي',
    icon: <Moon className="h-4 w-4 text-violet-500" />,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    shortcuts: [
      {
        keys: ['Ctrl', 'B'],
        description: 'طي السايدبار',
        icon: <PanelRightClose className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', 'Shift', 'D'],
        description: 'تبديل الوضع الداكن',
        icon: <Moon className="h-4 w-4" />,
      },
      {
        keys: ['Ctrl', '/'],
        description: 'عرض الاختصارات',
        icon: <Keyboard className="h-4 w-4" />,
      },
      {
        keys: ['Shift', '?'],
        description: 'عرض الاختصارات',
        icon: <Keyboard className="h-4 w-4" />,
      },
      {
        keys: ['Esc'],
        description: 'إغلاق النافذة',
        icon: null,
      },
    ],
  },
]

// المكون الرئيسي
interface KeyboardShortcutsHelpProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function KeyboardShortcutsHelp({ 
  open: controlledOpen, 
  onOpenChange: setControlledOpen 
}: KeyboardShortcutsHelpProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // استخدام القيمة المتحكم بها أو الداخلية
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = setControlledOpen || setInternalOpen

  // معالج الضغط على المفاتيح
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // التحقق من الضغط على Ctrl+? أو Shift+?
    // ملاحظة: علامة ? تُكتب بضغط Shift+/ على معظم لوحات المفاتيح
    const isCtrlQuestion = event.ctrlKey && event.shiftKey && event.key === '/'
    const isShiftQuestion = event.shiftKey && event.key === '?'
    const isCtrlSlash = event.ctrlKey && event.key === '/'
    
    // فتح النافذة
    if (isCtrlQuestion || isShiftQuestion || isCtrlSlash) {
      // التحقق من عدم التركيز على حقل إدخال
      const activeElement = document.activeElement
      const isInputFocused = activeElement instanceof HTMLInputElement || 
                            activeElement instanceof HTMLTextAreaElement ||
                            activeElement?.getAttribute('contenteditable') === 'true'
      
      if (!isInputFocused) {
        event.preventDefault()
        setIsOpen(!isOpen)
      }
    }
    
    // إغلاق النافذة بـ Escape
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false)
    }
  }, [isOpen, setIsOpen])

  // إضافة مستمع الأحداث
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // إحصائيات الاختصارات
  const totalShortcuts = shortcutCategories.reduce(
    (sum, cat) => sum + cat.shortcuts.length, 
    0
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        {/* الترويسة */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-l from-primary/5 via-primary/3 to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Keyboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">اختصارات لوحة المفاتيح</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                استخدم الاختصارات للتنقل السريع وتنفيذ الإجراءات
              </DialogDescription>
            </div>
          </div>
          
          {/* شريط الإحصائيات */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {totalShortcuts} اختصار
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
              <span className="text-muted-foreground text-xs">
                اضغط <KeyBadge>Ctrl</KeyBadge> + <KeyBadge>?</KeyBadge> للفتح
              </span>
            </Badge>
          </div>
        </DialogHeader>

        {/* محتوى الاختصارات */}
        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-8">
            {shortcutCategories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </div>
        </ScrollArea>

        {/* التذييل */}
        <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            اختصارات لوحة المفاتيح تساعدك على العمل بسرعة أكبر
          </p>
          <Badge variant="outline" className="text-xs">
            <span className="text-muted-foreground ml-1">للإغلاق:</span>
            <KeyBadge>Esc</KeyBadge>
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook لاستخدام الاختصارات في المكونات الأخرى
export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  const openShortcuts = useCallback(() => setIsOpen(true), [])
  const closeShortcuts = useCallback(() => setIsOpen(false), [])
  const toggleShortcuts = useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    setIsOpen,
    openShortcuts,
    closeShortcuts,
    toggleShortcuts,
    KeyboardShortcutsHelp: () => (
      <KeyboardShortcutsHelp open={isOpen} onOpenChange={setIsOpen} />
    ),
  }
}

// مكون زر عرض الاختصارات
export function KeyboardShortcutsButton({ 
  onClick 
}: { 
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
      title="عرض الاختصارات (Ctrl+?)"
    >
      <Keyboard className="h-4 w-4" />
      <span className="hidden sm:inline">الاختصارات</span>
      <div className="hidden md:flex items-center gap-0.5 mr-1">
        <KeyBadge>Ctrl</KeyBadge>
        <span className="text-muted-foreground text-xs">+</span>
        <KeyBadge>?</KeyBadge>
      </div>
    </button>
  )
}

export default KeyboardShortcutsHelp
