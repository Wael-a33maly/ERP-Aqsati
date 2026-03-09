'use client'

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  User,
  Package,
  Receipt,
  Wallet,
  CreditCard,
  FileText,
  Building2,
  ArrowRight,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

// ===================== TYPES =====================
interface SearchResult {
  type: 'customer' | 'product' | 'invoice' | 'payment' | 'contract' | 'user'
  id: string
  title: string
  subtitle: string
  link: string
  icon: string
}

interface SearchResponse {
  success: boolean
  data: SearchResult[]
  query: string
  total: number
}

// ===================== CONTEXT =====================
interface GlobalSearchContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null)

export function useGlobalSearch(): GlobalSearchContextType {
  const context = useContext(GlobalSearchContext)
  if (!context) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider')
  }
  return context
}

// ===================== ICON MAP =====================
const iconMap: Record<string, React.ReactNode> = {
  customer: <User className="h-4 w-4 text-cyan-500" />,
  user: <User className="h-4 w-4 text-pink-500" />,
  product: <Package className="h-4 w-4 text-orange-500" />,
  invoice: <Receipt className="h-4 w-4 text-emerald-500" />,
  payment: <Wallet className="h-4 w-4 text-green-500" />,
  contract: <CreditCard className="h-4 w-4 text-sky-500" />,
  file: <FileText className="h-4 w-4 text-violet-500" />,
  building: <Building2 className="h-4 w-4 text-purple-500" />,
}

// ===================== TYPE LABELS & COLORS =====================
const typeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  customer: { label: 'عميل', color: 'text-cyan-600', bgColor: 'bg-cyan-500/10' },
  product: { label: 'منتج', color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
  invoice: { label: 'فاتورة', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  payment: { label: 'دفعة', color: 'text-green-600', bgColor: 'bg-green-500/10' },
  contract: { label: 'عقد أقساط', color: 'text-sky-600', bgColor: 'bg-sky-500/10' },
  user: { label: 'مستخدم', color: 'text-pink-600', bgColor: 'bg-pink-500/10' },
}

// ===================== PROVIDER =====================
export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Still allow Ctrl+K or Cmd+K
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault()
          toggle()
        }
        return
      }

      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }

      // Slash key for quick search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        open()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, toggle])

  return (
    <GlobalSearchContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      <GlobalSearchModal />
    </GlobalSearchContext.Provider>
  )
}

// ===================== MODAL COMPONENT =====================
function GlobalSearchModal() {
  const { isOpen, close } = useGlobalSearch()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Debounced search
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      return
    }

    if (query.length < 2) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=30`)
        const data: SearchResponse = await response.json()
        
        if (data.success) {
          setResults(data.data)
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error('Search error:', error)
        toast.error('حدث خطأ في البحث')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, isOpen])

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    
    results.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = []
      }
      groups[result.type].push(result)
    })
    
    return groups
  }, [results])

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => results, [results])

  // Handle result click
  const handleSelect = (result: SearchResult) => {
    close()
    // Navigate to the result
    window.location.href = result.link
  }

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || flatResults.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % flatResults.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, flatResults, selectedIndex])

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => !open && close()}
      title="البحث السريع"
      description="ابحث في العملاء، المنتجات، الفواتير، المدفوعات، والأقساط"
      className="max-w-2xl"
      showCloseButton={false}
    >
      {/* Custom Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-l from-blue-500/5 to-purple-500/5">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">البحث السريع</span>
        </div>
        <div className="mr-auto flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
          <span className="text-xs text-muted-foreground">للإغلاق</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث عن عميل، منتج، فاتورة، دفعة، أو عقد أقساط..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </div>
      </div>

      {/* Results */}
      <CommandList className="max-h-[400px] overflow-y-auto">
        {query.length < 2 ? (
          <div className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">اكتب حرفين على الأقل للبحث</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="gap-1">
                <User className="h-3 w-3" /> عملاء
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" /> منتجات
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Receipt className="h-3 w-3" /> فواتير
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Wallet className="h-3 w-3" /> مدفوعات
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CreditCard className="h-3 w-3" /> أقساط
              </Badge>
            </div>
          </div>
        ) : !loading && flatResults.length === 0 ? (
          <CommandEmpty className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">لا توجد نتائج لـ &quot;{query}&quot;</p>
          </CommandEmpty>
        ) : (
          <div className="py-2">
            {Object.entries(groupedResults).map(([type, items], groupIndex) => (
              <div key={type}>
                {groupIndex > 0 && <CommandSeparator />}
                <CommandGroup
                  heading={
                    <div className="flex items-center gap-2">
                      {iconMap[type]}
                      <span className={typeConfig[type]?.color || ''}>
                        {typeConfig[type]?.label || type}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {items.length}
                      </Badge>
                    </div>
                  }
                  className="[&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:gap-2 [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-medium"
                >
                  {items.map((result, index) => {
                    const globalIndex = flatResults.findIndex(r => r.id === result.id)
                    const isSelected = globalIndex === selectedIndex
                    
                    return (
                      <CommandItem
                        key={result.id}
                        value={`${result.type}-${result.id}`}
                        onSelect={() => handleSelect(result)}
                        className={`
                          flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg mx-2
                          transition-all duration-150
                          ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}
                        `}
                      >
                        {/* Icon */}
                        <div className={`p-2 rounded-lg ${typeConfig[result.type]?.bgColor || 'bg-muted'}`}>
                          {iconMap[result.icon] || iconMap[result.type] || <FileText className="h-4 w-4" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                        </div>

                        {/* Type Badge */}
                        <Badge 
                          variant="outline" 
                          className={`${typeConfig[result.type]?.color} ${typeConfig[result.type]?.bgColor} border-0 text-xs`}
                        >
                          {typeConfig[result.type]?.label}
                        </Badge>

                        {/* Arrow */}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </div>
            ))}
          </div>
        )}
      </CommandList>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px]">
              ↑
            </kbd>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px]">
              ↓
            </kbd>
            <span className="mr-1">للتنقل</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px]">
              Enter
            </kbd>
            <span className="mr-1">للاختيار</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px]">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px]">
            K
          </kbd>
          <span className="mr-1">للبحث السريع</span>
        </div>
      </div>
    </CommandDialog>
  )
}

// ===================== SEARCH BUTTON COMPONENT =====================
export function GlobalSearchButton() {
  const { open } = useGlobalSearch()

  return (
    <button
      onClick={open}
      className="
        flex items-center gap-3 px-4 py-2.5 rounded-lg
        bg-muted/50 hover:bg-muted border border-border
        transition-all duration-200
        text-muted-foreground hover:text-foreground
        min-w-[280px] max-w-md
      "
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-right text-sm">البحث السريع...</span>
      <div className="flex items-center gap-1 text-xs">
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px]">
          Ctrl
        </kbd>
        <span className="text-muted-foreground">+</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px]">
          K
        </kbd>
      </div>
    </button>
  )
}

// ===================== COMPACT SEARCH BUTTON =====================
export function GlobalSearchButtonCompact() {
  const { open } = useGlobalSearch()

  return (
    <button
      onClick={open}
      className="
        flex items-center justify-center p-2 rounded-lg
        hover:bg-muted transition-colors
        text-muted-foreground hover:text-foreground
      "
      title="البحث السريع (Ctrl+K)"
    >
      <Search className="h-5 w-5" />
    </button>
  )
}

export default GlobalSearchModal
