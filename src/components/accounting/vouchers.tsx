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
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import {
  Receipt,
  CreditCard,
  ArrowRightLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Check,
  X,
  Loader2,
  Banknote,
  Building2,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface VoucherLine {
  id?: string;
  accountId: string;
  accountName?: string;
  description?: string;
  amount: number;
  lineType: 'DEBIT' | 'CREDIT';
}

interface Voucher {
  id: string;
  voucherNumber: string;
  voucherType: string;
  voucherDate: string;
  amount: number;
  paymentMethod: string;
  description?: string;
  status: string;
  checkNumber?: string;
  bankName?: string;
  lines: VoucherLine[];
}

interface Account {
  id: string;
  code: string;
  name: string;
}

const voucherTypes = [
  { value: 'RECEIPT', label: 'سند قبض', icon: Banknote, color: 'text-green-600' },
  { value: 'PAYMENT', label: 'سند صرف', icon: CreditCard, color: 'text-red-600' },
  { value: 'TRANSFER', label: 'سند تحويل', icon: ArrowRightLeft, color: 'text-blue-600' },
];

const paymentMethods = [
  { value: 'CASH', label: 'نقدي' },
  { value: 'CHECK', label: 'شيك' },
  { value: 'TRANSFER', label: 'تحويل بنكي' },
  { value: 'CARD', label: 'بطاقة' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  approved: 'معتمد',
  cancelled: 'ملغي',
};

export function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    voucherType: 'RECEIPT',
    voucherDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    amount: 0,
    checkNumber: '',
    checkDate: '',
    bankName: '',
    accountNumber: '',
    description: '',
    notes: '',
    cashAccountId: '',
    targetAccountId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vouchersRes, accountsRes] = await Promise.all([
        apiClient.get('/api/vouchers'),
        apiClient.get('/api/accounts?isLeaf=true'),
      ]);
      setVouchers(vouchersRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (voucher?: Voucher) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        voucherType: voucher.voucherType,
        voucherDate: voucher.voucherDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        paymentMethod: voucher.paymentMethod,
        amount: voucher.amount,
        checkNumber: voucher.checkNumber || '',
        checkDate: '',
        bankName: voucher.bankName || '',
        accountNumber: '',
        description: voucher.description || '',
        notes: '',
        cashAccountId: voucher.lines.find(l => l.lineType === 'DEBIT')?.accountId || '',
        targetAccountId: voucher.lines.find(l => l.lineType === 'CREDIT')?.accountId || '',
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        voucherType: filterType !== 'all' ? filterType : 'RECEIPT',
        voucherDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        amount: 0,
        checkNumber: '',
        checkDate: '',
        bankName: '',
        accountNumber: '',
        description: '',
        notes: '',
        cashAccountId: '',
        targetAccountId: '',
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.cashAccountId || !formData.targetAccountId) {
      alert('يرجى اختيار الحسابات');
      return;
    }

    if (formData.amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    setSaving(true);
    try {
      const lines = [
        {
          accountId: formData.cashAccountId,
          amount: formData.amount,
          lineType: 'DEBIT',
          description: formData.description,
        },
        {
          accountId: formData.targetAccountId,
          amount: formData.amount,
          lineType: 'CREDIT',
          description: formData.description,
        },
      ];

      const payload = {
        voucherType: formData.voucherType,
        voucherDate: formData.voucherDate,
        paymentMethod: formData.paymentMethod,
        amount: formData.amount,
        checkNumber: formData.checkNumber,
        checkDate: formData.checkDate || undefined,
        bankName: formData.bankName,
        description: formData.description,
        notes: formData.notes,
        lines,
      };

      if (editingVoucher) {
        await apiClient.put(`/api/vouchers/${editingVoucher.id}`, payload);
      } else {
        await apiClient.post('/api/vouchers', payload);
      }
      setShowDialog(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving voucher:', error);
      alert(error.response?.data?.error || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(`/api/vouchers/${id}/approve`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'حدث خطأ أثناء الاعتماد');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا السند؟')) return;
    
    try {
      await apiClient.post(`/api/vouchers/${id}/cancel`, { reason: '' });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'حدث خطأ أثناء الإلغاء');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السند؟')) return;
    
    try {
      await apiClient.delete(`/api/vouchers/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'حدث خطأ أثناء الحذف');
    }
  };

  const getVoucherTypeLabel = (type: string) => {
    return voucherTypes.find(t => t.value === type)?.label || type;
  };

  const getVoucherTypeIcon = (type: string) => {
    const vt = voucherTypes.find(t => t.value === type);
    return vt?.icon || Receipt;
  };

  const filteredVouchers = vouchers.filter(v => {
    const matchesType = filterType === 'all' || v.voucherType === filterType;
    const matchesSearch = !searchQuery ||
      v.voucherNumber?.includes(searchQuery) ||
      v.description?.includes(searchQuery);
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              السندات المالية
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 ml-2" />
                سند جديد
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث برقم السند..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="نوع السند" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع السندات</SelectItem>
                {voucherTypes.map(type => (
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[15%]">رقم السند</TableHead>
                  <TableHead className="w-[12%]">النوع</TableHead>
                  <TableHead className="w-[12%]">التاريخ</TableHead>
                  <TableHead className="w-[15%]">طريقة الدفع</TableHead>
                  <TableHead className="w-[15%]">المبلغ</TableHead>
                  <TableHead className="w-[10%]">الحالة</TableHead>
                  <TableHead className="w-[10%]">الوصف</TableHead>
                  <TableHead className="w-[11%]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.map(voucher => {
                  const TypeIcon = getVoucherTypeIcon(voucher.voucherType);
                  return (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono">{voucher.voucherNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`h-4 w-4 ${
                            voucherTypes.find(t => t.value === voucher.voucherType)?.color
                          }`} />
                          {getVoucherTypeLabel(voucher.voucherType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {voucher.voucherDate ? format(new Date(voucher.voucherDate), 'yyyy/MM/dd', { locale: ar }) : '-'}
                      </TableCell>
                      <TableCell>
                        {paymentMethods.find(m => m.value === voucher.paymentMethod)?.label || voucher.paymentMethod}
                      </TableCell>
                      <TableCell className="text-left font-mono">
                        {voucher.amount?.toLocaleString('ar-EG')} ر.س
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[voucher.status] || 'bg-gray-100'}>
                          {statusLabels[voucher.status] || voucher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {voucher.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {voucher.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(voucher)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(voucher.id)}
                                className="text-green-600"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(voucher.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {voucher.status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(voucher.id)}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredVouchers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      لا توجد سندات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {editingVoucher ? 'تعديل سند' : 'سند جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع السند</Label>
                <Select
                  value={formData.voucherType}
                  onValueChange={(value) => setFormData({ ...formData, voucherType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voucherTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>تاريخ السند</Label>
                <Input
                  type="date"
                  value={formData.voucherDate}
                  onChange={(e) => setFormData({ ...formData, voucherDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المبلغ</Label>
                <Input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Bank details for check/transfer */}
            {(formData.paymentMethod === 'CHECK' || formData.paymentMethod === 'TRANSFER') && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {formData.paymentMethod === 'CHECK' && (
                  <div className="space-y-2">
                    <Label>رقم الشيك</Label>
                    <Input
                      value={formData.checkNumber}
                      onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                      placeholder="رقم الشيك"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>البنك</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="اسم البنك"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {formData.voucherType === 'RECEIPT' ? 'حساب النقدية/البنك' : 
                   formData.voucherType === 'PAYMENT' ? 'حساب النقدية/البنك' : 'الحساب المحول منه'}
                </Label>
                <Select
                  value={formData.cashAccountId}
                  onValueChange={(value) => setFormData({ ...formData, cashAccountId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  {formData.voucherType === 'RECEIPT' ? 'الحساب المقابل' : 
                   formData.voucherType === 'PAYMENT' ? 'الحساب المقابل' : 'الحساب المحول إليه'}
                </Label>
                <Select
                  value={formData.targetAccountId}
                  onValueChange={(value) => setFormData({ ...formData, targetAccountId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.id !== formData.cashAccountId).map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="وصف السند..."
                rows={2}
              />
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
