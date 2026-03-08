'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Building2, Users, Package, UserCheck, Plus, Search, Loader2, Menu, Moon, Sun,
  LayoutDashboard, Settings, X, RefreshCw, Home, DollarSign, Receipt, Wallet,
  CreditCard, RotateCcw, BarChart3, Printer, Percent, MapPin, Warehouse,
  ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Palette, Shield, Database, Globe, HelpCircle,
  Download, FileText, Layers, TrendingUp, Bell, Check, AlertTriangle, Info, CheckCircle, LogOut, Save, Trash2,
  BellRing, XCircle, AlertCircle, Clock, Upload, Gift, PanelRightClose, PanelRightOpen, Layout, Percent as CommissionIcon,
  Users as UsersIcon, FileStack, Eye, Calendar, User, Building, LayoutTemplate, Key, Link, MessageCircle, Send, Copy,
  TruckIcon, FileInput, ArrowLeftRight, Mail, Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { authApi } from '@/lib/api-client'
import ReceiptTemplateBuilder from '@/components/receipt-template-builder'
import { predefinedTemplates } from '@/lib/receipt-templates'
import { KeyboardShortcutsHelp } from '@/components/shared/keyboard-shortcuts-help'
import { GlobalSearchProvider, GlobalSearchButton } from '@/components/shared/global-search-modal'
import EgyptianPaymentMethods from '@/components/payments/egyptian-payment-methods'
import TwoFactorSettings from '@/components/settings/two-factor-settings'
import PaymentGatewaySettings from '@/components/settings/payment-gateway-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ExportButton } from '@/components/shared/export-button'
import SubscriptionPlansManagement from '@/components/admin/subscription-plans-management'
import SuppliersManagement from '@/components/procurement/suppliers-management'
import PurchaseInvoicesManagement from '@/components/procurement/purchase-invoices-management'
import PurchaseReturnsManagement from '@/components/procurement/purchase-returns-management'
import InventoryTransfersManagement from '@/components/procurement/inventory-transfers-management'
import InventoryReportsPage from '@/components/procurement/inventory-reports-page'
import SuperAdminDashboard from '@/components/super-admin/super-admin-dashboard'
import ImpersonationBanner from '@/components/impersonation-banner'

// ============== TYPES ==============
type UserType = { id: string; email: string; name: string; role: string }

type NotificationType = 'info' | 'success' | 'warning' | 'error'

interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: Date
  link?: string
}

// ============== NOTIFICATIONS HOOK ==============
function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    // إشعارات تجريبية
    { id: '1', title: 'فاتورة جديدة', message: 'تم إنشاء فاتورة رقم INV-0001 بنجاح', type: 'success', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 5) },
    { id: '2', title: 'تنبيه المخزون', message: 'المنتج "لابتوب HP" وصل للحد الأدنى', type: 'warning', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30) },
    { id: '3', title: 'دفعة مستحقة', message: 'يوجد 3 فواتير متأخرة السداد', type: 'error', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60) },
    { id: '4', title: 'مستخدم جديد', message: 'تم إضافة مستخدم جديد "أحمد محمد"', type: 'info', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: '5', title: 'تقرير جاهز', message: 'تقرير المبيعات الشهري جاهز للتحميل', type: 'success', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date()
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addNotification
  }
}

// ============== NOTIFICATION ICON COMPONENT ==============
function NotificationIcon({ type }: { type: NotificationType }) {
  const icons = {
    info: <Info className="h-4 w-4 text-blue-500" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />
  }
  return icons[type]
}

// ============== TIME AGO COMPONENT ==============
function TimeAgo({ date }: { date: Date }) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return <span className="text-xs text-muted-foreground">الآن</span>
  if (minutes < 60) return <span className="text-xs text-muted-foreground">منذ {minutes} دقيقة</span>
  if (hours < 24) return <span className="text-xs text-muted-foreground">منذ {hours} ساعة</span>
  return <span className="text-xs text-muted-foreground">منذ {days} يوم</span>
}

// ============== NOTIFICATIONS DROPDOWN ==============
function NotificationsDropdown({ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll }: {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-muted/50 relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-l from-blue-500/5 to-purple-500/5">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">الإشعارات</h3>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-1.5">{unreadCount} جديدة</Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>
                  قراءة الكل
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600" onClick={clearAll}>
                مسح
              </Button>
            </div>
          )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 opacity-30 mb-2" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        notification.type === 'info' ? 'bg-blue-500/10' :
                        notification.type === 'success' ? 'bg-green-500/10' :
                        notification.type === 'warning' ? 'bg-amber-500/10' :
                        'bg-red-500/10'
                      }`}>
                        <NotificationIcon type={notification.type} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>{notification.title}</p>
                        <button 
                          className="flex-shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <TimeAgo date={notification.createdAt} />
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/30">
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setOpen(false)}>
              عرض كل الإشعارات
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ============== HELPER: توليد كود تلقائي ==============
function generateCode(prefix: string, existingCodes: string[]): string {
  let num = 1
  let code = `${prefix}-${String(num).padStart(4, '0')}`
  while (existingCodes.includes(code)) {
    num++
    code = `${prefix}-${String(num).padStart(4, '0')}`
  }
  return code
}

// ============== HELPER: العملة ==============
const defaultCurrencies = [
  { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س' },
  { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ' },
  { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م' },
  { code: 'USD', name: 'دولار أمريكي', symbol: '$' },
  { code: 'EUR', name: 'يورو', symbol: '€' },
  { code: 'KWD', name: 'دينار كويتي', symbol: 'د.ك' },
  { code: 'QAR', name: 'ريال قطري', symbol: 'ر.ق' },
  { code: 'BHD', name: 'دينار بحريني', symbol: 'د.ب' },
]

function useCurrency() {
  const [currency, setCurrency] = useState({ code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' })
  
  useEffect(() => {
    const loadCurrency = () => {
      const savedSettings = localStorage.getItem('erp_settings')
      const savedCurrencies = localStorage.getItem('erp_custom_currencies')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        const allCurrencies = [...defaultCurrencies, ...(savedCurrencies ? JSON.parse(savedCurrencies) : [])]
        const curr = allCurrencies.find((c: any) => c.code === settings.currency) || defaultCurrencies[0]
        setCurrency(curr)
      }
    }
    loadCurrency()
    
    window.addEventListener('storage', loadCurrency)
    const interval = setInterval(loadCurrency, 1000)
    
    return () => {
      window.removeEventListener('storage', loadCurrency)
      clearInterval(interval)
    }
  }, [])
  
  return currency
}

function formatCurrency(amount: number, symbol: string): string {
  return `${amount.toLocaleString()} ${symbol}`
}

// ============== DATE FORMAT ==============
const dateFormats = [
  { id: 'ar-SA-short', label: 'عربي - مختصر (١٥/٠١/٢٠٢٥)', locale: 'ar-SA', options: { year: 'numeric', month: '2-digit', day: '2-digit' } as Intl.DateTimeFormatOptions },
  { id: 'ar-SA-long', label: 'عربي - مفصل (١٥ يناير ٢٠٢٥)', locale: 'ar-SA', options: { year: 'numeric', month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions },
  { id: 'en-US-short', label: 'English - Short (01/15/2025)', locale: 'en-US', options: { year: 'numeric', month: '2-digit', day: '2-digit' } as Intl.DateTimeFormatOptions },
  { id: 'en-US-long', label: 'English - Long (January 15, 2025)', locale: 'en-US', options: { year: 'numeric', month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions },
  { id: 'en-GB-short', label: 'English UK - Short (15/01/2025)', locale: 'en-GB', options: { year: 'numeric', month: '2-digit', day: '2-digit' } as Intl.DateTimeFormatOptions },
  { id: 'en-GB-long', label: 'English UK - Long (15 January 2025)', locale: 'en-GB', options: { year: 'numeric', month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions },
  { id: 'ISO', label: 'ISO (2025-01-15)', locale: 'en-CA', options: { year: 'numeric', month: '2-digit', day: '2-digit' } as Intl.DateTimeFormatOptions },
  { id: 'custom-dash', label: 'مخصص - شرطات (2025-01-15)', locale: 'sv-SE', options: { year: 'numeric', month: '2-digit', day: '2-digit' } as Intl.DateTimeFormatOptions },
]

function useDateFormat() {
  const [dateFormat, setDateFormat] = useState(dateFormats[0])

  useEffect(() => {
    const loadDateFormat = () => {
      const savedSettings = localStorage.getItem('erp_settings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        const format = dateFormats.find(f => f.id === settings.dateFormat) || dateFormats[0]
        setDateFormat(format)
      }
    }
    loadDateFormat()

    window.addEventListener('storage', loadDateFormat)
    const interval = setInterval(loadDateFormat, 1000)

    return () => {
      window.removeEventListener('storage', loadDateFormat)
      clearInterval(interval)
    }
  }, [])

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString(dateFormat.locale, dateFormat.options)
  }

  const formatDateTime = (date: Date | string | null | undefined): string => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString(dateFormat.locale, { ...dateFormat.options, hour: '2-digit', minute: '2-digit' })
  }

  return { dateFormat, formatDate, formatDateTime, dateFormats }
}

// ============== NAV GROUPS ==============
const navGroups = [
  { id: 'main', title: 'الرئيسية', items: [{ id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, color: 'text-blue-500', bgColor: 'bg-blue-500/10' }] },
  { id: 'subscription', title: 'إدارة الاشتراكات', superAdminOnly: true, items: [
    { id: 'subscription-plans', label: 'الخطط والأسعار', icon: CreditCard, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { id: 'subscription-users', label: 'المشتركين', icon: Users, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    { id: 'subscription-payments', label: 'المدفوعات', icon: Wallet, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  ]},
  { id: 'organization', title: 'إدارة المؤسسة', items: [
    { id: 'companies', label: 'الشركات', icon: Building2, color: 'text-purple-500', bgColor: 'bg-purple-500/10', superAdminOnly: true },
    { id: 'branches', label: 'الفروع', icon: Home, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
    { id: 'users', label: 'المستخدمين', icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  ]},
  { id: 'sales', title: 'إضافات وتعريفات', items: [
    { id: 'customers', label: 'العملاء', icon: UserCheck, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    { id: 'zones', label: 'المناطق', icon: MapPin, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
    { id: 'categories', label: 'التصنيفات', icon: Package, color: 'text-lime-500', bgColor: 'bg-lime-500/10' },
    { id: 'products', label: 'المنتجات', icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { id: 'warehouses', label: 'المخازن', icon: Warehouse, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  ]},
  { id: 'finance', title: 'المالية', items: [
    { id: 'invoices', label: 'الفواتير', icon: Receipt, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { id: 'payments', label: 'المدفوعات', icon: Wallet, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { id: 'installments', label: 'الأقساط', icon: CreditCard, color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
    { id: 'collections', label: 'المقبوضات', icon: DollarSign, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
    { id: 'returns', label: 'المرتجعات', icon: RotateCcw, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
  ]},
  { id: 'procurement', title: 'المشتريات والمخازن', items: [
    { id: 'suppliers', label: 'الموردين', icon: TruckIcon, color: 'text-blue-600', bgColor: 'bg-blue-600/10' },
    { id: 'purchase-invoices', label: 'فواتير المشتريات', icon: FileInput, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
    { id: 'purchase-returns', label: 'مرتجعات المشتريات', icon: RotateCcw, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { id: 'inventory-transfers', label: 'التحويلات', icon: ArrowLeftRight, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { id: 'inventory-reports', label: 'تقارير المخازن', icon: BarChart3, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
  ]},
  { id: 'reports', title: 'التقارير والإعدادات', items: [
    { id: 'commissions', label: 'العمولات', icon: Percent, color: 'text-fuchsia-500', bgColor: 'bg-fuchsia-500/10' },
    { id: 'reports', label: 'التقارير', icon: BarChart3, color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
    { id: 'data-management', label: 'إدارة البيانات', icon: Database, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { id: 'receipt-templates', label: 'تصميم الإيصالات', icon: Layout, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
    { id: 'receipts-print', label: 'طباعة الإيصالات', icon: Printer, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  ]},
]

// ============== AUTH HOOK ==============
function useAuth() {
  const [user, setUserState] = useState<UserType | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('erp_user')
    if (stored) {
      try { 
        setUserState(JSON.parse(stored)) 
      } catch { 
        localStorage.removeItem('erp_user')
      }
    }
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setUser = (newUser: UserType | null) => {
    if (newUser) localStorage.setItem('erp_user', JSON.stringify(newUser))
    else localStorage.removeItem('erp_user')
    setUserState(newUser)
  }
  const logout = () => { localStorage.removeItem('erp_user'); setUserState(null) }

  return { user, setUser, logout, mounted }
}

// ============== STAT CARD ==============
function StatCard({ title, value, change, changeType, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-card rounded-xl border p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change && <div className="flex items-center gap-1 text-xs">{changeType === 'up' ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}<span className={changeType === 'up' ? 'text-green-500' : 'text-red-500'}>{change}</span></div>}
        </div>
        <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center`}><Icon className={`h-6 w-6 ${color}`} /></div>
      </div>
    </div>
  )
}

// ============== EGYPTIAN DATE TIME COMPONENT ==============
function EgyptianDateTime() {
  const [dateTime, setDateTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // تحويل التوقيت لمصر (UTC+2)
  const egyptTime = new Date(dateTime.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }))
  
  // تنسيق التاريخ بالعربية
  const formatDateArabic = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    return date.toLocaleDateString('ar-EG', options)
  }

  // تنسيق الوقت
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-l from-blue-500 to-cyan-500 flex items-center justify-center">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{formatDateArabic(egyptTime)}</p>
          <p className="text-xs text-muted-foreground">جمهورية مصر العربية 🇪🇬</p>
        </div>
      </div>
      <div className="h-8 w-px bg-border hidden sm:block" />
      <div className="flex items-center gap-2 hidden sm:flex">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-l from-purple-500 to-pink-500 flex items-center justify-center">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground" dir="ltr">{formatTime(egyptTime)}</p>
          <p className="text-xs text-muted-foreground">توقيت القاهرة</p>
        </div>
      </div>
    </div>
  )
}

// ============== CONNECTION STATUS COMPONENT ==============
function ConnectionStatus() {
  // استخدام حالة أولية من navigator.onLine
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine
    }
    return true
  })
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        toast.success('تم استعادة الاتصال بالإنترنت')
      }
      setWasOffline(false)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      toast.error('تم فقدان الاتصال بالإنترنت')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
      isOnline 
        ? 'bg-green-500/10 border border-green-500/20' 
        : 'bg-red-500/10 border border-red-500/20'
    }`}>
      <div className={`relative flex items-center justify-center ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
        {isOnline ? (
          <>
            <Globe className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full animate-ping" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full" />
          </>
        ) : (
          <XCircle className="h-5 w-5" />
        )}
      </div>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isOnline ? 'متصل بالإنترنت' : 'غير متصل'}
        </span>
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'النظام يعمل أونلاين' : 'وضع عدم الاتصال'}
        </span>
      </div>
    </div>
  )
}

// ============== DASHBOARD ==============
function Dashboard({ user, onNavigate }: { user: UserType; onNavigate: (view: string) => void }) {
  const [stats, setStats] = useState({ 
    users: 0, companies: 0, customers: 0, products: 0, invoices: 0, payments: 0, 
    totalSales: 0, totalPaid: 0, pendingAmount: 0, branches: 0, zones: 0, warehouses: 0 
  })
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const currency = useCurrency()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // استخدام API موحد لجلب جميع الإحصائيات في طلب واحد
        const response = await fetch('/api/dashboard/stats')
        const result = await response.json()
        
        if (result.success) {
          setStats(result.data.stats)
          setRecentInvoices(result.data.recentInvoices)
          setRecentPayments(result.data.recentPayments)
        }
      } catch (e) {
        console.error('Failed to fetch stats', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const collectionRate = stats.totalSales > 0 ? Math.round((stats.totalPaid / stats.totalSales) * 100) : 0

  const allStatCards = [
    { title: 'الشركات', value: stats.companies, icon: Building2, color: 'text-purple-500', bgColor: 'bg-purple-500/10', view: 'companies', superAdminOnly: true },
    { title: 'الفروع', value: stats.branches, icon: Home, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10', view: 'branches' },
    { title: 'المستخدمين', value: stats.users, icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-500/10', view: 'users' },
    { title: 'العملاء', value: stats.customers, icon: UserCheck, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', view: 'customers' },
    { title: 'المنتجات', value: stats.products, icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-500/10', view: 'products' },
    { title: 'الفواتير', value: stats.invoices, icon: Receipt, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', view: 'invoices' },
  ]
  
  // تصفية الكروت - إخفاء الشركات لغير مدير النظام
  const statCards = allStatCards.filter(card => 
    !card.superAdminOnly || user.role === 'SUPER_ADMIN'
  )
  
  const quickActions = [
    { label: 'فرع جديد', view: 'branches', color: 'from-indigo-500 to-indigo-600', icon: Home },
    { label: 'مستخدم جديد', view: 'users', color: 'from-pink-500 to-pink-600', icon: Users },
    { label: 'عميل جديد', view: 'customers', color: 'from-cyan-500 to-cyan-600', icon: UserCheck },
    { label: 'منتج جديد', view: 'products', color: 'from-orange-500 to-orange-600', icon: Package },
    { label: 'فاتورة جديدة', view: 'invoices', color: 'from-emerald-500 to-emerald-600', icon: Receipt },
  ]

  // إضافة "شركة جديدة" فقط لمدير النظام
  const superAdminActions = { label: 'شركة جديدة', view: 'companies', color: 'from-purple-500 to-purple-600', icon: Building2 }
  const allQuickActions = user.role === 'SUPER_ADMIN' ? [superAdminActions, ...quickActions] : quickActions

  const statusColors: any = { pending: 'bg-yellow-500/10 text-yellow-600', paid: 'bg-green-500/10 text-green-600', partial: 'bg-blue-500/10 text-blue-600', cancelled: 'bg-red-500/10 text-red-600' }
  const statusLabels: any = { pending: 'معلقة', paid: 'مدفوعة', partial: 'جزئية', cancelled: 'ملغاة' }

  return (
    <div className="space-y-6">
      {/* شريط التاريخ والوقت وحالة الاتصال */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-l from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border">
        <EgyptianDateTime />
        <ConnectionStatus />
      </div>
      
      {/* ترحيب بالمستخدم */}
      <div className="bg-gradient-to-l from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">مرحباً، {user.name}! 👋</h1>
            <p className="text-muted-foreground mt-1">نظام ERP للمؤسسات - إدارة شاملة لجميع عملياتك</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 ml-2" />تحديث
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {/* Skeleton للإحصائيات المالية */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-xl border p-5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-8 w-32 bg-muted rounded" />
                  </div>
                  <div className="h-14 w-14 bg-muted rounded-xl" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Skeleton لشريط التقدم */}
          <div className="bg-card rounded-xl border p-4 animate-pulse">
            <div className="h-4 w-48 bg-muted rounded mb-2" />
            <div className="h-3 w-full bg-muted rounded-full" />
          </div>
          
          {/* Skeleton لبطاقات الإحصائيات */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-xl border p-4 animate-pulse">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 bg-muted rounded-xl" />
                  <div className="h-6 w-12 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Skeleton للإجراءات السريعة */}
          <div className="bg-card rounded-xl p-6 border animate-pulse">
            <div className="h-6 w-32 bg-muted rounded mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* إحصائيات مالية رئيسية */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-l from-emerald-500/10 to-green-500/10 rounded-xl border p-5 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">إجمالي المبيعات</p><p className="text-3xl font-bold text-emerald-600">{formatCurrency(stats.totalSales, currency.symbol)}</p></div>
                <div className="h-14 w-14 rounded-xl bg-emerald-500/20 flex items-center justify-center"><DollarSign className="h-7 w-7 text-emerald-500" /></div>
              </div>
            </div>
            <div className="bg-gradient-to-l from-green-500/10 to-teal-500/10 rounded-xl border p-5 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">إجمالي المحصل</p><p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalPaid, currency.symbol)}</p></div>
                <div className="h-14 w-14 rounded-xl bg-green-500/20 flex items-center justify-center"><Wallet className="h-7 w-7 text-green-500" /></div>
              </div>
            </div>
            <div className="bg-gradient-to-l from-amber-500/10 to-orange-500/10 rounded-xl border p-5 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">المستحقات المعلقة</p><p className="text-3xl font-bold text-amber-600">{formatCurrency(stats.pendingAmount, currency.symbol)}</p></div>
                <div className="h-14 w-14 rounded-xl bg-amber-500/20 flex items-center justify-center"><Receipt className="h-7 w-7 text-amber-500" /></div>
              </div>
            </div>
            <div className="bg-gradient-to-l from-blue-500/10 to-indigo-500/10 rounded-xl border p-5 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">نسبة التحصيل</p><p className="text-3xl font-bold text-blue-600">{collectionRate}%</p></div>
                <div className="h-14 w-14 rounded-xl bg-blue-500/20 flex items-center justify-center"><TrendingUp className="h-7 w-7 text-blue-500" /></div>
              </div>
            </div>
          </div>

          {/* شريط التقدم للتحصيل */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">نسبة التحصيل من المبيعات</span>
                <span className="text-sm font-bold text-green-600">{collectionRate}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-l from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>المحصل: {formatCurrency(stats.totalPaid, currency.symbol)}</span>
                <span>المبيعات: {formatCurrency(stats.totalSales, currency.symbol)}</span>
              </div>
            </CardContent>
          </Card>

          {/* بطاقات الإحصائيات */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {statCards.map((stat, i) => (
              <div key={i} className="bg-card rounded-xl border p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={() => onNavigate(stat.view)}>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* إجراءات سريعة */}
          <div className="bg-gradient-to-l from-blue-500/10 to-purple-500/10 rounded-xl p-6 border">
            <h2 className="text-lg font-semibold mb-4">إجراءات سريعة</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {allQuickActions.map((action, i) => (
                <Button key={i} className={`bg-gradient-to-l ${action.color} h-auto py-3 flex-col gap-1`} onClick={() => onNavigate(action.view)}>
                  <action.icon className="h-5 w-5" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* آخر الفواتير والمدفوعات */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-500" />
                  آخر الفواتير
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentInvoices.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">لا توجد فواتير</p>
                    <Button size="sm" className="mt-2" onClick={() => onNavigate('invoices')}><Plus className="h-4 w-4 ml-1" />فاتورة جديدة</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentInvoices.slice(0, 5).map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => onNavigate('invoices')}>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Receipt className="h-4 w-4 text-emerald-500" /></div>
                          <div><p className="text-sm font-medium">{inv.invoiceNumber}</p><p className="text-xs text-muted-foreground">{inv.customer?.name || 'غير محدد'}</p></div>
                        </div>
                        <div className="text-left"><p className="text-sm font-medium">{formatCurrency(inv.total, currency.symbol)}</p><Badge className={statusColors[inv.status] || statusColors.pending}>{statusLabels[inv.status] || inv.status}</Badge></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-500" />
                  آخر المدفوعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPayments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">لا توجد مدفوعات</p>
                    <Button size="sm" className="mt-2" onClick={() => onNavigate('payments')}><Plus className="h-4 w-4 ml-1" />تسجيل دفعة</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentPayments.slice(0, 5).map((pay: any) => (
                      <div key={pay.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => onNavigate('payments')}>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center"><Wallet className="h-4 w-4 text-green-500" /></div>
                          <div><p className="text-sm font-medium">{pay.paymentNumber}</p><p className="text-xs text-muted-foreground">{pay.customer?.name || 'غير محدد'}</p></div>
                        </div>
                        <div className="text-left"><p className="text-sm font-medium text-green-600">{formatCurrency(pay.amount, currency.symbol)}</p><p className="text-xs text-muted-foreground">{pay.method || 'نقدي'}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ملخص الأداء */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-500" />
                ملخص الأداء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 rounded-xl bg-gradient-to-l from-emerald-500/10 to-green-500/10 border">
                  <p className="text-3xl font-bold text-emerald-600">{stats.invoices}</p>
                  <p className="text-sm text-muted-foreground mt-1">إجمالي الفواتير</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-l from-blue-500/10 to-indigo-500/10 border">
                  <p className="text-3xl font-bold text-blue-600">{stats.payments}</p>
                  <p className="text-sm text-muted-foreground mt-1">إجمالي المدفوعات</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-l from-amber-500/10 to-orange-500/10 border">
                  <p className="text-3xl font-bold text-amber-600">{stats.warehouses}</p>
                  <p className="text-sm text-muted-foreground mt-1">المخازن</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// ============== DATA TABLE ==============
function DataTable({ title, data, columns, onAdd, loading, searchPlaceholder, exportFileName }: any) {
  const [search, setSearch] = useState('')
  
  const filteredData = search 
    ? data.filter((row: any) => 
        columns.some((col: any) => {
          const value = col.render ? null : row[col.key]
          return value && String(value).toLowerCase().includes(search.toLowerCase())
        })
      )
    : data

  const handleExport = () => {
    const headers = columns.map((col: any) => col.label).join(',')
    const rows = filteredData.map((row: any) => 
      columns.map((col: any) => {
        const value = col.render ? '' : row[col.key]
        return value || ''
      }).join(',')
    ).join('\n')
    
    const csv = headers + '\n' + rows
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exportFileName || 'data'}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('تم تصدير البيانات')
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={searchPlaceholder || 'بحث...'} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex gap-2">
          {onAdd && <Button onClick={onAdd}><Plus className="h-4 w-4 ml-2" />إضافة</Button>}
          <Button variant="outline" onClick={handleExport} disabled={filteredData.length === 0}>
            <Download className="h-4 w-4 ml-2" />تصدير
          </Button>
        </div>
      </div>
      
      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{search ? 'لا توجد نتائج' : 'لا توجد بيانات'}</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <Table>
            <TableHeader><TableRow>{columns.map((col: any) => <TableHead key={col.key} className="text-right">{col.label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {filteredData.map((row: any, i: number) => (
                <TableRow key={row.id || i}>
                  {columns.map((col: any) => <TableCell key={col.key}>{col.render ? col.render(row) : row[col.key] || '-'}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  )
}

// ============== COMPANIES ==============
function CompaniesManagement() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ name: '', code: '', email: '', phone: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/companies?limit=100')
      const data = await res.json()
      if (data.success) setCompanies(data.data)
    } catch { 
      setCompanies([])
      toast.error('فشل تحميل البيانات')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('الاسم والكود مطلوبان'); return }
    try {
      const url = editItem ? `/api/companies/${editItem.id}` : '/api/companies'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) { 
        toast.success(editItem ? 'تم تحديث الشركة' : 'تم إنشاء الشركة')
        setDialogOpen(false)
        setEditItem(null)
        setForm({ name: '', code: '', email: '', phone: '' })
        fetchData() 
      }
      else toast.error(data.error || 'فشل الحفظ')
    } catch { toast.error('حدث خطأ') }
  }

  const handleEdit = (item: any) => {
    setEditItem(item)
    setForm({ name: item.name, code: item.code, email: item.email || '', phone: item.phone || '' })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟')) return
    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) { toast.success('تم حذف الشركة'); fetchData() }
      else toast.error(result.error || 'فشل الحذف')
    } catch { toast.error('حدث خطأ') }
  }

  const columns = [
    { key: 'name', label: 'الاسم' },
    { key: 'code', label: 'الكود' },
    { key: 'email', label: 'البريد' },
    { key: 'phone', label: 'الهاتف' },
    { key: 'active', label: 'الحالة', render: (r: any) => <Badge className={r.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{r.active ? 'نشط' : 'غير نشط'}</Badge> },
    { key: 'actions', label: 'إجراءات', render: (r: any) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(r)}><Settings className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-purple-500" /></div>
          <div><h1 className="text-2xl font-bold">إدارة الشركات</h1><p className="text-muted-foreground text-sm">إضافة وتعديل وحذف الشركات</p></div>
        </div>
        <Button className="bg-gradient-to-l from-purple-500 to-purple-600" onClick={() => { 
          setEditItem(null)
          const newCode = generateCode('CMP', companies.map(c => c.code))
          setForm({ name: '', code: newCode, email: '', phone: '' })
          setDialogOpen(true)
        }}><Plus className="h-4 w-4 ml-2" />شركة جديدة</Button>
      </div>
      <Card><CardContent className="p-0"><DataTable data={companies} columns={columns} loading={loading} /></CardContent></Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? 'تعديل شركة' : 'إضافة شركة جديدة'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>اسم الشركة *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>الكود *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSave}>{editItem ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== BRANCHES ==============
function BranchesManagement() {
  const [data, setData] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ name: '', code: '', companyId: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [branchesRes, companiesRes] = await Promise.all([fetch('/api/branches?limit=100'), fetch('/api/companies?limit=100')])
      const branchesData = await branchesRes.json()
      const companiesData = await companiesRes.json()
      if (branchesData.success) setData(branchesData.data)
      if (companiesData.success) setCompanies(companiesData.data)
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    if (!form.name || !form.code || !form.companyId) { toast.error('جميع الحقول مطلوبة'); return }
    try {
      const url = editItem ? `/api/branches/${editItem.id}` : '/api/branches'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const result = await res.json()
      if (result.success) { 
        toast.success(editItem ? 'تم تحديث الفرع' : 'تم إضافة الفرع')
        setDialogOpen(false)
        setEditItem(null)
        setForm({ name: '', code: '', companyId: '' })
        fetchData() 
      }
      else toast.error(result.error || 'فشل الحفظ')
    } catch { toast.error('حدث خطأ') }
  }

  const handleEdit = (item: any) => {
    setEditItem(item)
    setForm({ name: item.name, code: item.code, companyId: item.companyId })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) { toast.success('تم حذف الفرع'); fetchData() }
      else toast.error(result.error || 'فشل الحذف')
    } catch { toast.error('حدث خطأ') }
  }

  const columns = [
    { key: 'name', label: 'الاسم' },
    { key: 'code', label: 'الكود' },
    { key: 'company', label: 'الشركة', render: (r: any) => r.company?.name || '-' },
    { key: 'active', label: 'الحالة', render: (r: any) => <Badge className={r.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{r.active ? 'نشط' : 'غير نشط'}</Badge> },
    { key: 'actions', label: 'إجراءات', render: (r: any) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(r)}><Settings className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center"><Home className="h-6 w-6 text-indigo-500" /></div>
          <div><h1 className="text-2xl font-bold">إدارة الفروع</h1><p className="text-muted-foreground text-sm">إضافة وتعديل وحذف الفروع</p></div>
        </div>
        <Button className="bg-gradient-to-l from-indigo-500 to-indigo-600" onClick={() => { 
          setEditItem(null)
          const newCode = generateCode('BR', data.map(b => b.code))
          setForm({ name: '', code: newCode, companyId: '' })
          setDialogOpen(true)
        }}><Plus className="h-4 w-4 ml-2" />فرع جديد</Button>
      </div>
      <Card><CardContent className="p-0"><DataTable data={data} columns={columns} loading={loading} /></CardContent></Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? 'تعديل فرع' : 'إضافة فرع جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>الشركة *</Label>
              <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الشركة" /></SelectTrigger>
                <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>اسم الفرع *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>الكود *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSave}>{editItem ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== USERS ==============
function UsersManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT' })
  const [currentUser, setCurrentUser] = useState<any>(null)

  // الأدوار المتاحة - مدير النظام يرى جميع الأدوار، غيره لا يرى مدير النظام
  const allRoles = [
    { value: 'SUPER_ADMIN', label: 'مدير النظام' },
    { value: 'COMPANY_ADMIN', label: 'مدير شركة' },
    { value: 'BRANCH_MANAGER', label: 'مدير فرع' },
    { value: 'AGENT', label: 'مندوب' },
    { value: 'COLLECTOR', label: 'محصل' }
  ]
  
  // إخفاء دور مدير النظام لغير مدير النظام
  const roles = currentUser?.role === 'SUPER_ADMIN' 
    ? allRoles 
    : allRoles.filter(r => r.value !== 'SUPER_ADMIN')
  
  const roleLabels: any = { SUPER_ADMIN: 'مدير النظام', COMPANY_ADMIN: 'مدير شركة', BRANCH_MANAGER: 'مدير فرع', AGENT: 'مندوب', COLLECTOR: 'محصل' }
  const roleColors: any = { SUPER_ADMIN: 'bg-red-500/10 text-red-600', COMPANY_ADMIN: 'bg-purple-500/10 text-purple-600', BRANCH_MANAGER: 'bg-blue-500/10 text-blue-600', AGENT: 'bg-green-500/10 text-green-600', COLLECTOR: 'bg-orange-500/10 text-orange-600' }

  // جلب المستخدم الحالي
  useEffect(() => {
    const stored = localStorage.getItem('erp_user')
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)) } catch { }
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users?limit=100')
      const result = await res.json()
      if (result.success) setData(result.data)
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    if (!form.name || !form.email || (!editItem && !form.password)) { toast.error('جميع الحقول مطلوبة'); return }
    try {
      const url = editItem ? `/api/users/${editItem.id}` : '/api/users'
      const method = editItem ? 'PUT' : 'POST'
      const body = editItem ? { name: form.name, email: form.email, role: form.role, ...(form.password && { password: form.password }) } : form
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()
      if (result.success) { 
        toast.success(editItem ? 'تم تحديث المستخدم' : 'تم إضافة المستخدم')
        setDialogOpen(false)
        setEditItem(null)
        setForm({ name: '', email: '', password: '', role: 'AGENT' })
        fetchData() 
      }
      else toast.error(result.error || 'فشل الحفظ')
    } catch { toast.error('حدث خطأ') }
  }

  const handleEdit = (item: any) => {
    // منع تعديل مستخدمي مدير النظام لغير مدير النظام
    if (currentUser?.role !== 'SUPER_ADMIN' && item.role === 'SUPER_ADMIN') {
      toast.error('غير مصرح لك بتعديل مستخدم بصلاحية مدير النظام')
      return
    }
    setEditItem(item)
    setForm({ name: item.name, email: item.email, password: '', role: item.role })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, itemRole: string) => {
    // منع حذف مستخدمي مدير النظام لغير مدير النظام
    if (currentUser?.role !== 'SUPER_ADMIN' && itemRole === 'SUPER_ADMIN') {
      toast.error('غير مصرح لك بحذف مستخدم بصلاحية مدير النظام')
      return
    }
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) { toast.success('تم حذف المستخدم'); fetchData() }
      else toast.error(result.error || 'فشل الحذف')
    } catch { toast.error('حدث خطأ') }
  }

  const columns = [
    { key: 'name', label: 'الاسم' },
    { key: 'email', label: 'البريد' },
    { key: 'role', label: 'الدور', render: (r: any) => <Badge className={roleColors[r.role]}>{roleLabels[r.role]}</Badge> },
    { key: 'active', label: 'الحالة', render: (r: any) => <Badge className={r.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{r.active ? 'نشط' : 'غير نشط'}</Badge> },
    { key: 'actions', label: 'إجراءات', render: (r: any) => {
      // تعطيل الأزرار لمستخدمي مدير النظام إذا كان المستخدم الحالي ليس مدير نظام
      const isDisabled = currentUser?.role !== 'SUPER_ADMIN' && r.role === 'SUPER_ADMIN'
      return (
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleEdit(r)}
            disabled={isDisabled}
            className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className={`text-red-500 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => handleDelete(r.id, r.role)}
            disabled={isDisabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center"><Users className="h-6 w-6 text-pink-500" /></div>
          <div><h1 className="text-2xl font-bold">إدارة المستخدمين</h1><p className="text-muted-foreground text-sm">إضافة وتعديل وحذف المستخدمين</p></div>
        </div>
        <Button className="bg-gradient-to-l from-pink-500 to-pink-600" onClick={() => { setEditItem(null); setForm({ name: '', email: '', password: '', role: 'AGENT' }); setDialogOpen(true) }}><Plus className="h-4 w-4 ml-2" />مستخدم جديد</Button>
      </div>
      <Card><CardContent className="p-0"><DataTable data={data} columns={columns} loading={loading} /></CardContent></Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>البريد الإلكتروني *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>كلمة المرور {editItem ? '(اتركه فارغاً للإبقاء على الحالي)' : '*'}</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="space-y-2"><Label>الدور *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSave}>{editItem ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== CUSTOMERS ==============
function CustomersManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ 
    name: '', code: '', phone: '', phone2: '', address: '', 
    nationalId: '', creditLimit: 0, governorateId: '', cityId: '', areaId: '', agentId: '',
    notes: ''
  })
  // حالة الرصيد الافتتاحي
  const [hasOpeningBalance, setHasOpeningBalance] = useState(false)
  const [openingBalanceItems, setOpeningBalanceItems] = useState<{date: string; amount: number; goodsNotes: string}[]>([
    { date: new Date().toISOString().split('T')[0], amount: 0, goodsNotes: '' }
  ])
  const [governorates, setGovernorates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const currency = useCurrency()

  // حساب إجمالي الرصيد الافتتاحي
  const totalOpeningBalance = openingBalanceItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  // إضافة بند جديد للأقساط
  const addOpeningBalanceItem = () => {
    setOpeningBalanceItems([...openingBalanceItems, {
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      goodsNotes: ''
    }])
  }

  // حذف بند من الأقساط
  const removeOpeningBalanceItem = (index: number) => {
    if (openingBalanceItems.length > 1) {
      setOpeningBalanceItems(openingBalanceItems.filter((_, i) => i !== index))
    }
  }

  // تحديث بند من الأقساط
  const updateOpeningBalanceItem = (index: number, field: string, value: any) => {
    const updated = [...openingBalanceItems]
    updated[index] = { ...updated[index], [field]: value }
    setOpeningBalanceItems(updated)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [customersRes, governoratesRes, agentsRes] = await Promise.all([
        fetch('/api/customers?limit=100'),
        fetch('/api/governorates?active=true'),
        fetch('/api/users?role=AGENT&limit=100')
      ])
      const customersResult = await customersRes.json()
      const governoratesResult = await governoratesRes.json()
      const agentsResult = await agentsRes.json()
      
      if (customersResult.success) setData(customersResult.data)
      if (governoratesResult.success) setGovernorates(governoratesResult.data)
      if (agentsResult.success) setAgents(agentsResult.data)
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  // جلب المدن عند اختيار محافظة
  const fetchCities = async (governorateId: string) => {
    if (!governorateId) { setCities([]); setAreas([]); return }
    try {
      const res = await fetch(`/api/cities?governorateId=${governorateId}&active=true`)
      const result = await res.json()
      if (result.success) setCities(result.data)
      setAreas([])
    } catch { setCities([]) }
  }

  // جلب المناطق عند اختيار مدينة
  const fetchAreas = async (cityId: string) => {
    if (!cityId) { setAreas([]); return }
    try {
      const res = await fetch(`/api/areas?cityId=${cityId}&active=true`)
      const result = await res.json()
      if (result.success) setAreas(result.data)
    } catch { setAreas([]) }
  }

  useEffect(() => { fetchData() }, [])

  // عند تغيير المحافظة
  useEffect(() => {
    if (form.governorateId) fetchCities(form.governorateId)
  }, [form.governorateId])

  // عند تغيير المدينة
  useEffect(() => {
    if (form.cityId) fetchAreas(form.cityId)
  }, [form.cityId])

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('الاسم والكود مطلوبان'); return }
    try {
      // التحقق من الرصيد الافتتاحي
      if (hasOpeningBalance && totalOpeningBalance <= 0) {
        toast.error('يجب إدخال مبالغ للأقساط عند تفعيل الرصيد الافتتاحي')
        return
      }

      const url = editItem ? `/api/customers/${editItem.id}` : '/api/customers'
      const method = editItem ? 'PUT' : 'POST'
      
      // إضافة الرصيد الافتتاحي للبيانات
      const body: any = { ...form }
      if (hasOpeningBalance && !editItem) {
        body.openingBalance = {
          items: openingBalanceItems.filter(item => item.amount > 0),
          total: totalOpeningBalance
        }
      }
      
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()
      if (result.success) { 
        toast.success(editItem ? 'تم تحديث العميل' : hasOpeningBalance ? `تم إضافة العميل برصيد افتتاحي ${formatCurrency(totalOpeningBalance, currency.symbol)}` : 'تم إضافة العميل')
        setDialogOpen(false)
        setEditItem(null)
        setForm({ 
          name: '', code: '', phone: '', phone2: '', address: '', 
          nationalId: '', creditLimit: 0, governorateId: '', cityId: '', areaId: '', agentId: '',
          notes: ''
        })
        // إعادة تعيين الرصيد الافتتاحي
        setHasOpeningBalance(false)
        setOpeningBalanceItems([{ date: new Date().toISOString().split('T')[0], amount: 0, goodsNotes: '' }])
        fetchData() 
      }
      else toast.error(result.error || 'فشل الحفظ')
    } catch { toast.error('حدث خطأ') }
  }

  const handleEdit = (item: any) => {
    setEditItem(item)
    setForm({ 
      name: item.name, code: item.code, phone: item.phone || '', phone2: item.phone2 || '', 
      address: item.address || '', nationalId: item.nationalId || '', creditLimit: item.creditLimit || 0,
      governorateId: item.governorateId || '', cityId: item.cityId || '', areaId: item.areaId || '',
      agentId: item.agentId || '', notes: item.notes || ''
    })
    // جلب المدن والمناطق للعنصر المحدد
    if (item.governorateId) fetchCities(item.governorateId)
    if (item.cityId) fetchAreas(item.cityId)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) { toast.success('تم حذف العميل'); fetchData() }
      else toast.error(result.error || 'فشل الحذف')
    } catch { toast.error('حدث خطأ') }
  }

  const columns = [
    { key: 'code', label: 'الكود' },
    { key: 'name', label: 'الاسم' },
    { key: 'phone', label: 'الهاتف' },
    { key: 'governorate', label: 'المحافظة', render: (r: any) => r.governorate?.name || '-' },
    { key: 'city', label: 'المدينة', render: (r: any) => r.city?.name || '-' },
    { key: 'area', label: 'المنطقة', render: (r: any) => r.area?.name || '-' },
    { key: 'creditLimit', label: 'حد الائتمان', render: (r: any) => formatCurrency(r.creditLimit || 0, currency.symbol) },
    { key: 'active', label: 'الحالة', render: (r: any) => <Badge className={r.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{r.active ? 'نشط' : 'غير نشط'}</Badge> },
    { key: 'actions', label: 'إجراءات', render: (r: any) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(r)}><Settings className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center"><UserCheck className="h-6 w-6 text-cyan-500" /></div>
          <div><h1 className="text-2xl font-bold">إدارة العملاء</h1><p className="text-muted-foreground text-sm">إضافة وتعديل وحذف العملاء</p></div>
        </div>
        <Button className="bg-gradient-to-l from-cyan-500 to-cyan-600" onClick={() => { 
          setEditItem(null)
          const newCode = generateCode('CUST', data.map(c => c.code))
          setForm({ 
            name: '', code: newCode, phone: '', phone2: '', address: '', 
            nationalId: '', creditLimit: 0, governorateId: '', cityId: '', areaId: '', agentId: '',
            notes: ''
          })
          setCities([])
          setAreas([])
          setDialogOpen(true)
        }}><Plus className="h-4 w-4 ml-2" />عميل جديد</Button>
        <ExportButton entity="customers" />
      </div>
      <Card><CardContent className="p-0"><DataTable data={data} columns={columns} loading={loading} /></CardContent></Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'تعديل عميل' : 'إضافة عميل جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>الكود *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="space-y-2"><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" /></div>
            <div className="space-y-2"><Label>هاتف إضافي</Label><Input value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })} placeholder="01xxxxxxxxx" /></div>
            <div className="space-y-2"><Label>المحافظة</Label>
              <Select value={form.governorateId} onValueChange={(v) => setForm({ ...form, governorateId: v, cityId: '', areaId: '' })}>
                <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                <SelectContent>{governorates.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>المدينة/المركز</Label>
              <Select value={form.cityId} onValueChange={(v) => setForm({ ...form, cityId: v, areaId: '' })} disabled={!form.governorateId}>
                <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>المنطقة</Label>
              <Select value={form.areaId} onValueChange={(v) => setForm({ ...form, areaId: v })} disabled={!form.cityId}>
                <SelectTrigger><SelectValue placeholder="اختر المنطقة" /></SelectTrigger>
                <SelectContent>{areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>المندوب</Label>
              <Select value={form.agentId} onValueChange={(v) => setForm({ ...form, agentId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر المندوب" /></SelectTrigger>
                <SelectContent>{agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>الرقم القومي</Label><Input value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} /></div>
            <div className="space-y-2"><Label>حد الائتمان</Label><Input type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })} /></div>
            <div className="col-span-2 space-y-2"><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            
            {/* قسم الرصيد الافتتاحي - فقط عند الإضافة */}
            {!editItem && (
              <div className="col-span-2 space-y-4 p-4 rounded-lg bg-gradient-to-l from-amber-500/5 to-orange-500/5 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-amber-500" />
                    <Label className="text-amber-600 font-medium">رصيد افتتاحي للعميل</Label>
                  </div>
                  <Switch
                    checked={hasOpeningBalance}
                    onCheckedChange={setHasOpeningBalance}
                  />
                </div>
                
                {hasOpeningBalance && (
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">تسجيل أقساط الرصيد الافتتاحي</span>
                      <Button type="button" variant="outline" size="sm" onClick={addOpeningBalanceItem}>
                        <Plus className="h-4 w-4 ml-1" />إضافة قسط
                      </Button>
                    </div>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {openingBalanceItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-background rounded-lg border">
                          <div className="col-span-1 flex items-center justify-center">
                            <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                          </div>
                          <div className="col-span-3">
                            <Label className="text-xs text-muted-foreground">التاريخ</Label>
                            <Input
                              type="date"
                              value={item.date}
                              onChange={(e) => updateOpeningBalanceItem(index, 'date', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-3">
                            <Label className="text-xs text-muted-foreground">المبلغ</Label>
                            <Input
                              type="number"
                              value={item.amount || ''}
                              onChange={(e) => updateOpeningBalanceItem(index, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-4">
                            <Label className="text-xs text-muted-foreground">نوع البضاعة / ملاحظات</Label>
                            <Input
                              value={item.goodsNotes}
                              onChange={(e) => updateOpeningBalanceItem(index, 'goodsNotes', e.target.value)}
                              placeholder="وصف البضاعة..."
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-1 flex items-end justify-center pb-1">
                            {openingBalanceItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                onClick={() => removeOpeningBalanceItem(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* إجمالي الرصيد */}
                    <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <span className="font-medium text-amber-700">إجمالي الرصيد المستحق</span>
                      <span className="text-xl font-bold text-amber-600">{formatCurrency(totalOpeningBalance, currency.symbol)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSave}>{editItem ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== PRODUCTS ==============
function ProductsManagement() {
  const [data, setData] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ 
    name: '', sku: '', costPrice: 0, sellPrice: 0, minPrice: 0, categoryId: '',
    salesCommission: 0, salesCommissionType: 'PERCENTAGE'
  })
  // حالة الرصيد الافتتاحي للمنتج
  const [hasOpeningBalance, setHasOpeningBalance] = useState(false)
  const [openingQuantity, setOpeningQuantity] = useState(0)
  const [openingTotalValue, setOpeningTotalValue] = useState(0)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const currency = useCurrency()

  // حساب سعر الوحدة من الرصيد الافتتاحي
  const calculatedUnitPrice = openingQuantity > 0 ? openingTotalValue / openingQuantity : 0

  const fetchData = async () => {
    setLoading(true)
    try {
      // أولاً جلب الشركات
      const companiesRes = await fetch('/api/companies?limit=100')
      const companiesData = await companiesRes.json()
      if (companiesData.success && companiesData.data.length > 0) {
        setCompanies(companiesData.data)
        const companyId = companiesData.data[0].id
        setSelectedCompanyId(companyId)
        
        // جلب المنتجات والتصنيفات والمخازن للشركة
        const [productsRes, categoriesRes, warehousesRes] = await Promise.all([
          fetch(`/api/products?companyId=${companyId}&limit=100`),
          fetch(`/api/categories?companyId=${companyId}&limit=100`),
          fetch(`/api/warehouses?companyId=${companyId}&limit=100`)
        ])
        const productsData = await productsRes.json()
        const categoriesData = await categoriesRes.json()
        const warehousesData = await warehousesRes.json()
        if (productsData.success) setData(productsData.data)
        if (categoriesData.success) setCategories(categoriesData.data)
        if (warehousesData.success) {
          setWarehouses(warehousesData.data)
          if (warehousesData.data.length > 0) {
            setSelectedWarehouseId(warehousesData.data[0].id)
          }
        }
      } else {
        setCompanies([])
        setData([])
        setCategories([])
        setWarehouses([])
      }
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async () => {
    if (!form.name || !form.sku) { toast.error('الاسم والكود مطلوبان'); return }
    if (!selectedCompanyId) { toast.error('يرجى إضافة شركة أولاً'); return }
    
    // التحقق من الرصيد الافتتاحي
    if (hasOpeningBalance && !editItem) {
      if (openingQuantity <= 0) {
        toast.error('يجب إدخال كمية الرصيد الافتتاحي')
        return
      }
      if (openingTotalValue <= 0) {
        toast.error('يجب إدخال قيمة الرصيد الافتتاحي')
        return
      }
      if (!selectedWarehouseId) {
        toast.error('يجب اختيار مخزن للرصيد الافتتاحي')
        return
      }
    }
    
    try {
      const body: any = { 
        ...form, 
        companyId: selectedCompanyId,
        // إذا كان هناك رصيد افتتاحي، استخدم السعر المحسب
        costPrice: hasOpeningBalance && !editItem ? calculatedUnitPrice : form.costPrice
      }
      
      // إضافة بيانات الرصيد الافتتاحي
      if (hasOpeningBalance && !editItem) {
        body.openingBalance = {
          quantity: openingQuantity,
          totalValue: openingTotalValue,
          unitPrice: calculatedUnitPrice,
          warehouseId: selectedWarehouseId
        }
      }
      
      const url = editItem ? `/api/products/${editItem.id}` : '/api/products'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()
      if (result.success) { 
        toast.success(editItem ? 'تم تحديث المنتج' : hasOpeningBalance ? `تم إضافة المنتج برصيد ${openingQuantity} وحدة` : 'تم إضافة المنتج')
        setDialogOpen(false)
        setEditItem(null)
        setForm({ 
          name: '', sku: '', costPrice: 0, sellPrice: 0, minPrice: 0, categoryId: '',
          salesCommission: 0, salesCommissionType: 'PERCENTAGE'
        })
        // إعادة تعيين الرصيد الافتتاحي
        setHasOpeningBalance(false)
        setOpeningQuantity(0)
        setOpeningTotalValue(0)
        fetchData() 
      }
      else toast.error(result.error || 'فشل الحفظ')
    } catch { toast.error('حدث خطأ') }
  }

  const handleEdit = (item: any) => {
    setEditItem(item)
    setForm({ 
      name: item.name, sku: item.sku, costPrice: item.costPrice || 0, sellPrice: item.sellPrice || 0, 
      minPrice: item.minPrice || 0, categoryId: item.categoryId || '',
      salesCommission: item.salesCommission || 0, salesCommissionType: item.salesCommissionType || 'PERCENTAGE'
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    try {
      const res = await fetch(`/api/products/${id}?companyId=${selectedCompanyId}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) { toast.success('تم حذف المنتج'); fetchData() }
      else toast.error(result.error || 'فشل الحذف')
    } catch { toast.error('حدث خطأ') }
  }

  const columns = [
    { key: 'sku', label: 'الكود' },
    { key: 'name', label: 'الاسم' },
    { key: 'category', label: 'التصنيف', render: (r: any) => r.category?.name || '-' },
    { key: 'costPrice', label: 'سعر التكلفة', render: (r: any) => formatCurrency(r.costPrice || 0, currency.symbol) },
    { key: 'sellPrice', label: 'سعر البيع', render: (r: any) => formatCurrency(r.sellPrice || 0, currency.symbol) },
    { key: 'salesCommission', label: 'العمولة', render: (r: any) => {
      if (!r.salesCommission) return <span className="text-muted-foreground">-</span>
      return r.salesCommissionType === 'PERCENTAGE' 
        ? <Badge className="bg-fuchsia-500/10 text-fuchsia-600">{r.salesCommission}%</Badge>
        : <Badge className="bg-fuchsia-500/10 text-fuchsia-600">{formatCurrency(r.salesCommission, currency.symbol)}</Badge>
    }},
    { key: 'active', label: 'الحالة', render: (r: any) => <Badge className={r.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{r.active ? 'نشط' : 'غير نشط'}</Badge> },
    { key: 'actions', label: 'إجراءات', render: (r: any) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(r)}><Settings className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center"><Package className="h-6 w-6 text-orange-500" /></div>
          <div><h1 className="text-2xl font-bold">إدارة المنتجات</h1><p className="text-muted-foreground text-sm">إضافة وتعديل وحذف المنتجات</p></div>
        </div>
        <Button className="bg-gradient-to-l from-orange-500 to-orange-600" onClick={() => { 
          setEditItem(null)
          const newCode = generateCode('PRD', data.map(p => p.sku))
          setForm({ 
            name: '', sku: newCode, costPrice: 0, sellPrice: 0, minPrice: 0, categoryId: '',
            salesCommission: 0, salesCommissionType: 'PERCENTAGE'
          })
          setDialogOpen(true)
        }}><Plus className="h-4 w-4 ml-2" />منتج جديد</Button>
        <ExportButton entity="products" />
      </div>
      <Card><CardContent className="p-0"><DataTable data={data} columns={columns} loading={loading} /></CardContent></Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'تعديل منتج' : 'إضافة منتج جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>الكود *</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>التصنيف</Label>
              <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm({ ...form, categoryId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون تصنيف</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>سعر التكلفة</Label>
                <Input 
                  type="number" 
                  value={hasOpeningBalance && !editItem ? calculatedUnitPrice : form.costPrice} 
                  onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
                  disabled={hasOpeningBalance && !editItem}
                />
                {hasOpeningBalance && !editItem && (
                  <p className="text-xs text-muted-foreground">محسوب من الرصيد الافتتاحي</p>
                )}
              </div>
              <div className="space-y-2"><Label>سعر البيع</Label><Input type="number" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>أدنى سعر</Label><Input type="number" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            
            {/* قسم الرصيد الافتتاحي - فقط عند الإضافة */}
            {!editItem && (
              <div className="p-4 rounded-lg bg-gradient-to-l from-emerald-500/5 to-green-500/5 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-500" />
                    <Label className="text-emerald-600 font-medium">رصيد افتتاحي للمخزون</Label>
                  </div>
                  <Switch
                    checked={hasOpeningBalance}
                    onCheckedChange={setHasOpeningBalance}
                  />
                </div>
                
                {hasOpeningBalance && (
                  <div className="space-y-4 mt-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">الكمية</Label>
                        <Input
                          type="number"
                          value={openingQuantity || ''}
                          onChange={(e) => setOpeningQuantity(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">إجمالي القيمة</Label>
                        <Input
                          type="number"
                          value={openingTotalValue || ''}
                          onChange={(e) => setOpeningTotalValue(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">المخزن</Label>
                        <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المخزن" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((w) => (
                              <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* عرض سعر الوحدة المحسوب */}
                    {openingQuantity > 0 && openingTotalValue > 0 && (
                      <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                        <div>
                          <span className="text-sm text-muted-foreground">سعر الوحدة المحسوب = </span>
                          <span className="font-bold text-emerald-600">{formatCurrency(calculatedUnitPrice, currency.symbol)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(openingTotalValue, currency.symbol)} ÷ {openingQuantity} وحدة
                        </span>
                      </div>
                    )}
                    
                    {warehouses.length === 0 && (
                      <p className="text-xs text-amber-600">⚠️ لا توجد مخازن، يرجى إضافة مخزن أولاً</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* قسم عمولة البيع */}
            <div className="p-4 rounded-lg bg-gradient-to-l from-fuchsia-500/5 to-purple-500/5 border border-fuchsia-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Percent className="h-4 w-4 text-fuchsia-500" />
                <Label className="text-fuchsia-600 font-medium">عمولة البيع للمندوب</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">نوع العمولة</Label>
                  <Select value={form.salesCommissionType} onValueChange={(v) => setForm({ ...form, salesCommissionType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">نسبة مئوية (%)</SelectItem>
                      <SelectItem value="FIXED">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {form.salesCommissionType === 'PERCENTAGE' ? 'النسبة (%)' : 'المبلغ'}
                  </Label>
                  <Input 
                    type="number" 
                    value={form.salesCommission} 
                    onChange={(e) => setForm({ ...form, salesCommission: parseFloat(e.target.value) || 0 })}
                    placeholder={form.salesCommissionType === 'PERCENTAGE' ? 'مثال: 5' : 'مثال: 10'}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {form.salesCommissionType === 'PERCENTAGE' 
                  ? 'سيتم حساب نسبة من سعر البيع كعمولة للمندوب عند بيع هذا المنتج'
                  : 'سيتم خصم مبلغ ثابت كعمولة للمندوب عند بيع كل قطعة من هذا المنتج'}
              </p>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSave}>{editItem ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== LOCATIONS (النظام الهرمي للمواقع) ==============
function LocationsManagement() {
  const [activeTab, setActiveTab] = useState<'import' | 'governorates' | 'cities' | 'areas'>('import')
  const [governorates, setGovernorates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  
  // الشركة من المستخدم الحالي
  const [companyId, setCompanyId] = useState<string>('')
  
  // بيانات الاستيراد من egydata
  const [egyptGovernorates, setEgyptGovernorates] = useState<any[]>([])
  const [selectedGovs, setSelectedGovs] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [resetting, setResetting] = useState(false)
  
  // فلاتر للمدن والمناطق
  const [filterGovernorateId, setFilterGovernorateId] = useState<string>('')
  const [filterCityId, setFilterCityId] = useState<string>('')
  
  // Forms for each level
  const [govForm, setGovForm] = useState({ name: '', nameAr: '', code: '', active: true })
  const [cityForm, setCityForm] = useState({ name: '', nameAr: '', code: '', governorateId: '', active: true })
  const [areaForm, setAreaForm] = useState({ name: '', nameAr: '', code: '', cityId: '', active: true })

  // جلب الشركة من المستخدم الحالي
  useEffect(() => {
    const userData = localStorage.getItem('erp_user')
    if (userData) {
      const user = JSON.parse(userData)
      if (user.companyId) {
        setCompanyId(user.companyId)
      } else {
        // للسوبر أدمن - جلب أول شركة
        fetch('/api/companies?limit=1')
          .then(r => r.json())
          .then(data => {
            if (data.success && data.data.length > 0) {
              setCompanyId(data.data[0].id)
            }
          })
      }
    }
  }, [])

  const fetchData = async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const [govRes, citiesRes, areasRes] = await Promise.all([
        fetch(`/api/governorates?companyId=${companyId}`),
        fetch(`/api/cities?companyId=${companyId}`),
        fetch(`/api/areas?companyId=${companyId}`)
      ])
      
      const [govData, citiesData, areasData] = await Promise.all([
        govRes.json(),
        citiesRes.json(),
        areasRes.json()
      ])
      
      if (govData.success) setGovernorates(govData.data || [])
      if (citiesData.success) setCities(citiesData.data || [])
      if (areasData.success) setAreas(areasData.data || [])
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [companyId])
  
  // جلب المحافظات المصرية المتاحة
  const fetchEgyptGovernorates = async () => {
    try {
      const res = await fetch(`/api/locations/egypt?action=list&companyId=${companyId}`)
      const data = await res.json()
      if (data.success) setEgyptGovernorates(data.data)
    } catch { toast.error('فشل تحميل بيانات المحافظات') }
  }
  
  useEffect(() => {
    if (activeTab === 'import' && companyId) fetchEgyptGovernorates()
  }, [activeTab, companyId])
  
  // استيراد المحافظات المختارة
  const handleImport = async () => {
    if (selectedGovs.size === 0) {
      toast.error('يرجى اختيار محافظة واحدة على الأقل')
      return
    }
    
    setImporting(true)
    try {
      const res = await fetch('/api/locations/egypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          governorateCodes: Array.from(selectedGovs)
        })
      })
      const result = await res.json()
      if (result.success) {
        toast.success(result.message)
        setImportDialog(false)
        setSelectedGovs(new Set())
        fetchData()
        fetchEgyptGovernorates()
      } else {
        toast.error(result.error || 'فشل الاستيراد')
      }
    } catch { toast.error('حدث خطأ أثناء الاستيراد') }
    finally { setImporting(false) }
  }
  
  // حذف جميع بيانات المواقع
  const handleResetAll = async () => {
    if (!confirm('هل أنت متأكد من حذف جميع بيانات المواقع؟\nسيتم حذف جميع المحافظات والمدن والمناطق.')) return
    
    setResetting(true)
    try {
      const res = await fetch(`/api/locations/egypt?resetAll=true&companyId=${companyId}`, { 
        method: 'DELETE' 
      })
      const result = await res.json()
      if (result.success) {
        toast.success(result.message)
        fetchData()
        fetchEgyptGovernorates()
      } else {
        toast.error(result.error || 'فشل الحذف')
      }
    } catch { toast.error('حدث خطأ أثناء الحذف') }
    finally { setResetting(false) }
  }

  // ============== GOVERNORATE HANDLERS ==============
  const handleSaveGovernorate = async () => {
    if (!govForm.nameAr || !govForm.code) { toast.error('الاسم العربي والكود مطلوبان'); return }
    if (!companyId) { toast.error('لا توجد شركة مرتبطة'); return }
    try {
      // استخدام الاسم العربي كاسم إنجليزي إذا لم يُدخل الاسم الإنجليزي
      const body = { 
        ...govForm, 
        companyId, 
        name: govForm.name || govForm.nameAr, // fallback to Arabic name
        nameAr: govForm.nameAr 
      }
      const url = editItem ? `/api/governorates/${editItem.id}` : '/api/governorates'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()
      if (result.success) { 
        toast.success(editItem ? 'تم تحديث المحافظة' : 'تم إضافة المحافظة')
        setDialogOpen(false)
        setEditItem(null)
        setGovForm({ name: '', nameAr: '', code: '', active: true })
        fetchData() 
      }
      else toast.error(result.error || 'فشل الحفظ')
    } catch { toast.error('حدث خطأ') }
  }

  const handleEditGovernorate = (item: any) => {
    setEditItem({ ...item, type: 'governorate' })
    setGovForm({ name: item.name, nameAr: item.nameAr || item.name, code: item.code, active: item.active !== false })
    setDialogOpen(true)
  }

  const handleDeleteGovernorate = async (id: string) => {
    const gov = governorates.find(g => g.id === id)
    const customersCount = gov?._count?.customers || 0
    const citiesCount = gov?._count?.cities || 0
    
    const msg = customersCount > 0 
      ? `لا يمكن حذف المحافظة لوجود ${customersCount} عميل مرتبط بها`
      : `هل أنت متأكد من حذف المحافظة "${gov?.nameAr || gov?.name}"؟\nسيتم حذف ${citiesCount} مدينة ومنطقة تابعة لها.`
    
    if (customersCount > 0) {
      toast.error(msg)
      return
    }
    
    if (!confirm(msg)) return
    try {
      const res = await fetch(`/api/locations/egypt?governorateId=${id}&companyId=${companyId}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) { toast.success(result.message); fetchData() }
      else toast.error(result.error || 'فشل الحذف')
    } catch { toast.error('حدث خطأ') }
  }

  // ============== CITY HANDLERS ==============
  const handleSaveCity = async () => {
    if (!cityForm.nameAr || !cityForm.code || !cityForm.governorateId) { 
      toast.error('الاسم العربي والكود والمحافظة مطلوبون'); return 
    }
    if (!companyId) {
      toast.error('يرجى الانتظار حتى يتم تحميل بيانات الشركة'); return
    }
    try {
      // استخدام الاسم العربي كاسم إنجليزي إذا لم يُدخل الاسم الإنجليزي
      const body = { 
        ...cityForm, 
        companyId, 
        name: cityForm.name || cityForm.nameAr, // fallback to Arabic name
        nameAr: cityForm.nameAr 
      }
      const url = editItem ? `/api/cities/${editItem.id}` : '/api/cities'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()
      if (result.success) { 
        toast.success(editItem ? 'تم تحديث المدينة' : 'تم إضافة المدينة')
        setDialogOpen(false)
        setEditItem(null)
        setCityForm({ name: '', nameAr: '', code: '', governorateId: '', active: true })
        fetchData() 
      }
      else toast.error(result.error || 'فشل الحفظ')
    } catch { toast.error('حدث خطأ') }
  }

  const handleEditCity = (item: any) => {
    setEditItem({ ...item, type: 'city' })
    setCityForm({ name: item.name, nameAr: item.nameAr || item.name, code: item.code, governorateId: item.governorateId, active: item.active !== false })
    setDialogOpen(true)
  }

  const handleDeleteCity = async (id: string) => {
    const city = cities.find(c => c.id === id)
    const customersCount = city?._count?.customers || 0
    
    if (customersCount > 0) {
      toast.error(`لا يمكن حذف المدينة لوجود ${customersCount} عميل مرتبط بها`)
      return
    }
    
    if (!confirm(`هل أنت متأكد من حذف المدينة "${city?.nameAr || city?.name}"؟`)) return
    try {
      const res = await fetch(`/api/cities/${id}?companyId=${companyId}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) { toast.success('تم حذف المدينة'); fetchData() }
      else toast.error(result.error || 'فشل الحذف')
    } catch { toast.error('حدث خطأ') }
  }

  // ============== AREA HANDLERS ==============
  const handleSaveArea = async () => {
    if (!areaForm.nameAr || !areaForm.code || !areaForm.cityId) { 
      toast.error('الاسم العربي والكود والمدينة مطلوبون'); return 
    }
    if (!companyId) {
      toast.error('يرجى الانتظار حتى يتم تحميل بيانات الشركة'); return
    }
    try {
      // استخدام الاسم العربي كاسم إنجليزي إذا لم يُدخل الاسم الإنجليزي
      const body = { 
        ...areaForm, 
        companyId, 
        name: areaForm.name || areaForm.nameAr, // fallback to Arabic name
        nameAr: areaForm.nameAr 
      }
      const url = editItem ? `/api/areas/${editItem.id}` : '/api/areas'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()
      if (result.success) { 
        toast.success(editItem ? 'تم تحديث المنطقة' : 'تم إضافة المنطقة')
        setDialogOpen(false)
        setEditItem(null)
        setAreaForm({ name: '', nameAr: '', code: '', cityId: '', active: true })
        fetchData() 
      }
      else toast.error(result.error || 'فشل الحفظ')
    } catch { toast.error('حدث خطأ') }
  }

  const handleEditArea = (item: any) => {
    setEditItem({ ...item, type: 'area' })
    setAreaForm({ name: item.name, nameAr: item.nameAr || item.name, code: item.code, cityId: item.cityId, active: item.active !== false })
    setDialogOpen(true)
  }

  const handleDeleteArea = async (id: string) => {
    const area = areas.find(a => a.id === id)
    const customersCount = area?._count?.customers || 0
    
    if (customersCount > 0) {
      toast.error(`لا يمكن حذف المنطقة لوجود ${customersCount} عميل مرتبط بها`)
      return
    }
    
    if (!confirm(`هل أنت متأكد من حذف المنطقة "${area?.nameAr || area?.name}"؟`)) return
    try {
      const res = await fetch(`/api/areas/${id}?companyId=${companyId}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) { toast.success('تم حذف المنطقة'); fetchData() }
      else toast.error(result.error || 'فشل الحذف')
    } catch { toast.error('حدث خطأ') }
  }

  // Columns for each level - مع عرض الاسم العربي
  const governorateColumns = [
    { key: 'code', label: 'الكود' },
    { key: 'nameAr', label: 'اسم المحافظة', render: (r: any) => <span className="font-medium">{r.nameAr || r.name}</span> },
    { key: 'cities', label: 'المدن', render: (r: any) => <Badge className="bg-blue-500/10 text-blue-600">{r._count?.cities || 0}</Badge> },
    { key: 'customers', label: 'العملاء', render: (r: any) => <Badge className="bg-cyan-500/10 text-cyan-600">{r._count?.customers || 0}</Badge> },
    { key: 'active', label: 'الحالة', render: (r: any) => <Badge className={r.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{r.active ? 'نشط' : 'غير نشط'}</Badge> },
    { key: 'actions', label: 'إجراءات', render: (r: any) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => handleEditGovernorate(r)}><Settings className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteGovernorate(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ]

  const cityColumns = [
    { key: 'code', label: 'الكود' },
    { key: 'nameAr', label: 'اسم المدينة', render: (r: any) => <span className="font-medium">{r.nameAr || r.name}</span> },
    { key: 'governorate', label: 'المحافظة', render: (r: any) => <Badge className="bg-purple-500/10 text-purple-600">{r.governorate?.nameAr || r.governorate?.name || '-'}</Badge> },
    { key: 'areas', label: 'المناطق', render: (r: any) => <Badge className="bg-teal-500/10 text-teal-600">{r._count?.areas || 0}</Badge> },
    { key: 'customers', label: 'العملاء', render: (r: any) => <Badge className="bg-cyan-500/10 text-cyan-600">{r._count?.customers || 0}</Badge> },
    { key: 'active', label: 'الحالة', render: (r: any) => <Badge className={r.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{r.active ? 'نشط' : 'غير نشط'}</Badge> },
    { key: 'actions', label: 'إجراءات', render: (r: any) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => handleEditCity(r)}><Settings className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteCity(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ]

  const areaColumns = [
    { key: 'code', label: 'الكود' },
    { key: 'nameAr', label: 'اسم المنطقة', render: (r: any) => <span className="font-medium">{r.nameAr || r.name}</span> },
    { key: 'city', label: 'المدينة', render: (r: any) => <Badge className="bg-teal-500/10 text-teal-600">{r.city?.nameAr || r.city?.name || '-'}</Badge> },
    { key: 'governorate', label: 'المحافظة', render: (r: any) => <Badge className="bg-purple-500/10 text-purple-600">{r.city?.governorate?.nameAr || r.city?.governorate?.name || '-'}</Badge> },
    { key: 'customers', label: 'العملاء', render: (r: any) => <Badge className="bg-cyan-500/10 text-cyan-600">{r._count?.customers || 0}</Badge> },
    { key: 'active', label: 'الحالة', render: (r: any) => <Badge className={r.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{r.active ? 'نشط' : 'غير نشط'}</Badge> },
    { key: 'actions', label: 'إجراءات', render: (r: any) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => handleEditArea(r)}><Settings className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteArea(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ]

  if (loading && !companyId) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center"><MapPin className="h-6 w-6 text-teal-500" /></div>
          <div><h1 className="text-2xl font-bold">إدارة المواقع</h1><p className="text-muted-foreground text-sm">استيراد المحافظات المصرية أو إضافة مواقع مخصصة</p></div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="bg-gradient-to-l from-purple-500/10 to-violet-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المحافظات</p>
                <p className="text-xl font-bold">{governorates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-teal-500/10 to-cyan-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Home className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المدن</p>
                <p className="text-xl font-bold">{cities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-cyan-500/10 to-sky-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المناطق</p>
                <p className="text-xl font-bold">{areas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-green-500/10 to-emerald-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">العملاء</p>
                <p className="text-xl font-bold">{governorates.reduce((sum, g) => sum + (g._count?.customers || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit overflow-x-auto">
        <Button 
          variant={activeTab === 'import' ? 'default' : 'ghost'} 
          className={activeTab === 'import' ? 'bg-gradient-to-l from-emerald-500 to-teal-500 text-white' : ''}
          onClick={() => setActiveTab('import')}
        >
          <Download className="h-4 w-4 ml-2" />
          استيراد المحافظات
        </Button>
        <Button 
          variant={activeTab === 'governorates' ? 'default' : 'ghost'} 
          className={activeTab === 'governorates' ? 'bg-gradient-to-l from-purple-500 to-purple-600 text-white' : ''}
          onClick={() => setActiveTab('governorates')}
        >
          <Building2 className="h-4 w-4 ml-2" />
          المحافظات ({governorates.length})
        </Button>
        <Button 
          variant={activeTab === 'cities' ? 'default' : 'ghost'}
          className={activeTab === 'cities' ? 'bg-gradient-to-l from-teal-500 to-teal-600 text-white' : ''}
          onClick={() => setActiveTab('cities')}
        >
          <Home className="h-4 w-4 ml-2" />
          المدن ({cities.length})
        </Button>
        <Button 
          variant={activeTab === 'areas' ? 'default' : 'ghost'}
          className={activeTab === 'areas' ? 'bg-gradient-to-l from-cyan-500 to-cyan-600 text-white' : ''}
          onClick={() => setActiveTab('areas')}
        >
          <MapPin className="h-4 w-4 ml-2" />
          المناطق ({areas.length})
        </Button>
      </div>

      {/* تبويب الاستيراد */}
      {activeTab === 'import' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-5 w-5 text-emerald-500" />
                  استيراد المحافظات المصرية
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  اختر المحافظات التي تريد استيرادها مع مدنها ومناطقها
                </p>
              </div>
              {(governorates.length > 0 || cities.length > 0 || areas.length > 0) && (
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                  disabled={resetting}
                  onClick={handleResetAll}
                >
                  {resetting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Trash2 className="h-4 w-4 ml-2" />}
                  حذف الكل
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={egyptGovernorates.length > 0 && egyptGovernorates.filter(g => !g.imported).every(g => selectedGovs.has(g.code))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedGovs(new Set(egyptGovernorates.filter(g => !g.imported).map(g => g.code)))
                    } else {
                      setSelectedGovs(new Set())
                    }
                  }}
                />
                <Label className="text-sm">اختيار الكل ({egyptGovernorates.filter(g => !g.imported).length} متاحة)</Label>
              </div>
              <Button 
                className="bg-gradient-to-l from-emerald-500 to-teal-500"
                disabled={selectedGovs.size === 0 || importing}
                onClick={handleImport}
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Download className="h-4 w-4 ml-2" />}
                استيراد ({selectedGovs.size})
              </Button>
            </div>
            
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 max-h-[400px] overflow-y-auto">
              {egyptGovernorates.map((gov) => (
                <div 
                  key={gov.code}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    gov.imported 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800' 
                      : selectedGovs.has(gov.code)
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card hover:bg-muted/50 border-transparent hover:border-muted'
                  }`}
                  onClick={() => {
                    if (gov.imported) return
                    const newSet = new Set(selectedGovs)
                    if (newSet.has(gov.code)) {
                      newSet.delete(gov.code)
                    } else {
                      newSet.add(gov.code)
                    }
                    setSelectedGovs(newSet)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={gov.imported || selectedGovs.has(gov.code)}
                      disabled={gov.imported}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{gov.name}</p>
                      <p className="text-xs text-muted-foreground">{gov.citiesCount} مدينة</p>
                    </div>
                  </div>
                  {gov.imported && (
                    <Badge className="mt-2 w-full justify-center bg-green-500/10 text-green-600 text-xs">
                      <Check className="h-3 w-3 ml-1" />مستوردة
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Governorates Tab */}
      {activeTab === 'governorates' && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">قائمة المحافظات</h3>
              <Button className="bg-gradient-to-l from-purple-500 to-purple-600" onClick={() => { 
                setEditItem(null)
                setGovForm({ name: '', nameAr: '', code: generateCode('GOV', governorates.map(g => g.code)) })
                setDialogOpen(true)
              }}><Plus className="h-4 w-4 ml-2" />محافظة جديدة</Button>
            </div>
            <DataTable data={governorates} columns={governorateColumns} loading={loading} />
          </CardContent>
        </Card>
      )}

      {/* Cities Tab */}
      {activeTab === 'cities' && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">قائمة المدن والمراكز</h3>
                <Select value={filterGovernorateId || "all"} onValueChange={(v) => setFilterGovernorateId(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="فلترة بالمحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {governorates.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.nameAr || g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-gradient-to-l from-teal-500 to-teal-600" onClick={() => { 
                setEditItem(null)
                setCityForm({ name: '', nameAr: '', code: generateCode('CTY', cities.map(c => c.code)), governorateId: filterGovernorateId, active: true })
                setDialogOpen(true)
              }}><Plus className="h-4 w-4 ml-2" />مدينة جديدة</Button>
            </div>
            <DataTable data={filterGovernorateId ? cities.filter(c => c.governorateId === filterGovernorateId) : cities} columns={cityColumns} loading={loading} />
          </CardContent>
        </Card>
      )}

      {/* Areas Tab */}
      {activeTab === 'areas' && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">قائمة المناطق</h3>
                <Select value={filterCityId || "all"} onValueChange={(v) => setFilterCityId(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="فلترة بالمدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {cities.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nameAr || c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-gradient-to-l from-cyan-500 to-cyan-600" onClick={() => { 
                setEditItem(null)
                setAreaForm({ name: '', nameAr: '', code: generateCode('ARA', areas.map(a => a.code)), cityId: filterCityId, active: true })
                setDialogOpen(true)
              }}><Plus className="h-4 w-4 ml-2" />منطقة جديدة</Button>
            </div>
            <DataTable data={filterCityId ? areas.filter(a => a.cityId === filterCityId) : areas} columns={areaColumns} loading={loading} />
          </CardContent>
        </Card>
      )}

      {/* Dialog for Add/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem?.type === 'governorate' ? (editItem ? 'تعديل محافظة' : 'إضافة محافظة جديدة') :
               editItem?.type === 'city' ? (editItem ? 'تعديل مدينة' : 'إضافة مدينة جديدة') :
               (editItem ? 'تعديل منطقة' : 'إضافة منطقة جديدة')}
            </DialogTitle>
          </DialogHeader>
          
          {/* Governorate Form */}
          {(activeTab === 'governorates' || editItem?.type === 'governorate') && !editItem?.type?.includes('city') && !editItem?.type?.includes('area') && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>اسم المحافظة (عربي) *</Label><Input value={govForm.nameAr} onChange={(e) => setGovForm({ ...govForm, nameAr: e.target.value })} placeholder="مثال: القاهرة" /></div>
              <div className="space-y-2"><Label>الاسم (إنجليزي) - اختياري</Label><Input value={govForm.name} onChange={(e) => setGovForm({ ...govForm, name: e.target.value })} placeholder="Cairo" /></div>
              <div className="space-y-2"><Label>الكود *</Label><Input value={govForm.code} onChange={(e) => setGovForm({ ...govForm, code: e.target.value })} placeholder="GOV-0001" /></div>
              {editItem && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <Label>حالة النشاط</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={govForm.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{govForm.active ? 'نشط' : 'غير نشط'}</Badge>
                    <Switch checked={govForm.active} onCheckedChange={(v) => setGovForm({ ...govForm, active: v })} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* City Form */}
          {(activeTab === 'cities' || editItem?.type === 'city') && !editItem?.type?.includes('area') && editItem?.type !== 'governorate' && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>المحافظة *</Label>
                <Select value={cityForm.governorateId} onValueChange={(v) => setCityForm({ ...cityForm, governorateId: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                  <SelectContent>{governorates.map(g => <SelectItem key={g.id} value={g.id}>{g.nameAr || g.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>اسم المدينة (عربي) *</Label><Input value={cityForm.nameAr} onChange={(e) => setCityForm({ ...cityForm, nameAr: e.target.value })} placeholder="مثال: مدينة نصر" /></div>
              <div className="space-y-2"><Label>الاسم (إنجليزي) - اختياري</Label><Input value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })} placeholder="Nasr City" /></div>
              <div className="space-y-2"><Label>الكود *</Label><Input value={cityForm.code} onChange={(e) => setCityForm({ ...cityForm, code: e.target.value })} placeholder="CTY-0001" /></div>
              {editItem && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <Label>حالة النشاط</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={cityForm.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{cityForm.active ? 'نشط' : 'غير نشط'}</Badge>
                    <Switch checked={cityForm.active} onCheckedChange={(v) => setCityForm({ ...cityForm, active: v })} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Area Form */}
          {(activeTab === 'areas' || editItem?.type === 'area') && editItem?.type !== 'governorate' && editItem?.type !== 'city' && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>المدينة *</Label>
                <Select value={areaForm.cityId} onValueChange={(v) => setAreaForm({ ...areaForm, cityId: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                  <SelectContent>{cities.map(c => <SelectItem key={c.id} value={c.id}>{c.nameAr || c.name} ({c.governorate?.nameAr || c.governorate?.name})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>اسم المنطقة (عربي) *</Label><Input value={areaForm.nameAr} onChange={(e) => setAreaForm({ ...areaForm, nameAr: e.target.value })} placeholder="مثال: الحي السابع" /></div>
              <div className="space-y-2"><Label>الاسم (إنجليزي) - اختياري</Label><Input value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} placeholder="District 7" /></div>
              <div className="space-y-2"><Label>الكود *</Label><Input value={areaForm.code} onChange={(e) => setAreaForm({ ...areaForm, code: e.target.value })} placeholder="ARA-0001" /></div>
              {editItem && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <Label>حالة النشاط</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={areaForm.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{areaForm.active ? 'نشط' : 'غير نشط'}</Badge>
                    <Switch checked={areaForm.active} onCheckedChange={(v) => setAreaForm({ ...areaForm, active: v })} />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={() => {
              if (activeTab === 'governorates' || editItem?.type === 'governorate') handleSaveGovernorate()
              else if (activeTab === 'cities' || editItem?.type === 'city') handleSaveCity()
              else handleSaveArea()
            }}>{editItem ? 'تحديث' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== CATEGORIES ==============
function CategoriesManagement() {
  const [data, setData] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ name: '', code: '', parentId: '' })
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const fetchData = async () => {
    setLoading(true)
    try {
      // أولاً جلب الشركات
      const companiesRes = await fetch('/api/companies?limit=100')
      const companiesData = await companiesRes.json()
      if (companiesData.success && companiesData.data.length > 0) {
        setCompanies(companiesData.data)
        const companyId = companiesData.data[0].id
        setSelectedCompanyId(companyId)
        
        // ثم جلب التصنيفات للشركة
        const categoriesRes = await fetch(`/api/categories?companyId=${companyId}&limit=100&activeOnly=false`)
        const categoriesData = await categoriesRes.json()
        if (categoriesData.success) setData(categoriesData.data)
      } else {
        setCompanies([])
        setData([])
      }
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // الحصول على التصنيفات الجذر (بدون أب)
  const rootCategories = data.filter(c => !c.parentId)

  // الحصول على التصنيفات المتاحة كأب (استبعاد التصنيف الحالي وأبنائه في حالة التعديل)
  const getAvailableParents = () => {
    if (!editItem) return data.filter(c => c.active)
    
    // جمع كل أبناء التصنيف الحالي
    const getDescendantIds = (id: string): string[] => {
      const children = data.filter(c => c.parentId === id)
      return children.flatMap(c => [c.id, ...getDescendantIds(c.id)])
    }
    const descendantIds = getDescendantIds(editItem.id)
    
    return data.filter(c => c.active && c.id !== editItem.id && !descendantIds.includes(c.id))
  }

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('الاسم والكود مطلوبان'); return }
    if (!selectedCompanyId) { toast.error('يرجى إضافة شركة أولاً'); return }
    try {
      const body = { 
        ...form, 
        companyId: selectedCompanyId,
        parentId: form.parentId || null
      }
      const url = editItem ? `/api/categories/${editItem.id}` : '/api/categories'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()
      if (result.success) { 
        toast.success(editItem ? 'تم تحديث التصنيف' : 'تم إضافة التصنيف')
        setDialogOpen(false)
        setEditItem(null)
        setForm({ name: '', code: '', parentId: '' })
        fetchData() 
      }
      else toast.error(result.error || 'فشل الحفظ')
    } catch { toast.error('حدث خطأ') }
  }

  const handleEdit = (item: any) => {
    setEditItem(item)
    setForm({ 
      name: item.name, 
      code: item.code, 
      parentId: item.parentId || '' 
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return
    try {
      const res = await fetch(`/api/categories?id=${id}&companyId=${selectedCompanyId}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) { toast.success('تم حذف التصنيف'); fetchData() }
      else toast.error(result.error || 'فشل الحذف')
    } catch { toast.error('حدث خطأ') }
  }

  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  // مكون عرض التصنيف الهرمي
  const CategoryTreeItem = ({ category, level = 0 }: { category: any; level?: number }) => {
    const children = data.filter(c => c.parentId === category.id)
    const isExpanded = expandedCategories.has(category.id)
    const hasChildren = children.length > 0
    const productCount = category._count?.products || 0

    return (
      <div>
        <div 
          className={`flex items-center gap-2 p-3 hover:bg-muted/50 border-b cursor-pointer transition-colors ${level > 0 ? 'bg-muted/20' : ''}`}
          style={{ paddingRight: `${level * 24 + 12}px` }}
        >
          {/* زر التوسيع/الطي */}
          <div className="w-6 flex justify-center">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleExpand(category.id)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4 rotate-90" />}
              </Button>
            ) : (
              <span className="w-4" />
            )}
          </div>

          {/* أيقونة التصنيف */}
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${hasChildren ? 'bg-lime-500/20' : 'bg-gray-500/10'}`}>
            {hasChildren ? (
              <Layers className="h-4 w-4 text-lime-500" />
            ) : (
              <Package className="h-4 w-4 text-gray-500" />
            )}
          </div>

          {/* معلومات التصنيف */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{category.name}</p>
              <span className="text-xs text-muted-foreground">({category.code})</span>
              {productCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {productCount} منتج
                </Badge>
              )}
            </div>
            {category.parent && (
              <p className="text-xs text-muted-foreground">
                تحت: {category.parent.name}
              </p>
            )}
          </div>

          {/* الحالة */}
          <Badge className={category.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
            {category.active ? 'نشط' : 'غير نشط'}
          </Badge>

          {/* عدد الأبناء */}
          {hasChildren && (
            <Badge variant="outline" className="text-lime-600 border-lime-300">
              {children.length} فرعي
            </Badge>
          )}

          {/* الإجراءات */}
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => handleEdit(category)}>
              <Settings className="h-4 w-4" />
            </Button>
            {!hasChildren && (
              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(category.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* التصنيفات الفرعية */}
        {isExpanded && hasChildren && (
          <div className="border-s-2 border-lime-200 dark:border-lime-800 ms-4">
            {children.map(child => (
              <CategoryTreeItem key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // إحصائيات
  const stats = {
    total: data.filter(c => c.active).length,
    parents: data.filter(c => c.active && !c.parentId).length,
    children: data.filter(c => c.active && c.parentId).length,
    withProducts: data.filter(c => c.active && (c._count?.products || 0) > 0).length,
  }

  const availableParents = getAvailableParents()

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-lime-500/10 flex items-center justify-center">
            <Layers className="h-6 w-6 text-lime-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة التصنيفات</h1>
            <p className="text-muted-foreground text-sm">تصنيفات هرمية للمنتجات</p>
          </div>
        </div>
        <Button 
          className="bg-gradient-to-l from-lime-500 to-lime-600" 
          onClick={() => { 
            setEditItem(null)
            const newCode = generateCode('CAT', data.map(c => c.code))
            setForm({ name: '', code: newCode, parentId: '' })
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          تصنيف جديد
        </Button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-gradient-to-l from-lime-500/10 to-green-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-lime-500/20 flex items-center justify-center">
                <Layers className="h-5 w-5 text-lime-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي التصنيفات</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-emerald-500/10 to-teal-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Layers className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تصنيفات رئيسية</p>
                <p className="text-xl font-bold">{stats.parents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-cyan-500/10 to-sky-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تصنيفات فرعية</p>
                <p className="text-xl font-bold">{stats.children}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-purple-500/10 to-pink-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">بها منتجات</p>
                <p className="text-xl font-bold">{stats.withProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* شجرة التصنيفات */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5 text-lime-500" />
              شجرة التصنيفات
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedCategories(new Set(data.map(c => c.id)))}
              >
                <ChevronDown className="h-4 w-4 ml-1" />
                توسيع الكل
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedCategories(new Set())}
              >
                <ChevronUp className="h-4 w-4 ml-1 rotate-90" />
                طي الكل
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rootCategories.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد تصنيفات</p>
              <Button size="sm" className="mt-2" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة تصنيف
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              {rootCategories.map(category => (
                <CategoryTreeItem key={category.id} category={category} />
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* نافذة الإضافة/التعديل */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-lime-500" />
              {editItem ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم *</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="اسم التصنيف"
              />
            </div>
            <div className="space-y-2">
              <Label>الكود *</Label>
              <Input 
                value={form.code} 
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="CAT-0001"
              />
            </div>
            <div className="space-y-2">
              <Label>التصنيف الأب (اختياري)</Label>
              <Select 
                value={form.parentId || 'none'} 
                onValueChange={(v) => setForm({ ...form, parentId: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="بدون أب (تصنيف رئيسي)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون أب (تصنيف رئيسي)</SelectItem>
                  {availableParents.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.parent ? `${c.parent.name} ← ` : ''}{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.parentId && (
              <div className="p-3 rounded-lg bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-800">
                <p className="text-sm text-lime-700 dark:text-lime-300">
                  سيتم إضافة هذا التصنيف كتصنيف فرعي تحت التصنيف المحدد
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button className="bg-gradient-to-l from-lime-500 to-lime-600" onClick={handleSave}>
              {editItem ? 'تحديث' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== WAREHOUSES ==============
function WarehousesManagement() {
  const [data, setData] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ name: '', code: '', address: '' })

  // جلب الشركة من المستخدم الحالي
  useEffect(() => {
    const userData = localStorage.getItem('erp_user')
    if (userData) {
      const user = JSON.parse(userData)
      if (user.companyId) {
        setSelectedCompanyId(user.companyId)
      }
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // إذا لم يكن هناك شركة من المستخدم، جلب أول شركة
      let companyId = selectedCompanyId
      if (!companyId) {
        const companiesRes = await fetch('/api/companies?limit=1')
        const companiesData = await companiesRes.json()
        if (companiesData.success && companiesData.data.length > 0) {
          companyId = companiesData.data[0].id
          setSelectedCompanyId(companyId)
          setCompanies(companiesData.data)
        }
      }
      
      if (companyId) {
        const warehousesRes = await fetch(`/api/warehouses?companyId=${companyId}&limit=100`)
        const warehousesData = await warehousesRes.json()
        if (warehousesData.success) setData(warehousesData.data)
      }
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  useEffect(() => { if (selectedCompanyId) fetchData() }, [selectedCompanyId])

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('الاسم والكود مطلوبان'); return }
    if (!selectedCompanyId) { toast.error('يرجى إضافة شركة أولاً'); return }
    try {
      const body = { ...form, companyId: selectedCompanyId }
      const url = editItem ? `/api/warehouses/${editItem.id}` : '/api/warehouses'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await res.json()
      if (result.success) { 
        toast.success(editItem ? 'تم تحديث المخزن' : 'تم إضافة المخزن')
        setDialogOpen(false)
        setEditItem(null)
        setForm({ name: '', code: '', address: '' })
        fetchData() 
      }
      else toast.error(result.error || 'فشل الحفظ')
    } catch { toast.error('حدث خطأ') }
  }

  const handleEdit = (item: any) => {
    setEditItem(item)
    setForm({ name: item.name, code: item.code, address: item.address || '' })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المخزن؟')) return
    try {
      const res = await fetch(`/api/warehouses?id=${id}&companyId=${selectedCompanyId}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) { toast.success('تم حذف المخزن'); fetchData() }
      else toast.error(result.error || 'فشل الحذف')
    } catch { toast.error('حدث خطأ') }
  }

  const columns = [
    { key: 'code', label: 'الكود' },
    { key: 'name', label: 'الاسم' },
    { key: 'address', label: 'العنوان' },
    { key: 'active', label: 'الحالة', render: (r: any) => <Badge className={r.active ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>{r.active ? 'نشط' : 'غير نشط'}</Badge> },
    { key: 'actions', label: 'إجراءات', render: (r: any) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => handleEdit(r)}><Settings className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center"><Warehouse className="h-6 w-6 text-amber-500" /></div>
          <div><h1 className="text-2xl font-bold">إدارة المخازن</h1><p className="text-muted-foreground text-sm">إضافة وتعديل وحذف المخازن</p></div>
        </div>
        <Button className="bg-gradient-to-l from-amber-500 to-amber-600" onClick={() => { 
          if (!selectedCompanyId) {
            toast.error('يرجى إضافة شركة أولاً')
            return
          }
          setEditItem(null)
          const newCode = generateCode('WH', data.map(w => w.code))
          setForm({ name: '', code: newCode, address: '' })
          setDialogOpen(true)
        }}><Plus className="h-4 w-4 ml-2" />مخزن جديد</Button>
      </div>
      
      {!selectedCompanyId && companies.length === 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="py-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <p className="text-amber-700 dark:text-amber-300 font-medium mb-2">لا توجد شركات</p>
            <p className="text-sm text-muted-foreground mb-4">يرجى إضافة شركة أولاً لإنشاء المخازن</p>
            <Button onClick={() => window.location.href = '/?view=companies'}>إضافة شركة</Button>
          </CardContent>
        </Card>
      )}
      
      {selectedCompanyId && (
        <Card><CardContent className="p-0"><DataTable data={data} columns={columns} loading={loading} /></CardContent></Card>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? 'تعديل مخزن' : 'إضافة مخزن جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>الكود *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="space-y-2"><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button><Button onClick={handleSave}>{editItem ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== INVOICES ==============
function InvoicesManagement() {
  const [data, setData] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [governorates, setGovernorates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [settings, setSettings] = useState({ taxRate: 15, showTax: true, discountEnabled: true })
  // حالات الإجراءات
  const [viewInvoice, setViewInvoice] = useState<any>(null)
  const [editInvoice, setEditInvoice] = useState<any>(null)
  const [returnInvoice, setReturnInvoice] = useState<any>(null)
  const [printReceiptsInvoice, setPrintReceiptsInvoice] = useState<any>(null)
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([])
  const [selectAllInstallments, setSelectAllInstallments] = useState(true)
  const [printInvoice, setPrintInvoice] = useState<any>(null)
  const [customerForm, setCustomerForm] = useState({
    name: '', phone: '', phone2: '', address: '',
    governorateId: '', cityId: '', areaId: '', agentId: '', 
    nationalId: '', creditLimit: 0, notes: ''
  })
  // حالة الرصيد الافتتاحي للعميل
  const [hasOpeningBalance, setHasOpeningBalance] = useState(false)
  const [openingBalanceItems, setOpeningBalanceItems] = useState<{date: string; amount: number; goodsNotes: string}[]>([
    { date: new Date().toISOString().split('T')[0], amount: 0, goodsNotes: '' }
  ])
  // حساب إجمالي الرصيد الافتتاحي
  const totalOpeningBalance = openingBalanceItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  // دوال الرصيد الافتتاحي
  const addOpeningBalanceItem = () => {
    setOpeningBalanceItems([...openingBalanceItems, {
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      goodsNotes: ''
    }])
  }
  const removeOpeningBalanceItem = (index: number) => {
    if (openingBalanceItems.length > 1) {
      setOpeningBalanceItems(openingBalanceItems.filter((_, i) => i !== index))
    }
  }
  const updateOpeningBalanceItem = (index: number, field: string, value: any) => {
    const updated = [...openingBalanceItems]
    updated[index] = { ...updated[index], [field]: value }
    setOpeningBalanceItems(updated)
  }
  
  const [form, setForm] = useState({
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentType: 'CASH', // CASH, CREDIT, INSTALLMENT
    agentId: '',
    branchId: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0, notes: '' }],
    discount: 0,
    downPayment: 0,
    installmentMonths: 0,
    installmentAmount: 0,
    firstInstallmentDate: '',
    notes: ''
  })
  const currency = useCurrency()
  const { formatDate, formatDateTime } = useDateFormat()
  
  // العميل المحدد
  const selectedCustomer = customers.find(c => c.id === form.customerId)
  
  // تصفية العملاء بناءً على البحث (الاسم، الكود، الهاتف)
  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true
    const search = customerSearch.toLowerCase()
    return (
      c.name?.toLowerCase().includes(search) ||
      c.code?.toLowerCase().includes(search) ||
      c.phone?.includes(search) ||
      c.phone2?.includes(search)
    )
  }).slice(0, 20) // تحديد النتائج بـ 20

  // تحميل الإعدادات
  useEffect(() => {
    const savedSettings = localStorage.getItem('erp_settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings({ 
        taxRate: parsed.taxRate || 15, 
        showTax: parsed.showTax !== false,
        discountEnabled: parsed.discountEnabled !== false
      })
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invoicesRes, customersRes, productsRes, agentsRes, branchesRes, governoratesRes, companiesRes, citiesRes, areasRes] = await Promise.all([
        fetch('/api/invoices?limit=100'),
        fetch('/api/customers?limit=100'),
        fetch('/api/products?limit=100'),
        fetch('/api/users?role=AGENT&limit=100'),
        fetch('/api/branches?limit=100'),
        fetch('/api/governorates?active=true'),
        fetch('/api/companies?limit=100'),
        fetch('/api/cities?limit=500'),
        fetch('/api/areas?limit=1000')
      ])
      const invoicesData = await invoicesRes.json()
      const customersData = await customersRes.json()
      const productsData = await productsRes.json()
      const agentsData = await agentsRes.json()
      const branchesData = await branchesRes.json()
      const governoratesData = await governoratesRes.json()
      const companiesData = await companiesRes.json()
      const citiesData = await citiesRes.json()
      const areasData = await areasRes.json()
      if (invoicesData.success) setData(invoicesData.data)
      if (customersData.success) setCustomers(customersData.data)
      if (productsData.success) setProducts(productsData.data)
      if (agentsData.success) setAgents(agentsData.data)
      if (branchesData.success) setBranches(branchesData.data)
      if (governoratesData.success) setGovernorates(governoratesData.data || [])
      if (companiesData.success) setCompanies(companiesData.data || [])
      if (citiesData.success) setCities(citiesData.data || [])
      if (areasData.success) setAreas(areasData.data || [])
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])
  
  // تحديث المدن عند تغيير المحافظة
  useEffect(() => {
    if (customerForm.governorateId && cities.length > 0) {
      // المدن تم تحميلها مسبقاً، لا حاجة لتحميلها مرة أخرى
    }
  }, [customerForm.governorateId, cities.length])
  
  // تحديث المناطق عند تغيير المدينة
  useEffect(() => {
    if (customerForm.cityId && areas.length > 0) {
      // المناطق تم تحميلها مسبقاً، لا حاجة لتحميلها مرة أخرى
    }
  }, [customerForm.cityId, areas.length])

  // عند اختيار العميل - ملء المندوب تلقائياً
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    setForm({ 
      ...form, 
      customerId,
      agentId: customer?.agentId || ''
    })
  }
  
  // إضافة عميل جديد سريع
  const handleAddCustomer = async () => {
    if (!customerForm.name || !customerForm.phone) {
      toast.error('اسم العميل والهاتف مطلوبان')
      return
    }
    
    // التحقق من الرصيد الافتتاحي
    if (hasOpeningBalance && totalOpeningBalance <= 0) {
      toast.error('يجب إدخال مبالغ للأقساط عند تفعيل الرصيد الافتتاحي')
      return
    }
    
    // التحقق من وجود شركة
    if (companies.length === 0) {
      toast.error('لا توجد شركات. يرجى إضافة شركة أولاً')
      return
    }
    
    const companyId = companies[0].id
    
    // توليد كود العميل تلقائياً
    const existingCodes = customers.filter(c => c.companyId === companyId).map(c => c.code)
    const code = generateCode('CUST', existingCodes)
    
    try {
      // إضافة بيانات الرصيد الافتتاحي
      const body: any = { ...customerForm, companyId, code }
      if (hasOpeningBalance) {
        body.openingBalance = {
          items: openingBalanceItems.filter(item => item.amount > 0),
          total: totalOpeningBalance
        }
      }
      
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const result = await res.json()
      if (result.success) {
        toast.success(hasOpeningBalance 
          ? `تم إضافة العميل برصيد افتتاحي ${formatCurrency(totalOpeningBalance, currency.symbol)}` 
          : 'تم إضافة العميل بنجاح')
        // إضافة العميل للقائمة واختياره
        setCustomers([...customers, result.data])
        setForm({ ...form, customerId: result.data.id, agentId: result.data.agentId || '' })
        setShowCustomerDialog(false)
        setCustomerForm({ name: '', phone: '', phone2: '', address: '', governorateId: '', cityId: '', areaId: '', agentId: '', nationalId: '', creditLimit: 0, notes: '' })
        // إعادة تعيين الرصيد الافتتاحي
        setHasOpeningBalance(false)
        setOpeningBalanceItems([{ date: new Date().toISOString().split('T')[0], amount: 0, goodsNotes: '' }])
      } else {
        toast.error(result.error || 'فشل إضافة العميل')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  // حساب رقم الفاتورة التالي
  const nextInvoiceNumber = data.length > 0 
    ? `INV-${String(parseInt(data[0].invoiceNumber?.replace('INV-', '') || '0') + 1).padStart(6, '0')}`
    : 'INV-000001'

  // الحسابات
  const subtotal = form.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const taxRate = settings.taxRate || 15
  const taxAmount = settings.showTax ? Math.round((subtotal - form.discount) * taxRate / 100) : 0
  const total = subtotal - form.discount + taxAmount
  const remaining = total - form.downPayment
  const totalQuantity = form.items.reduce((sum, item) => sum + item.quantity, 0)
  
  // حساب الأقساط - المنطق الصحيح
  // المتبقي = الإجمالي - الدفعة المقدمة
  // عدد الأقساط = المتبقي ÷ قيمة القسط (تقريب لأعلى)
  // لا يزيد عدد الأقساط عن عدد الشهور المدخل
  // الفرق (زيادة أو نقص) يضاف/يخصم من القسط الأخير

  const monthlyInstallment = form.installmentAmount || 0

  // حساب عدد الأقساط المطلوبة بناءً على قيمة القسط
  const requiredMonths = monthlyInstallment > 0 && remaining > 0
    ? Math.ceil(remaining / monthlyInstallment)
    : 0

  // عدد الأقساط الفعلي = الأقل بين المطلوب والشهور المدخلة
  const actualMonths = form.installmentMonths > 0
    ? Math.min(requiredMonths, form.installmentMonths)
    : requiredMonths

  // حساب القسط الأخير (يشمل الفرق)
  const lastInstallmentAmount = actualMonths > 0 && monthlyInstallment > 0 && remaining > 0
    ? remaining - (monthlyInstallment * (actualMonths - 1))
    : 0

  // توليد جدول الأقساط
  const generateInstallments = () => {
    if (actualMonths <= 0 || monthlyInstallment <= 0 || remaining <= 0) return []

    const installments = []
    let currentDate = form.firstInstallmentDate ? new Date(form.firstInstallmentDate) : new Date()

    for (let i = 1; i <= actualMonths; i++) {
      const dueDate = new Date(currentDate)
      dueDate.setMonth(dueDate.getMonth() + (i - 1))

      // القسط الأخير يشمل الفرق (سواء زيادة أو نقص)
      const installmentAmount = i === actualMonths ? lastInstallmentAmount : monthlyInstallment

      installments.push({
        number: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: installmentAmount,
        isLast: i === actualMonths
      })
    }
    return installments
  }

  const installments = form.paymentType === 'INSTALLMENT' && actualMonths > 0 && monthlyInstallment > 0 && remaining > 0
    ? generateInstallments()
    : []

  // تحديد حالة الفاتورة
  const getInvoiceStatus = () => {
    if (form.downPayment >= total) return { label: 'محصلة بالكامل', color: 'text-green-600' }
    if (form.downPayment > 0) return { label: 'تحصيل جزئي', color: 'text-blue-600' }
    return { label: 'غير محصلة', color: 'text-red-600' }
  }
  const invoiceStatus = getInvoiceStatus()

  const handleAddItem = () => {
    setForm({ ...form, items: [...form.items, { productId: '', quantity: 1, unitPrice: 0, notes: '' }] })
  }

  const handleRemoveItem = (index: number) => {
    if (form.items.length > 1) {
      setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
    }
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...form.items]
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      newItems[index] = { ...newItems[index], productId: value, unitPrice: product?.sellPrice || 0 }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setForm({ ...form, items: newItems })
  }

  const handleSaveInvoice = async () => {
    if (!form.customerId) { toast.error('يرجى اختيار العميل'); return }
    if (form.items.some(item => !item.productId || item.quantity <= 0)) { toast.error('يرجى ملء جميع أصناف الفاتورة'); return }
    
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: form.customerId,
          invoiceDate: form.invoiceDate,
          type: form.paymentType,
          agentId: form.agentId || null,
          branchId: form.branchId || null,
          items: form.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          discount: form.discount,
          paidAmount: form.downPayment,
          notes: form.notes,
          installments: form.paymentType === 'INSTALLMENT' ? installments : null,
        })
      })
      const result = await res.json()
      if (result.success) {
        toast.success('تم إنشاء الفاتورة بنجاح')
        setIsCreating(false)
        setForm({
          customerId: '', invoiceDate: new Date().toISOString().split('T')[0], paymentType: 'CASH',
          agentId: '', branchId: '', items: [{ productId: '', quantity: 1, unitPrice: 0, notes: '' }],
          discount: 0, downPayment: 0, installmentMonths: 0, installmentAmount: 0, firstInstallmentDate: '', notes: ''
        })
        fetchData()
      } else {
        toast.error(result.error || 'فشل إنشاء الفاتورة')
      }
    } catch { toast.error('حدث خطأ') }
  }

  const statusColors: any = { pending: 'bg-yellow-500/10 text-yellow-600', paid: 'bg-green-500/10 text-green-600', partial: 'bg-blue-500/10 text-blue-600', cancelled: 'bg-red-500/10 text-red-600' }
  const statusLabels: any = { pending: 'معلقة', paid: 'مدفوعة', partial: 'جزئية', cancelled: 'ملغاة' }

  // شاشة إنشاء فاتورة جديدة
  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Receipt className="h-6 w-6 text-emerald-500" /></div>
            <div>
              <h1 className="text-2xl font-bold">فاتورة جديدة</h1>
              <p className="text-muted-foreground text-sm">رقم الفاتورة: <span className="font-mono font-bold text-emerald-600">{nextInvoiceNumber}</span></p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCreating(false)}><X className="h-4 w-4 ml-2" />إلغاء</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* القسم الرئيسي */}
          <div className="lg:col-span-2 space-y-4">
            {/* الصف الأول: التاريخ - العميل - رقم الفاتورة */}
            <Card>
              <CardContent className="p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">التاريخ</Label>
                    <Input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">بحث العميل *</Label>
                    <div className="flex gap-1 relative">
                      <div className="flex-1 relative">
                        <Input 
                          placeholder="ابحث بالاسم، الكود، أو الهاتف..."
                          value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.code})` : customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value)
                            setShowCustomerDropdown(true)
                            if (!e.target.value) {
                              setForm({ ...form, customerId: '' })
                            }
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          className="pr-8"
                        />
                        <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        
                        {/* قائمة النتائج */}
                        {showCustomerDropdown && customerSearch && !selectedCustomer && (
                          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredCustomers.length === 0 ? (
                              <div className="p-3 text-center text-muted-foreground text-sm">
                                لا توجد نتائج
                              </div>
                            ) : (
                              filteredCustomers.map((c) => (
                                <div 
                                  key={c.id}
                                  className="p-3 hover:bg-muted cursor-pointer border-b last:border-0"
                                  onClick={() => {
                                    handleCustomerSelect(c.id)
                                    setCustomerSearch('')
                                    setShowCustomerDropdown(false)
                                  }}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">{c.name}</p>
                                      <p className="text-xs text-muted-foreground">كود: {c.code}</p>
                                    </div>
                                    <div className="text-left">
                                      <p className="text-xs text-cyan-600">{c.phone}</p>
                                      {c.phone2 && <p className="text-xs text-muted-foreground">{c.phone2}</p>}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <Button type="button" size="icon" variant="outline" className="shrink-0" onClick={() => setShowCustomerDialog(true)} title="إضافة عميل جديد">
                        <Plus className="h-4 w-4 text-cyan-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">رقم الفاتورة</Label>
                    <Input value={nextInvoiceNumber} disabled className="bg-muted font-mono" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* بيانات العميل - تظهر بعد اختيار العميل */}
            {selectedCustomer && (
              <Card className="bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800">
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-cyan-500" />
                    بيانات العميل: {selectedCustomer.name}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mr-auto text-xs"
                      onClick={() => setForm({ ...form, customerId: '' })}
                    >
                      <X className="h-3 w-3 ml-1" />تغيير
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">كود: {selectedCustomer.code}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">المحافظة</p>
                        <p className="text-sm font-medium">{selectedCustomer.governorate?.name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">المركز</p>
                        <p className="text-sm font-medium">{selectedCustomer.city?.name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">المنطقة</p>
                        <p className="text-sm font-medium">{selectedCustomer.area?.name || selectedCustomer.zone?.name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">العنوان</p>
                        <p className="text-sm font-medium">{selectedCustomer.address || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">الهاتف</p>
                        <p className="text-sm font-medium">{selectedCustomer.phone || '-'}{selectedCustomer.phone2 && ` / ${selectedCustomer.phone2}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">المندوب</p>
                        <p className="text-sm font-medium">{selectedCustomer.agent?.name || agents.find(a => a.id === selectedCustomer.agentId)?.name || '-'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* الصف الثاني: طريقة الدفع - المندوب - الفرع */}
            <Card>
              <CardContent className="p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">طريقة الدفع</Label>
                    <Select value={form.paymentType} onValueChange={(v) => setForm({ ...form, paymentType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">نقداً</SelectItem>
                        <SelectItem value="CREDIT">آجل</SelectItem>
                        <SelectItem value="INSTALLMENT">تقسيط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">المندوب</Label>
                    <Select value={form.agentId} onValueChange={(v) => setForm({ ...form, agentId: v })}>
                      <SelectTrigger><SelectValue placeholder="اختر المندوب" /></SelectTrigger>
                      <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">الفرع</Label>
                    <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                      <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
                      <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* جدول المنتجات */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base">جدول المنتجات</CardTitle>
                <Button size="sm" variant="outline" onClick={handleAddItem}><Plus className="h-4 w-4 ml-1" />إضافة سطر</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-center w-24">رمز المادة</TableHead>
                        <TableHead className="text-center">اسم المادة</TableHead>
                        <TableHead className="text-center w-20">الكمية</TableHead>
                        <TableHead className="text-center w-20">الوحدة</TableHead>
                        <TableHead className="text-center w-28">الأفرادي</TableHead>
                        <TableHead className="text-center w-28">الإجمالي</TableHead>
                        <TableHead className="text-center w-32">بيان</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.items.map((item, index) => {
                        const product = products.find(p => p.id === item.productId)
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Input className="h-9 text-center text-xs" value={product?.sku || ''} disabled />
                            </TableCell>
                            <TableCell>
                              <Select value={item.productId} onValueChange={(v) => handleItemChange(index, 'productId', v)}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="اختر" /></SelectTrigger>
                                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-9 text-center" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} min={1} />
                            </TableCell>
                            <TableCell>
                              <Input className="h-9 text-center text-xs" value={product?.unit || 'قطعة'} disabled />
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-9 text-center" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} />
                            </TableCell>
                            <TableCell>
                              <div className="h-9 px-2 flex items-center justify-center bg-muted rounded font-medium text-sm">{formatCurrency(item.quantity * item.unitPrice, currency.symbol)}</div>
                            </TableCell>
                            <TableCell>
                              <Input className="h-9 text-xs" value={item.notes} onChange={(e) => handleItemChange(index, 'notes', e.target.value)} placeholder="بيان..." />
                            </TableCell>
                            <TableCell>
                              {form.items.length > 1 && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleRemoveItem(index)}><X className="h-4 w-4" /></Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* قسم الأقساط */}
            {form.paymentType === 'INSTALLMENT' && (
              <Card className="border-sky-200 dark:border-sky-800">
                <CardHeader className="bg-sky-50 dark:bg-sky-950/30 py-3">
                  <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-5 w-5 text-sky-500" />جدول الأقساط</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* ملخص الأقساط - الدفعة المقدمة للقراءة فقط */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">إجمالي الفاتورة</p>
                      <p className="font-bold">{formatCurrency(total, currency.symbol)}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">المقدم (من ملخص الفاتورة)</p>
                      <p className="font-bold text-green-600 mt-1">{formatCurrency(form.downPayment, currency.symbol)}</p>
                      <p className="text-xs text-muted-foreground mt-1">⬅ يحدد من ملخص الفاتورة</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">المتبقي للتقسيط</p>
                      <p className="font-bold text-amber-600">{formatCurrency(remaining, currency.symbol)}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">عدد الأشهر *</p>
                      <Input type="number" className="h-8 text-center mt-1" value={form.installmentMonths || ''} onChange={(e) => setForm({ ...form, installmentMonths: parseInt(e.target.value) || 0 })} min={1} placeholder="0" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">قيمة القسط الشهري *</p>
                      <Input type="number" className="h-9 text-center font-bold" value={form.installmentAmount || ''} onChange={(e) => setForm({ ...form, installmentAmount: parseFloat(e.target.value) || 0 })} placeholder="أدخل قيمة القسط" />
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">تاريخ القسط الأول</p>
                      <Input type="date" className="h-9" value={form.firstInstallmentDate} onChange={(e) => setForm({ ...form, firstInstallmentDate: e.target.value })} />
                    </div>
                  </div>

                  {/* رسالة تنبيه */}
                  {actualMonths > 0 && monthlyInstallment > 0 && remaining > 0 && (
                    <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">عدد الأقساط المطلوبة:</span>
                        <span className="font-bold text-sky-600">{requiredMonths} قسط</span>
                      </div>
                      {form.installmentMonths > 0 && requiredMonths > form.installmentMonths && (
                        <div className="flex justify-between items-center text-amber-600">
                          <span className="text-sm">⚠️ محدد بـ:</span>
                          <span className="font-bold">{form.installmentMonths} قسط (الحد الأقصى)</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm">عدد الأقساط الفعلي:</span>
                        <span className="font-bold text-green-600">{actualMonths} قسط</span>
                      </div>
                      {lastInstallmentAmount !== monthlyInstallment && (
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">قيمة القسط الشهري:</span>
                            <span className="font-medium">{formatCurrency(monthlyInstallment, currency.symbol)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm">القسط الأخير (مع الفرق):</span>
                            <span className="font-bold text-amber-600">{formatCurrency(lastInstallmentAmount, currency.symbol)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* رسالة عند عدم إدخال البيانات */}
                  {(actualMonths <= 0 || monthlyInstallment <= 0) && (
                    <div className="p-4 bg-muted/20 rounded-lg text-center text-muted-foreground">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">أدخل قيمة القسط الشهري لحساب الأقساط تلقائياً</p>
                      <p className="text-xs mt-1">عدد الشهور اختياري - لتحديد حد أقصى لعدد الأقساط</p>
                    </div>
                  )}
                  
                  {/* جدول الأقساط - يظهر فقط عند إدخال البيانات */}
                  {installments.length > 0 && (
                    <>
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-center w-16">القسط</TableHead>
                              <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                              <TableHead className="text-center">المبلغ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {installments.map((inst, i) => (
                              <TableRow key={i} className={inst.isLast ? 'bg-sky-50 dark:bg-sky-950/30' : ''}>
                                <TableCell className="text-center font-medium">
                                  {inst.isLast ? <Badge className="bg-sky-500">الأخير</Badge> : inst.number}
                                </TableCell>
                                <TableCell className="text-center">{formatDate(inst.dueDate)}</TableCell>
                                <TableCell className="text-center font-medium">{formatCurrency(inst.amount, currency.symbol)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* ملخص الأقساط */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg border border-sky-200 dark:border-sky-800">
                          <span className="text-sm font-medium">إجمالي الأقساط:</span>
                          <span className="font-bold text-sky-600">{formatCurrency(installments.reduce((sum, i) => sum + i.amount, 0), currency.symbol)}</span>
                        </div>
                        {/* التحقق من صحة الحساب */}
                        {remaining > 0 && (
                          <div className={`flex justify-between items-center p-2 rounded-lg text-sm ${
                            Math.abs(installments.reduce((sum, i) => sum + i.amount, 0) - remaining) < 1
                              ? 'bg-green-50 dark:bg-green-950/30 text-green-600'
                              : 'bg-red-50 dark:bg-red-950/30 text-red-600'
                          }`}>
                            <span>المتبقي للتقسيط:</span>
                            <span className="font-bold">{formatCurrency(remaining, currency.symbol)}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ملاحظات */}
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-base">ملاحظات</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات إضافية..." rows={2} />
              </CardContent>
            </Card>
          </div>

          {/* ملخص الفاتورة */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader className="py-3"><CardTitle className="text-base">ملخص الفاتورة</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">مجموع المنتجات</span>
                  <span className="font-medium">{totalQuantity} قطعة</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                  <span>{formatCurrency(subtotal, currency.symbol)}</span>
                </div>
                {settings.discountEnabled !== false && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">الخصم</span>
                    <Input type="number" className="w-24 h-8 text-left" value={form.discount} onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })} />
                  </div>
                )}
                {settings.showTax && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الضريبة ({taxRate}%)</span>
                    <span>{formatCurrency(taxAmount, currency.symbol)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>الإجمالي</span>
                  <span className="text-emerald-600">{formatCurrency(total, currency.symbol)}</span>
                </div>
                
                {form.paymentType !== 'CASH' && (
                  <>
                    <div className="border-t pt-3 flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">دفعة مقدمة</span>
                      <Input type="number" className="w-24 h-8 text-left" value={form.downPayment} onChange={(e) => setForm({ ...form, downPayment: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الباقي</span>
                      <span className="font-bold text-amber-600">{formatCurrency(remaining, currency.symbol)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">حالة الفاتورة</span>
                      <Badge className={invoiceStatus.color === 'text-green-600' ? 'bg-green-500/10 text-green-600' : invoiceStatus.color === 'text-blue-600' ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-600'}>{invoiceStatus.label}</Badge>
                    </div>
                  </>
                )}
                
                {/* التفقيط */}
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-1">التفقيط:</p>
                  <p className="text-xs leading-relaxed bg-muted/30 p-2 rounded">{formatCurrencyArabic(total, currency.name || 'ريال')}</p>
                </div>
              </CardContent>
              
              <CardContent className="pt-0 space-y-2">
                <Button className="w-full bg-gradient-to-l from-emerald-500 to-emerald-600 h-12" onClick={handleSaveInvoice}>
                  <Save className="h-5 w-5 ml-2" />حفظ الفاتورة
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setIsCreating(false)}>
                  <X className="h-4 w-4 ml-2" />إلغاء
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* نافذة إضافة عميل جديد - داخل شاشة الفاتورة */}
        <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-cyan-500" />
                إضافة عميل جديد
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم *</Label>
                  <Input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="اسم العميل" />
                </div>
                <div className="space-y-2">
                  <Label>الهاتف *</Label>
                  <Input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="رقم الهاتف" />
                </div>
                <div className="space-y-2">
                  <Label>هاتف إضافي</Label>
                  <Input value={customerForm.phone2} onChange={(e) => setCustomerForm({ ...customerForm, phone2: e.target.value })} placeholder="رقم هاتف آخر" />
                </div>
                <div className="space-y-2">
                  <Label>الرقم القومي</Label>
                  <Input value={customerForm.nationalId} onChange={(e) => setCustomerForm({ ...customerForm, nationalId: e.target.value })} placeholder="الرقم القومي" />
                </div>
                <div className="space-y-2">
                  <Label>المحافظة</Label>
                  <Select value={customerForm.governorateId} onValueChange={(v) => setCustomerForm({ ...customerForm, governorateId: v, cityId: '', areaId: '' })}>
                    <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                    <SelectContent>
                      {governorates.map((g) => <SelectItem key={g.id} value={g.id}>{g.nameAr || g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المدينة/المركز</Label>
                  <Select value={customerForm.cityId} onValueChange={(v) => setCustomerForm({ ...customerForm, cityId: v, areaId: '' })} disabled={!customerForm.governorateId}>
                    <SelectTrigger><SelectValue placeholder={customerForm.governorateId ? "اختر المدينة" : "اختر المحافظة أولاً"} /></SelectTrigger>
                    <SelectContent>
                      {cities.filter(c => c.governorateId === customerForm.governorateId).map((c) => <SelectItem key={c.id} value={c.id}>{c.nameAr || c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المنطقة</Label>
                  <Select value={customerForm.areaId} onValueChange={(v) => setCustomerForm({ ...customerForm, areaId: v })} disabled={!customerForm.cityId}>
                    <SelectTrigger><SelectValue placeholder={customerForm.cityId ? "اختر المنطقة" : "اختر المدينة أولاً"} /></SelectTrigger>
                    <SelectContent>
                      {areas.filter(a => a.cityId === customerForm.cityId).map((a) => <SelectItem key={a.id} value={a.id}>{a.nameAr || a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المندوب</Label>
                  <Select value={customerForm.agentId} onValueChange={(v) => setCustomerForm({ ...customerForm, agentId: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر المندوب" /></SelectTrigger>
                    <SelectContent>
                      {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>حد الائتمان</Label>
                  <Input type="number" value={customerForm.creditLimit || 0} onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: parseFloat(e.target.value) || 0 })} placeholder="0" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>العنوان</Label>
                  <Input value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} placeholder="العنوان التفصيلي" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>ملاحظات</Label>
                  <Textarea value={customerForm.notes} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} placeholder="ملاحظات..." rows={2} />
                </div>
                
                {/* قسم الرصيد الافتتاحي */}
                <div className="col-span-2 space-y-4 p-4 rounded-lg bg-gradient-to-l from-amber-500/5 to-orange-500/5 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-amber-500" />
                      <Label className="text-amber-600 font-medium">رصيد افتتاحي للعميل</Label>
                    </div>
                    <Switch
                      checked={hasOpeningBalance}
                      onCheckedChange={setHasOpeningBalance}
                    />
                  </div>
                  
                  {hasOpeningBalance && (
                    <div className="space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">تسجيل أقساط الرصيد الافتتاحي</span>
                        <Button type="button" variant="outline" size="sm" onClick={addOpeningBalanceItem}>
                          <Plus className="h-4 w-4 ml-1" />إضافة قسط
                        </Button>
                      </div>
                      
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {openingBalanceItems.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-background rounded-lg border">
                            <div className="col-span-1 flex items-center justify-center">
                              <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                            </div>
                            <div className="col-span-3">
                              <Label className="text-xs text-muted-foreground">التاريخ</Label>
                              <Input
                                type="date"
                                value={item.date}
                                onChange={(e) => updateOpeningBalanceItem(index, 'date', e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-3">
                              <Label className="text-xs text-muted-foreground">المبلغ</Label>
                              <Input
                                type="number"
                                value={item.amount || ''}
                                onChange={(e) => updateOpeningBalanceItem(index, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-4">
                              <Label className="text-xs text-muted-foreground">نوع البضاعة / ملاحظات</Label>
                              <Input
                                value={item.goodsNotes}
                                onChange={(e) => updateOpeningBalanceItem(index, 'goodsNotes', e.target.value)}
                                placeholder="وصف البضاعة..."
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-1 flex items-end justify-center pb-1">
                              {openingBalanceItems.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  onClick={() => removeOpeningBalanceItem(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* إجمالي الرصيد */}
                      <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                        <span className="font-medium text-amber-700">إجمالي الرصيد المستحق</span>
                        <span className="text-xl font-bold text-amber-600">{formatCurrency(totalOpeningBalance, currency.symbol)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>إلغاء</Button>
              <Button className="bg-gradient-to-l from-cyan-500 to-cyan-600" onClick={handleAddCustomer}>
                <Plus className="h-4 w-4 ml-2" />إضافة العميل
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // حذف الفاتورة
  const handleDeleteInvoice = async (invoice: any) => {
    if (!confirm(`هل أنت متأكد من حذف الفاتورة ${invoice.invoiceNumber}؟`)) return
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        toast.success('تم حذف الفاتورة')
        fetchData()
      } else {
        toast.error(result.error || 'فشل الحذف')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  // إنشاء مرتجع
  const handleCreateReturn = async () => {
    if (!returnInvoice) return
    
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: returnInvoice.id,
          customerId: returnInvoice.customerId,
          branchId: returnInvoice.branchId,
          agentId: returnInvoice.agentId,
          items: returnInvoice.items?.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          total: returnInvoice.items?.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0) || 0,
          reason: 'مرتجع من الفاتورة'
        })
      })
      const result = await res.json()
      if (result.success) {
        toast.success('تم إنشاء المرتجع بنجاح')
        setReturnInvoice(null)
        fetchData()
      } else {
        toast.error(result.error || 'فشل إنشاء المرتجع')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  // طباعة جدول الأقساط
  const handlePrintInstallments = (invoice: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const customer = invoice.customer || {}
    const installments = invoice.installments || []
    const paidAmount = invoice.paidAmount || 0

    // حساب المحصل والمتبقي لكل قسط
    let cumulativePaid = paidAmount
    let cumulativeRemaining = invoice.total

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>جدول أقساط - ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .header p { color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
          .info-box h3 { font-size: 14px; color: #666; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          .info-box p { margin: 5px 0; font-size: 14px; }
          .info-box .label { color: #666; }
          .info-box .value { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
          th { background: #f5f5f5; font-weight: bold; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
          .summary-item { text-align: center; }
          .summary-item .label { font-size: 12px; color: #666; }
          .summary-item .value { font-size: 18px; font-weight: bold; color: #333; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>جدول أقساط</h1>
          <p>فاتورة رقم: ${invoice.invoiceNumber}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>بيانات العميل</h3>
            <p><span class="label">الاسم:</span> <span class="value">${customer.name || '-'}</span></p>
            <p><span class="label">الهاتف:</span> <span class="value">${customer.phone || '-'}</span></p>
            <p><span class="label">العنوان:</span> <span class="value">${customer.address || '-'}</span></p>
          </div>
          <div class="info-box">
            <h3>بيانات الفاتورة</h3>
            <p><span class="label">رقم الفاتورة:</span> <span class="value">${invoice.invoiceNumber}</span></p>
            <p><span class="label">التاريخ:</span> <span class="value">${formatDate(invoice.invoiceDate)}</span></p>
            <p><span class="label">إجمالي الفاتورة:</span> <span class="value">${invoice.total?.toLocaleString()} ر.س</span></p>
            <p><span class="label">الدفعة المقدمة:</span> <span class="value">${paidAmount.toLocaleString()} ر.س</span></p>
            <p><span class="label">المتبقي:</span> <span class="value">${(invoice.total - paidAmount).toLocaleString()} ر.س</span></p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>القسط</th>
              <th>تاريخ الاستحقاق</th>
              <th>قيمة القسط</th>
              <th>المحصل</th>
              <th>المتبقي</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${installments.length > 0 ? installments.map((inst: any, i: number) => {
              cumulativeRemaining -= inst.amount
              const status = inst.paid ? 'مدفوع' : inst.partiallyPaid ? 'جزئي' : new Date(inst.dueDate) < new Date() ? 'متأخر' : 'معلق'
              const statusColor = inst.paid ? 'green' : inst.partiallyPaid ? 'blue' : new Date(inst.dueDate) < new Date() ? 'red' : 'orange'
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td>${formatDate(inst.dueDate)}</td>
                  <td>${inst.amount?.toLocaleString()} ر.س</td>
                  <td>${(inst.paidAmount || 0).toLocaleString()} ر.س</td>
                  <td>${(inst.amount - (inst.paidAmount || 0)).toLocaleString()} ر.س</td>
                  <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
                </tr>
              `
            }).join('') : `
              <tr>
                <td colspan="6" style="color: #999;">لا توجد أقساط</td>
              </tr>
            `}
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-item">
            <div class="label">إجمالي الأقساط</div>
            <div class="value">${installments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0).toLocaleString()} ر.س</div>
          </div>
          <div class="summary-item">
            <div class="label">إجمالي المحصل</div>
            <div class="value">${(paidAmount + installments.reduce((sum: number, i: any) => sum + (i.paidAmount || 0), 0)).toLocaleString()} ر.س</div>
          </div>
          <div class="summary-item">
            <div class="label">إجمالي المتبقي</div>
            <div class="value">${(invoice.remainingAmount || 0).toLocaleString()} ر.س</div>
          </div>
        </div>
        
        <div class="footer">
          <p>تم الطباعة في: ${formatDateTime(new Date())}</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  const columns = [
    { key: 'invoiceNumber', label: 'الرقم' },
    { key: 'invoiceDate', label: 'التاريخ', render: (r: any) => formatDate(r.invoiceDate) },
    { key: 'customer', label: 'العميل', render: (r: any) => r.customer?.name || '-' },
    { key: 'total', label: 'المبلغ', render: (r: any) => formatCurrency(r.total, currency.symbol) },
    { key: 'type', label: 'النوع', render: (r: any) => <Badge className={r.type === 'CASH' ? 'bg-green-500/10 text-green-600' : r.type === 'INSTALLMENT' ? 'bg-sky-500/10 text-sky-600' : 'bg-amber-500/10 text-amber-600'}>{r.type === 'CASH' ? 'نقدي' : r.type === 'INSTALLMENT' ? 'تقسيط' : 'آجل'}</Badge> },
    { key: 'status', label: 'الحالة', render: (r: any) => <Badge className={statusColors[r.status] || statusColors.pending}>{statusLabels[r.status] || r.status}</Badge> },
    { key: 'actions', label: 'الإجراءات', render: (r: any) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" title="عرض" onClick={() => setViewInvoice(r)}><Search className="h-4 w-4 text-blue-500" /></Button>
        <Button size="sm" variant="ghost" title="تعديل" onClick={() => setEditInvoice(r)}><Settings className="h-4 w-4 text-amber-500" /></Button>
        {r.type === 'INSTALLMENT' && (
          <>
            <Button size="sm" variant="ghost" title="طباعة إيصالات الأقساط" onClick={() => {
              setPrintReceiptsInvoice(r)
              setSelectedInstallments([])
              setSelectAllInstallments(true)
            }}><Receipt className="h-4 w-4 text-green-500" /></Button>
            <Button size="sm" variant="ghost" title="جدول الأقساط" onClick={() => handlePrintInstallments(r)}><Printer className="h-4 w-4 text-sky-500" /></Button>
          </>
        )}
        <Button size="sm" variant="ghost" title="مرتجع" onClick={() => setReturnInvoice(r)}><RotateCcw className="h-4 w-4 text-orange-500" /></Button>
        <Button size="sm" variant="ghost" title="حذف" className="text-red-500" onClick={() => handleDeleteInvoice(r)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Receipt className="h-6 w-6 text-emerald-500" /></div>
          <div><h1 className="text-2xl font-bold">إدارة الفواتير</h1><p className="text-muted-foreground text-sm">إضافة وتعديل الفواتير</p></div>
        </div>
        <Button className="bg-gradient-to-l from-emerald-500 to-emerald-600" onClick={() => setIsCreating(true)}><Plus className="h-4 w-4 ml-2" />فاتورة جديدة</Button>
        <ExportButton entity="invoices" />
      </div>
      <Card><CardContent className="p-0"><DataTable data={data} columns={columns} loading={loading} /></CardContent></Card>

      {/* نافذة عرض تفاصيل الفاتورة */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
              تفاصيل الفاتورة {viewInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              {/* بيانات العميل */}
              <Card>
                <CardHeader className="py-3 bg-cyan-50 dark:bg-cyan-950/30">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-cyan-500" />
                    بيانات العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">الاسم</p>
                      <p className="font-medium">{viewInvoice.customer?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">الهاتف</p>
                      <p className="font-medium">{viewInvoice.customer?.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">العنوان</p>
                      <p className="font-medium">{viewInvoice.customer?.address || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">المندوب</p>
                      <p className="font-medium">{viewInvoice.agent?.name || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* بيانات الفاتورة */}
              <Card>
                <CardHeader className="py-3 bg-emerald-50 dark:bg-emerald-950/30">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-500" />
                    بيانات الفاتورة
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">رقم الفاتورة</p>
                      <p className="font-medium">{viewInvoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">التاريخ</p>
                      <p className="font-medium">{formatDate(viewInvoice.invoiceDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">النوع</p>
                      <Badge className={viewInvoice.type === 'CASH' ? 'bg-green-500/10 text-green-600' : viewInvoice.type === 'INSTALLMENT' ? 'bg-sky-500/10 text-sky-600' : 'bg-amber-500/10 text-amber-600'}>
                        {viewInvoice.type === 'CASH' ? 'نقدي' : viewInvoice.type === 'INSTALLMENT' ? 'تقسيط' : 'آجل'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">الحالة</p>
                      <Badge className={statusColors[viewInvoice.status] || statusColors.pending}>
                        {statusLabels[viewInvoice.status] || viewInvoice.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">المجموع الفرعي</p>
                      <p className="font-medium">{formatCurrency(viewInvoice.subtotal || 0, currency.symbol)}</p>
                    </div>
                    {(settings.discountEnabled !== false || (viewInvoice.discount || 0) > 0) && (
                      <div>
                        <p className="text-xs text-muted-foreground">الخصم</p>
                        <p className="font-medium text-red-500">{formatCurrency(viewInvoice.discount || 0, currency.symbol)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">الضريبة</p>
                      <p className="font-medium">{formatCurrency(viewInvoice.taxAmount || 0, currency.symbol)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">الإجمالي</p>
                      <p className="font-bold text-lg text-emerald-600">{formatCurrency(viewInvoice.total || 0, currency.symbol)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">المدفوع</p>
                      <p className="font-medium text-green-600">{formatCurrency(viewInvoice.paidAmount || 0, currency.symbol)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">المتبقي</p>
                      <p className="font-medium text-amber-600">{formatCurrency(viewInvoice.remainingAmount || 0, currency.symbol)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* أصناف الفاتورة */}
              <Card>
                <CardHeader className="py-3 bg-purple-50 dark:bg-purple-950/30">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    أصناف الفاتورة
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-center">سعر الوحدة</TableHead>
                        <TableHead className="text-center">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewInvoice.items?.map((item: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{item.product?.name || item.productId}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-center">{formatCurrency(item.unitPrice, currency.symbol)}</TableCell>
                          <TableCell className="text-center font-medium">{formatCurrency(item.quantity * item.unitPrice, currency.symbol)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* جدول الأقساط - للفواتير المقسطة */}
              {viewInvoice.type === 'INSTALLMENT' && viewInvoice.installments && viewInvoice.installments.length > 0 && (
                <Card className="border-sky-200 dark:border-sky-800">
                  <CardHeader className="py-3 bg-sky-50 dark:bg-sky-950/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-sky-500" />
                        جدول الأقساط
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => handlePrintInstallments(viewInvoice)}>
                        <Printer className="h-4 w-4 ml-2" />طباعة
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-center w-16">القسط</TableHead>
                          <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                          <TableHead className="text-center">قيمة القسط</TableHead>
                          <TableHead className="text-center">المحصل</TableHead>
                          <TableHead className="text-center">المتبقي</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewInvoice.installments.map((inst: any, i: number) => {
                          const paid = inst.paidAmount || 0
                          const remaining = inst.amount - paid
                          const isPaid = paid >= inst.amount
                          const isPartial = paid > 0 && paid < inst.amount
                          const isOverdue = !isPaid && new Date(inst.dueDate) < new Date()
                          return (
                            <TableRow key={i} className={isPaid ? 'bg-green-50 dark:bg-green-950/20' : isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                              <TableCell className="text-center font-medium">{i + 1}</TableCell>
                              <TableCell className="text-center">{formatDate(inst.dueDate)}</TableCell>
                              <TableCell className="text-center">{formatCurrency(inst.amount, currency.symbol)}</TableCell>
                              <TableCell className="text-center text-green-600">{formatCurrency(paid, currency.symbol)}</TableCell>
                              <TableCell className="text-center text-amber-600">{formatCurrency(remaining, currency.symbol)}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={isPaid ? 'bg-green-500/10 text-green-600' : isPartial ? 'bg-blue-500/10 text-blue-600' : isOverdue ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}>
                                  {isPaid ? 'مدفوع' : isPartial ? 'جزئي' : isOverdue ? 'متأخر' : 'معلق'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border-t flex justify-between items-center">
                      <span className="text-sm font-medium">إجمالي الأقساط:</span>
                      <span className="font-bold text-sky-600">{formatCurrency(viewInvoice.installments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0), currency.symbol)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ملاحظات */}
              {viewInvoice.notes && (
                <Card>
                  <CardHeader className="py-3"><CardTitle className="text-base">ملاحظات</CardTitle></CardHeader>
                  <CardContent><p className="text-sm">{viewInvoice.notes}</p></CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewInvoice(null)}>إغلاق</Button>
            {viewInvoice?.type === 'INSTALLMENT' && (
              <Button onClick={() => handlePrintInstallments(viewInvoice)}>
                <Printer className="h-4 w-4 ml-2" />طباعة الأقساط
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة المرتجع */}
      <Dialog open={!!returnInvoice} onOpenChange={() => setReturnInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              إنشاء مرتجع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              سيتم إنشاء مرتجع للفاتورة <strong>{returnInvoice?.invoiceNumber}</strong>
            </p>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm"><strong>العميل:</strong> {returnInvoice?.customer?.name}</p>
              <p className="text-sm"><strong>الإجمالي:</strong> {formatCurrency(returnInvoice?.total || 0, currency.symbol)}</p>
            </div>
            <p className="text-xs text-amber-600">⚠️ سيتم إرجاع جميع أصناف الفاتورة</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnInvoice(null)}>إلغاء</Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleCreateReturn}>
              <RotateCcw className="h-4 w-4 ml-2" />تأكيد المرتجع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة طباعة إيصالات الأقساط */}
      <Dialog open={!!printReceiptsInvoice} onOpenChange={() => setPrintReceiptsInvoice(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-500" />
              طباعة إيصالات الأقساط
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              الفاتورة: {printReceiptsInvoice?.invoiceNumber} | العميل: {printReceiptsInvoice?.customer?.name}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* معلومات العقد */}
            {printReceiptsInvoice?.installmentContract && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">رقم العقد:</span>
                      <span className="font-bold mr-2">{printReceiptsInvoice.installmentContract.contractNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">عدد الأقساط:</span>
                      <span className="font-bold mr-2">{printReceiptsInvoice.installmentContract.numberOfPayments}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">إجمالي الأقساط:</span>
                      <span className="font-bold mr-2">{formatCurrency(printReceiptsInvoice.installmentContract.financedAmount, currency.symbol)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">قيمة القسط:</span>
                      <span className="font-bold mr-2 text-green-600">{formatCurrency(printReceiptsInvoice.installmentContract.financedAmount / printReceiptsInvoice.installmentContract.numberOfPayments, currency.symbol)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* جدول الأقساط */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium">اختر الأقساط المراد طباعتها:</h4>
              <Button variant="outline" size="sm" onClick={() => {
                if (selectAllInstallments) {
                  setSelectedInstallments([])
                  setSelectAllInstallments(false)
                } else {
                  setSelectedInstallments([])
                  setSelectAllInstallments(true)
                }
              }}>
                {selectAllInstallments ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
              </Button>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectAllInstallments}
                        onChange={() => {
                          if (selectAllInstallments) {
                            setSelectedInstallments([])
                            setSelectAllInstallments(false)
                          } else {
                            setSelectedInstallments([])
                            setSelectAllInstallments(true)
                          }
                        }}
                        className="h-4 w-4"
                      />
                    </TableHead>
                    <TableHead className="text-center">رقم القسط</TableHead>
                    <TableHead className="text-center">تاريخ الاستحقاق</TableHead>
                    <TableHead className="text-center">قيمة القسط</TableHead>
                    <TableHead className="text-center">المدفوع</TableHead>
                    <TableHead className="text-center">المتبقي</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printReceiptsInvoice?.installments?.map((inst: any, i: number) => {
                    const paid = inst.paidAmount || 0
                    const remaining = inst.amount - paid
                    const isPaid = paid >= inst.amount
                    const isPartial = paid > 0 && paid < inst.amount
                    const isOverdue = !isPaid && new Date(inst.dueDate) < new Date()
                    const isSelected = selectAllInstallments || selectedInstallments.includes(i)
                    
                    return (
                      <TableRow 
                        key={i}
                        className={`cursor-pointer hover:bg-muted/30 ${isSelected ? 'bg-primary/5' : ''}`}
                        onClick={() => {
                          if (selectedInstallments.includes(i)) {
                            setSelectedInstallments(selectedInstallments.filter(idx => idx !== i))
                          } else {
                            setSelectedInstallments([...selectedInstallments, i])
                          }
                          setSelectAllInstallments(false)
                        }}
                      >
                        <TableCell className="text-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}}
                            className="h-4 w-4"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="text-center font-bold">القسط {i + 1}</TableCell>
                        <TableCell className="text-center">{formatDate(inst.dueDate)}</TableCell>
                        <TableCell className="text-center font-medium">{formatCurrency(inst.amount, currency.symbol)}</TableCell>
                        <TableCell className="text-center text-green-600">{formatCurrency(paid, currency.symbol)}</TableCell>
                        <TableCell className="text-center text-red-600">{formatCurrency(remaining, currency.symbol)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={isPaid ? 'bg-green-500/10 text-green-600' : isPartial ? 'bg-blue-500/10 text-blue-600' : isOverdue ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}>
                            {isPaid ? 'مدفوع' : isPartial ? 'جزئي' : isOverdue ? 'متأخر' : 'معلق'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* أزرار الإجراءات */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectAllInstallments 
                  ? `سيتم طباعة ${printReceiptsInvoice?.installments?.length || 0} إيصال`
                  : `سيتم طباعة ${selectedInstallments.length} إيصال`
                }
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPrintReceiptsInvoice(null)}>
                  إلغاء
                </Button>
                <Button onClick={() => {
                  const installmentsToPrint = selectAllInstallments 
                    ? printReceiptsInvoice?.installments 
                    : printReceiptsInvoice?.installments?.filter((_: any, i: number) => selectedInstallments.includes(i))

                  if (!installmentsToPrint || installmentsToPrint.length === 0) {
                    toast.error('الرجاء اختيار قسط واحد على الأقل')
                    return
                  }

                  // طباعة الإيصالات
                  const printWindow = window.open('', '_blank')
                  if (!printWindow) {
                    toast.error('الرجاء السماح بالنوافذ المنبثقة')
                    return
                  }

                  const customer = printReceiptsInvoice?.customer || {}
                  const invoice = printReceiptsInvoice
                  const contract = printReceiptsInvoice?.installmentContract || { numberOfPayments: installmentsToPrint.length }
                  const paperWidth = 794  // عرض A4 كامل
                  const paperHeight = 374 // ارتفاع ثلث A4
                  const allInstallments = printReceiptsInvoice?.installments || []

                  const receiptsHtml = installmentsToPrint.map((inst: any, idx: number) => {
                    // حساب المتبقي القادم = إجمالي الفاتورة - المقدم - مجموع الأقساط حتى القسط الحالي
                    const currentInstallmentIndex = allInstallments.findIndex((i: any) => i.id === inst.id || i.installmentNumber === inst.installmentNumber)
                    const paidInstallmentsSum = allInstallments.slice(0, currentInstallmentIndex + 1).reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
                    const remainingAfterCurrent = (contract.financedAmount || invoice.total || 0) - paidInstallmentsSum
                    
                    return `
                    <div class="receipt-page" style="
                      width: ${paperWidth}px;
                      height: ${paperHeight}px;
                      padding: 8px 15px;
                      box-sizing: border-box;
                      position: relative;
                      font-family: 'Segoe UI', Arial, Tahoma, sans-serif;
                      direction: rtl;
                      page-break-after: always;
                      background: white;
                      overflow: hidden;
                    ">
                      <!-- الهيدر -->
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; padding-bottom: 4px; border-bottom: 2px solid #1a1a1a;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="width: 40px; height: 40px; border: 2px solid #333; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; background: #f5f5f5;">
                            ${invoice.company?.logo ? `<img src="${invoice.company.logo}" style="max-width: 35px; max-height: 35px;">` : 'LOGO'}
                          </div>
                          <div>
                            <div style="font-size: 16px; font-weight: bold; color: #1a1a1a;">${invoice.company?.name || 'اسم الشركة'}</div>
                            <div style="font-size: 11px; color: #666;">${invoice.branch?.name || 'الفرع الرئيسي'}</div>
                          </div>
                        </div>
                        <div style="text-align: left; font-size: 12px;">
                          <div style="font-weight: bold;">📞 ${customer?.phone || '-'}</div>
                        </div>
                      </div>

                      <!-- العمودين -->
                      <div style="display: flex; gap: 15px; margin-bottom: 5px;">
                        <!-- عمود بيانات العميل - اليمين -->
                        <div style="flex: 1; font-size: 12px;">
                          <div style="background: #f0f0f0; padding: 3px 8px; text-align: center; font-weight: bold; border-radius: 4px; margin-bottom: 4px; font-size: 12px; border: 1px solid #ddd;">
                            👤 بيانات العميل
                          </div>
                          <div style="line-height: 1.5; padding: 0 3px;">
                            <div style="font-size: 13px; font-weight: bold;">العميل: ${customer?.name || '-'}</div>
                            <div>📱 تليفون: <strong>${customer?.phone || '-'}</strong></div>
                            <div>📍 العنوان: ${customer?.address || '-'}</div>
                            <div>🌍 المنطقة: ${customer?.zone?.name || '-'}</div>
                          </div>
                        </div>

                        <!-- عمود بيانات الأقساط - اليسار -->
                        <div style="flex: 1; font-size: 12px;">
                          <div style="background: #e3f2fd; padding: 3px 8px; text-align: center; font-weight: bold; border-radius: 4px; margin-bottom: 4px; font-size: 12px; border: 1px solid #90caf9;">
                            💳 بيانات الأقساط
                          </div>
                          <div style="line-height: 1.5; padding: 0 3px;">
                            <div>رقم العقد: <strong style="color: #1565c0;">${contract.contractNumber || '-'}</strong> فاتورة: <strong>${invoice.invoiceNumber}</strong></div>
                            <div>القسط رقم: <strong style="color: #d32f2f; font-size: 14px;">${inst.installmentNumber || idx + 1}</strong> من <strong>${contract.numberOfPayments}</strong></div>
                            <div>إجمالي الفاتورة: <strong>${(invoice.total || 0).toLocaleString()} ر.س</strong></div>
                            <div>المقدم: <strong>${(contract.downPayment || 0).toLocaleString()} ر.س</strong></div>
                            <div style="background: #e8f5e9; border: 1px solid #4caf50; border-radius: 4px; padding: 2px 6px; display: inline-block;">
                              قيمة القسط: <strong style="color: #2e7d32; font-size: 14px;">${(inst.amount || 0).toLocaleString()} ر.س</strong>
                            </div>
                            <div style="color: #c62828; font-weight: bold;">
                              المتبقي بعد هذا القسط: ${(remainingAfterCurrent).toLocaleString()} ر.س
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- جدول المنتجات -->
                      <div style="border: 1px solid #ccc; border-radius: 4px; padding: 3px 6px; font-size: 10px; margin-bottom: 5px; background: #fafafa;">
                        <div style="border-bottom: 1px solid #ddd; padding-bottom: 2px; margin-bottom: 2px; font-weight: bold; text-align: center; font-size: 11px;">
                          📦 المنتجات
                        </div>
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3px; font-weight: bold; text-align: center; font-size: 10px;">
                          <span>المنتج</span>
                          <span>العدد</span>
                          <span>السعر</span>
                          <span>الإجمالي</span>
                        </div>
                        ${(invoice.items || []).map((item: any) => `
                          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3px; text-align: center; padding-top: 2px; font-size: 10px;">
                            <span>${item.product?.name || '-'}</span>
                            <span>${item.quantity}</span>
                            <span>${(item.unitPrice || 0).toLocaleString()}</span>
                            <span>${((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}</span>
                          </div>
                        `).join('')}
                      </div>

                      <!-- الفوتر -->
                      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #333; padding-top: 4px;">
                        <div style="font-size: 11px;">
                          <span>👤 المندوب: <strong>${invoice.agent?.name || '-'}</strong></span>
                          <span style="margin-right: 10px;">📞 ${invoice.agent?.phone || '-'}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <div style="font-size: 9px; color: #666; text-align: left;">
                            ${new Date().toLocaleDateString('ar-SA')}
                          </div>
                          <div style="width: 40px; height: 40px; border: 1px solid #333; display: flex; align-items: center; justify-content: center; background: white;">
                            <svg viewBox="0 0 100 100" width="35" height="35">
                              <rect x="10" y="10" width="25" height="25" fill="#1a1a1a"/>
                              <rect x="65" y="10" width="25" height="25" fill="#1a1a1a"/>
                              <rect x="10" y="65" width="25" height="25" fill="#1a1a1a"/>
                              <rect x="15" y="15" width="15" height="15" fill="white"/>
                              <rect x="70" y="15" width="15" height="15" fill="white"/>
                              <rect x="15" y="70" width="15" height="15" fill="white"/>
                              <rect x="18" y="18" width="9" height="9" fill="#1a1a1a"/>
                              <rect x="73" y="18" width="9" height="9" fill="#1a1a1a"/>
                              <rect x="18" y="73" width="9" height="9" fill="#1a1a1a"/>
                              <rect x="40" y="10" width="5" height="5" fill="#1a1a1a"/>
                              <rect x="50" y="10" width="5" height="5" fill="#1a1a1a"/>
                              <rect x="40" y="20" width="5" height="5" fill="#1a1a1a"/>
                              <rect x="45" y="25" width="5" height="5" fill="#1a1a1a"/>
                              <rect x="40" y="40" width="20" height="20" fill="#1a1a1a"/>
                              <rect x="45" y="45" width="10" height="10" fill="white"/>
                              <rect x="65" y="40" width="5" height="5" fill="#1a1a1a"/>
                              <rect x="75" y="50" width="5" height="5" fill="#1a1a1a"/>
                              <rect x="40" y="65" width="5" height="5" fill="#1a1a1a"/>
                              <rect x="50" y="70" width="5" height="5" fill="#1a1a1a"/>
                              <rect x="65" y="65" width="10" height="10" fill="#1a1a1a"/>
                              <rect x="80" y="70" width="10" height="10" fill="#1a1a1a"/>
                              <rect x="70" y="80" width="5" height="5" fill="#1a1a1a"/>
                              <rect x="85" y="85" width="5" height="5" fill="#1a1a1a"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  `}).join('')

                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html dir="rtl">
                    <head>
                      <meta charset="UTF-8">
                      <title>إيصالات الأقساط - ${invoice.invoiceNumber}</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                          font-family: Arial, Tahoma, sans-serif;
                          background: #f5f5f5;
                          padding: 10px;
                        }
                        .receipt-page {
                          margin: 5px auto;
                          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        @media print {
                          body { background: white; padding: 0; margin: 0; }
                          .receipt-page { 
                            box-shadow: none; 
                            margin: 0;
                            page-break-after: always;
                            padding: 10px 15px;
                          }
                          .receipt-page:last-child { page-break-after: auto; }
                        }
                        @page {
                          size: ${paperWidth}px ${paperHeight}px;
                          margin: 5mm;
                        }
                      </style>
                    </head>
                    <body>
                      ${receiptsHtml}
                      <script>
                        setTimeout(() => {
                          window.print();
                        }, 500);
                      </script>
                    </body>
                    </html>
                  `)
                  printWindow.document.close()

                  // تسجيل عمليات الطباعة في قاعدة البيانات
                  installmentsToPrint.forEach(async (inst: any) => {
                    try {
                      await fetch('/api/receipt-prints', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          companyId: invoice.companyId,
                          branchId: invoice.branchId,
                          installmentId: inst.id,
                          invoiceId: invoice.id,
                          customerId: customer?.id,
                          contractNumber: contract.contractNumber,
                          installmentNumber: inst.installmentNumber,
                          printedBy: invoice.agentId,
                          printMethod: 'PRINT',
                        })
                      })
                    } catch (e) {
                      console.error('Failed to log print:', e)
                    }
                  })

                  toast.success(`تم طباعة ${installmentsToPrint.length} إيصال وتسجيلهم في النظام`)
                  setPrintReceiptsInvoice(null)
                }}>
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة الإيصالات
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== INSTALLMENTS ==============
function InstallmentsManagement() {
  const [contracts, setContracts] = useState<any[]>([])
  const [installments, setInstallments] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  
  // تبويبات الأقساط: غير مدفوعة، مدفوعة، متأخرة، ملغي
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid' | 'overdue' | 'cancelled'>('unpaid')
  
  // الفلاتر
  const [customerFilter, setCustomerFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [searchCustomer, setSearchCustomer] = useState('')
  
  // التحصيل السريع
  const [collectDialog, setCollectDialog] = useState<any>(null)
  const [collectAmount, setCollectAmount] = useState(0)
  const [collectMethod, setCollectMethod] = useState('CASH')
  const [collectNotes, setCollectNotes] = useState('')
  const [collecting, setCollecting] = useState(false)
  
  // الدفع المجمع
  const [selectedInstallments, setSelectedInstallments] = useState<Set<string>>(new Set())
  const [bulkPayDialog, setBulkPayDialog] = useState(false)
  const [bulkPaying, setBulkPaying] = useState(false)
  
  // قيم الدفع الجزئي لكل قسط
  const [partialPaymentAmounts, setPartialPaymentAmounts] = useState<Map<string, number>>(new Map())
  
  // فلتر مدة التأخير
  const [overdueDaysFilter, setOverdueDaysFilter] = useState<string>('all')
  
  // تاريخ الدفع
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  
  const currency = useCurrency()
  const { formatDate } = useDateFormat()

  const fetchData = async () => {
    setLoading(true)
    try {
      // تحميل البيانات بالتوازي مع تحسين الأداء
      const [installmentsRes, agentsRes, branchesRes, zonesRes] = await Promise.all([
        fetch('/api/installments/all?limit=500', { cache: 'no-store' }),
        fetch('/api/users?role=AGENT&limit=50', { cache: 'no-store' }),
        fetch('/api/branches?limit=50', { cache: 'no-store' }),
        fetch('/api/zones?limit=50', { cache: 'no-store' })
      ])
      
      // تحليل البيانات بالتوازي
      const [installmentsData, agentsData, branchesData, zonesData] = await Promise.all([
        installmentsRes.json(),
        agentsRes.json(),
        branchesRes.json(),
        zonesRes.json()
      ])
      
      // تحديث الحالات
      if (installmentsData.success) setInstallments(installmentsData.data || [])
      if (agentsData.success) setAgents(agentsData.data || [])
      if (branchesData.success) setBranches(branchesData.data || [])
      if (zonesData.success) setZones(zonesData.data || [])
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // منطق التصنيف للأقساط
  const getClassification = (inst: any) => {
    const paidAmount = inst.paidAmount || 0
    const amount = inst.amount || 0
    const isFullyPaid = paidAmount >= amount
    const isPartialPayment = paidAmount > 0 && paidAmount < amount
    const isOverdue = !isFullyPaid && new Date(inst.dueDate) < new Date()
    const isCancelled = inst.status === 'cancelled'
    
    // حساب أيام التأخير
    const overdueDays = isOverdue ? Math.floor((new Date().getTime() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
    
    return {
      isFullyPaid,
      isPartialPayment,
      isOverdue,
      isCancelled,
      isUnpaid: !isFullyPaid && !isCancelled,
      status: isCancelled ? 'cancelled' : isFullyPaid ? 'paid' : isOverdue ? 'overdue' : 'unpaid',
      overdueDays
    }
  }
  
  // حساب المبلغ المحدد للدفع الجزئي
  const getPartialAmount = (instId: string, fullAmount: number) => {
    return partialPaymentAmounts.get(instId) ?? fullAmount
  }
  
  // تحديث قيمة الدفع الجزئي
  const updatePartialAmount = (instId: string, amount: number, maxAmount: number) => {
    const newMap = new Map(partialPaymentAmounts)
    const validAmount = Math.min(Math.max(0, amount), maxAmount)
    if (validAmount === maxAmount) {
      newMap.delete(instId) // إذا كان المبلغ كامل، نحذفه من الخريطة
    } else {
      newMap.set(instId, validAmount)
    }
    setPartialPaymentAmounts(newMap)
  }
  
  // تحديد/إلغاء تحديد قسط مع تحديث قيمة الدفع
  const toggleInstallmentSelection = (inst: any, checked: boolean) => {
    const newSet = new Set(selectedInstallments)
    const remaining = (inst.amount || 0) - (inst.paidAmount || 0)
    
    if (checked) {
      newSet.add(inst.id)
      // تعيين القيمة الكاملة عند التحديد
      if (!partialPaymentAmounts.has(inst.id)) {
        const newMap = new Map(partialPaymentAmounts)
        // لا حاجة لتخزين القيمة الكاملة، ستستخدم القيمة الافتراضية
        setPartialPaymentAmounts(newMap)
      }
    } else {
      newSet.delete(inst.id)
      // إزالة القيمة عند إلغاء التحديد
      const newMap = new Map(partialPaymentAmounts)
      newMap.delete(inst.id)
      setPartialPaymentAmounts(newMap)
    }
    
    setSelectedInstallments(newSet)
  }
  
  // حساب إجمالي الدفع المجمع
  const calculateBulkTotal = () => {
    return filteredInstallments
      .filter((i: any) => selectedInstallments.has(i.id))
      .reduce((sum: number, i: any) => {
        const remaining = (i.amount || 0) - (i.paidAmount || 0)
        const partialAmount = getPartialAmount(i.id, remaining)
        return sum + partialAmount
      }, 0)
  }

  // إحصائيات الأقساط حسب التبويب
  const allUnpaid = installments.filter(i => {
    const c = getClassification(i)
    return c.isUnpaid && !c.isOverdue // غير مدفوع但不 متأخر
  })
  const allPaid = installments.filter(i => getClassification(i).isFullyPaid)
  const allOverdue = installments.filter(i => getClassification(i).isOverdue)
  const allCancelled = installments.filter(i => getClassification(i).isCancelled)

  const tabStats = {
    unpaid: { count: allUnpaid.length, amount: allUnpaid.reduce((sum, i) => sum + ((i.amount || 0) - (i.paidAmount || 0)), 0) },
    paid: { count: allPaid.length, amount: allPaid.reduce((sum, i) => sum + (i.paidAmount || i.amount || 0), 0) },
    overdue: { count: allOverdue.length, amount: allOverdue.reduce((sum, i) => sum + ((i.amount || 0) - (i.paidAmount || 0)), 0) },
    cancelled: { count: allCancelled.length, amount: allCancelled.reduce((sum, i) => sum + (i.amount || 0), 0) }
  }

  // الإحصائيات العامة
  const stats = {
    totalContracts: contracts.length,
    activeContracts: contracts.filter(c => c.status === 'active').length,
    totalAmount: contracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0),
    totalPaid: contracts.reduce((sum, c) => sum + (c.downPayment || 0) + (c.installments?.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.paidAmount || 0), 0) || 0), 0),
    totalRemaining: contracts.reduce((sum, c) => sum + (c.financedAmount || 0) - (c.installments?.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.paidAmount || 0), 0) || 0), 0),
    overdueInstallments: allOverdue.length,
  }

  // فلترة الأقساط
  const filteredInstallments = installments.filter(i => {
    const contract = i.contract || {}
    const customer = contract.customer || {}
    const invoice = contract.invoice || {}
    const classification = getClassification(i)
    
    // فلترة حسب التبويب
    if (activeTab === 'paid' && !classification.isFullyPaid) return false
    if (activeTab === 'unpaid' && (!classification.isUnpaid || classification.isOverdue)) return false
    if (activeTab === 'overdue' && !classification.isOverdue) return false
    if (activeTab === 'cancelled' && !classification.isCancelled) return false
    
    // فلترة مدة التأخير (فقط في تبويب المتأخرة)
    if (activeTab === 'overdue' && overdueDaysFilter !== 'all') {
      const overdueDays = classification.overdueDays
      switch (overdueDaysFilter) {
        case '1-7': if (overdueDays < 1 || overdueDays > 7) return false; break
        case '8-15': if (overdueDays < 8 || overdueDays > 15) return false; break
        case '16-30': if (overdueDays < 16 || overdueDays > 30) return false; break
        case '31-60': if (overdueDays < 31 || overdueDays > 60) return false; break
        case '61-90': if (overdueDays < 61 || overdueDays > 90) return false; break
        case '90+': if (overdueDays < 91) return false; break
      }
    }
    
    // الفلاتر الأخرى
    if (searchCustomer && !customer.name?.toLowerCase().includes(searchCustomer.toLowerCase())) return false
    if (agentFilter && contract.agentId !== agentFilter) return false
    if (branchFilter && invoice.branchId !== branchFilter) return false
    if (zoneFilter && customer.zoneId !== zoneFilter) return false
    if (dateFromFilter && new Date(i.dueDate) < new Date(dateFromFilter)) return false
    if (dateToFilter && new Date(i.dueDate) > new Date(dateToFilter)) return false
    return true
  })

  // فلترة العقود (للعرض القديم)
  const filteredContracts = contracts.filter(c => {
    if (customerFilter && !c.customer?.name?.toLowerCase().includes(customerFilter.toLowerCase())) return false
    if (agentFilter && c.agentId !== agentFilter) return false
    if (branchFilter && c.invoice?.branchId !== branchFilter) return false
    if (zoneFilter && c.customer?.zoneId !== zoneFilter) return false
    if (dateFromFilter && new Date(c.contractDate) < new Date(dateFromFilter)) return false
    if (dateToFilter && new Date(c.contractDate) > new Date(dateToFilter)) return false
    return true
  })

  const statusColors: any = {
    active: 'bg-green-500/10 text-green-600',
    completed: 'bg-blue-500/10 text-blue-600',
    cancelled: 'bg-red-500/10 text-red-600',
    defaulted: 'bg-amber-500/10 text-amber-600'
  }
  const statusLabels: any = {
    active: 'نشط',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    defaulted: 'متأخر'
  }

  // طباعة جدول الأقساط
  const handlePrintContract = (contract: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const customer = contract.customer || {}
    const installments = contract.installments || []
    const invoice = contract.invoice || {}

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>عقد أقساط - ${contract.contractNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .header p { color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
          .info-box h3 { font-size: 14px; color: #666; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          .info-box p { margin: 5px 0; font-size: 14px; }
          .info-box .label { color: #666; }
          .info-box .value { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
          th { background: #f5f5f5; font-weight: bold; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
          .summary-item { text-align: center; }
          .summary-item .label { font-size: 12px; color: #666; }
          .summary-item .value { font-size: 18px; font-weight: bold; color: #333; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>عقد أقساط</h1>
          <p>رقم العقد: ${contract.contractNumber}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>بيانات العميل</h3>
            <p><span class="label">الاسم:</span> <span class="value">${customer.name || '-'}</span></p>
            <p><span class="label">الهاتف:</span> <span class="value">${customer.phone || '-'}</span></p>
            <p><span class="label">العنوان:</span> <span class="value">${customer.address || '-'}</span></p>
          </div>
          <div class="info-box">
            <h3>بيانات العقد</h3>
            <p><span class="label">رقم العقد:</span> <span class="value">${contract.contractNumber}</span></p>
            <p><span class="label">رقم الفاتورة:</span> <span class="value">${invoice.invoiceNumber || '-'}</span></p>
            <p><span class="label">تاريخ العقد:</span> <span class="value">${formatDate(contract.contractDate)}</span></p>
            <p><span class="label">إجمالي المبلغ:</span> <span class="value">${contract.totalAmount?.toLocaleString()} ر.س</span></p>
            <p><span class="label">الدفعة المقدمة:</span> <span class="value">${contract.downPayment?.toLocaleString()} ر.س</span></p>
            <p><span class="label">المبلغ الممول:</span> <span class="value">${contract.financedAmount?.toLocaleString()} ر.س</span></p>
            <p><span class="label">عدد الأقساط:</span> <span class="value">${contract.numberOfPayments} قسط</span></p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>القسط</th>
              <th>تاريخ الاستحقاق</th>
              <th>قيمة القسط</th>
              <th>المحصل</th>
              <th>المتبقي</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${installments.length > 0 ? installments.map((inst: any, i: number) => {
              const paid = inst.paidAmount || 0
              const remaining = inst.amount - paid
              const isPaid = paid >= inst.amount
              const isPartial = paid > 0 && paid < inst.amount
              const isOverdue = !isPaid && new Date(inst.dueDate) < new Date()
              const status = isPaid ? 'مدفوع' : isPartial ? 'جزئي' : isOverdue ? 'متأخر' : 'معلق'
              const statusColor = isPaid ? 'green' : isPartial ? 'blue' : isOverdue ? 'red' : 'orange'
              return `
                <tr>
                  <td>${inst.installmentNumber || i + 1}</td>
                  <td>${formatDate(inst.dueDate)}</td>
                  <td>${inst.amount?.toLocaleString()} ر.س</td>
                  <td>${paid.toLocaleString()} ر.س</td>
                  <td>${remaining.toLocaleString()} ر.س</td>
                  <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
                </tr>
              `
            }).join('') : `
              <tr>
                <td colspan="6" style="color: #999;">لا توجد أقساط</td>
              </tr>
            `}
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-item">
            <div class="label">إجمالي الأقساط</div>
            <div class="value">${installments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0).toLocaleString()} ر.س</div>
          </div>
          <div class="summary-item">
            <div class="label">إجمالي المحصل</div>
            <div class="value">${(contract.downPayment + installments.reduce((sum: number, i: any) => sum + (i.paidAmount || 0), 0)).toLocaleString()} ر.س</div>
          </div>
          <div class="summary-item">
            <div class="label">إجمالي المتبقي</div>
            <div class="value">${installments.reduce((sum: number, i: any) => sum + ((i.amount || 0) - (i.paidAmount || 0)), 0).toLocaleString()} ر.س</div>
          </div>
        </div>
        
        <div class="footer">
          <p>تم الطباعة في: ${formatDate(new Date())}</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  // دفع قسط
  const handlePayInstallment = async (installment: any, contract: any) => {
    const amount = prompt('أدخل مبلغ الدفع:')
    if (!amount || isNaN(parseFloat(amount))) return

    try {
      const res = await fetch('/api/installments/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentId: installment.id,
          amount: parseFloat(amount),
          method: 'CASH'
        })
      })
      const result = await res.json()
      if (result.success) {
        toast.success('تم تسجيل الدفعة بنجاح')
        fetchData()
      } else {
        toast.error(result.error || 'فشل في تسجيل الدفعة')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col min-h-[calc(100vh-12rem)]">
      {/* منطقة المحتوى القابلة للتمرير */}
      <div className="flex-1 overflow-auto space-y-6 pb-4 min-h-0">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-sky-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة الأقساط</h1>
            <p className="text-muted-foreground text-sm">متابعة عقود الأقساط والمدفوعات</p>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات - قابلة للنقر */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card 
          className={`bg-gradient-to-l from-amber-500/10 to-orange-500/10 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2 ${activeTab === 'unpaid' ? 'border-amber-500' : 'border-transparent'}`}
          onClick={() => setActiveTab('unpaid')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-xs text-muted-foreground">غير مدفوعة</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{tabStats.unpaid.count}</p>
            <p className="text-sm text-muted-foreground mt-1">{formatCurrency(tabStats.unpaid.amount, currency.symbol)}</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`bg-gradient-to-l from-green-500/10 to-emerald-500/10 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2 ${activeTab === 'paid' ? 'border-green-500' : 'border-transparent'}`}
          onClick={() => setActiveTab('paid')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-xs text-muted-foreground">مدفوعة</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{tabStats.paid.count}</p>
            <p className="text-sm text-muted-foreground mt-1">{formatCurrency(tabStats.paid.amount, currency.symbol)}</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`bg-gradient-to-l from-red-500/10 to-rose-500/10 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2 ${activeTab === 'overdue' ? 'border-red-500' : 'border-transparent'}`}
          onClick={() => setActiveTab('overdue')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <span className="text-xs text-muted-foreground">متأخرة (متابعة)</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{tabStats.overdue.count}</p>
            <p className="text-sm text-muted-foreground mt-1">{formatCurrency(tabStats.overdue.amount, currency.symbol)}</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`bg-gradient-to-l from-gray-500/10 to-slate-500/10 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2 ${activeTab === 'cancelled' ? 'border-gray-500' : 'border-transparent'}`}
          onClick={() => setActiveTab('cancelled')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gray-500/20 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-gray-500" />
              </div>
              <span className="text-xs text-muted-foreground">ملغاة</span>
            </div>
            <p className="text-2xl font-bold text-gray-600">{tabStats.cancelled.count}</p>
            <p className="text-sm text-muted-foreground mt-1">{formatCurrency(tabStats.cancelled.amount, currency.symbol)}</p>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر المنسقة */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            فلاتر البحث
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* بحث العميل */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Search className="h-3 w-3" />
                بحث العميل
              </Label>
              <Input
                placeholder="اسم أو هاتف العميل..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="h-9"
              />
            </div>
            
            {/* المندوب */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                المندوب
              </Label>
              <Select value={agentFilter || 'all'} onValueChange={(v) => setAgentFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {agents.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* الفرع */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                الفرع
              </Label>
              <Select value={branchFilter || 'all'} onValueChange={(v) => setBranchFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* المنطقة */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                المنطقة
              </Label>
              <Select value={zoneFilter || 'all'} onValueChange={(v) => setZoneFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {(zones as any[]).map((z: any) => (
                    <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* من تاريخ */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                من تاريخ
              </Label>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="h-9"
              />
            </div>
            
            {/* إلى تاريخ */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                إلى تاريخ
              </Label>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="h-9"
              />
            </div>
            
            {/* فلتر مدة التأخير - يظهر فقط في تبويب المتأخرة */}
            {activeTab === 'overdue' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  مدة التأخير
                </Label>
                <Select value={overdueDaysFilter} onValueChange={setOverdueDaysFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="1-7">1 - 7 أيام</SelectItem>
                    <SelectItem value="8-15">8 - 15 يوم</SelectItem>
                    <SelectItem value="16-30">16 - 30 يوم</SelectItem>
                    <SelectItem value="31-60">31 - 60 يوم</SelectItem>
                    <SelectItem value="61-90">61 - 90 يوم</SelectItem>
                    <SelectItem value="90+">أكثر من 90 يوم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* أزرار الإجراءات */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchCustomer('')
                setAgentFilter('')
                setBranchFilter('')
                setZoneFilter('')
                setDateFromFilter('')
                setDateToFilter('')
              }}
            >
              <X className="h-4 w-4 ml-1" />
              مسح الفلاتر
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => fetchData()}>
              <RefreshCw className="h-4 w-4 ml-1" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول الأقساط المفلترة */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {activeTab === 'unpaid' && <><Receipt className="h-5 w-5 text-amber-500" /> أقساط غير مدفوعة</>}
              {activeTab === 'paid' && <><CheckCircle className="h-5 w-5 text-green-500" /> أقساط مدفوعة</>}
              {activeTab === 'overdue' && <><AlertTriangle className="h-5 w-5 text-red-500" /> أقساط متأخرة (متابعة)</>}
              {activeTab === 'cancelled' && <><XCircle className="h-5 w-5 text-gray-500" /> أقساط ملغاة</>}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{filteredInstallments.length} قسط</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInstallments.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد أقساط في هذا التصنيف</p>
            </div>
          ) : (
            <>
              {/* منطقة الجدول القابلة للتمرير */}
              <div className="flex-1 overflow-auto">
                <Table dir="rtl">
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      {activeTab !== 'paid' && activeTab !== 'cancelled' && (
                        <TableHead className="text-center w-12 bg-muted/50">
                          <Checkbox
                            checked={filteredInstallments.length > 0 && filteredInstallments.every((i: any) => selectedInstallments.has(i.id))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedInstallments(new Set(filteredInstallments.map((i: any) => i.id)))
                              } else {
                                setSelectedInstallments(new Set())
                                setPartialPaymentAmounts(new Map())
                              }
                            }}
                          />
                        </TableHead>
                      )}
                      {activeTab !== 'paid' && activeTab !== 'cancelled' && (
                        <TableHead className="text-center bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 font-bold">قيمة الدفع</TableHead>
                      )}
                      {activeTab !== 'paid' && activeTab !== 'cancelled' && (
                        <TableHead className="text-center bg-muted/50">إجراءات</TableHead>
                      )}
                      <TableHead className="text-center bg-muted/50">الحالة</TableHead>
                      <TableHead className="text-center bg-muted/50">المندوب</TableHead>
                      <TableHead className="text-center bg-muted/50">تاريخ الاستحقاق</TableHead>
                      <TableHead className="text-center bg-muted/50">المتبقي</TableHead>
                      <TableHead className="text-center bg-muted/50">المدفوع</TableHead>
                      <TableHead className="text-center bg-muted/50">المبلغ</TableHead>
                      <TableHead className="text-center bg-muted/50">الهاتف</TableHead>
                      <TableHead className="text-right bg-muted/50">العميل</TableHead>
                      <TableHead className="text-right bg-muted/50">رقم القسط</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredInstallments.map((inst: any) => {
                    const contract = inst.contract || {}
                    const customer = contract.customer || {}
                    const classification = getClassification(inst)
                    const remaining = (inst.amount || 0) - (inst.paidAmount || 0)
                    
                    return (
                      <TableRow key={inst.id} className={classification.isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                        {activeTab !== 'paid' && activeTab !== 'cancelled' && (
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedInstallments.has(inst.id)}
                              onCheckedChange={(checked) => toggleInstallmentSelection(inst, !!checked)}
                            />
                          </TableCell>
                        )}
                        {activeTab !== 'paid' && activeTab !== 'cancelled' && (
                          <TableCell className="text-center bg-green-50/50 dark:bg-green-950/10">
                            <Input
                              type="number"
                              value={getPartialAmount(inst.id, remaining)}
                              onChange={(e) => updatePartialAmount(inst.id, parseFloat(e.target.value) || 0, remaining)}
                              className="h-8 w-24 mx-auto text-center font-bold text-green-600 border-green-300 focus:border-green-500"
                              min={0}
                              max={remaining}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                        )}
                        {activeTab !== 'paid' && activeTab !== 'cancelled' && (
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              className="bg-gradient-to-l from-green-500 to-emerald-500 h-8"
                              onClick={() => {
                                setCollectDialog(inst)
                                setCollectAmount(remaining)
                              }}
                            >
                              <DollarSign className="h-4 w-4 ml-1" />
                              تحصيل
                            </Button>
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <Badge className={
                            classification.isFullyPaid ? 'bg-green-500/10 text-green-600' :
                            classification.isCancelled ? 'bg-gray-500/10 text-gray-600' :
                            classification.isOverdue ? 'bg-red-500/10 text-red-600' :
                            classification.isPartialPayment ? 'bg-blue-500/10 text-blue-600' :
                            'bg-amber-500/10 text-amber-600'
                          }>
                            {classification.isFullyPaid ? 'مدفوع' :
                             classification.isCancelled ? 'ملغي' :
                             classification.isOverdue ? 'متأخر' :
                             classification.isPartialPayment ? 'جزئي' : 'معلق'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{contract.agent?.name || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div>
                            <p>{formatDate(inst.dueDate)}</p>
                            {classification.isOverdue && !classification.isFullyPaid && (
                              <p className="text-xs text-red-500 font-bold flex items-center justify-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                متأخر {classification.overdueDays} يوم
                              </p>
                            )}
                            {inst.paidDate && classification.isFullyPaid && (
                              <p className="text-xs text-green-500">دفع: {formatDate(inst.paidDate)}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-amber-600">{formatCurrency(remaining, currency.symbol)}</TableCell>
                        <TableCell className="text-center text-green-600">{formatCurrency(inst.paidAmount || 0, currency.symbol)}</TableCell>
                        <TableCell className="text-center font-medium">{formatCurrency(inst.amount, currency.symbol)}</TableCell>
                        <TableCell className="text-sm text-center">{customer.phone || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{customer.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-right">
                          {contract.contractNumber}-{inst.installmentNumber}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
          )}
        </CardContent>
      </Card>

      {/* نافذة التحصيل السريع */}
      <Dialog open={!!collectDialog} onOpenChange={() => setCollectDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              تحصيل قسط
            </DialogTitle>
          </DialogHeader>
          
          {collectDialog && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">العميل:</span>
                  <span className="font-medium">{collectDialog.contract?.customer?.name || '-'}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">رقم القسط:</span>
                  <span className="font-medium">{collectDialog.contract?.contractNumber}-{collectDialog.installmentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">المبلغ المستحق:</span>
                  <span className="font-bold text-green-600">{formatCurrency((collectDialog.amount || 0) - (collectDialog.paidAmount || 0), currency.symbol)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>المبلغ المحصل</Label>
                <Input
                  type="number"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="text-lg font-bold"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  تاريخ الدفع
                </Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select value={collectMethod} onValueChange={setCollectMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">نقدي</SelectItem>
                    <SelectItem value="BANK_TRANSFER">تحويل بنكي</SelectItem>
                    <SelectItem value="CARD">بطاقة</SelectItem>
                    <SelectItem value="FAWRY">فوري</SelectItem>
                    <SelectItem value="INSTAPAY">انستاباي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="ملاحظات التحصيل..."
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCollectDialog(null)}>إلغاء</Button>
            <Button 
              onClick={async () => {
                if (!collectDialog || collectAmount <= 0) {
                  toast.error('يرجى إدخال مبلغ صحيح')
                  return
                }
                setCollecting(true)
                try {
                  const res = await fetch('/api/installments/collect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      installmentId: collectDialog.id,
                      amount: collectAmount,
                      method: collectMethod,
                      notes: collectNotes,
                      paymentDate: paymentDate
                    })
                  })
                  const result = await res.json()
                  if (result.success) {
                    toast.success('تم تحصيل القسط بنجاح')
                    setCollectDialog(null)
                    setCollectAmount(0)
                    setCollectNotes('')
                    fetchData()
                  } else {
                    toast.error(result.error || 'فشل التحصيل')
                  }
                } catch {
                  toast.error('حدث خطأ أثناء التحصيل')
                } finally {
                  setCollecting(false)
                }
              }}
              disabled={collecting || collectAmount <= 0}
              className="bg-gradient-to-l from-green-500 to-emerald-500"
            >
              {collecting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Check className="h-4 w-4 ml-2" />}
              تأكيد التحصيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة الدفع المجمع */}
      <Dialog open={bulkPayDialog} onOpenChange={setBulkPayDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-500" />
              دفع مجمع للأقساط
            </DialogTitle>
            <DialogDescription>
              سيتم دفع {selectedInstallments.size} قسط مختار
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">عدد الأقساط:</span>
                <span className="font-bold">{selectedInstallments.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">إجمالي المبلغ:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(calculateBulkTotal(), currency.symbol)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                تاريخ الدفع
              </Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={collectMethod} onValueChange={setCollectMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">نقدي</SelectItem>
                  <SelectItem value="BANK_TRANSFER">تحويل بنكي</SelectItem>
                  <SelectItem value="CARD">بطاقة</SelectItem>
                  <SelectItem value="FAWRY">فوري</SelectItem>
                  <SelectItem value="INSTAPAY">انستاباي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={collectNotes}
                onChange={(e) => setCollectNotes(e.target.value)}
                placeholder="ملاحظات الدفع المجمع..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkPayDialog(false)}>إلغاء</Button>
            <Button 
              onClick={async () => {
                setBulkPaying(true)
                try {
                  const selectedList = filteredInstallments.filter((i: any) => selectedInstallments.has(i.id))
                  let successCount = 0
                  let failCount = 0
                  
                  for (const inst of selectedList) {
                    const remaining = (inst.amount || 0) - (inst.paidAmount || 0)
                    const partialAmount = getPartialAmount(inst.id, remaining)
                    const res = await fetch('/api/installments/collect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        installmentId: inst.id,
                        amount: partialAmount,
                        method: collectMethod,
                        notes: collectNotes,
                        paymentDate: paymentDate
                      })
                    })
                    const result = await res.json()
                    if (result.success) successCount++
                    else failCount++
                  }
                  
                  if (successCount > 0) {
                    toast.success(`تم تحصيل ${successCount} قسط بنجاح`)
                  }
                  if (failCount > 0) {
                    toast.error(`فشل تحصيل ${failCount} قسط`)
                  }
                  
                  setBulkPayDialog(false)
                  setSelectedInstallments(new Set())
                  setPartialPaymentAmounts(new Map())
                  setCollectNotes('')
                  fetchData()
                } catch {
                  toast.error('حدث خطأ أثناء الدفع المجمع')
                } finally {
                  setBulkPaying(false)
                }
              }}
              disabled={bulkPaying}
              className="bg-gradient-to-l from-green-500 to-emerald-500"
            >
              {bulkPaying ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Check className="h-4 w-4 ml-2" />}
              تأكيد الدفع المجمع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      
      {/* التذييل الثابت في أسفل الصفحة */}
      {!loading && filteredInstallments.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/98 to-card/95 border-t-2 border-primary/30 p-3 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* عدد الأقساط */}
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {selectedInstallments.size > 0 ? 'الأقساط المختارة' : 'إجمالي الأقساط'}
                </p>
                <p className="text-lg font-bold">
                  {selectedInstallments.size > 0 ? selectedInstallments.size : filteredInstallments.length}
                </p>
              </div>
            </div>
            
            {/* المبلغ */}
            <div className="text-center px-3">
              <p className="text-xs text-muted-foreground">المبلغ</p>
              <p className="text-lg font-bold">
                {formatCurrency(
                  selectedInstallments.size > 0
                    ? filteredInstallments.filter((i: any) => selectedInstallments.has(i.id)).reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
                    : filteredInstallments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0),
                  currency.symbol
                )}
              </p>
            </div>
            
            {/* المدفوع */}
            <div className="text-center px-3 border-e border-muted">
              <p className="text-xs text-muted-foreground">المدفوع</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(
                  selectedInstallments.size > 0
                    ? filteredInstallments.filter((i: any) => selectedInstallments.has(i.id)).reduce((sum: number, i: any) => sum + (i.paidAmount || 0), 0)
                    : filteredInstallments.reduce((sum: number, i: any) => sum + (i.paidAmount || 0), 0),
                  currency.symbol
                )}
              </p>
            </div>
            
            {/* المتبقي */}
            <div className="text-center px-3 border-e border-muted">
              <p className="text-xs text-muted-foreground">المتبقي</p>
              <p className="text-lg font-bold text-amber-600">
                {formatCurrency(
                  selectedInstallments.size > 0
                    ? filteredInstallments.filter((i: any) => selectedInstallments.has(i.id)).reduce((sum: number, i: any) => sum + ((i.amount || 0) - (i.paidAmount || 0)), 0)
                    : filteredInstallments.reduce((sum: number, i: any) => sum + ((i.amount || 0) - (i.paidAmount || 0)), 0),
                  currency.symbol
                )}
              </p>
            </div>
            
            {/* قيمة الدفع */}
            {activeTab !== 'paid' && activeTab !== 'cancelled' && (
              <div className="text-center bg-green-100 dark:bg-green-950/50 px-4 py-2 rounded-lg">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 dark:text-green-400 font-medium">قيمة الدفع</span>
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(
                    selectedInstallments.size > 0
                      ? calculateBulkTotal()
                      : filteredInstallments.reduce((sum: number, i: any) => sum + ((i.amount || 0) - (i.paidAmount || 0)), 0),
                    currency.symbol
                  )}
                </p>
              </div>
            )}
            
            {/* زر الدفع المجمع */}
            {selectedInstallments.size > 0 && activeTab !== 'paid' && activeTab !== 'cancelled' && (
              <Button
                size="lg"
                className="bg-gradient-to-l from-green-500 to-emerald-500 shadow-lg"
                onClick={() => setBulkPayDialog(true)}
              >
                <Wallet className="h-5 w-5 ml-2" />
                دفع مجمع ({selectedInstallments.size})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============== COLLECTIONS (المقبوضات) - مبسط ==============
function CollectionsManagement() {
  const [installments, setInstallments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [paymentLinks, setPaymentLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [customerFilter, setCustomerFilter] = useState('')
  const [linkAmount, setLinkAmount] = useState(0)
  const [linkDescription, setLinkDescription] = useState('')
  const [linkExpiry, setLinkExpiry] = useState(7)
  const [creatingLink, setCreatingLink] = useState(false)
  const [createdLink, setCreatedLink] = useState<any>(null)
  const [paymentLinkDialog, setPaymentLinkDialog] = useState<any>(null)
  
  const currency = useCurrency()
  const { formatDate } = useDateFormat()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [installmentsRes, customersRes, linksRes] = await Promise.all([
        fetch('/api/installments/all?limit=500'),
        fetch('/api/customers?limit=500'),
        fetch('/api/payment-links?limit=50')
      ])
      const installmentsData = await installmentsRes.json()
      const customersData = await customersRes.json()
      const linksData = await linksRes.json()
      if (installmentsData.success) setInstallments(installmentsData.data || [])
      if (customersData.success) setCustomers(customersData.data || [])
      if (linksData.success) setPaymentLinks(linksData.data || [])
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreatePaymentLink = async () => {
    if (!customerFilter || linkAmount <= 0) {
      toast.error('يرجى اختيار العميل وإدخال مبلغ صحيح')
      return
    }
    
    setCreatingLink(true)
    try {
      const res = await fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerFilter,
          amount: linkAmount,
          description: linkDescription,
          expiresInDays: linkExpiry
        })
      })
      const result = await res.json()
      
      if (result.success) {
        setCreatedLink(result.data)
        toast.success('تم إنشاء رابط الدفع بنجاح')
        fetchData()
      } else {
        toast.error(result.error || 'فشل إنشاء رابط الدفع')
      }
    } catch {
      toast.error('حدث خطأ أثناء إنشاء الرابط')
    } finally {
      setCreatingLink(false)
    }
  }

  const copyPaymentLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('تم نسخ الرابط')
  }

  const shareViaWhatsApp = (phone: string, url: string, amount: number) => {
    const message = `مرحباً،%0A%0Aيرجى دفع المبلغ: ${amount.toLocaleString()} ${currency.symbol}%0A%0Aرابط الدفع:%0A${url}%0A%0Aشكراً لك`
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">المقبوضات</h1>
            <p className="text-muted-foreground text-sm">بوابات الدفع وروابط الدفع</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchData()}>
          <RefreshCw className="h-4 w-4 ml-2" />تحديث
        </Button>
      </div>

      {/* إنشاء رابط دفع سريع */}
      <Card className="border-2 border-dashed border-primary/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            إنشاء رابط دفع سريع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اختر العميل</Label>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>المبلغ</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={linkAmount || ''}
                    onChange={(e) => setLinkAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="text-2xl font-bold h-14 text-left pl-16"
                    dir="ltr"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                    {currency.symbol}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>الوصف (اختياري)</Label>
                <Input
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  placeholder="وصف الدفعة..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>صلاحية الرابط</Label>
                <Select value={linkExpiry.toString()} onValueChange={(v) => setLinkExpiry(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">يوم واحد</SelectItem>
                    <SelectItem value="3">3 أيام</SelectItem>
                    <SelectItem value="7">أسبوع</SelectItem>
                    <SelectItem value="14">أسبوعين</SelectItem>
                    <SelectItem value="30">شهر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              {customerFilter && linkAmount > 0 ? (
                <div className="w-full">
                  <EgyptianPaymentMethods
                    amount={linkAmount}
                    customerId={customerFilter}
                    customerPhone={customers.find((c: any) => c.id === customerFilter)?.phone}
                    customerName={customers.find((c: any) => c.id === customerFilter)?.name}
                    description={linkDescription || 'دفعة سريعة'}
                    onPaymentComplete={() => {
                      toast.success('تم الدفع بنجاح!')
                      setCustomerFilter('')
                      setLinkAmount(0)
                      fetchData()
                    }}
                    currency={currency}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>اختر العميل وأدخل المبلغ</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* روابط الدفع النشطة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link className="h-5 w-5 text-purple-500" />
            روابط الدفع النشطة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paymentLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد روابط دفع</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentLinks.map((link: any) => {
                  const customer = link.Customer || {}
                  const isExpired = new Date(link.expiresAt) < new Date()
                  return (
                    <TableRow key={link.id} className={isExpired ? 'bg-gray-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{customer.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">{formatCurrency(link.amount, currency.symbol)}</TableCell>
                      <TableCell className="text-sm">{link.description}</TableCell>
                      <TableCell>
                        <Badge className={link.status === 'active' && !isExpired ? 'bg-green-500/10 text-green-600' : link.status === 'paid' ? 'bg-blue-500/10 text-blue-600' : 'bg-gray-500/10 text-gray-600'}>
                          {link.status === 'paid' ? 'مدفوع' : isExpired ? 'منتهي' : 'نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(link.expiresAt)}</TableCell>
                      <TableCell>
                        {link.status === 'active' && !isExpired && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const url = `${window.location.origin}/pay/${link.linkCode}`
                                copyPaymentLink(url)
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareViaWhatsApp(customer.phone || '', `${window.location.origin}/pay/${link.linkCode}`, link.amount)}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============== PAYMENTS ==============
function PaymentsManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('records')
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const currency = useCurrency()
  const { formatDate } = useDateFormat()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [paymentsRes, customersRes] = await Promise.all([
        fetch('/api/payments?limit=100'),
        fetch('/api/customers?limit=500')
      ])
      const paymentsResult = await paymentsRes.json()
      const customersResult = await customersRes.json()
      if (paymentsResult.success) setData(paymentsResult.data)
      if (customersResult.success) setCustomers(customersResult.data)
    } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // فلترة العملاء
  const filteredCustomers = customerSearch 
    ? customers.filter((c: any) => 
        c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch) ||
        c.code?.toLowerCase().includes(customerSearch.toLowerCase())
      )
    : customers

  const columns = [
    { key: 'paymentNumber', label: 'الرقم' },
    { key: 'paymentDate', label: 'التاريخ', render: (r: any) => formatDate(r.paymentDate) },
    { key: 'customer', label: 'العميل', render: (r: any) => r.customer?.name || '-' },
    { key: 'amount', label: 'المبلغ', render: (r: any) => <span className="text-green-600 font-medium">{formatCurrency(r.amount, currency.symbol)}</span> },
    { key: 'method', label: 'الطريقة' },
  ]

  const handlePaymentComplete = (response: any) => {
    toast.success('تم الدفع بنجاح!')
    fetchData()
    setSelectedCustomer('')
    setPaymentAmount(0)
    setCustomerSearch('')
  }

  const selectedCustomerData = customers.find((c: any) => c.id === selectedCustomer)

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة المدفوعات</h1>
            <p className="text-muted-foreground text-sm">سجل المدفوعات وبوابات الدفع الإلكتروني</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <ExportButton entity="payments" />
        </div>
      </div>

      {/* التبويبات المحسنة */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-xl">
          <Button
            variant={activeTab === 'records' ? 'default' : 'ghost'}
            size="sm"
            className={`gap-2 rounded-lg ${activeTab === 'records' ? 'bg-primary text-primary-foreground shadow-md' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">سجل المدفوعات</span>
            <Badge className="ml-1 bg-white/20 text-xs">{data.length}</Badge>
          </Button>
          <Button
            variant={activeTab === 'egyptian' ? 'default' : 'ghost'}
            size="sm"
            className={`gap-2 rounded-lg ${activeTab === 'egyptian' ? 'bg-primary text-primary-foreground shadow-md' : ''}`}
            onClick={() => setActiveTab('egyptian')}
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">بوابات الدفع</span>
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            size="sm"
            className={`gap-2 rounded-lg ${activeTab === 'settings' ? 'bg-primary text-primary-foreground shadow-md' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">إعدادات البوابات</span>
          </Button>
        </div>

        {/* سجل المدفوعات */}
        {activeTab === 'records' && (
          <div className="mt-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <DataTable data={data} columns={columns} loading={loading} searchPlaceholder="بحث في المدفوعات..." />
              </CardContent>
            </Card>
          </div>
        )}

        {/* بوابات الدفع */}
        {activeTab === 'egyptian' && (
          <div className="mt-6 space-y-6">
            {/* اختيار العميل والمبلغ - تصميم محسن */}
            <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-l from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold">بيانات الدفع</h3>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {/* البحث عن عميل */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">البحث عن عميل</Label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="اسم، هاتف، أو كود العميل..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value)
                          if (selectedCustomer && !e.target.value) {
                            setSelectedCustomer('')
                          }
                        }}
                        className="pr-9"
                      />
                      {customerSearch && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => { setCustomerSearch(''); setSelectedCustomer('') }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    {/* قائمة العملاء */}
                    {customerSearch && !selectedCustomer && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            لا توجد نتائج
                          </div>
                        ) : (
                          filteredCustomers.slice(0, 10).map((c: any) => (
                            <button
                              key={c.id}
                              className="w-full p-3 hover:bg-muted text-right border-b last:border-0 flex justify-between items-center"
                              onClick={() => {
                                setSelectedCustomer(c.id)
                                setCustomerSearch(c.name)
                              }}
                            >
                              <div>
                                <p className="font-medium">{c.name}</p>
                                <p className="text-xs text-muted-foreground">{c.code} • {c.phone}</p>
                              </div>
                              <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    
                    {/* العميل المختار */}
                    {selectedCustomerData && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                              <UserCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{selectedCustomerData.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedCustomerData.phone}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedCustomer(''); setCustomerSearch('') }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* المبلغ */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">المبلغ</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="text-2xl font-bold h-14 text-left pl-16"
                        dir="ltr"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                        {currency.symbol}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      المبلغ بالعملة المحددة في الإعدادات ({currency.name})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* واجهة الدفع */}
            {selectedCustomer && paymentAmount > 0 ? (
              <EgyptianPaymentMethods
                amount={paymentAmount}
                customerId={selectedCustomer}
                customerPhone={selectedCustomerData?.phone}
                customerName={selectedCustomerData?.name}
                description="دفعة عبر نظام أقساطي"
                onPaymentComplete={handlePaymentComplete}
                currency={currency}
              />
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="py-16">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                      <CreditCard className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">اختر العميل والمبلغ</h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                      ابحث عن عميل وأدخل المبلغ للبدء في عملية الدفع عبر بوابات الدفع المصرية
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* إعدادات البوابات */}
        {activeTab === 'settings' && (
          <div className="mt-6">
            <PaymentGatewaySettings />
          </div>
        )}
      </Tabs>
    </div>
  )
}

// ============== REPORTS ==============
function ReportsPage() {
  const [stats, setStats] = useState({ totalSales: 0, totalPaid: 0, pendingAmount: 0, invoicesCount: 0, paymentsCount: 0 })
  const [loading, setLoading] = useState(true)
  const currency = useCurrency()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [invoices, payments] = await Promise.all([
          fetch('/api/invoices?limit=1000').then(r => r.json()),
          fetch('/api/payments?limit=1000').then(r => r.json()),
        ])
        
        const invoiceList = invoices.data || []
        const paymentList = payments.data || []
        const totalSales = invoiceList.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
        const totalPaid = paymentList.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        const pendingAmount = totalSales - totalPaid
        
        setStats({
          totalSales,
          totalPaid,
          pendingAmount,
          invoicesCount: invoices.pagination?.total || 0,
          paymentsCount: payments.pagination?.total || 0,
        })
      } catch (e) {
        console.error('Failed to fetch stats', e)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center"><BarChart3 className="h-6 w-6 text-violet-500" /></div>
        <div><h1 className="text-2xl font-bold">التقارير</h1><p className="text-muted-foreground text-sm">ملخص الأداء المالي</p></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-l from-emerald-500/10 to-green-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center"><DollarSign className="h-6 w-6 text-emerald-500" /></div>
              <div><p className="text-sm text-muted-foreground">إجمالي المبيعات</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalSales, currency.symbol)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-green-500/10 to-teal-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center"><Wallet className="h-6 w-6 text-green-500" /></div>
              <div><p className="text-sm text-muted-foreground">إجمالي المحصل</p><p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid, currency.symbol)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-amber-500/10 to-orange-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center"><Receipt className="h-6 w-6 text-amber-500" /></div>
              <div><p className="text-sm text-muted-foreground">المستحقات المعلقة</p><p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.pendingAmount, currency.symbol)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-blue-500/10 to-indigo-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-blue-500" /></div>
              <div><p className="text-sm text-muted-foreground">نسبة التحصيل</p><p className="text-2xl font-bold text-blue-600">{stats.totalSales > 0 ? Math.round((stats.totalPaid / stats.totalSales) * 100) : 0}%</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">ملخص الفواتير</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-emerald-600">{stats.invoicesCount}</p>
              <p className="text-muted-foreground mt-2">إجمالي الفواتير</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">ملخص المدفوعات</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-green-600">{stats.paymentsCount}</p>
              <p className="text-muted-foreground mt-2">إجمالي المدفوعات</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============== تفقيط الأرقام العربية ==============
const arabicOnes = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة']
const arabicTens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
const arabicHundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة']
const arabicThousands = ['', 'ألف', 'ألفان', 'آلاف']

function numberToArabicWords(num: number): string {
  if (num === 0) return 'صفر'
  if (num < 0) return 'سالب ' + numberToArabicWords(Math.abs(num))
  
  const parts: string[] = []
  
  // المليارات
  if (num >= 1000000000) {
    const billions = Math.floor(num / 1000000000)
    if (billions === 1) parts.push('مليار')
    else if (billions === 2) parts.push('ملياران')
    else if (billions >= 3 && billions <= 10) parts.push(numberToArabicWords(billions) + ' مليارات')
    else parts.push(numberToArabicWords(billions) + ' مليار')
    num %= 1000000000
  }
  
  // الملايين
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000)
    if (millions === 1) parts.push('مليون')
    else if (millions === 2) parts.push('مليونان')
    else if (millions >= 3 && millions <= 10) parts.push(numberToArabicWords(millions) + ' ملايين')
    else parts.push(numberToArabicWords(millions) + ' مليون')
    num %= 1000000
  }
  
  // الآلاف
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000)
    if (thousands === 1) parts.push('ألف')
    else if (thousands === 2) parts.push('ألفان')
    else if (thousands >= 3 && thousands <= 10) parts.push(numberToArabicWords(thousands) + ' آلاف')
    else parts.push(numberToArabicWords(thousands) + ' ألف')
    num %= 1000
  }
  
  // المئات
  if (num >= 100) {
    parts.push(arabicHundreds[Math.floor(num / 100)])
    num %= 100
  }
  
  // العشرات والآحاد
  if (num > 0) {
    if (num < 10) {
      parts.push(arabicOnes[num])
    } else if (num === 10) {
      parts.push('عشرة')
    } else if (num === 11) {
      parts.push('أحد عشر')
    } else if (num === 12) {
      parts.push('اثنا عشر')
    } else if (num < 20) {
      parts.push(arabicOnes[num - 10] + ' عشر')
    } else {
      const tens = Math.floor(num / 10)
      const ones = num % 10
      if (ones > 0) {
        parts.push(arabicOnes[ones] + ' و' + arabicTens[tens])
      } else {
        parts.push(arabicTens[tens])
      }
    }
  }
  
  return parts.filter(p => p).join(' و')
}

function formatCurrencyArabic(amount: number, currencyName: string = 'ريال'): string {
  const wholePart = Math.floor(amount)
  const decimalPart = Math.round((amount - wholePart) * 100)
  
  let result = ''
  if (wholePart > 0) {
    result = numberToArabicWords(wholePart) + ' ' + currencyName
  } else {
    result = 'صفر ' + currencyName
  }
  
  if (decimalPart > 0) {
    result += ' و' + numberToArabicWords(decimalPart) + ' هللة فقط لا غير'
  } else {
    result += ' فقط لا غير'
  }
  
  return result
}

// ============== DATA MANAGEMENT ==============
function DataManagement() {
  const [stats, setStats] = useState({
    companies: 0, branches: 0, users: 0, customers: 0, products: 0,
    invoices: 0, payments: 0, warehouses: 0, zones: 0, categories: 0
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [companies, setCompanies] = useState<any[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // معلومات المستخدم الحالي
  const [currentUser, setCurrentUser] = useState<{id: string; role: string; companyId?: string; name: string} | null>(null)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const isCompanyAdmin = currentUser?.role === 'COMPANY_ADMIN'
  
  // تحديد الشركة الافتراضية لأدمن الشركة
  const userCompanyId = currentUser?.companyId || ''

  const fetchStats = async () => {
    setLoading(true)
    try {
      // جلب معلومات المستخدم الحالي
      const userStr = localStorage.getItem('erp_user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        setCurrentUser(userData)
        // لأدمن الشركة: تعيين شركته كافتراضي
        if (userData.role === 'COMPANY_ADMIN' && userData.companyId) {
          setSelectedCompany(userData.companyId)
        }
      }
      
      // جلب الشركات
      const companiesRes = await fetch('/api/companies?limit=100')
      const companiesData = await companiesRes.json()
      if (companiesData.success) setCompanies(companiesData.data || [])
      
      // جلب الإحصائيات
      const [branchesRes, usersRes, customersRes, productsRes, invoicesRes, paymentsRes, warehousesRes, zonesRes, categoriesRes] = await Promise.all([
        fetch('/api/branches?limit=1').then(r => r.json()),
        fetch('/api/users?limit=1').then(r => r.json()),
        fetch('/api/customers?limit=1').then(r => r.json()),
        fetch('/api/products?limit=1').then(r => r.json()),
        fetch('/api/invoices?limit=1').then(r => r.json()),
        fetch('/api/payments?limit=1').then(r => r.json()),
        fetch('/api/warehouses?limit=1').then(r => r.json()),
        fetch('/api/zones?limit=1').then(r => r.json()),
        fetch('/api/categories?limit=1').then(r => r.json()),
      ])
      
      setStats({
        companies: companiesData.pagination?.total || 0,
        branches: branchesRes.pagination?.total || 0,
        users: usersRes.pagination?.total || 0,
        customers: customersRes.pagination?.total || 0,
        products: productsRes.pagination?.total || 0,
        invoices: invoicesRes.pagination?.total || 0,
        payments: paymentsRes.pagination?.total || 0,
        warehouses: warehousesRes.pagination?.total || 0,
        zones: zonesRes.pagination?.total || 0,
        categories: categoriesRes.pagination?.total || 0,
      })
    } catch (e) {
      console.error('Failed to fetch stats', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  // تصدير البيانات
  const handleExport = async () => {
    // للسوبر أدمن: يمكنه اختيار النظام الكامل أو شركة محددة
    // لأدمن الشركة: تصدير شركته فقط
    const exportCompanyId = isSuperAdmin ? selectedCompany : userCompanyId
    const isFullBackup = isSuperAdmin && selectedCompany === 'all'
    
    setExporting(true)
    try {
      const backup: any = { 
        version: '1.0', 
        date: new Date().toISOString(), 
        type: isFullBackup ? 'full' : 'company',
        exportedBy: currentUser?.name,
        exportedAt: new Date().toISOString()
      }
      
      if (isFullBackup) {
        // تصدير كامل للنظام (سوبر أدمن فقط)
        const endpoints = ['companies', 'branches', 'users', 'customers', 'products', 'invoices', 'payments', 'warehouses', 'zones', 'categories', 'governorates', 'cities', 'areas']
        for (const endpoint of endpoints) {
          const res = await fetch(`/api/${endpoint}?limit=10000`)
          const data = await res.json()
          backup[endpoint] = data.data || []
        }
      } else {
        // تصدير لشركة محددة
        const endpoints = ['customers', 'products', 'invoices', 'payments', 'warehouses', 'zones', 'categories', 'governorates', 'cities', 'areas']
        for (const endpoint of endpoints) {
          const res = await fetch(`/api/${endpoint}?companyId=${exportCompanyId}&limit=10000`)
          const data = await res.json()
          backup[endpoint] = data.data || []
        }
        // إضافة الشركة المحددة
        const companyRes = await fetch(`/api/companies/${exportCompanyId}`)
        const companyData = await companyRes.json()
        backup.companies = companyData.success ? [companyData.data] : []
        
        // إضافة فروع الشركة
        const branchesRes = await fetch(`/api/branches?companyId=${exportCompanyId}&limit=10000`)
        const branchesData = await branchesRes.json()
        backup.branches = branchesData.data || []
        
        // إضافة مستخدمي الشركة
        const usersRes = await fetch(`/api/users?companyId=${exportCompanyId}&limit=10000`)
        const usersData = await usersRes.json()
        backup.users = usersData.data || []
      }
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `erp-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('تم تصدير النسخة الاحتياطية بنجاح')
    } catch (e) {
      toast.error('فشل تصدير البيانات')
    } finally {
      setExporting(false)
    }
  }

  // استيراد البيانات
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImporting(true)
    try {
      const text = await file.text()
      const backup = JSON.parse(text)
      
      // استيراد البيانات
      if (backup.companies) {
        for (const item of backup.companies) {
          await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
        }
      }
      
      toast.success('تم استيراد البيانات بنجاح')
      fetchStats()
    } catch (e) {
      toast.error('فشل استيراد البيانات - تأكد من صحة الملف')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  // مسح البيانات
  const handleDeleteAll = async () => {
    if (!deleteConfirm) {
      toast.error('يرجى تأكيد الحذف')
      return
    }
    
    setDeleting(true)
    try {
      // مسح البيانات (ترتيب مهم بسبب العلاقات)
      const deleteOrder = ['payments', 'invoices', 'customers', 'products', 'warehouses', 'zones', 'categories', 'branches', 'users', 'companies']
      for (const endpoint of deleteOrder) {
        const res = await fetch(`/api/${endpoint}?deleteAll=true`, { method: 'DELETE' })
      }
      toast.success('تم مسح جميع البيانات')
      fetchStats()
    } catch (e) {
      toast.error('فشل مسح البيانات')
    } finally {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  const statCards = [
    { key: 'companies', label: 'الشركات', icon: Building2, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { key: 'branches', label: 'الفروع', icon: Home, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
    { key: 'users', label: 'المستخدمين', icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { key: 'customers', label: 'العملاء', icon: UserCheck, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
    { key: 'products', label: 'المنتجات', icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { key: 'invoices', label: 'الفواتير', icon: Receipt, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { key: 'payments', label: 'المدفوعات', icon: Wallet, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { key: 'warehouses', label: 'المخازن', icon: Warehouse, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { key: 'zones', label: 'المناطق', icon: MapPin, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
    { key: 'categories', label: 'التصنيفات', icon: Layers, color: 'text-lime-500', bgColor: 'bg-lime-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center"><Database className="h-6 w-6 text-red-500" /></div>
        <div><h1 className="text-2xl font-bold">إدارة البيانات</h1><p className="text-muted-foreground text-sm">نسخ احتياطي، استعادة، وإدارة البيانات</p></div>
      </div>

      {/* إحصائيات البيانات */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-500" />إحصائيات البيانات الحالية</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {statCards.map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{stats[stat.key as keyof typeof stats]}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* النسخ الاحتياطي */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="h-5 w-5 text-green-500" />تصدير نسخة احتياطية</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isSuperAdmin ? (
              // للسوبر أدمن: اختيار النظام الكامل أو شركة محددة
              <div className="space-y-2">
                <Label>نطاق التصدير</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📁 النظام كامل (جميع الشركات)</SelectItem>
                    {companies.map(c => <SelectItem key={c.id} value={c.id}>🏢 شركة: {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedCompany === 'all' && (
                  <p className="text-xs text-muted-foreground">سيتم تصدير جميع بيانات النظام بما في ذلك جميع الشركات</p>
                )}
              </div>
            ) : (
              // لأدمن الشركة: عرض شركته فقط
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">تصدير بيانات شركتك</p>
                      <p className="text-xs text-muted-foreground">{companies.find(c => c.id === userCompanyId)?.name || 'شركتك'}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">سيتم تصدير جميع بيانات شركتك فقط (العملاء، المنتجات، الفواتير، المدفوعات، ...)</p>
              </div>
            )}
            <Button className="w-full bg-gradient-to-l from-green-500 to-green-600" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Download className="h-4 w-4 ml-2" />}
              تنزيل النسخة الاحتياطية
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-5 w-5 text-blue-500" />استعادة نسخة احتياطية</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!isSuperAdmin && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">يمكنك استيراد البيانات لشركتك فقط</p>
                </div>
              </div>
            )}
            <div className="border-2 border-dashed rounded-xl p-6 text-center">
              <input type="file" accept=".json" onChange={handleImport} className="hidden" id="backup-import" disabled={importing} />
              <label htmlFor="backup-import" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">اضغط لاختيار ملف النسخة الاحتياطية</p>
                <p className="text-xs text-muted-foreground mt-1">صيغة JSON</p>
              </label>
            </div>
            {importing && <div className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">جاري الاستيراد...</span></div>}
          </CardContent>
        </Card>
      </div>

      {/* مسح البيانات - للسوبر أدمن فقط */}
      {isSuperAdmin && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="bg-red-50 dark:bg-red-950/30">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              منطقة خطر - مسح البيانات (سوبر أدمن فقط)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-300">تحذير!</p>
                <p className="text-sm text-red-600 dark:text-red-400">هذا الإجراء سيحذف جميع البيانات بشكل نهائي ولا يمكن التراجع عنه.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="confirm-delete" checked={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.checked)} className="h-4 w-4" />
              <label htmlFor="confirm-delete" className="text-sm">أنا أفهم أن جميع البيانات سيتم حذفها نهائياً</label>
            </div>
            
            <Button variant="destructive" className="w-full" onClick={handleDeleteAll} disabled={!deleteConfirm || deleting}>
              {deleting ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Trash2 className="h-4 w-4 ml-2" />}
              مسح جميع البيانات
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============== SUBSCRIPTION SECTION ==============
function SubscriptionSection() {
  const [subscription, setSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showPlansDialog, setShowPlansDialog] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [paymentMethods] = useState([
    { code: 'FAWRY', name: 'فوري', icon: '🏪' },
    { code: 'INSTAPAY', name: 'انستا باي', icon: '💳' },
    { code: 'VODAFONE_CASH', name: 'فودافون كاش', icon: '📱' },
    { code: 'ORANGE_MONEY', name: 'أورنج موني', icon: '🟠' },
    { code: 'ETISALAT_CASH', name: 'اتصالات كاش', icon: '🔴' },
    { code: 'BANK_TRANSFER', name: 'تحويل بنكي', icon: '🏦' }
  ])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [plansRes] = await Promise.all([
        fetch('/api/plans').then(r => r.json())
      ])
      
      if (plansRes.success) {
        setPlans(plansRes.data)
      }
    } catch (error) {
      console.error('Error loading subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePayment = async () => {
    if (!selectedPaymentMethod || !subscription) return
    
    try {
      const res = await fetch('/api/subscription-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          companyId: subscription.companyId,
          paymentMethod: selectedPaymentMethod
        })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('تم إنشاء طلب الدفع')
        setShowPaymentDialog(false)
        // عرض تعليمات الدفع
        if (data.message) {
          toast.info(data.message, { duration: 10000 })
        }
      }
    } catch (error) {
      toast.error('فشل في إنشاء طلب الدفع')
    }
  }

  const getUsagePercent = (used: number, max: number) => {
    if (max === -1) return 0 // غير محدود
    return Math.min((used / max) * 100, 100)
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 70) return 'bg-amber-500'
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-md bg-gradient-to-l from-purple-500/5 to-pink-500/5">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  // افتراض خطة افتراضية للعرض
  const currentPlan = plans.find(p => p.code === 'free') || plans[0]
  const usage = {
    branches: { used: 1, max: currentPlan?.maxBranches || 1 },
    users: { used: 2, max: currentPlan?.maxUsers || 5 },
    products: { used: 15, max: currentPlan?.maxProducts || 100 },
    customers: { used: 45, max: currentPlan?.maxCustomers || 500 },
    invoices: { used: 12, max: currentPlan?.maxInvoices || 100 }
  }

  return (
    <>
      <Card className="border-0 shadow-md bg-gradient-to-l from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-purple-500" />
            الاشتراك والخطة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* الخطة الحالية */}
          <div className="p-4 rounded-lg bg-gradient-to-l from-purple-500/10 to-pink-500/10 border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold">{currentPlan?.nameAr || 'المجانية'}</h3>
                <p className="text-sm text-muted-foreground">{currentPlan?.descriptionAr || 'للشركات الصغيرة'}</p>
              </div>
              <Badge className="bg-purple-500 text-white">
                {currentPlan?.price === 0 ? 'مجاني' : `${currentPlan?.price} ${currentPlan?.currency}/شهر`}
              </Badge>
            </div>
            <Button 
              className="w-full bg-gradient-to-l from-purple-500 to-pink-500"
              onClick={() => setShowPlansDialog(true)}
            >
              <TrendingUp className="h-4 w-4 ml-2" />
              ترقية الخطة
            </Button>
          </div>

          {/* استخدام الموارد */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">استخدام الموارد</h4>
            
            {[
              { label: 'الفروع', icon: Home, ...usage.branches },
              { label: 'المستخدمين', icon: Users, ...usage.users },
              { label: 'المنتجات', icon: Package, ...usage.products },
              { label: 'العملاء', icon: UserCheck, ...usage.customers },
              { label: 'الفواتير (شهرياً)', icon: Receipt, ...usage.invoices }
            ].map((item, i) => {
              const percent = getUsagePercent(item.used, item.max)
              const isUnlimited = item.max === -1
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </span>
                    <span className={percent >= 90 ? 'text-red-500' : ''}>
                      {item.used} / {isUnlimited ? '∞' : item.max}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${getUsageColor(percent)}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* طرق الدفع */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">طرق الدفع المتاحة</h4>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.slice(0, 6).map((method) => (
                <div 
                  key={method.code}
                  className="p-2 rounded-lg bg-muted/30 text-center text-xs"
                >
                  <span className="text-lg">{method.icon}</span>
                  <p className="mt-1">{method.name}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog اختيار الخطة */}
      <Dialog open={showPlansDialog} onOpenChange={setShowPlansDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>اختر الخطة المناسبة</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`cursor-pointer transition-all ${plan.isPopular ? 'border-purple-500 border-2' : ''}`}
                onClick={() => {
                  setSelectedPaymentMethod('')
                  setShowPaymentDialog(true)
                  setShowPlansDialog(false)
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{plan.nameAr}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground"> {plan.currency}/شهر</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      {plan.maxBranches === -1 ? 'فروع غير محدودة' : `${plan.maxBranches} فروع`}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      {plan.maxUsers === -1 ? 'مستخدمين غير محدودين' : `${plan.maxUsers} مستخدمين`}
                    </li>
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog الدفع */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اختر طريقة الدفع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <Button
                  key={method.code}
                  variant={selectedPaymentMethod === method.code ? 'default' : 'outline'}
                  className={`h-auto py-4 flex-col gap-2 ${selectedPaymentMethod === method.code ? 'bg-gradient-to-l from-purple-500 to-pink-500' : ''}`}
                  onClick={() => setSelectedPaymentMethod(method.code)}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <span>{method.name}</span>
                </Button>
              ))}
            </div>
            <Button 
              className="w-full" 
              disabled={!selectedPaymentMethod}
              onClick={handleCreatePayment}
            >
              متابعة الدفع
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============== SYSTEM SETTINGS TAB ==============
function SystemSettingsTab({ 
  companies, 
  selectedCompanyId, 
  setSelectedCompanyId 
}: { 
  companies: any[]
  selectedCompanyId: string
  setSelectedCompanyId: (id: string) => void 
}) {
  const [currentUser, setCurrentUser] = useState<{id: string; role: string; companyId?: string; name: string} | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedStatus, setSeedStatus] = useState<{ hasData: boolean; counts: any } | null>(null)
  const [backupHistory, setBackupHistory] = useState<any[]>([])
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<File | null>(null)

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const isCompanyAdmin = currentUser?.role === 'COMPANY_ADMIN'
  const userCompanyId = currentUser?.companyId || ''

  useEffect(() => {
    const userStr = localStorage.getItem('erp_user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setCurrentUser(userData)
      if (userData.role === 'COMPANY_ADMIN' && userData.companyId) {
        setSelectedCompanyId(userData.companyId)
      }
    }
    
    const checkSeedStatus = async () => {
      try {
        const res = await fetch('/api/seed')
        const data = await res.json()
        if (data.success) setSeedStatus({ hasData: data.hasData, counts: data.counts })
      } catch (e) {}
    }
    checkSeedStatus()
  }, [])

  // تصدير النسخة الاحتياطية
  const handleExport = async () => {
    const exportCompanyId = isSuperAdmin ? selectedCompanyId : userCompanyId
    const isFullBackup = isSuperAdmin && selectedCompanyId === 'all'
    
    setExporting(true)
    try {
      const backup: any = { 
        version: '2.0', 
        date: new Date().toISOString(), 
        type: isFullBackup ? 'full' : 'company',
        exportedBy: currentUser?.name,
        exportedAt: new Date().toISOString(),
        companyName: isFullBackup ? 'النظام كامل' : companies.find(c => c.id === exportCompanyId)?.name
      }
      
      if (isFullBackup) {
        const endpoints = ['companies', 'branches', 'users', 'customers', 'products', 'invoices', 'payments', 'warehouses', 'zones', 'categories', 'suppliers', 'purchaseInvoices', 'purchaseReturns', 'inventoryTransfers']
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(`/api/${endpoint}?limit=10000`)
            const data = await res.json()
            backup[endpoint] = data.data || []
          } catch (e) {
            backup[endpoint] = []
          }
        }
      } else {
        const endpoints = ['customers', 'products', 'invoices', 'payments', 'warehouses', 'zones', 'categories', 'suppliers', 'purchaseInvoices', 'purchaseReturns', 'inventoryTransfers']
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(`/api/${endpoint}?companyId=${exportCompanyId}&limit=10000`)
            const data = await res.json()
            backup[endpoint] = data.data || []
          } catch (e) {
            backup[endpoint] = []
          }
        }
        const companyRes = await fetch(`/api/companies/${exportCompanyId}`)
        const companyData = await companyRes.json()
        backup.companies = companyData.success ? [companyData.data] : []
        
        const branchesRes = await fetch(`/api/branches?companyId=${exportCompanyId}&limit=10000`)
        const branchesData = await branchesRes.json()
        backup.branches = branchesData.data || []
        
        const usersRes = await fetch(`/api/users?companyId=${exportCompanyId}&limit=10000`)
        const usersData = await usersRes.json()
        backup.users = usersData.data || []
      }
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `erp-backup-${isFullBackup ? 'full' : 'company'}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('✅ تم تصدير النسخة الاحتياطية بنجاح')
    } catch (e) {
      toast.error('فشل تصدير البيانات')
    } finally {
      setExporting(false)
    }
  }

  // استيراد النسخة الاحتياطية (للسوبر أدمن فقط)
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSelectedBackup(file)
    setShowRestoreDialog(true)
    e.target.value = ''
  }

  const handleConfirmRestore = async () => {
    if (!selectedBackup) return
    
    setImporting(true)
    try {
      const text = await selectedBackup.text()
      const backup = JSON.parse(text)
      
      // التحقق من صحة الملف
      if (!backup.version || !backup.date) {
        toast.error('ملف نسخة احتياطية غير صالح')
        return
      }

      // استيراد البيانات
      const importOrder = ['companies', 'branches', 'users', 'zones', 'categories', 'warehouses', 'products', 'customers', 'suppliers', 'invoices', 'payments', 'purchaseInvoices', 'purchaseReturns', 'inventoryTransfers']
      
      let imported = 0
      for (const endpoint of importOrder) {
        if (backup[endpoint] && backup[endpoint].length > 0) {
          for (const item of backup[endpoint]) {
            try {
              await fetch(`/api/${endpoint}`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(item) 
              })
              imported++
            } catch (e) {
              // تخطي الأخطاء
            }
          }
        }
      }
      
      toast.success(`✅ تم استيراد ${imported} سجل بنجاح`)
      setShowRestoreDialog(false)
      setSelectedBackup(null)
    } catch (e) {
      toast.error('فشل استيراد البيانات - تأكد من صحة الملف')
    } finally {
      setImporting(false)
    }
  }

  // مسح جميع البيانات
  const handleDeleteAll = async () => {
    if (!deletePassword) {
      toast.error('يرجى إدخال كلمة المرور للتأكيد')
      return
    }
    
    if (!deleteConfirm) {
      toast.error('يرجى تأكيد الحذف')
      return
    }

    setDeleting(true)
    try {
      const deleteCompanyId = isSuperAdmin ? selectedCompanyId : userCompanyId
      const isFullDelete = isSuperAdmin && selectedCompanyId === 'all'
      
      const deleteOrder = ['payments', 'invoices', 'customers', 'products', 'warehouses', 'zones', 'categories', 'branches', 'users']
      
      for (const endpoint of deleteOrder) {
        try {
          await fetch(`/api/${endpoint}?deleteAll=true${!isFullDelete ? `&companyId=${deleteCompanyId}` : ''}`, { method: 'DELETE' })
        } catch (e) {}
      }
      
      toast.success('✅ تم مسح جميع البيانات بنجاح')
      setDeleteConfirm(false)
      setDeletePassword('')
    } catch (e) {
      toast.error('فشل مسح البيانات')
    } finally {
      setDeleting(false)
    }
  }

  // إضافة بيانات تجريبية
  const handleSeedData = async () => {
    if (!confirm('هل تريد إضافة بيانات تجريبية للنظام؟')) return
    setSeedLoading(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setSeedStatus({ hasData: true, counts: data.counts })
      } else {
        toast.error(data.message || data.error)
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء إضافة البيانات')
    } finally {
      setSeedLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SubscriptionSection />
      
      {/* معلومات النظام */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-l from-cyan-500/10 to-teal-500/10">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-500" />
            معلومات النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Database, color: 'cyan', label: 'قاعدة البيانات', value: 'SQLite - متصل ✅' },
              { icon: Globe, color: 'teal', label: 'الإصدار', value: 'v2.0.0' },
              { icon: HelpCircle, color: 'blue', label: 'الدعم الفني', value: 'متاح 24/7' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                <div className={`h-10 w-10 rounded-lg bg-${item.color}-500/10 flex items-center justify-center`}>
                  <item.icon className={`h-5 w-5 text-${item.color}-500`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* النسخ الاحتياطي والاسترجاع */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-l from-emerald-500/10 to-green-500/10">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-500" />
            النسخ الاحتياطي والاسترجاع
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* اختيار الشركة للسوبر أدمن */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                نطاق النسخة الاحتياطية
              </Label>
              <Select value={selectedCompanyId || 'all'} onValueChange={setSelectedCompanyId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌐 النظام كامل (جميع الشركات)</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>🏢 {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* تصدير */}
            <div className="p-4 rounded-lg bg-gradient-to-l from-emerald-500/10 to-green-500/10 border">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Download className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium">تصدير نسخة احتياطية</p>
                  <p className="text-xs text-muted-foreground">
                    {isSuperAdmin ? 'تصدير النظام كامل أو شركة محددة' : 'تصدير بيانات شركتك'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleExport} 
                disabled={exporting} 
                className="w-full bg-gradient-to-l from-emerald-500 to-green-500"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Download className="h-4 w-4 ml-2" />}
                {exporting ? 'جاري التصدير...' : 'تنزيل النسخة الاحتياطية'}
              </Button>
            </div>

            {/* استيراد - للسوبر أدمن فقط */}
            {isSuperAdmin ? (
              <div className="p-4 rounded-lg bg-gradient-to-l from-blue-500/10 to-indigo-500/10 border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">استرجاع نسخة احتياطية</p>
                    <p className="text-xs text-muted-foreground">استرجاع البيانات من ملف نسخة سابقة</p>
                  </div>
                </div>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" id="backup-import" disabled={importing} />
                  <label htmlFor="backup-import" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">اضغط لاختيار ملف النسخة الاحتياطية</p>
                    <p className="text-xs text-muted-foreground mt-1">صيغة JSON</p>
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/30 border border-dashed">
                <div className="flex flex-col items-center justify-center h-full py-4">
                  <Shield className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    استرجاع النسخة الاحتياطية متاح للسوبر أدمن فقط
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* منطقة الخطر - مسح البيانات */}
      <Card className="border-2 border-red-200 dark:border-red-800">
        <CardHeader className="bg-gradient-to-l from-red-500/10 to-rose-500/10">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            منطقة الخطر - مسح البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">تحذير!</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                هذا الإجراء سيحذف جميع البيانات بشكل نهائي ولا يمكن التراجع عنه.
                {isSuperAdmin ? ' يمكنك مسح جميع بيانات النظام أو شركة محددة.' : ' سيتم مسح جميع بيانات شركتك.'}
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="space-y-2">
              <Label>نطاق المسح</Label>
              <Select value={selectedCompanyId || 'all'} onValueChange={setSelectedCompanyId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">⚠️ النظام كامل (جميع الشركات)</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>🏢 {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-red-600">أدخل كلمة المرور للتأكيد</Label>
            <Input 
              type="password" 
              value={deletePassword} 
              onChange={(e) => setDeletePassword(e.target.value)} 
              placeholder="أدخل كلمة المرور" 
              className="border-red-200 focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <input 
              type="checkbox" 
              id="confirm-delete" 
              checked={deleteConfirm} 
              onChange={(e) => setDeleteConfirm(e.target.checked)} 
              className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500" 
            />
            <label htmlFor="confirm-delete" className="text-sm text-red-700 dark:text-red-300">
              أنا أفهم أن جميع البيانات سيتم حذفها نهائياً ولا يمكن استرجاعها
            </label>
          </div>

          <Button 
            variant="destructive" 
            className="w-full bg-gradient-to-l from-red-500 to-rose-500" 
            onClick={handleDeleteAll} 
            disabled={!deleteConfirm || !deletePassword || deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Trash2 className="h-4 w-4 ml-2" />}
            {deleting ? 'جاري المسح...' : '⚠️ مسح جميع البيانات'}
          </Button>
        </CardContent>
      </Card>

      {/* البيانات التجريبية */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-l from-amber-500/10 to-orange-500/10">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-500" />
            البيانات التجريبية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-gradient-to-l from-amber-500/10 to-orange-500/10 border gap-4">
              <div>
                <p className="font-medium">إضافة بيانات تجريبية</p>
                <p className="text-sm text-muted-foreground">إضافة شركات، فروع، مستخدمين، عملاء، منتجات، فواتير ومدفوعات للتجربة</p>
              </div>
              <Button 
                onClick={handleSeedData} 
                disabled={seedLoading || (seedStatus?.hasData)} 
                className="bg-gradient-to-l from-amber-500 to-orange-500 shrink-0"
              >
                {seedLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Database className="h-4 w-4 ml-2" />}
                {seedLoading ? 'جاري الإضافة...' : seedStatus?.hasData ? 'البيانات موجودة' : 'إضافة بيانات'}
              </Button>
            </div>
            
            {seedStatus?.hasData && seedStatus.counts && (
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: 'الشركات', value: seedStatus.counts.companies, color: 'text-purple-500' },
                  { label: 'الفروع', value: seedStatus.counts.branches, color: 'text-indigo-500' },
                  { label: 'المستخدمين', value: seedStatus.counts.users, color: 'text-pink-500' },
                  { label: 'العملاء', value: seedStatus.counts.customers, color: 'text-cyan-500' },
                  { label: 'المنتجات', value: seedStatus.counts.products, color: 'text-orange-500' },
                  { label: 'الفواتير', value: seedStatus.counts.invoices, color: 'text-emerald-500' },
                  { label: 'المدفوعات', value: seedStatus.counts.payments, color: 'text-green-500' },
                  { label: 'المناطق', value: seedStatus.counts.zones, color: 'text-teal-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
                    <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* نافذة تأكيد الاسترجاع */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="h-5 w-5" />
              تأكيد استرجاع النسخة الاحتياطية
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">تنبيه!</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    استرجاع النسخة الاحتياطية قد يستبدل بعض البيانات الحالية.
                    يُنصح بعمل نسخة احتياطية للبيانات الحالية قبل المتابعة.
                  </p>
                </div>
              </div>
            </div>
            
            {selectedBackup && (
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-sm"><strong>الملف:</strong> {selectedBackup.name}</p>
                <p className="text-xs text-muted-foreground"><strong>الحجم:</strong> {(selectedBackup.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowRestoreDialog(false); setSelectedBackup(null) }}>
              إلغاء
            </Button>
            <Button 
              onClick={handleConfirmRestore} 
              disabled={importing}
              className="bg-gradient-to-l from-blue-500 to-indigo-500"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <RefreshCw className="h-4 w-4 ml-2" />}
              {importing ? 'جاري الاسترجاع...' : 'تأكيد الاسترجاع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== SETTINGS ==============
function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedStatus, setSeedStatus] = useState<{ hasData: boolean; counts: any } | null>(null)
  const [settings, setSettings] = useState({ currency: 'SAR', taxRate: 15, showTax: true, discountEnabled: true, language: 'ar', dateFormat: 'ar-SA-short', notifications: { email: true, installments: true, payments: true } })
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const currencies = [...defaultCurrencies]
  const [activeSettingsTab, setActiveSettingsTab] = useState('appearance')

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(timer)
  }, [])
  
  useEffect(() => {
    const savedSettings = localStorage.getItem('erp_settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings(prev => ({ ...prev, ...parsed }))
    }
    
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/companies?limit=100')
        const data = await res.json()
        if (data.success) {
          setCompanies(data.data || [])
          if (data.data?.length > 0 && !selectedCompanyId) {
            setSelectedCompanyId(data.data[0].id)
            if (data.data[0].discountEnabled !== undefined) {
              setSettings(prev => ({ ...prev, discountEnabled: data.data[0].discountEnabled }))
            }
          }
        }
      } catch (e) {}
    }
    fetchCompanies()
    
    const checkSeedStatus = async () => {
      try {
        const res = await fetch('/api/seed')
        const data = await res.json()
        if (data.success) setSeedStatus({ hasData: data.hasData, counts: data.counts })
      } catch (e) {}
    }
    checkSeedStatus()
  }, [])

  const handleSaveSettings = (showToast: boolean = true) => {
    localStorage.setItem('erp_settings', JSON.stringify(settings))
    if (showToast) toast.success('تم حفظ الإعدادات بنجاح')
  }

  const handleSettingChange = (key: string, value: any, showSuccess: boolean = true) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    localStorage.setItem('erp_settings', JSON.stringify({ ...settings, [key]: value }))
    if (showSuccess) {
      toast.success(`تم ${value ? 'تفعيل' : 'تعطيل'} ${key === 'showTax' ? 'إظهار الضريبة' : key === 'discountEnabled' ? 'الخصم' : key} بنجاح`)
    }
  }

  const handleUpdateDiscountSetting = async (enabled: boolean) => {
    if (!selectedCompanyId) {
      toast.error('يرجى اختيار شركة أولاً')
      return
    }
    
    try {
      const res = await fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCompanyId, discountEnabled: enabled })
      })
      const data = await res.json()
      if (data.success) {
        setSettings(prev => ({ ...prev, discountEnabled: enabled }))
        localStorage.setItem('erp_settings', JSON.stringify({ ...settings, discountEnabled: enabled }))
        toast.success(enabled ? '✅ تم تفعيل الخصم بنجاح' : '❌ تم إلغاء تفعيل الخصم')
        setCompanies(prev => prev.map(c => c.id === selectedCompanyId ? { ...c, discountEnabled: enabled } : c))
      } else {
        toast.error(data.error || 'فشل تحديث الإعداد')
      }
    } catch (e) {
      toast.error('حدث خطأ')
    }
  }

  const handleSeedData = async () => {
    if (!confirm('هل تريد إضافة بيانات تجريبية للنظام؟')) return
    setSeedLoading(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setSeedStatus({ hasData: true, counts: data.counts })
      } else {
        toast.error(data.message || data.error)
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء إضافة البيانات')
    } finally {
      setSeedLoading(false)
    }
  }

  // قائمة التبويبات
  const settingsTabs = [
    { id: 'appearance', label: 'المظهر', icon: Palette },
    { id: 'payment-gateways', label: 'بوابات الدفع', icon: CreditCard },
    { id: 'finance', label: 'المالية', icon: DollarSign },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'system', label: 'النظام', icon: Database },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gray-500/10 flex items-center justify-center">
          <Settings className="h-6 w-6 text-gray-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground text-sm">إعدادات النظام والتخصيص</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* القائمة الجانبية - تبويبات رأسية */}
        <div className="lg:w-64 shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all ${
                    activeSettingsTab === tab.id 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* محتوى التبويبات */}
        <div className="flex-1 min-w-0">
          {/* المظهر */}
          {activeSettingsTab === 'appearance' && (
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-l from-purple-500/10 to-pink-500/10">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-500" />
                  إعدادات المظهر
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      {theme === 'dark' ? <Moon className="h-5 w-5 text-purple-500" /> : <Sun className="h-5 w-5 text-amber-500" />}
                    </div>
                    <div>
                      <p className="font-medium">الوضع الداكن</p>
                      <p className="text-sm text-muted-foreground">تفعيل الوضع الداكن للواجهة</p>
                    </div>
                  </div>
                  {mounted && (
                    <Switch 
                      checked={theme === 'dark'} 
                      onCheckedChange={(checked) => {
                        setTheme(checked ? 'dark' : 'light')
                        toast.success(checked ? '🌙 تم تفعيل الوضع الداكن' : '☀️ تم تفعيل الوضع الفاتح')
                      }} 
                    />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="font-medium">اللغة</p>
                      <p className="text-sm text-muted-foreground">لغة واجهة المستخدم</p>
                    </div>
                  </div>
                  <Select value={settings.language} onValueChange={(v) => {
                    setSettings({ ...settings, language: v })
                    toast.success(v === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English')
                  }}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-500" />
                    صيغة عرض التاريخ
                  </Label>
                  <Select value={settings.dateFormat || 'ar-SA-short'} onValueChange={(v) => {
                    setSettings({ ...settings, dateFormat: v })
                    toast.success('تم تحديث صيغة التاريخ')
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="p-4 rounded-lg bg-gradient-to-l from-cyan-500/10 to-teal-500/10 border">
                    <p className="text-sm text-muted-foreground mb-1">معاينة:</p>
                    <p className="text-xl font-bold text-cyan-600">
                      {(() => {
                        const format = dateFormats.find(f => f.id === (settings.dateFormat || 'ar-SA-short')) || dateFormats[0]
                        return new Date().toLocaleDateString(format.locale, format.options)
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* بوابات الدفع */}
          {activeSettingsTab === 'payment-gateways' && (
            <PaymentGatewaySettings />
          )}

          {/* المالية */}
          {activeSettingsTab === 'finance' && (
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-l from-emerald-500/10 to-green-500/10">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  إعدادات المالية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    العملة الافتراضية
                  </Label>
                  <Select value={settings.currency} onValueChange={(v) => handleSettingChange('currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.name} ({c.symbol})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-emerald-500" />
                    نسبة الضريبة (%)
                  </Label>
                  <Input 
                    type="number" 
                    value={settings.taxRate} 
                    onChange={(e) => handleSettingChange('taxRate', parseInt(e.target.value) || 0, false)} 
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">إظهار الضريبة</p>
                      <p className="text-sm text-muted-foreground">عرض الضريبة في الفواتير والمستندات</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.showTax !== false} 
                    onCheckedChange={(checked) => handleSettingChange('showTax', checked)} 
                  />
                </div>

                {companies.length > 0 && (
                  <div className="space-y-3">
                    <Label>الشركة</Label>
                    <Select value={selectedCompanyId} onValueChange={(v) => {
                      setSelectedCompanyId(v)
                      const company = companies.find(c => c.id === v)
                      if (company) {
                        setSettings(prev => ({ ...prev, discountEnabled: company.discountEnabled ?? true }))
                      }
                    }}>
                      <SelectTrigger><SelectValue placeholder="اختر الشركة" /></SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-l from-violet-500/10 to-purple-500/10 border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Percent className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="font-medium">تفعيل الخصم</p>
                      <p className="text-sm text-muted-foreground">السماح بإضافة خصم في الفواتير</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.discountEnabled !== false} 
                    onCheckedChange={(checked) => handleUpdateDiscountSetting(checked)} 
                  />
                </div>

                <Button onClick={() => handleSaveSettings()} className="w-full bg-gradient-to-l from-emerald-500 to-green-500">
                  <Save className="h-4 w-4 ml-2" />
                  حفظ إعدادات المالية
                </Button>
              </CardContent>
            </Card>
          )}

          {/* الأمان */}
          {activeSettingsTab === 'security' && (
            <div className="space-y-6">
              <TwoFactorSettings />
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-gradient-to-l from-orange-500/10 to-amber-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-orange-500" />
                    تغيير كلمة المرور
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>كلمة المرور الحالية</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور الجديدة</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>تأكيد كلمة المرور</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <Button onClick={() => toast.success('✅ تم تحديث كلمة المرور بنجاح')} className="w-full bg-gradient-to-l from-orange-500 to-amber-500">
                    <Key className="h-4 w-4 ml-2" />
                    تحديث كلمة المرور
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* الإشعارات */}
          {activeSettingsTab === 'notifications' && (
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-l from-amber-500/10 to-yellow-500/10">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  إعدادات الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">إشعارات البريد</p>
                      <p className="text-sm text-muted-foreground">استلام تنبيهات عبر البريد الإلكتروني</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.notifications?.email} 
                    onCheckedChange={(v) => {
                      setSettings({ ...settings, notifications: { ...settings.notifications, email: v } })
                      toast.success(v ? '✅ تم تفعيل إشعارات البريد' : '❌ تم إلغاء إشعارات البريد')
                    }} 
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">تنبيهات الأقساط</p>
                      <p className="text-sm text-muted-foreground">إشعار عند استحقاق الأقساط</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.notifications?.installments} 
                    onCheckedChange={(v) => {
                      setSettings({ ...settings, notifications: { ...settings.notifications, installments: v } })
                      toast.success(v ? '✅ تم تفعيل تنبيهات الأقساط' : '❌ تم إلغاء تنبيهات الأقساط')
                    }} 
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">تنبيهات المدفوعات</p>
                      <p className="text-sm text-muted-foreground">إشعار عند استلام مدفوعات</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.notifications?.payments} 
                    onCheckedChange={(v) => {
                      setSettings({ ...settings, notifications: { ...settings.notifications, payments: v } })
                      toast.success(v ? '✅ تم تفعيل تنبيهات المدفوعات' : '❌ تم إلغاء تنبيهات المدفوعات')
                    }} 
                  />
                </div>

                <Button onClick={() => handleSaveSettings()} className="w-full bg-gradient-to-l from-amber-500 to-yellow-500">
                  <Bell className="h-4 w-4 ml-2" />
                  حفظ إعدادات الإشعارات
                </Button>
              </CardContent>
            </Card>
          )}

          {/* الملف الشخصي */}
          {activeSettingsTab === 'profile' && (
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-l from-blue-500/10 to-indigo-500/10">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  الملف الشخصي
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="أدخل اسمك" />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="example@mail.com" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+966 5XX XXX XXXX" />
                </div>
                <Button onClick={() => toast.success('✅ تم حفظ الملف الشخصي بنجاح')} className="w-full bg-gradient-to-l from-blue-500 to-indigo-500">
                  <Save className="h-4 w-4 ml-2" />
                  حفظ الملف الشخصي
                </Button>
              </CardContent>
            </Card>
          )}

          {/* النظام */}
          {activeSettingsTab === 'system' && (
            <SystemSettingsTab 
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              setSelectedCompanyId={setSelectedCompanyId}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ============== COMMISSIONS MANAGEMENT ==============
function CommissionsManagement() {
  const [policies, setPolicies] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'policies' | 'commissions' | 'reports'>('commissions')
  const currency = useCurrency()
  const { formatDate } = useDateFormat()
  
  // الفلاتر
  const [filters, setFilters] = useState({
    branchId: '',
    agentId: '',
    collectorId: '',
    startDate: '',
    endDate: '',
    status: '',
    type: ''
  })
  
  // نافذة إضافة سياسة
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<any>(null)
  const [policyForm, setPolicyForm] = useState({
    name: '',
    type: 'COLLECTION',
    calculationType: 'PERCENTAGE',
    value: 0,
    perItem: false,
    minAmount: 0,
    maxAmount: 0,
    branchId: '',
    agentId: ''
  })
  
  // تقرير المندوب المحدد
  const [selectedAgentReport, setSelectedAgentReport] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [policiesRes, commissionsRes, agentsRes, branchesRes, companiesRes] = await Promise.all([
        fetch('/api/commissions/policies?limit=100'),
        fetch('/api/commissions/agent?limit=100'),
        fetch('/api/users?limit=100'),
        fetch('/api/branches?limit=100'),
        fetch('/api/companies?limit=100')
      ])
      
      const policiesData = await policiesRes.json()
      const commissionsData = await commissionsRes.json()
      const agentsData = await agentsRes.json()
      const branchesData = await branchesRes.json()
      const companiesData = await companiesRes.json()
      
      if (policiesData.success) setPolicies(policiesData.data)
      if (commissionsData.success) setCommissions(commissionsData.data)
      if (agentsData.success) setAgents(agentsData.data.filter((u: any) => u.role === 'AGENT' || u.role === 'COLLECTOR' || u.role === 'BRANCH_MANAGER'))
      if (branchesData.success) setBranches(branchesData.data)
      if (companiesData.success) setCompanies(companiesData.data)
    } catch (e) {
      toast.error('فشل تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // جلب تقرير المندوب
  const fetchAgentReport = async (agentId: string) => {
    try {
      const params = new URLSearchParams({
        summary: 'true',
        agentId,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      })
      const res = await fetch(`/api/commissions/agent?${params}`)
      const data = await res.json()
      if (data.success) {
        setSelectedAgentReport({ agentId, ...data.data })
      }
    } catch (e) {
      toast.error('فشل تحميل تقرير المندوب')
    }
  }

  // حفظ سياسة العمولة
  const handleSavePolicy = async () => {
    if (!policyForm.name || policyForm.value <= 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    
    // التحقق من وجود شركة
    const companyId = companies[0]?.id
    if (!companyId) {
      toast.error('يجب إضافة شركة أولاً قبل إنشاء سياسة العمولة')
      return
    }
    
    try {
      const url = editingPolicy ? `/api/commissions/policies` : '/api/commissions/policies'
      const method = editingPolicy ? 'PUT' : 'POST'
      const body = editingPolicy 
        ? { ...policyForm, id: editingPolicy.id }
        : { 
            ...policyForm, 
            companyId,
            branchId: policyForm.branchId || null,
            agentId: policyForm.agentId || null,
            minAmount: policyForm.minAmount || null,
            maxAmount: policyForm.maxAmount || null
          }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(editingPolicy ? 'تم تحديث السياسة' : 'تم إنشاء السياسة')
        setPolicyDialogOpen(false)
        setEditingPolicy(null)
        setPolicyForm({
          name: '',
          type: 'COLLECTION',
          calculationType: 'PERCENTAGE',
          value: 0,
          perItem: false,
          minAmount: 0,
          maxAmount: 0,
          branchId: '',
          agentId: ''
        })
        fetchData()
      } else {
        toast.error(data.error || 'فشل الحفظ')
      }
    } catch (e) {
      toast.error('حدث خطأ')
    }
  }

  // دفع العمولات
  const handlePayCommissions = async (commissionIds: string[]) => {
    try {
      const res = await fetch('/api/commissions/agent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionIds, paidDate: new Date().toISOString() })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`تم دفع ${data.data?.length || commissionIds.length} عمولة`)
        fetchData()
      } else {
        toast.error(data.error || 'فشل العملية')
      }
    } catch (e) {
      toast.error('حدث خطأ')
    }
  }

  // تصفية العمولات
  const filteredCommissions = commissions.filter((c: any) => {
    if (filters.branchId && c.agent?.branch?.id !== filters.branchId) return false
    if (filters.agentId && c.agentId !== filters.agentId) return false
    if (filters.collectorId && c.agentId !== filters.collectorId) return false
    if (filters.status && c.status !== filters.status) return false
    if (filters.type && c.type !== filters.type) return false
    if (filters.startDate && new Date(c.createdAt) < new Date(filters.startDate)) return false
    if (filters.endDate && new Date(c.createdAt) > new Date(filters.endDate)) return false
    return true
  })

  // إحصائيات العمولات
  const stats = {
    totalPending: filteredCommissions.filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + (c.amount || 0), 0),
    totalPaid: filteredCommissions.filter((c: any) => c.status === 'paid').reduce((sum: number, c: any) => sum + (c.amount || 0), 0),
    pendingCount: filteredCommissions.filter((c: any) => c.status === 'pending').length,
    paidCount: filteredCommissions.filter((c: any) => c.status === 'paid').length
  }

  // تجميع العمولات حسب المندوب
  const commissionsByAgent = filteredCommissions.reduce((acc: any, c: any) => {
    const agentId = c.agentId
    if (!acc[agentId]) {
      acc[agentId] = {
        agent: c.agent,
        pending: 0,
        paid: 0,
        pendingCount: 0,
        paidCount: 0,
        commissions: []
      }
    }
    acc[agentId].commissions.push(c)
    if (c.status === 'pending') {
      acc[agentId].pending += c.amount || 0
      acc[agentId].pendingCount++
    } else if (c.status === 'paid') {
      acc[agentId].paid += c.amount || 0
      acc[agentId].paidCount++
    }
    return acc
  }, {})

  const statusColors: any = {
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    paid: 'bg-green-500/10 text-green-600 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20'
  }
  const statusLabels: any = { pending: 'معلقة', paid: 'مدفوعة', cancelled: 'ملغاة' }
  const typeLabels: any = { COLLECTION: 'تحصيل', SALES: 'مبيعات', BOTH: 'كلاهما' }
  const calcTypeLabels: any = { PERCENTAGE: 'نسبة مئوية', FIXED: 'مبلغ ثابت' }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
            <Percent className="h-6 w-6 text-fuchsia-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة العمولات</h1>
            <p className="text-muted-foreground text-sm">سياسات العمولات وتقارير المندوبين</p>
          </div>
        </div>
        <Button 
          className="bg-gradient-to-l from-fuchsia-500 to-purple-600"
          onClick={() => {
            setEditingPolicy(null)
            setPolicyForm({
              name: '',
              type: 'COLLECTION',
              calculationType: 'PERCENTAGE',
              value: 0,
              perItem: false,
              minAmount: 0,
              maxAmount: 0,
              branchId: '',
              agentId: ''
            })
            setPolicyDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          سياسة جديدة
        </Button>
      </div>

      {/* الإحصائيات */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-l from-amber-500/10 to-orange-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عمولات معلقة</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.totalPending, currency.symbol)}</p>
                <p className="text-xs text-muted-foreground">{stats.pendingCount} عملية</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-green-500/10 to-emerald-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عمولات مدفوعة</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid, currency.symbol)}</p>
                <p className="text-xs text-muted-foreground">{stats.paidCount} عملية</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-fuchsia-500/10 to-purple-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">سياسات العمولات</p>
                <p className="text-2xl font-bold text-fuchsia-600">{policies.length}</p>
                <p className="text-xs text-muted-foreground">{policies.filter((p: any) => p.active).length} نشطة</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                <Percent className="h-5 w-5 text-fuchsia-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-l from-blue-500/10 to-indigo-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المندوبين</p>
                <p className="text-2xl font-bold text-blue-600">{agents.length}</p>
                <p className="text-xs text-muted-foreground">مندوب/محصل</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl w-fit">
        {[
          { id: 'commissions', label: 'العمولات' },
          { id: 'reports', label: 'تقارير المندوبين' },
          { id: 'policies', label: 'سياسات العمولات' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-background shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* الفلاتر */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">الفرع</Label>
              <Select value={filters.branchId || 'all'} onValueChange={(v) => setFilters({ ...filters, branchId: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="كل الفروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفروع</SelectItem>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">المندوب</Label>
              <Select value={filters.agentId || 'all'} onValueChange={(v) => setFilters({ ...filters, agentId: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="كل المندوبين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المندوبين</SelectItem>
                  {agents.filter((a: any) => a.role === 'AGENT' || a.role === 'BRANCH_MANAGER').map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">المحصل</Label>
              <Select value={filters.collectorId || 'all'} onValueChange={(v) => setFilters({ ...filters, collectorId: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="كل المحصلين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المحصلين</SelectItem>
                  {agents.filter((a: any) => a.role === 'COLLECTOR').map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">من تاريخ</Label>
              <Input 
                type="date" 
                className="h-9"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">إلى تاريخ</Label>
              <Input 
                type="date" 
                className="h-9"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">الحالة</Label>
              <Select value={filters.status || 'all'} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="كل الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="paid">مدفوعة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilters({
                branchId: '',
                agentId: '',
                collectorId: '',
                startDate: '',
                endDate: '',
                status: '',
                type: ''
              })}
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* محتوى التبويبات */}
      {activeTab === 'commissions' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المندوب</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">المرجع</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        لا توجد عمولات
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommissions.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-fuchsia-500/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-fuchsia-500" />
                            </div>
                            <div>
                              <p className="font-medium">{c.agent?.name || 'غير محدد'}</p>
                              <p className="text-xs text-muted-foreground">{c.agent?.branch?.name || ''}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[c.type] || c.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(c.amount, currency.symbol)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.referenceType === 'INVOICE' ? 'فاتورة' : 'دفعة'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(c.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[c.status] || statusColors.pending}>
                            {statusLabels[c.status] || c.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {c.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-green-500 hover:text-green-600"
                              onClick={() => handlePayCommissions([c.id])}
                            >
                              <Check className="h-4 w-4 ml-1" />
                              دفع
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* جدول المندوبين مع ملخص العمولات */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-fuchsia-500" />
                ملخص عمولات المندوبين
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المندوب</TableHead>
                    <TableHead className="text-right">الفرع</TableHead>
                    <TableHead className="text-right">معلقة</TableHead>
                    <TableHead className="text-right">مدفوعة</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(commissionsByAgent).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا توجد بيانات
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.entries(commissionsByAgent).map(([agentId, data]: [string, any]) => (
                      <TableRow key={agentId} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {data.agent?.name?.charAt(0) || '؟'}
                            </div>
                            <div>
                              <p className="font-medium">{data.agent?.name || 'غير محدد'}</p>
                              <p className="text-xs text-muted-foreground">{data.agent?.email || ''}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{data.agent?.branch?.name || '-'}</TableCell>
                        <TableCell>
                          <span className="text-amber-600 font-medium">{formatCurrency(data.pending, currency.symbol)}</span>
                          <span className="text-xs text-muted-foreground mr-1">({data.pendingCount})</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{formatCurrency(data.paid, currency.symbol)}</span>
                          <span className="text-xs text-muted-foreground mr-1">({data.paidCount})</span>
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(data.pending + data.paid, currency.symbol)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => fetchAgentReport(agentId)}
                            >
                              <FileText className="h-4 w-4 ml-1" />
                              تقرير
                            </Button>
                            {data.pending > 0 && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-green-500"
                                onClick={() => handlePayCommissions(data.commissions.filter((c: any) => c.status === 'pending').map((c: any) => c.id))}
                              >
                                <Check className="h-4 w-4 ml-1" />
                                دفع الكل
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* تقرير المندوب المحدد */}
          {selectedAgentReport && (
            <Card className="border-0 shadow-sm bg-gradient-to-l from-fuchsia-500/5 to-purple-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-fuchsia-500" />
                    تقرير تفصيلي
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setSelectedAgentReport(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-muted-foreground">معلقة</p>
                    <p className="text-2xl font-bold text-amber-600">{formatCurrency(selectedAgentReport.totalPending, currency.symbol)}</p>
                    <p className="text-xs text-muted-foreground">{selectedAgentReport.countPending} عملية</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-muted-foreground">مدفوعة</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedAgentReport.totalPaid, currency.symbol)}</p>
                    <p className="text-xs text-muted-foreground">{selectedAgentReport.countPaid} عملية</p>
                  </div>
                  <div className="p-4 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20">
                    <p className="text-sm text-muted-foreground">الإجمالي</p>
                    <p className="text-2xl font-bold text-fuchsia-600">{formatCurrency(selectedAgentReport.totalPending + selectedAgentReport.totalPaid, currency.symbol)}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">عمولات التحصيل</p>
                    <div className="flex justify-between">
                      <span className="text-amber-600">معلقة: {formatCurrency(selectedAgentReport.byType?.COLLECTION?.pending || 0, currency.symbol)}</span>
                      <span className="text-green-600">مدفوعة: {formatCurrency(selectedAgentReport.byType?.COLLECTION?.paid || 0, currency.symbol)}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">عمولات المبيعات</p>
                    <div className="flex justify-between">
                      <span className="text-amber-600">معلقة: {formatCurrency(selectedAgentReport.byType?.SALES?.pending || 0, currency.symbol)}</span>
                      <span className="text-green-600">مدفوعة: {formatCurrency(selectedAgentReport.byType?.SALES?.paid || 0, currency.symbol)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'policies' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">طريقة الحساب</TableHead>
                  <TableHead className="text-right">القيمة</TableHead>
                  <TableHead className="text-right">النطاق</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد سياسات عمولات
                    </TableCell>
                  </TableRow>
                ) : (
                  policies.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[p.type] || p.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {calcTypeLabels[p.calculationType] || p.calculationType}
                      </TableCell>
                      <TableCell className="font-medium">
                        {p.calculationType === 'PERCENTAGE' ? `${p.value}%` : formatCurrency(p.value, currency.symbol)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.agent ? `مندوب: ${p.agent.name}` : p.branch ? `فرع: ${p.branch.name}` : 'عام'}
                      </TableCell>
                      <TableCell>
                        <Badge className={p.active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
                          {p.active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingPolicy(p)
                              setPolicyForm({
                                name: p.name,
                                type: p.type,
                                calculationType: p.calculationType,
                                value: p.value,
                                perItem: p.perItem || false,
                                minAmount: p.minAmount || 0,
                                maxAmount: p.maxAmount || 0,
                                branchId: p.branchId || '',
                                agentId: p.agentId || ''
                              })
                              setPolicyDialogOpen(true)
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* نافذة إضافة/تعديل سياسة */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? 'تعديل سياسة العمولة' : 'سياسة عمولة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم السياسة *</Label>
              <Input 
                value={policyForm.name} 
                onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                placeholder="مثال: عمولة التحصيل الأساسية"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>نوع العمولة</Label>
                <Select value={policyForm.type} onValueChange={(v) => setPolicyForm({ ...policyForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLLECTION">تحصيل</SelectItem>
                    <SelectItem value="SALES">مبيعات</SelectItem>
                    <SelectItem value="BOTH">كلاهما</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>طريقة الحساب</Label>
                <Select value={policyForm.calculationType} onValueChange={(v) => setPolicyForm({ ...policyForm, calculationType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="FIXED">مبلغ ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>القيمة *</Label>
              <Input 
                type="number" 
                value={policyForm.value} 
                onChange={(e) => setPolicyForm({ ...policyForm, value: parseFloat(e.target.value) || 0 })}
                placeholder={policyForm.calculationType === 'PERCENTAGE' ? 'مثال: 5' : 'مثال: 50'}
              />
              <p className="text-xs text-muted-foreground">
                {policyForm.calculationType === 'PERCENTAGE' 
                  ? 'النسبة تُحسب من قيمة التحصيل أو المبيعات'
                  : 'مبلغ ثابت على كل عملية أو قطعة مباعة'}
              </p>
              {policyForm.calculationType === 'FIXED' && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 mt-2">
                  <Switch 
                    checked={policyForm.perItem} 
                    onCheckedChange={(v) => setPolicyForm({ ...policyForm, perItem: v })}
                  />
                  <div>
                    <p className="text-sm font-medium">على كل قطعة مباعة</p>
                    <p className="text-xs text-muted-foreground">يتم ضرب المبلغ في عدد القطع</p>
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>الحد الأدنى</Label>
                <Input 
                  type="number" 
                  value={policyForm.minAmount} 
                  onChange={(e) => setPolicyForm({ ...policyForm, minAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأقصى</Label>
                <Input 
                  type="number" 
                  value={policyForm.maxAmount} 
                  onChange={(e) => setPolicyForm({ ...policyForm, maxAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>الفرع (اختياري)</Label>
                <Select value={policyForm.branchId || 'all'} onValueChange={(v) => setPolicyForm({ ...policyForm, branchId: v === 'all' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="عام لكل الفروع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">عام لكل الفروع</SelectItem>
                    {branches.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المندوب (اختياري)</Label>
                <Select value={policyForm.agentId || 'all'} onValueChange={(v) => setPolicyForm({ ...policyForm, agentId: v === 'all' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="عام لكل المندوبين" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">عام لكل المندوبين</SelectItem>
                    {agents.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPolicyDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSavePolicy}>
              {editingPolicy ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== SIMPLE MODULE ==============
function SimpleModule({ title, subtitle, icon: Icon, color, bgColor, apiEndpoint, columns }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/${apiEndpoint}?limit=100`)
        const result = await res.json()
        if (result.success) setData(result.data)
      } catch { toast.error('فشل تحميل البيانات') } finally { setLoading(false) }
    }
    fetchData()
  }, [apiEndpoint])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center`}><Icon className={`h-6 w-6 ${color}`} /></div>
        <div><h1 className="text-2xl font-bold">{title}</h1><p className="text-muted-foreground text-sm">{subtitle}</p></div>
      </div>
      <Card><CardContent className="p-0"><DataTable data={data} columns={columns} loading={loading} /></CardContent></Card>
    </div>
  )
}

// ============== SUBSCRIPTION PLANS PAGE ==============
function SubscriptionPlansPage() {
  return <SubscriptionPlansManagement />
}

// ============== SUBSCRIPTION USERS PAGE ==============
function SubscriptionUsersPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [subRes, compRes] = await Promise.all([
        fetch('/api/subscriptions').then(r => r.json()),
        fetch('/api/companies?limit=100').then(r => r.json())
      ])
      if (subRes.success) setSubscriptions(subRes.data)
      if (compRes.success) setCompanies(compRes.data)
    } finally { setLoading(false) }
  }

  const getCompanyStats = (companyId: string) => {
    const company = companies.find((c: any) => c.id === companyId)
    return {
      branches: company?._aggr_count_branches || 0,
      users: company?._aggr_count_users || 0,
      products: company?._aggr_count_products || 0,
      customers: company?._aggr_count_customers || 0
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const company = companies.find((c: any) => c.id === sub.companyId)
    const matchesSearch = company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusColors: Record<string, string> = {
    active: 'bg-green-500', trial: 'bg-blue-500', past_due: 'bg-amber-500', cancelled: 'bg-red-500', expired: 'bg-gray-500'
  }
  const statusLabels: Record<string, string> = {
    active: 'نشط', trial: 'تجريبي', past_due: 'متأخر', cancelled: 'ملغي', expired: 'منتهي'
  }

  const handleViewDetails = (sub: any) => {
    setSelectedCompany({ subscription: sub, company: companies.find((c: any) => c.id === sub.companyId), stats: getCompanyStats(sub.companyId) })
    setDetailsOpen(true)
  }

  const handleRenew = async (subscriptionId: string) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subscriptionId, action: 'renew', endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })
      })
      if ((await res.json()).success) {
        toast.success('تم تجديد الاشتراك لمدة سنة')
        loadData()
      }
    } catch { toast.error('حدث خطأ') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المشتركين</h1>
          <p className="text-muted-foreground">إدارة اشتراكات الشركات وإحصائياتها</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{subscriptions.filter(s => s.status === 'active').length}</div><p className="text-sm text-muted-foreground">اشتراكات نشطة</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{subscriptions.filter(s => s.status === 'trial').length}</div><p className="text-sm text-muted-foreground">فترة تجريبية</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-600">{subscriptions.filter(s => s.status === 'past_due').length}</div><p className="text-sm text-muted-foreground">متأخرين</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{subscriptions.filter(s => s.status === 'expired' || s.status === 'cancelled').length}</div><p className="text-sm text-muted-foreground">منتهية/ملغية</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="trial">تجريبي</SelectItem>
            <SelectItem value="past_due">متأخر</SelectItem>
            <SelectItem value="expired">منتهي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشركة</TableHead>
                <TableHead>الخطة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>بداية الاشتراك</TableHead>
                <TableHead>نهاية الاشتراك</TableHead>
                <TableHead>الاستخدام</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filteredSubscriptions.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا يوجد مشتركين</TableCell></TableRow>
              ) : filteredSubscriptions.map((sub) => {
                const company = companies.find((c: any) => c.id === sub.companyId)
                const stats = getCompanyStats(sub.companyId)
                return (
                  <TableRow key={sub.id}>
                    <TableCell><div className="font-medium">{company?.name || 'غير معروف'}</div></TableCell>
                    <TableCell><Badge>{sub.plan?.nameAr || sub.plan?.name}</Badge></TableCell>
                    <TableCell><Badge className={`${statusColors[sub.status]} text-white`}>{statusLabels[sub.status]}</Badge></TableCell>
                    <TableCell>{new Date(sub.startDate).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>{new Date(sub.endDate).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>فروع: {stats.branches} | مستخدمين: {stats.users}</div>
                        <div>منتجات: {stats.products} | عملاء: {stats.customers}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(sub)}>التفاصيل</Button>
                        {sub.status !== 'active' && <Button size="sm" className="bg-green-500" onClick={() => handleRenew(sub.id)}>تجديد</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>تفاصيل الاشتراك</DialogTitle></DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">الشركة</p><p className="font-bold">{selectedCompany.company?.name}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">الخطة</p><p className="font-bold">{selectedCompany.subscription?.plan?.nameAr}</p></CardContent></Card>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-purple-600">{selectedCompany.stats?.branches}</p><p className="text-sm text-muted-foreground">فروع</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-cyan-600">{selectedCompany.stats?.users}</p><p className="text-sm text-muted-foreground">مستخدمين</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-orange-600">{selectedCompany.stats?.products}</p><p className="text-sm text-muted-foreground">منتجات</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-600">{selectedCompany.stats?.customers}</p><p className="text-sm text-muted-foreground">عملاء</p></CardContent></Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== SUBSCRIPTION PAYMENTS PAGE ==============
function SubscriptionPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { loadPayments() }, [])

  const loadPayments = async () => {
    try {
      const res = await fetch('/api/subscription-payments')
      const data = await res.json()
      if (data.success) setPayments(data.data)
    } finally { setLoading(false) }
  }

  const handleConfirm = async (id: string) => {
    try {
      const res = await fetch('/api/subscription-payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'confirm' })
      })
      if ((await res.json()).success) {
        toast.success('تم تأكيد الدفع')
        loadPayments()
      }
    } catch { toast.error('حدث خطأ') }
  }

  const filteredPayments = payments.filter(p => statusFilter === 'all' || p.status === statusFilter)

  const statusColors: Record<string, string> = {
    completed: 'bg-green-500', pending: 'bg-amber-500', failed: 'bg-red-500', refunded: 'bg-gray-500'
  }
  const statusLabels: Record<string, string> = {
    completed: 'مكتمل', pending: 'قيد الانتظار', failed: 'فشل', refunded: 'مسترد'
  }

  const methodLabels: Record<string, string> = {
    FAWRY: 'فوري', INSTAPAY: 'انستا باي', VODAFONE_CASH: 'فودافون كاش',
    ORANGE_MONEY: 'أورنج موني', ETISALAT_CASH: 'اتصالات كاش', BANK_TRANSFER: 'تحويل بنكي', CASH: 'نقدي'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مدفوعات الاشتراكات</h1>
          <p className="text-muted-foreground">إدارة وتتبع المدفوعات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0).toLocaleString()} ج.م</div><p className="text-sm text-muted-foreground">إجمالي المحصل</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-amber-600">{payments.filter(p => p.status === 'pending').length}</div><p className="text-sm text-muted-foreground">في انتظار التأكيد</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{payments.length}</div><p className="text-sm text-muted-foreground">إجمالي العمليات</p></CardContent></Card>
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">الكل</SelectItem>
          <SelectItem value="pending">قيد الانتظار</SelectItem>
          <SelectItem value="completed">مكتمل</SelectItem>
          <SelectItem value="failed">فشل</SelectItem>
        </SelectContent>
      </Select>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم المرجعي</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد مدفوعات</TableCell></TableRow>
              ) : filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono">{payment.referenceNumber}</TableCell>
                  <TableCell className="font-bold">{payment.amount.toLocaleString()} {payment.currency}</TableCell>
                  <TableCell><Badge variant="outline">{methodLabels[payment.paymentMethod] || payment.paymentMethod}</Badge></TableCell>
                  <TableCell><Badge className={`${statusColors[payment.status]} text-white`}>{statusLabels[payment.status]}</Badge></TableCell>
                  <TableCell>{new Date(payment.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    {payment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-500" onClick={() => handleConfirm(payment.id)}>تأكيد</Button>
                        <Button size="sm" variant="outline" className="text-red-500">رفض</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ============== SIDEBAR ==============
function Sidebar({ currentView, onNavigate, onClose, collapsed, fontSize, onToggleCollapse, onFontSizeChange, user }: any) {
  // مجموعة واحدة مفتوحة فقط - سلوك الأكورديون
  const [openGroup, setOpenGroup] = useState<string | null>('main')
  
  // تصفية المجموعات بناءً على صلاحيات المستخدم
  const filteredNavGroups = navGroups.filter(group => {
    if (group.superAdminOnly) {
      return user?.role === 'SUPER_ADMIN'
    }
    return true
  }).map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.superAdminOnly) {
        return user?.role === 'SUPER_ADMIN'
      }
      return true
    })
  })).filter(group => group.items.length > 0) // إخفاء المجموعات الفارغة
  
  // تحويل حجم الخط إلى classes
  const fontSizeClass = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }[fontSize || 'medium']
  
  const iconSizeClass = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5'
  }[fontSize || 'medium']
  
  const itemPaddingClass = {
    small: 'px-2 py-1.5',
    medium: 'px-3 py-2.5',
    large: 'px-4 py-3'
  }[fontSize || 'medium']

  return (
    <div className={`flex flex-col h-full min-h-0 bg-gradient-to-b from-card via-card to-muted/20 transition-all duration-300 ${collapsed ? 'w-16' : 'w-full'}`} dir="rtl">
      {/* Header - Fixed */}
      <div className={`flex-shrink-0 flex items-center gap-3 p-4 border-b bg-gradient-to-l from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm ${collapsed ? 'justify-center' : ''}`}>
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 text-right overflow-hidden">
            <h1 className="font-bold text-lg bg-gradient-to-l from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">نظام ERP</h1>
            <p className="text-xs text-muted-foreground">إدارة المؤسسات</p>
          </div>
        )}
        {onClose && !collapsed && <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted/50 shrink-0"><X className="h-4 w-4" /></Button>}
      </div>
      
      {/* Navigation - Scrollable independently */}
      <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll" dir="rtl">
        <div className="px-2 py-4 space-y-2">
          {filteredNavGroups.map((group) => (
            <div key={group.id} className="rounded-xl">
              {collapsed ? (
                // الوضع المطوي - أيقونات فقط
                <div className="flex flex-col items-center gap-1 py-1">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/30 mb-1">
                    <span className={`${fontSizeClass} font-bold text-primary`}>{group.title.charAt(0)}</span>
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`group flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-200 ${
                        currentView === item.id 
                          ? `${item.bgColor} ${item.color} shadow-sm` 
                          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      }`}
                      title={item.label}
                    >
                      <item.icon className={`${iconSizeClass} ${currentView === item.id ? item.color : 'text-muted-foreground group-hover:text-foreground'}`} />
                    </button>
                  ))}
                </div>
              ) : (
                // الوضع الموسع - أكورديون كامل (مجموعة واحدة فقط مفتوحة)
                <Collapsible 
                  open={openGroup === group.id} 
                  onOpenChange={() => {
                    setOpenGroup(prev => prev === group.id ? null : group.id)
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full group cursor-pointer" type="button">
                      <div className={`flex items-center justify-between ${itemPaddingClass} rounded-xl transition-all duration-200 ${
                        openGroup === group.id 
                          ? 'bg-gradient-to-l from-primary/10 via-primary/5 to-transparent text-primary' 
                          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full transition-all duration-200 ${
                            openGroup === group.id ? 'bg-primary shadow-sm shadow-primary/50' : 'bg-muted-foreground/30'
                          }`} />
                          <span className={`${fontSizeClass} font-semibold`}>{group.title}</span>
                        </div>
                        <div className={`transition-transform duration-200 ${openGroup === group.id ? 'rotate-180' : ''}`}>
                          <ChevronDown className={iconSizeClass} />
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden">
                    <div className="pr-2 py-2 space-y-1">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { onNavigate(item.id); onClose?.() }}
                          className={`w-full group flex items-center gap-3 ${itemPaddingClass} rounded-xl transition-all duration-200 ${
                            currentView === item.id 
                              ? `${item.bgColor} ${item.color} font-medium shadow-sm` 
                              : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <div className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 ${
                            currentView === item.id 
                              ? `${item.bgColor} shadow-sm` 
                              : 'bg-muted/30 group-hover:bg-muted/50'
                          }`}>
                            <item.icon className={`${iconSizeClass} ${currentView === item.id ? item.color : 'text-muted-foreground group-hover:text-foreground'}`} />
                          </div>
                          <span className={`${fontSizeClass} flex-1 text-right`}>{item.label}</span>
                          {currentView === item.id && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer - Fixed with controls */}
      <div className="flex-shrink-0 border-t bg-gradient-to-l from-blue-500/5 via-purple-500/5 to-pink-500/5">
        {/* Control buttons */}
        {!collapsed && (
          <div className="flex items-center justify-center gap-3 p-3">
            {/* Font Size Control */}
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onFontSizeChange?.(size)}
                  className={`h-7 w-7 rounded-md flex items-center justify-center transition-all duration-200 ${
                    fontSize === size 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-muted/50 text-muted-foreground'
                  }`}
                  title={size === 'small' ? 'خط صغير' : size === 'medium' ? 'خط متوسط' : 'خط كبير'}
                >
                  <span className={`font-medium ${size === 'small' ? 'text-[10px]' : size === 'medium' ? 'text-xs' : 'text-sm'}`}>أ</span>
                </button>
              ))}
            </div>
            
            {/* Collapse Button */}
            <button
              onClick={onToggleCollapse}
              className="h-9 w-9 rounded-lg bg-muted/30 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all duration-200 group"
              title="طي السايدبار"
            >
              <PanelRightClose className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
        
        {/* Collapsed state */}
        {collapsed && (
          <div className="flex flex-col items-center gap-2 p-2">
            <button
              onClick={onToggleCollapse}
              className="h-9 w-9 rounded-lg bg-muted/30 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all duration-200 group"
              title="توسيع السايدبار"
            >
              <PanelRightOpen className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}

// ============== RECEIPTS PRINT HELPER COMPONENTS ==============
// بطاقة القسم
function SectionCard({ title, icon: Icon, iconColor, bgColor, children }: any) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3 bg-gradient-to-l from-muted/50 to-muted/30">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center shadow-sm shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <CardTitle className="text-base truncate">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {children}
      </CardContent>
    </Card>
  )
}

// حقل الإدخال المحسن
function InputField({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div className="space-y-1.5 w-full">
      <Label className="text-xs text-muted-foreground block truncate">{label}</Label>
      <Input 
        type={type}
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className="h-9 text-sm w-full box-border overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ maxWidth: '100%' }}
        dir="rtl"
      />
    </div>
  )
}

// حقل التاريخ
function DateField({ label, value, onChange }: any) {
  return (
    <div className="space-y-1.5 w-full">
      <Label className="text-xs text-muted-foreground block truncate">{label}</Label>
      <Input 
        type="date" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="h-9 text-sm w-full box-border" 
        style={{ maxWidth: '100%' }}
      />
    </div>
  )
}

// حقل الاختيار المحسن
function SelectField({ label, value, onChange, options, placeholder }: any) {
  return (
    <div className="space-y-1.5 w-full">
      <Label className="text-xs text-muted-foreground block truncate">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm w-full box-border overflow-hidden">
          <SelectValue placeholder={placeholder || 'اختر...'} className="truncate" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {options.map((opt: any, index: number) => (
            <SelectItem key={opt.id || opt.value || `opt-${index}`} value={opt.id || opt.value || `val-${index}`} className="truncate">
              {opt.name || opt.nameAr || opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// أزرار المعاينة والطباعة
function ActionButtons({ onPreview, onPrint, previewDisabled, printDisabled }: any) {
  return (
    <div className="flex gap-2 mt-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onPreview}
        disabled={previewDisabled}
        className="flex-1 gap-2"
      >
        <Eye className="h-4 w-4" />
        معاينة
      </Button>
      <Button 
        size="sm" 
        onClick={onPrint}
        disabled={printDisabled}
        className="flex-1 gap-2"
      >
        <Printer className="h-4 w-4" />
        طباعة
      </Button>
    </div>
  )
}

// حقل البحث عن عميل مع قائمة منسدلة
function CustomerSearchField({ 
  label, 
  value, 
  onChange, 
  customers, 
  onCustomerSelect,
  placeholder = "اسم أو كود أو هاتف..."
}: any) {
  const [showDropdown, setShowDropdown] = useState(false)
  
  // تصفية العملاء بناءً على البحث
  const filteredCustomers = customers.filter((c: any) => {
    if (!value || value.trim() === '') return false
    const search = value.toLowerCase().trim()
    const name = (c.name || '').toLowerCase()
    const code = (c.code || '').toLowerCase()
    const phone = (c.phone || '').toLowerCase()
    return name.includes(search) || code.includes(search) || phone.includes(search)
  }).slice(0, 10)
  
  return (
    <div className="space-y-1.5 w-full">
      <Label className="text-xs text-muted-foreground block truncate">{label}</Label>
      <div className="relative w-full">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
        <Input 
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="h-9 text-sm pr-9 w-full box-border overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ maxWidth: '100%' }}
          dir="rtl"
        />
        {/* قائمة العملاء المنسدلة */}
        {showDropdown && filteredCustomers.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCustomers.map((c: any) => (
              <div
                key={c.id}
                className="px-3 py-2 hover:bg-muted cursor-pointer text-sm border-b last:border-b-0"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onCustomerSelect(c)
                  setShowDropdown(false)
                }}
              >
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground flex gap-2">
                  <span>{c.code}</span>
                  {c.phone && <span>• {c.phone}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============== RECEIPTS PRINT DASHBOARD ==============
function ReceiptsPrintDashboard() {
  // States للفلاتر
  const [branches, setBranches] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [lastFilters, setLastFilters] = useState<any>(null)
  
  // States للقوالب
  const [companyTemplates, setCompanyTemplates] = useState<any[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  
  // States لكل قسم
  // 1. إيصالات المندوب
  const [agentBranch, setAgentBranch] = useState('')
  const [agentId, setAgentId] = useState('')
  const [agentDateFrom, setAgentDateFrom] = useState('')
  const [agentDateTo, setAgentDateTo] = useState('')
  
  // 2. عدة عملاء
  const [multiBranch, setMultiBranch] = useState('')
  const [customerCodeFrom, setCustomerCodeFrom] = useState('')
  const [customerCodeTo, setCustomerCodeTo] = useState('')
  
  // 3. عميل واحد
  const [singleBranch, setSingleBranch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  
  // 4. جميع الإيصالات
  const [allDateFrom, setAllDateFrom] = useState('')
  const [allDateTo, setAllDateTo] = useState('')
  
  // 5. فرع معين
  const [branchFilterBranch, setBranchFilterBranch] = useState('')
  const [branchDateFrom, setBranchDateFrom] = useState('')
  const [branchDateTo, setBranchDateTo] = useState('')
  
  const currency = useCurrency()
  const ITEMS_PER_PAGE = 5
  
  // تصفية العملاء بناءً على البحث
  const filteredCustomers = customers.filter((c: any) => {
    if (!customerSearch || customerSearch.trim() === '') return false
    const search = customerSearch.toLowerCase().trim()
    const name = (c.name || '').toLowerCase()
    const code = (c.code || '').toLowerCase()
    const phone = (c.phone || '').toLowerCase()
    return name.includes(search) || code.includes(search) || phone.includes(search)
  }).slice(0, 10) // أقصى 10 نتائج
  
  // جلب البيانات الأولية
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, usersRes, customersRes, templatesRes] = await Promise.all([
          fetch('/api/branches?limit=100'),
          fetch('/api/users?limit=100'),
          fetch('/api/customers?limit=100'),
          fetch('/api/templates/company?companyId=default')
        ])
        
        const branchesData = await branchesRes.json()
        const usersData = await usersRes.json()
        const customersData = await customersRes.json()
        const templatesData = await templatesRes.json()
        
        if (branchesData.success) setBranches(branchesData.data || [])
        if (usersData.success) setAgents((usersData.data || []).filter((u: any) => u.role === 'AGENT'))
        if (customersData.success) setCustomers(customersData.data || [])
        
        // تحميل قوالب الشركة
        if (templatesData.success && templatesData.data?.length > 0) {
          setCompanyTemplates(templatesData.data)
          // تحديد القالب الافتراضي أو أول قالب
          const defaultTemplate = templatesData.data.find((t: any) => t.isDefault)
          setSelectedTemplateId(defaultTemplate?.id || templatesData.data[0]?.id || '')
        } else {
          // إذا لم توجد قوالب مثبتة، استخدم القوالب المجانية
          const freeTemplates = predefinedTemplates.filter(t => t.isFree)
          setCompanyTemplates(freeTemplates)
          setSelectedTemplateId(freeTemplates[0]?.id || '')
        }
      } catch (e) {
        console.error('Error fetching data:', e)
        // في حالة الخطأ، استخدم القوالب المجانية
        const freeTemplates = predefinedTemplates.filter(t => t.isFree)
        setCompanyTemplates(freeTemplates)
        setSelectedTemplateId(freeTemplates[0]?.id || '')
      } finally {
        setTemplatesLoading(false)
      }
    }
    fetchData()
  }, [])
  
  // دالة المعاينة
  const handlePreview = async (filters: any) => {
    setPreviewLoading(true)
    setPreviewOpen(true)
    setLastFilters(filters)
    
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string)
      })
      
      const res = await fetch(`/api/receipts/preview?${params.toString()}`)
      const data = await res.json()
      
      if (data.success) {
        setPreviewData(data.data || [])
        setCurrentPage(0)
      } else {
        toast.error(data.error || 'حدث خطأ أثناء جلب البيانات')
        setPreviewData([])
      }
    } catch (e) {
      console.error('Preview error:', e)
      toast.error('حدث خطأ أثناء المعاينة')
      setPreviewData([])
    } finally {
      setPreviewLoading(false)
    }
  }
  
  // دالة الطباعة
  const handlePrint = () => {
    if (previewData.length === 0) {
      toast.error('لا توجد بيانات للطباعة')
      return
    }
    
    // توليد HTML للطباعة
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('يرجى السماح بالنوافذ المنبثقة')
      return
    }
    
    const receiptsHtml = previewData.map((receipt, index) => `
      <div class="receipt-page" style="width: 794px; height: 374px; padding: 20px; box-sizing: border-box; font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; border: 1px solid #e5e7eb; margin-bottom: 10px; page-break-after: always;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 15px;">
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #6b7280;">${receipt.branch?.nameAr || receipt.branch?.name || ''}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937;">${receipt.company?.nameAr || receipt.company?.name || ''}</div>
            <div style="font-size: 11px; color: #6b7280;">${receipt.company?.phone || ''}</div>
          </div>
          <div style="text-align: left;">
            <div style="font-size: 12px; color: #6b7280;">${receipt.company?.phone || ''}</div>
          </div>
        </div>
        
        <!-- Two Columns -->
        <div style="display: flex; gap: 20px;">
          <!-- عمود بيانات العميل (يمين) -->
          <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px;">
            <div style="font-weight: bold; font-size: 13px; color: #3b82f6; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">بيانات العميل</div>
            <div style="font-size: 11px; line-height: 1.8;">
              <div><strong>الاسم:</strong> ${receipt.customer?.name || '-'}</div>
              <div><strong>الكود:</strong> ${receipt.customer?.code || '-'}</div>
              <div><strong>الهاتف:</strong> ${receipt.customer?.phone || '-'}</div>
              <div><strong>العنوان:</strong> ${receipt.customer?.address || '-'}</div>
            </div>
          </div>
          
          <!-- عمود بيانات القسط (يسار) -->
          <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px;">
            <div style="font-weight: bold; font-size: 13px; color: #10b981; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">بيانات القسط</div>
            <div style="font-size: 11px; line-height: 1.8;">
              <div><strong>رقم العقد:</strong> ${receipt.invoiceNumber || '-'}</div>
              <div><strong>قيمة العقد:</strong> ${receipt.total?.toLocaleString() || 0} ${currency.symbol}</div>
              <div><strong>المقدم:</strong> ${receipt.downPayment?.toLocaleString() || 0} ${currency.symbol}</div>
              <div><strong>القسط الحالي:</strong> ${receipt.installments?.current?.number || '-'}/ ${receipt.installments?.total || 0}</div>
              <div><strong>قيمة القسط:</strong> ${receipt.installments?.current?.amount?.toLocaleString() || 0} ${currency.symbol}</div>
              <div><strong>المتبقي القادم:</strong> ${receipt.installments?.remainingAfterCurrent?.toLocaleString() || 0} ${currency.symbol}</div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 10px; color: #6b7280;">
            <strong>المندوب:</strong> ${receipt.agent?.name || '-'} | ${receipt.agent?.phone || '-'}
          </div>
          <div style="font-size: 10px; color: #6b7280;">
            تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}
          </div>
        </div>
      </div>
    `).join('')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>طباعة الإيصالات</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Sans Arabic', Arial, sans-serif; background: #f3f4f6; padding: 20px; }
          @media print {
            body { background: white; padding: 0; }
            .receipt-page { border: none; margin: 0; page-break-after: always; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${receiptsHtml}
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
    
    toast.success(`جاري طباعة ${previewData.length} إيصال`)
  }
  
  // حساب الصفحات
  const totalPages = Math.ceil(previewData.length / ITEMS_PER_PAGE)
  const paginatedData = previewData.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
  
  // اختصار الطباعة
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && previewOpen && previewData.length > 0) {
        e.preventDefault()
        handlePrint()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewOpen, previewData])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-xl p-6 border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Printer className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">لوحة طباعة إيصالات الأقساط</h1>
              <p className="text-muted-foreground text-sm">اختر نوع الطباعة المطلوبة ثم قم بالمعاينة قبل الطباعة</p>
            </div>
          </div>
          
          {/* اختيار القالب */}
          <div className="flex items-center gap-3 bg-background/50 rounded-lg px-4 py-2 border">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">قالب الطباعة</Label>
              {templatesLoading ? (
                <div className="w-[200px] h-8 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : companyTemplates.length === 0 ? (
                <div className="w-[200px] h-8 flex items-center text-xs text-muted-foreground">
                  لا توجد قوالب متاحة
                </div>
              ) : (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="اختر القالب" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyTemplates.map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.nameAr || template.name}</span>
                          {template.isDefault && (
                            <Badge variant="default" className="text-[10px] px-1 py-0 h-4 bg-primary">افتراضي</Badge>
                          )}
                          {template.isCustom && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">مخصص</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Grid Layout for Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        
        {/* 1. إيصالات المندوب */}
        <SectionCard 
          title="إيصالات المندوب" 
          icon={User} 
          iconColor="text-blue-500" 
          bgColor="bg-blue-500/10"
        >
          <div className="space-y-3">
            <SelectField 
              label="الفرع" 
              value={agentBranch} 
              onChange={setAgentBranch}
              options={[{ id: '', name: 'جميع الفروع' }, ...branches]}
            />
            <SelectField 
              label="المندوب" 
              value={agentId} 
              onChange={setAgentId}
              options={[{ id: '', name: 'جميع المندوبين' }, ...agents]}
            />
            <div className="grid grid-cols-2 gap-3">
              <DateField label="من تاريخ" value={agentDateFrom} onChange={setAgentDateFrom} />
              <DateField label="إلى تاريخ" value={agentDateTo} onChange={setAgentDateTo} />
            </div>
            <ActionButtons 
              onPreview={() => handlePreview({ branchId: agentBranch, agentId, dateFrom: agentDateFrom, dateTo: agentDateTo })}
              onPrint={() => { handlePreview({ branchId: agentBranch, agentId, dateFrom: agentDateFrom, dateTo: agentDateTo }).then(() => setTimeout(handlePrint, 1000)) }}
              previewDisabled={loading}
              printDisabled={true}
            />
          </div>
        </SectionCard>
        
        {/* 2. عدة عملاء */}
        <SectionCard 
          title="طباعة لعدة عملاء" 
          icon={UsersIcon} 
          iconColor="text-purple-500" 
          bgColor="bg-purple-500/10"
        >
          <div className="space-y-3">
            <SelectField 
              label="الفرع" 
              value={multiBranch} 
              onChange={setMultiBranch}
              options={[{ id: '', name: 'جميع الفروع' }, ...branches]}
            />
            <div className="grid grid-cols-2 gap-3">
              <CustomerSearchField 
                label="من عميل" 
                placeholder="اسم أو كود أو هاتف..."
                value={customerCodeFrom} 
                onChange={setCustomerCodeFrom}
                customers={customers}
                onCustomerSelect={(c: any) => setCustomerCodeFrom(c.code)}
              />
              <CustomerSearchField 
                label="إلى عميل" 
                placeholder="اسم أو كود أو هاتف..."
                value={customerCodeTo} 
                onChange={setCustomerCodeTo}
                customers={customers}
                onCustomerSelect={(c: any) => setCustomerCodeTo(c.code)}
              />
            </div>
            <div className="bg-purple-500/10 rounded-lg p-2 text-xs text-muted-foreground text-center">
              سيتم طباعة إيصالات العملاء من <strong>{customerCodeFrom || '---'}</strong> إلى <strong>{customerCodeTo || '---'}</strong>
            </div>
            <ActionButtons 
              onPreview={() => handlePreview({ branchId: multiBranch, customerCodeFrom, customerCodeTo })}
              onPrint={() => { handlePreview({ branchId: multiBranch, customerCodeFrom, customerCodeTo }).then(() => setTimeout(handlePrint, 1000)) }}
              previewDisabled={loading}
              printDisabled={true}
            />
          </div>
        </SectionCard>
        
        {/* 3. عميل واحد */}
        <SectionCard 
          title="طباعة لعميل واحد" 
          icon={UserCheck} 
          iconColor="text-cyan-500" 
          bgColor="bg-cyan-500/10"
        >
          <div className="space-y-3">
            <SelectField 
              label="الفرع" 
              value={singleBranch} 
              onChange={setSingleBranch}
              options={[{ id: '', name: 'جميع الفروع' }, ...branches]}
            />
            <div className="space-y-1.5 w-full">
              <Label className="text-xs text-muted-foreground block truncate">البحث عن عميل</Label>
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                <Input 
                  placeholder="اسم أو كود أو هاتف..." 
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setShowCustomerDropdown(true)
                    if (!e.target.value.trim()) {
                      setSelectedCustomer(null)
                    }
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  className="h-9 text-sm pr-9 w-full box-border overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{ maxWidth: '100%' }}
                  dir="rtl"
                />
                {/* قائمة العملاء المنسدلة */}
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map((c: any) => (
                      <div
                        key={c.id}
                        className="px-3 py-2 hover:bg-muted cursor-pointer text-sm border-b last:border-b-0"
                        onClick={() => {
                          setSelectedCustomer(c)
                          setCustomerSearch(`${c.name} (${c.code})`)
                          setShowCustomerDropdown(false)
                        }}
                      >
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground flex gap-2">
                          <span>{c.code}</span>
                          {c.phone && <span>• {c.phone}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <div className="text-xs bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 rounded-lg px-3 py-2 mt-1 border border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">✓ {selectedCustomer.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => {
                        setSelectedCustomer(null)
                        setCustomerSearch('')
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    كود: {selectedCustomer.code} {selectedCustomer.phone && `| هاتف: ${selectedCustomer.phone}`}
                  </div>
                </div>
              )}
            </div>
            <ActionButtons 
              onPreview={() => selectedCustomer && handlePreview({ branchId: singleBranch, customerId: selectedCustomer.id })}
              onPrint={() => { if (selectedCustomer) { handlePreview({ branchId: singleBranch, customerId: selectedCustomer.id }).then(() => setTimeout(handlePrint, 1000)) } }}
              previewDisabled={loading || !selectedCustomer}
              printDisabled={true}
            />
          </div>
        </SectionCard>
        
        {/* 4. جميع الإيصالات */}
        <SectionCard 
          title="جميع الإيصالات" 
          icon={FileStack} 
          iconColor="text-amber-500" 
          bgColor="bg-amber-500/10"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <DateField label="من تاريخ" value={allDateFrom} onChange={setAllDateFrom} />
              <DateField label="إلى تاريخ" value={allDateTo} onChange={setAllDateTo} />
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">ملاحظة</span>
              </div>
              سيتم طباعة جميع الإيصالات في النظام خلال الفترة المحددة
            </div>
            <ActionButtons 
              onPreview={() => handlePreview({ dateFrom: allDateFrom, dateTo: allDateTo })}
              onPrint={() => { handlePreview({ dateFrom: allDateFrom, dateTo: allDateTo }).then(() => setTimeout(handlePrint, 1000)) }}
              previewDisabled={loading}
              printDisabled={true}
            />
          </div>
        </SectionCard>
        
        {/* 5. فرع معين */}
        <SectionCard 
          title="إيصالات فرع معين" 
          icon={Building} 
          iconColor="text-rose-500" 
          bgColor="bg-rose-500/10"
        >
          <div className="space-y-3">
            <SelectField 
              label="الفرع" 
              value={branchFilterBranch} 
              onChange={setBranchFilterBranch}
              options={[{ id: '', name: 'اختر الفرع' }, ...branches]}
            />
            <div className="grid grid-cols-2 gap-3">
              <DateField label="من تاريخ" value={branchDateFrom} onChange={setBranchDateFrom} />
              <DateField label="إلى تاريخ" value={branchDateTo} onChange={setBranchDateTo} />
            </div>
            <ActionButtons 
              onPreview={() => handlePreview({ branchId: branchFilterBranch, dateFrom: branchDateFrom, dateTo: branchDateTo })}
              onPrint={() => { handlePreview({ branchId: branchFilterBranch, dateFrom: branchDateFrom, dateTo: branchDateTo }).then(() => setTimeout(handlePrint, 1000)) }}
              previewDisabled={loading || !branchFilterBranch}
              printDisabled={true}
            />
          </div>
        </SectionCard>
        
        {/* إحصائيات سريعة */}
        <Card className="bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              إحصائيات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{branches.length}</div>
                <div className="text-xs text-muted-foreground">فروع</div>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{agents.length}</div>
                <div className="text-xs text-muted-foreground">مندوبين</div>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-cyan-600">{customers.length}</div>
                <div className="text-xs text-muted-foreground">عملاء</div>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">5</div>
                <div className="text-xs text-muted-foreground">أنواع طباعة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* نافذة المعاينة */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b bg-gradient-to-l from-emerald-500/10 to-green-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <DialogTitle>معاينة الإيصالات</DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    {previewLoading ? 'جاري التحميل...' : `عدد الإيصالات: ${previewData.length}`}
                  </p>
                </div>
              </div>
              {previewData.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Receipt className="h-3 w-3" />
                    {previewData.length} إيصال
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    {totalPages} صفحة
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[calc(90vh-140px)] p-4 bg-muted/30">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">جاري تحميل الإيصالات...</p>
              </div>
            ) : previewData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FileStack className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">لا توجد إيصالات مطابقة للبحث</p>
                <p className="text-xs text-muted-foreground mt-1">جرب تغيير معايير البحث</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedData.map((receipt, index) => (
                  <Card key={receipt.id} className="overflow-hidden">
                    <div className="p-4 bg-gradient-to-l from-blue-500/5 to-purple-500/5 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-600">
                            {currentPage * ITEMS_PER_PAGE + index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{receipt.invoiceNumber}</div>
                            <div className="text-xs text-muted-foreground">{receipt.customer?.name || '-'}</div>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-emerald-600">{receipt.total?.toLocaleString()} {currency.symbol}</div>
                          <div className="text-xs text-muted-foreground">قيمة العقد</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">العميل:</span>
                        <div className="font-medium">{receipt.customer?.name || '-'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الهاتف:</span>
                        <div className="font-medium">{receipt.customer?.phone || '-'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">المندوب:</span>
                        <div className="font-medium">{receipt.agent?.name || '-'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الفرع:</span>
                        <div className="font-medium">{receipt.branch?.name || '-'}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {previewData.length > 0 && (
            <div className="p-4 border-t bg-background flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  السابق
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  {totalPages > 5 && <span className="px-2">...</span>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  التالي
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
                  <X className="h-4 w-4 ml-1" />
                  إلغاء
                </Button>
                <Button size="sm" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  طباعة الآن
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== MAIN APP ==============
function MainApp({ user, logout }: { user: UserType; logout: () => void }) {
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // نظام الإشعارات
  const notifications = useNotifications()
  
  // قراءة الإعدادات المحفوظة مباشرة عند التهيئة
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_sidebar_collapsed')
      return saved === 'true'
    }
    return false
  })
  
  const [sidebarFontSize, setSidebarFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('erp_sidebar_fontsize')
      if (saved && ['small', 'medium', 'large'].includes(saved)) {
        return saved as 'small' | 'medium' | 'large'
      }
    }
    return 'medium'
  })
  
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // تحميل الإعدادات المحفوظة
  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(timer)
  }, [])
  
  // حفظ إعدادات السايدبار
  const toggleSidebar = () => {
    const newValue = !sidebarCollapsed
    setSidebarCollapsed(newValue)
    localStorage.setItem('erp_sidebar_collapsed', String(newValue))
  }
  
  const changeFontSize = (size: 'small' | 'medium' | 'large') => {
    setSidebarFontSize(size)
    localStorage.setItem('erp_sidebar_fontsize', size)
    toast.success(`تم تغيير حجم الخط إلى ${size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : 'كبير'}`)
  }

  const currentItem = navGroups.flatMap(g => g.items).find(n => n.id === currentView)

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard user={user} onNavigate={setCurrentView} />
      case 'companies': return <CompaniesManagement />
      case 'branches': return <BranchesManagement />
      case 'users': return <UsersManagement />
      case 'customers': return <CustomersManagement />
      case 'zones': return <LocationsManagement />
      case 'categories': return <CategoriesManagement />
      case 'products': return <ProductsManagement />
      case 'warehouses': return <WarehousesManagement />
      case 'invoices': return <InvoicesManagement />
      case 'payments': return <PaymentsManagement />
      case 'reports': return <ReportsPage />
      case 'data-management': return <DataManagement />
      case 'settings': return <SettingsPage />
      case 'subscription-plans': return <SubscriptionPlansPage />
      case 'subscription-users': return <SubscriptionUsersPage />
      case 'subscription-payments': return <SubscriptionPaymentsPage />
      case 'inventory': return <SimpleModule title="المخزون" subtitle="متابعة الكميات" icon={Warehouse} color="text-amber-500" bgColor="bg-amber-500/10" apiEndpoint="inventory" columns={[{ key: 'product', label: 'المنتج', render: (r: any) => r.product?.name }, { key: 'quantity', label: 'الكمية' }]} />
      case 'installments': return <InstallmentsManagement />
      case 'collections': return <CollectionsManagement />
      case 'returns': return <SimpleModule title="المرتجعات" subtitle="طلبات الإرجاع" icon={RotateCcw} color="text-rose-500" bgColor="bg-rose-500/10" apiEndpoint="returns" columns={[{ key: 'returnNumber', label: 'الرقم' }, { key: 'customer', label: 'العميل', render: (r: any) => r.customer?.name }]} />
      case 'commissions': return <CommissionsManagement />
      case 'receipts-print': return <ReceiptsPrintDashboard />
      case 'receipt-templates': return <ReceiptTemplateBuilder />
      case 'suppliers': return <SuppliersManagement />
      case 'purchase-invoices': return <PurchaseInvoicesManagement />
      case 'purchase-returns': return <PurchaseReturnsManagement />
      case 'inventory-transfers': return <InventoryTransfersManagement />
      case 'inventory-reports': return <InventoryReportsPage />
      default: return <Dashboard user={user} onNavigate={setCurrentView} />
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background" dir="rtl">
      {/* Sidebar - يمتد من أعلى لأسفل بالكامل */}
      <aside 
        className={`hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 border-l bg-card/30 backdrop-blur-sm transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-72'
        }`}
      >
        <Sidebar currentView={currentView} onNavigate={setCurrentView} collapsed={sidebarCollapsed} fontSize={sidebarFontSize} onToggleCollapse={toggleSidebar} onFontSizeChange={changeFontSize} user={user} />
      </aside>
      
      {/* Main Area - Header + Content + Footer */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header - يبدأ من نهاية السايدبار */}
        <header className="flex-shrink-0 z-50 border-b bg-background/80 backdrop-blur-xl shadow-sm">
          <div className="flex h-16 items-center gap-3 px-4">
            {/* Mobile Menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden hover:bg-muted/50"><Menu className="h-5 w-5" /></Button></SheetTrigger>
              <SheetContent side="right" className="p-0 w-72">
                <Sidebar currentView={currentView} onNavigate={setCurrentView} onClose={() => setSidebarOpen(false)} fontSize={sidebarFontSize} onFontSizeChange={changeFontSize} user={user} />
              </SheetContent>
            </Sheet>
            
            <div className="flex-1 flex items-center gap-3">
              {currentItem && (
                <div className={`h-10 w-10 rounded-xl ${currentItem.bgColor} flex items-center justify-center shadow-sm`}>
                  <currentItem.icon className={`h-5 w-5 ${currentItem.color}`} />
                </div>
              )}
              <div>
                <h2 className="font-semibold text-lg">{currentItem?.label || 'لوحة التحكم'}</h2>
                <p className="text-xs text-muted-foreground hidden sm:block">نظام إدارة المؤسسات</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* البحث السريع */}
              <GlobalSearchButton />
              {/* الإشعارات */}
              <NotificationsDropdown 
                notifications={notifications.notifications}
                unreadCount={notifications.unreadCount}
                markAsRead={notifications.markAsRead}
                markAllAsRead={notifications.markAllAsRead}
                deleteNotification={notifications.deleteNotification}
                clearAll={notifications.clearAll}
              />
              {mounted && (
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="hover:bg-muted/50">
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setCurrentView('settings')} className="hover:bg-muted/50"><Settings className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" onClick={logout} className="hover:bg-destructive/10 text-destructive"><LogOut className="h-5 w-5" /></Button>
            </div>
          </div>
        </header>
        
        {/* Content Area - Independent scroll */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-muted/10" dir="rtl">
          <div className="p-4 md:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
        
        {/* Footer - بجانب السايدبار */}
        <footer className="flex-shrink-0 border-t py-3 px-6 bg-gradient-to-l from-blue-500/5 via-purple-500/5 to-pink-500/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">النظام متصل</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold bg-gradient-to-l from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">ERP</span>
              <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      </div>
      
      {/* اختصارات لوحة المفاتيح */}
      <KeyboardShortcutsHelp />
    </div>
  )
}

// ============== LOGIN PAGE ==============
function LoginPage({ onLogin, onRegister }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ email: 'a33maly@gmail.com', password: 'WEGSMs@1983' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // استدعاء API لتسجيل الدخول (للجميع بما فيهم السوبر أدمن)
      const res = await fetch('/api/debug-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      })
      
      const data = await res.json()
      
      if (data.success && data.data) {
        const user = data.data.user || data.data
        localStorage.setItem('erp_user', JSON.stringify(user))
        onLogin(user)
        toast.success('مرحباً بك!')
      } else {
        setError(data.error || 'فشل تسجيل الدخول')
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"><Building2 className="h-8 w-8 text-white" /></div>
            <h1 className="text-3xl font-bold bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">نظام ERP</h1>
          </div>
          <p className="text-muted-foreground">نظام إدارة المؤسسات المتكامل</p>
        </div>
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  placeholder="أدخل البريد الإلكتروني"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input 
                  type="password" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  placeholder="أدخل كلمة المرور"
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-l from-blue-500 to-purple-600 h-11" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري تسجيل الدخول...
                  </>
                ) : 'تسجيل الدخول'}
              </Button>
            </form>
            <div className="mt-6 pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground mb-3">ليس لديك حساب؟</p>
              <Button variant="outline" className="w-full" onClick={onRegister}>إنشاء حساب جديد</Button>
            </div>
          </CardContent>
        </Card>
        <div className="text-center text-xs text-muted-foreground">
          <p>بيانات الدخول الافتراضية للسوبر أدمن:</p>
          <p className="font-mono">a33maly@gmail.com / WEGSMs@1983</p>
        </div>
      </div>
    </div>
  )
}

// ============== PRICING PAGE ==============
function PricingPage({ onSelectPlan }: { onSelectPlan: (plan: any) => void }) {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(res => {
        if (res.success) setPlans(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const getPrice = (plan: any) => {
    if (billingCycle === 'YEARLY') {
      return plan.price * 10 // شهرين مجاناً
    }
    return plan.price
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
      {/* Header */}
      <div className="pt-12 pb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">نظام ERP</h1>
        </div>
        <h2 className="text-3xl font-bold mb-2">اختر الخطة المناسبة لك</h2>
        <p className="text-muted-foreground">ابدأ مجاناً وقم بالترقية في أي وقت</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg flex gap-1">
          <Button 
            variant={billingCycle === 'MONTHLY' ? 'default' : 'ghost'}
            className={`rounded-full ${billingCycle === 'MONTHLY' ? 'bg-gradient-to-l from-blue-500 to-purple-600' : ''}`}
            onClick={() => setBillingCycle('MONTHLY')}
          >
            شهري
          </Button>
          <Button 
            variant={billingCycle === 'YEARLY' ? 'default' : 'ghost'}
            className={`rounded-full ${billingCycle === 'YEARLY' ? 'bg-gradient-to-l from-blue-500 to-purple-600' : ''}`}
            onClick={() => setBillingCycle('YEARLY')}
          >
            سنوي <Badge className="mr-2 bg-green-500">وفر 17%</Badge>
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden ${plan.isPopular ? 'border-2 border-purple-500 shadow-xl scale-105' : 'border shadow-lg'}`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-l from-purple-500 to-pink-500 text-white text-xs text-center py-1">
                  الأكثر شعبية
                </div>
              )}
              <CardHeader className={plan.isPopular ? 'pt-8' : ''}>
                <CardTitle className="text-xl">{plan.nameAr}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.descriptionAr}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-4xl font-bold">{getPrice(plan)}</span>
                  <span className="text-muted-foreground"> {plan.currency}/{billingCycle === 'YEARLY' ? 'سنة' : 'شهر'}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.maxBranches === -1 ? 'فروع غير محدودة' : `${plan.maxBranches} فروع`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.maxUsers === -1 ? 'مستخدمين غير محدودين' : `${plan.maxUsers} مستخدمين`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.maxProducts === -1 ? 'منتجات غير محدودة' : `${plan.maxProducts} منتج`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.maxCustomers === -1 ? 'عملاء غير محدودين' : `${plan.maxCustomers} عميل`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.maxInvoices === -1 ? 'فواتير غير محدودة' : `${plan.maxInvoices} فاتورة/شهر`}</span>
                  </div>
                  {plan.trialDays > 0 && (
                    <div className="flex items-center gap-2 text-purple-600">
                      <Gift className="h-4 w-4" />
                      <span>{plan.trialDays} يوم تجريبي مجاني</span>
                    </div>
                  )}
                </div>

                <Button 
                  className={`w-full ${plan.isPopular ? 'bg-gradient-to-l from-purple-500 to-pink-500' : ''}`}
                  variant={plan.isPopular ? 'default' : 'outline'}
                  onClick={() => onSelectPlan(plan)}
                >
                  {plan.price === 0 ? 'ابدأ مجاناً' : 'اختر الخطة'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============== REGISTRATION PAGE ==============
function RegistrationPage({ onBack, onSelectPlan, selectedPlan }: { onBack: () => void; onSelectPlan: () => void; selectedPlan?: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [form, setForm] = useState({
    companyName: '',
    companyNameAr: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    contactName: '',
    city: ''
  })

  const checkEmail = async (email: string) => {
    if (!email || !email.includes('@')) return
    setCheckingEmail(true)
    try {
      const res = await fetch(`/api/auth/register?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setEmailAvailable(data.available)
    } catch {
      setEmailAvailable(null)
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    if (form.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          companyNameAr: form.companyNameAr || form.companyName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          contactName: form.contactName,
          city: form.city,
          planId: selectedPlan?.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(data.data.message || 'تم التسجيل بنجاح!')
        onBack()
      } else {
        setError(data.error || 'فشل في التسجيل')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4" dir="rtl">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent">إنشاء حساب جديد</h1>
          </div>
          {selectedPlan && (
            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full">
              <span className="text-sm">الخطة المختارة:</span>
              <Badge className="bg-purple-500">{selectedPlan.nameAr}</Badge>
              <Button variant="link" size="sm" onClick={onSelectPlan}>تغيير</Button>
            </div>
          )}
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الشركة (بالإنجليزية)</Label>
                  <Input 
                    value={form.companyName} 
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })} 
                    placeholder="Company Name"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم الشركة (بالعربية)</Label>
                  <Input 
                    value={form.companyNameAr} 
                    onChange={(e) => setForm({ ...form, companyNameAr: e.target.value })} 
                    placeholder="اسم الشركة" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <div className="relative">
                  <Input 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value })
                      setEmailAvailable(null)
                    }}
                    onBlur={() => checkEmail(form.email)}
                    placeholder="email@company.com"
                    required 
                  />
                  {checkingEmail && <Loader2 className="h-4 w-4 animate-spin absolute left-3 top-3" />}
                  {emailAvailable === true && <CheckCircle className="h-4 w-4 text-green-500 absolute left-3 top-3" />}
                  {emailAvailable === false && <XCircle className="h-4 w-4 text-red-500 absolute left-3 top-3" />}
                </div>
                {emailAvailable === false && <p className="text-xs text-red-500">البريد الإلكتروني مستخدم مسبقاً</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input 
                    type="tel" 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    placeholder="+20 1XX XXX XXXX"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input 
                    value={form.city} 
                    onChange={(e) => setForm({ ...form, city: e.target.value })} 
                    placeholder="القاهرة، الإسكندرية..." 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>اسم المسؤول</Label>
                <Input 
                  value={form.contactName} 
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })} 
                  placeholder="الاسم الكامل للمسؤول" 
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input 
                    type="password" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    placeholder="6 أحرف على الأقل"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>تأكيد كلمة المرور</Label>
                  <Input 
                    type="password" 
                    value={form.confirmPassword} 
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} 
                    placeholder="أعد كتابة كلمة المرور"
                    required 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">رجوع</Button>
                <Button type="submit" className="flex-1 bg-gradient-to-l from-blue-500 to-purple-600" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء الحساب'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============== EXPORT ==============
export default function ERPPage() {
  const { user, setUser, logout, mounted } = useAuth()
  const [authPage, setAuthPage] = useState<'login' | 'register' | 'pricing'>('login')
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  
  // التحقق من وضع الدخول المتخفي - قراءة مرة واحدة عند التهيئة
  const [impersonationState] = useState(() => {
    if (typeof window !== 'undefined') {
      const impersonationData = localStorage.getItem('impersonation_session')
      if (impersonationData) {
        try {
          const data = JSON.parse(impersonationData)
          return { isImpersonating: true, companyName: data.companyName || '' }
        } catch {
          return { isImpersonating: false, companyName: '' }
        }
      }
    }
    return { isImpersonating: false, companyName: '' }
  })
  
  const isImpersonating = impersonationState.isImpersonating
  const impersonatedCompany = impersonationState.companyName
  
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    )
  }
  
  if (!user) {
    if (authPage === 'pricing') {
      return (
        <PricingPage 
          onSelectPlan={(plan) => {
            setSelectedPlan(plan)
            setAuthPage('register')
          }} 
        />
      )
    }
    
    if (authPage === 'register') {
      return (
        <RegistrationPage 
          onBack={() => setAuthPage('login')}
          onSelectPlan={() => setAuthPage('pricing')}
          selectedPlan={selectedPlan}
        />
      )
    }
    
    return (
      <LoginPage 
        onLogin={setUser} 
        onRegister={() => setAuthPage('pricing')} 
      />
    )
  }

  // التحقق من نوع المستخدم وعرض اللوحة المناسبة
  const isSuperAdmin = user.role === 'SUPER_ADMIN' && !isImpersonating
  
  // إذا كان سوبر أدمن وليس في وضع الدخول المتخفي، عرض لوحة السوبر أدمن
  if (isSuperAdmin) {
    return (
      <SuperAdminDashboard 
        user={user}
        onImpersonate={() => {
          window.location.reload()
        }}
      />
    )
  }
  
  // للسوبر أدمن في وضع الدخول المتخفي أو مستخدم عادي
  return (
    <GlobalSearchProvider>
      {isImpersonating && (
        <ImpersonationBanner 
          companyName={impersonatedCompany}
          onExit={() => {
            window.location.reload()
          }}
        />
      )}
      <MainApp user={user} logout={logout} />
    </GlobalSearchProvider>
  )
}
