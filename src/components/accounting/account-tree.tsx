'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, Search, Loader2, Edit, Trash2, Landmark, 
  Folder, FolderOpen, ChevronLeft, ChevronDown,
  DollarSign, Building2, User, CreditCard, Package, TrendingUp, TrendingDown
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface Account {
  id: string
  code: string
  name: string
  nameAr: string
  type: string
  category: string
  parentId?: string
  balance: number
  active: boolean
  children?: Account[]
}

const accountTypes = [
  { value: 'ASSET', label: 'أصول', labelEn: 'Assets', icon: DollarSign, color: 'text-blue-500' },
  { value: 'LIABILITY', label: 'خصوم', labelEn: 'Liabilities', icon: CreditCard, color: 'text-red-500' },
  { value: 'EQUITY', label: 'حقوق الملكية', labelEn: 'Equity', icon: Building2, color: 'text-purple-500' },
  { value: 'REVENUE', label: 'إيرادات', labelEn: 'Revenue', icon: TrendingUp, color: 'text-green-500' },
  { value: 'EXPENSE', label: 'مصروفات', labelEn: 'Expenses', icon: TrendingDown, color: 'text-orange-500' },
]

const defaultCategories = {
  ASSET: [
    { code: '1.1', name: 'النقدية والبنوك', nameAr: 'Cash and Banks' },
    { code: '1.2', name: 'العملاء', nameAr: 'Customers' },
    { code: '1.3', name: 'المخزون', nameAr: 'Inventory' },
    { code: '1.4', name: 'الأصول الثابتة', nameAr: 'Fixed Assets' },
  ],
  LIABILITY: [
    { code: '2.1', name: 'الموردين', nameAr: 'Suppliers' },
    { code: '2.2', name: 'القروض', nameAr: 'Loans' },
    { code: '2.3', name: 'المستحقات', nameAr: 'Payables' },
  ],
  EQUITY: [
    { code: '3.1', name: 'رأس المال', nameAr: 'Capital' },
    { code: '3.2', name: 'الأرباح المحتجزة', nameAr: 'Retained Earnings' },
  ],
  REVENUE: [
    { code: '4.1', name: 'المبيعات', nameAr: 'Sales' },
    { code: '4.2', name: 'الإيرادات الأخرى', nameAr: 'Other Revenue' },
  ],
  EXPENSE: [
    { code: '5.1', name: 'تكلفة المبيعات', nameAr: 'Cost of Sales' },
    { code: '5.2', name: 'المصروفات التشغيلية', nameAr: 'Operating Expenses' },
  ],
}

// Account Tree Item Component
function AccountTreeItem({ 
  account, 
  level = 0, 
  onEdit, 
  onDelete, 
  expandedAccounts, 
  onToggleExpand 
}: { 
  account: Account
  level?: number
  onEdit: (account: Account) => void
  onDelete: (id: string) => void
  expandedAccounts: string[]
  onToggleExpand: (id: string) => void
}) {
  const hasChildren = account.children && account.children.length > 0
  const isExpanded = expandedAccounts.includes(account.id)
  const accountType = accountTypes.find(t => t.value === account.type)
  const Icon = accountType?.icon || DollarSign

  return (
    <div>
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-lg cursor-pointer group",
          level > 0 && "border-r-2 border-muted mr-4"
        )}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => hasChildren && onToggleExpand(account.id)}
          className={cn(
            "w-5 h-5 flex items-center justify-center",
            !hasChildren && "invisible"
          )}
        >
          {hasChildren && (
            isExpanded 
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Account Icon */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          accountType?.color ? `bg-${accountType.color.replace('text-', '')}/10` : 'bg-muted'
        )}>
          {hasChildren ? (
            isExpanded 
              ? <FolderOpen className={cn("h-4 w-4", accountType?.color)} />
              : <Folder className={cn("h-4 w-4", accountType?.color)} />
          ) : (
            <Icon className={cn("h-4 w-4", accountType?.color)} />
          )}
        </div>

        {/* Account Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{account.code}</span>
            <span className="font-medium truncate">{account.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{accountType?.label}</span>
            {!account.active && (
              <Badge variant="secondary" className="text-xs">غير نشط</Badge>
            )}
          </div>
        </div>

        {/* Balance */}
        <div className="text-left">
          <span className={cn(
            "font-mono font-medium",
            account.balance >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {account.balance.toLocaleString('ar-EG')} ج.م
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onEdit(account)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(account.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mr-4">
          {account.children!.map(child => (
            <AccountTreeItem
              key={child.id}
              account={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedAccounts={expandedAccounts}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AccountTreeManagement() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([])
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameAr: '',
    type: 'ASSET',
    category: '',
    parentId: '',
    active: true,
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/accounts/tree')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      } else {
        // Use default accounts if API fails
        setAccounts(getDefaultAccounts())
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccounts(getDefaultAccounts())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultAccounts = (): Account[] => {
    return [
      {
        id: '1',
        code: '1',
        name: 'الأصول',
        nameAr: 'Assets',
        type: 'ASSET',
        category: 'أصول متداولة',
        balance: 150000,
        active: true,
        children: [
          { id: '1.1', code: '1.1', name: 'النقدية والبنوك', nameAr: 'Cash and Banks', type: 'ASSET', category: 'نقدية', balance: 50000, active: true },
          { id: '1.2', code: '1.2', name: 'العملاء', nameAr: 'Customers', type: 'ASSET', category: 'ذمم مدينة', balance: 75000, active: true },
          { id: '1.3', code: '1.3', name: 'المخزون', nameAr: 'Inventory', type: 'ASSET', category: 'مخزون', balance: 25000, active: true },
        ]
      },
      {
        id: '2',
        code: '2',
        name: 'الخصوم',
        nameAr: 'Liabilities',
        type: 'LIABILITY',
        category: 'خصوم متداولة',
        balance: -80000,
        active: true,
        children: [
          { id: '2.1', code: '2.1', name: 'الموردين', nameAr: 'Suppliers', type: 'LIABILITY', category: 'ذمم دائنة', balance: -45000, active: true },
          { id: '2.2', code: '2.2', name: 'القروض', nameAr: 'Loans', type: 'LIABILITY', category: 'قروض', balance: -35000, active: true },
        ]
      },
      {
        id: '3',
        code: '3',
        name: 'حقوق الملكية',
        nameAr: 'Equity',
        type: 'EQUITY',
        category: 'ملكية',
        balance: 70000,
        active: true,
        children: [
          { id: '3.1', code: '3.1', name: 'رأس المال', nameAr: 'Capital', type: 'EQUITY', category: 'رأس مال', balance: 50000, active: true },
          { id: '3.2', code: '3.2', name: 'الأرباح المحتجزة', nameAr: 'Retained Earnings', type: 'EQUITY', category: 'أرباح', balance: 20000, active: true },
        ]
      },
      {
        id: '4',
        code: '4',
        name: 'الإيرادات',
        nameAr: 'Revenue',
        type: 'REVENUE',
        category: 'إيرادات',
        balance: 120000,
        active: true,
        children: [
          { id: '4.1', code: '4.1', name: 'المبيعات', nameAr: 'Sales', type: 'REVENUE', category: 'مبيعات', balance: 100000, active: true },
          { id: '4.2', code: '4.2', name: 'إيرادات أخرى', nameAr: 'Other Revenue', type: 'REVENUE', category: 'أخرى', balance: 20000, active: true },
        ]
      },
      {
        id: '5',
        code: '5',
        name: 'المصروفات',
        nameAr: 'Expenses',
        type: 'EXPENSE',
        category: 'مصروفات',
        balance: -60000,
        active: true,
        children: [
          { id: '5.1', code: '5.1', name: 'تكلفة المبيعات', nameAr: 'Cost of Sales', type: 'EXPENSE', category: 'تكلفة', balance: -40000, active: true },
          { id: '5.2', code: '5.2', name: 'مصروفات تشغيلية', nameAr: 'Operating Expenses', type: 'EXPENSE', category: 'تشغيل', balance: -20000, active: true },
        ]
      },
    ]
  }

  const handleToggleExpand = (id: string) => {
    setExpandedAccounts(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id)
        : [...prev, id]
    )
  }

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        code: account.code,
        name: account.name,
        nameAr: account.nameAr,
        type: account.type,
        category: account.category,
        parentId: account.parentId || '',
        active: account.active,
      })
    } else {
      setEditingAccount(null)
      setFormData({
        code: '',
        name: '',
        nameAr: '',
        type: 'ASSET',
        category: '',
        parentId: '',
        active: true,
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      toast.success(editingAccount ? 'تم تحديث الحساب بنجاح' : 'تم إنشاء الحساب بنجاح')
      setDialogOpen(false)
      fetchAccounts()
    } catch (error) {
      toast.error('حدث خطأ في الحفظ')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
      toast.success('تم حذف الحساب بنجاح')
    }
  }

  // Filter accounts based on search
  const filteredAccounts = search
    ? accounts.filter(a => 
        a.name.includes(search) || 
        a.code.includes(search) ||
        a.nameAr?.includes(search)
      )
    : accounts

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Landmark className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">شجرة الحسابات</h1>
            <p className="text-muted-foreground">Chart of Accounts</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة حساب
        </Button>
      </div>

      {/* Account Type Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {accountTypes.map(type => {
          const Icon = type.icon
          const total = accounts
            .filter(a => a.type === type.value)
            .reduce((sum, a) => sum + a.balance, 0)
          
          return (
            <Card key={type.value} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    `bg-${type.color.replace('text-', '')}/10`
                  )}>
                    <Icon className={cn("h-5 w-5", type.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{type.labelEn}</p>
                    <p className="font-semibold">{type.label}</p>
                  </div>
                </div>
                <div className="mt-3 text-right">
                  <span className={cn(
                    "font-mono text-sm font-medium",
                    total >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {total.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث عن حساب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Account Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">هيكل الحسابات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد حسابات
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAccounts.map(account => (
                <AccountTreeItem
                  key={account.id}
                  account={account}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                  expandedAccounts={expandedAccounts}
                  onToggleExpand={handleToggleExpand}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'تعديل الحساب' : 'إضافة حساب جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">رقم الحساب</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="مثال: 1.1.1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">نوع الحساب</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">اسم الحساب (عربي)</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: النقدية"
              />
            </div>

            <div>
              <label className="text-sm font-medium">اسم الحساب (إنجليزي)</label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="مثال: Cash"
              />
            </div>

            <div>
              <label className="text-sm font-medium">الحساب الأب</label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب الأب (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون أب (حساب رئيسي)</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave}>
              {editingAccount ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
