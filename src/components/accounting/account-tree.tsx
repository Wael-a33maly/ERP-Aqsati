'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';
import {
  TreeDeciduous,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronDown,
  Search,
  MoreVertical,
  RefreshCw,
  Folder,
  FolderOpen,
  Hash,
  Loader2,
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  accountType: string;
  parentId?: string;
  level: number;
  isLeaf: boolean;
  balanceType: string;
  openingBalance: number;
  currentBalance: number;
  active: boolean;
  children?: Account[];
}

const accountTypes = [
  { value: 'ASSET', label: 'أصول', labelEn: 'Assets', color: 'bg-blue-100 text-blue-800' },
  { value: 'LIABILITY', label: 'خصوم', labelEn: 'Liabilities', color: 'bg-red-100 text-red-800' },
  { value: 'EQUITY', label: 'حقوق الملكية', labelEn: 'Equity', color: 'bg-green-100 text-green-800' },
  { value: 'REVENUE', label: 'إيرادات', labelEn: 'Revenue', color: 'bg-purple-100 text-purple-800' },
  { value: 'EXPENSE', label: 'مصروفات', labelEn: 'Expenses', color: 'bg-orange-100 text-orange-800' },
];

export function AccountTree() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameAr: '',
    accountType: 'ASSET',
    parentId: '',
    openingBalance: 0,
    isLeaf: true,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/accounts/tree');
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        nameAr: account.nameAr || '',
        accountType: account.accountType,
        parentId: account.parentId || '',
        openingBalance: account.openingBalance,
        isLeaf: account.isLeaf,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        code: '',
        name: '',
        nameAr: '',
        accountType: 'ASSET',
        parentId: '',
        openingBalance: 0,
        isLeaf: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingAccount) {
        await apiClient.put(`/api/accounts/${editingAccount.id}`, formData);
      } else {
        await apiClient.post('/api/accounts', formData);
      }
      setShowDialog(false);
      loadAccounts();
    } catch (error: any) {
      console.error('Error saving account:', error);
      alert(error.response?.data?.error || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
    
    try {
      await apiClient.delete(`/api/accounts/${id}`);
      loadAccounts();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert(error.response?.data?.error || 'حدث خطأ أثناء الحذف');
    }
  };

  const handleSeedDefault = async () => {
    if (!confirm('هل تريد إنشاء شجرة الحسابات الافتراضية؟')) return;
    
    try {
      await apiClient.post('/api/accounts/seed-default');
      loadAccounts();
    } catch (error) {
      console.error('Error seeding accounts:', error);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAccounts(newExpanded);
  };

  const getAccountTypeLabel = (type: string) => {
    return accountTypes.find(t => t.value === type)?.label || type;
  };

  const getAccountTypeColor = (type: string) => {
    return accountTypes.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-800';
  };

  const filterAccounts = (accounts: Account[]): Account[] => {
    return accounts.filter(account => {
      const matchesSearch = !searchQuery || 
        account.code.includes(searchQuery) ||
        account.name.includes(searchQuery) ||
        (account.nameAr && account.nameAr.includes(searchQuery));
      
      const matchesType = filterType === 'all' || account.accountType === filterType;
      
      if (matchesSearch && matchesType) return true;
      
      if (account.children) {
        const filteredChildren = filterAccounts(account.children);
        if (filteredChildren.length > 0) return true;
      }
      
      return false;
    }).map(account => ({
      ...account,
      children: account.children ? filterAccounts(account.children) : undefined,
    }));
  };

  const renderAccountRow = (account: Account, depth: number = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedAccounts.has(account.id);
    
    return (
      <React.Fragment key={account.id}>
        <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
          <TableCell>
            <div className="flex items-center" style={{ paddingRight: `${depth * 24}px` }}>
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleExpanded(account.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <span className="w-6" />
              )}
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-yellow-500 ml-2" />
                ) : (
                  <Folder className="h-4 w-4 text-yellow-500 ml-2" />
                )
              ) : (
                <Hash className="h-4 w-4 text-gray-400 ml-2" />
              )}
              <span className="font-medium">{account.code}</span>
              <span className="mr-2">{account.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge className={getAccountTypeColor(account.accountType)}>
              {getAccountTypeLabel(account.accountType)}
            </Badge>
          </TableCell>
          <TableCell className="text-left">
            {account.isLeaf ? (
              <span className={account.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                {account.currentBalance.toLocaleString('ar-EG')} ر.س
              </span>
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell>
            <Badge variant={account.active ? 'default' : 'secondary'}>
              {account.active ? 'نشط' : 'غير نشط'}
            </Badge>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleOpenDialog(account)}>
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenDialog({ ...account, parentId: account.id } as any)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة فرعي
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDelete(account.id)}
                  className="text-red-600"
                  disabled={account.isSystem}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && 
          account.children!.map(child => renderAccountRow(child, depth + 1))
        }
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TreeDeciduous className="h-5 w-5" />
              شجرة الحسابات المحاسبية
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadAccounts}>
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
              <Button variant="outline" size="sm" onClick={handleSeedDefault}>
                إنشاء افتراضي
              </Button>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة حساب
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث في الحسابات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="نوع الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {accountTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TreeDeciduous className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد حسابات</p>
              <Button variant="outline" className="mt-4" onClick={handleSeedDefault}>
                إنشاء شجرة الحسابات الافتراضية
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">الحساب</TableHead>
                  <TableHead className="w-[20%]">النوع</TableHead>
                  <TableHead className="w-[20%]">الرصيد</TableHead>
                  <TableHead className="w-[10%]">الحالة</TableHead>
                  <TableHead className="w-[10%]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterAccounts(accounts).map(account => renderAccountRow(account))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'تعديل حساب' : 'إضافة حساب جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>كود الحساب</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="مثال: 1111"
                />
              </div>
              <div className="space-y-2">
                <Label>نوع الحساب</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) => setFormData({ ...formData, accountType: value })}
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
            
            <div className="space-y-2">
              <Label>اسم الحساب</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="اسم الحساب"
              />
            </div>
            
            <div className="space-y-2">
              <Label>اسم الحساب بالعربية</Label>
              <Input
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="اسم الحساب بالعربية"
              />
            </div>
            
            <div className="space-y-2">
              <Label>الرصيد الافتتاحي</Label>
              <Input
                type="number"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLeaf"
                checked={formData.isLeaf}
                onChange={(e) => setFormData({ ...formData, isLeaf: e.target.checked })}
              />
              <Label htmlFor="isLeaf">حساب فرعي (يقبل قيود)</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
