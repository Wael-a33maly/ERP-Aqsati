'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, usePermissions, RoleBadge } from '@/stores/auth-store'
import { authApi } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FileText,
  DollarSign,
  CreditCard,
  RotateCcw,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  Moon,
  Sun,
  Globe,
  ChevronDown,
  Warehouse,
  MapPin,
  Percent,
  Printer,
  Loader2,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

interface NavItem {
  label: string
  labelAr: string
  href: string
  icon: React.ReactNode
  permission?: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    labelAr: 'لوحة التحكم',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: 'Companies',
    labelAr: 'الشركات',
    href: '/companies',
    icon: <Building2 className="h-4 w-4" />,
    permission: 'companies.read',
  },
  {
    label: 'Branches',
    labelAr: 'الفروع',
    href: '/branches',
    icon: <Building2 className="h-4 w-4" />,
    permission: 'branches.read',
  },
  {
    label: 'Users',
    labelAr: 'المستخدمين',
    href: '/users',
    icon: <Users className="h-4 w-4" />,
    permission: 'users.read',
  },
  {
    label: 'Customers',
    labelAr: 'العملاء',
    href: '/customers',
    icon: <Users className="h-4 w-4" />,
    permission: 'customers.read',
  },
  {
    label: 'Zones',
    labelAr: 'المناطق',
    href: '/zones',
    icon: <MapPin className="h-4 w-4" />,
    permission: 'customers.read',
  },
  {
    label: 'Products',
    labelAr: 'المنتجات',
    href: '/products',
    icon: <Package className="h-4 w-4" />,
    permission: 'products.read',
  },
  {
    label: 'Inventory',
    labelAr: 'المخزون',
    href: '/inventory',
    icon: <Warehouse className="h-4 w-4" />,
    permission: 'inventory.read',
  },
  {
    label: 'Invoices',
    labelAr: 'الفواتير',
    href: '/invoices',
    icon: <FileText className="h-4 w-4" />,
    permission: 'invoices.read',
  },
  {
    label: 'Payments',
    labelAr: 'المدفوعات',
    href: '/payments',
    icon: <DollarSign className="h-4 w-4" />,
    permission: 'payments.read',
  },
  {
    label: 'Installments',
    labelAr: 'الأقساط',
    href: '/installments',
    icon: <CreditCard className="h-4 w-4" />,
    permission: 'installments.read',
  },
  {
    label: 'Returns',
    labelAr: 'المرتجعات',
    href: '/returns',
    icon: <RotateCcw className="h-4 w-4" />,
    permission: 'returns.read',
  },
  {
    label: 'Commissions',
    labelAr: 'العمولات',
    href: '/commissions',
    icon: <Percent className="h-4 w-4" />,
    permission: 'commissions.read',
  },
  {
    label: 'Reports',
    labelAr: 'التقارير',
    href: '/reports',
    icon: <BarChart3 className="h-4 w-4" />,
    permission: 'reports.read',
  },
  {
    label: 'Print',
    labelAr: 'الطباعة',
    href: '/print',
    icon: <Printer className="h-4 w-4" />,
    permission: 'invoices.read',
  },
  {
    label: 'Settings',
    labelAr: 'الإعدادات',
    href: '/settings',
    icon: <Settings className="h-4 w-4" />,
    permission: 'settings.read',
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const { user, logout, locale, setLocale } = useAuthStore()
  const hasPermission = usePermissions()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authApi.logout()
      logout()
      toast.success('Logged out successfully')
      router.push('/')
    } catch {
      toast.error('Failed to logout')
    } finally {
      setIsLoggingOut(false)
      setLogoutDialogOpen(false)
    }
  }

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6 border-b">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-bold text-lg">Enterprise ERP</h1>
          <p className="text-xs text-muted-foreground">نظام إدارة المؤسسات</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className="w-full justify-start gap-3 h-10"
              onClick={() => {
                // In a real app, this would use router.push
                setSidebarOpen(false)
              }}
            >
              {item.icon}
              <div className="flex flex-col items-start">
                <span>{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.labelAr}</span>
              </div>
            </Button>
          ))}
        </nav>
      </ScrollArea>

      {/* Company Info */}
      {user?.company && (
        <div className="px-4 py-3 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground">Company / الشركة</p>
          <p className="text-sm font-medium truncate">{user.company.name}</p>
          {user.branch && (
            <>
              <p className="text-xs text-muted-foreground mt-1">Branch / الفرع</p>
              <p className="text-sm font-medium truncate">{user.branch.name}</p>
            </>
          )}
        </div>
      )}
    </div>
  )

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-4">
          {/* Mobile menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Breadcrumb / Title */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">لوحة التحكم</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            >
              <Globe className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || undefined} />
                    <AvatarFallback>
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <RoleBadge role={user?.role || ''} className="text-xs" />
                  </div>
                  <ChevronDown className="h-4 w-4 hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>
                  <Globe className="mr-2 h-4 w-4" />
                  {locale === 'en' ? 'العربية' : 'English'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark Mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setLogoutDialogOpen(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout / تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 border-r bg-muted/30">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground bg-muted/30">
        <p>Enterprise ERP System © {new Date().getFullYear()} - نظام إدارة المؤسسات</p>
      </footer>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout / تسجيل الخروج</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? This will end your current session.
              <br />
              <span dir="rtl">هل أنت متأكد من تسجيل الخروج؟</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel / إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                'Logout / تسجيل الخروج'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
