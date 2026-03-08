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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { apiClient } from '@/lib/api-client';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Calendar,
  Hash,
  Loader2,
  ArrowRightLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface JournalEntryLine {
  id?: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  description?: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description?: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  lines: JournalEntryLine[];
  createdAt: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  pending: 'معلق',
  approved: 'معتمد',
  cancelled: 'ملغي',
};

export function JournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
    lines: [
      { accountId: '', debit: 0, credit: 0 },
      { accountId: '', debit: 0, credit: 0 },
    ] as JournalEntryLine[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesRes, accountsRes] = await Promise.all([
        apiClient.get('/api/journal-entries'),
        apiClient.get('/api/accounts?isLeaf=true'),
      ]);
      setEntries(entriesRes.data || []);
      setAccounts(accountsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (entry?: JournalEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        entryDate: entry.entryDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        description: entry.description || '',
        notes: '',
        lines: entry.lines.map(l => ({
          accountId: l.accountId,
          accountCode: l.accountCode,
          accountName: l.accountName,
          description: l.description || '',
          debit: l.debit,
          credit: l.credit,
        })),
      });
    } else {
      setEditingEntry(null);
      setFormData({
        entryDate: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        lines: [
          { accountId: '', debit: 0, credit: 0 },
          { accountId: '', debit: 0, credit: 0 },
        ],
      });
    }
    setShowDialog(true);
  };

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { accountId: '', debit: 0, credit: 0 }],
    });
  };

  const handleRemoveLine = (index: number) => {
    if (formData.lines.length <= 2) return;
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // If setting debit, clear credit and vice versa
    if (field === 'debit' && value > 0) {
      newLines[index].credit = 0;
    } else if (field === 'credit' && value > 0) {
      newLines[index].debit = 0;
    }
    
    setFormData({ ...formData, lines: newLines });
  };

  const calculateTotals = () => {
    const totalDebit = formData.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = formData.lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    return { totalDebit, totalCredit };
  };

  const handleSave = async () => {
    const { totalDebit, totalCredit } = calculateTotals();
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert('القيد غير متوازن! يجب أن يساوي المدين الدائن');
      return;
    }

    setSaving(true);
    try {
      if (editingEntry) {
        await apiClient.put(`/api/journal-entries/${editingEntry.id}`, formData);
      } else {
        await apiClient.post('/api/journal-entries', formData);
      }
      setShowDialog(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving entry:', error);
      alert(error.response?.data?.error || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.post(`/api/journal-entries/${id}/approve`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'حدث خطأ أثناء الاعتماد');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا القيد؟')) return;
    
    try {
      await apiClient.post(`/api/journal-entries/${id}/cancel`, { reason: '' });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'حدث خطأ أثناء الإلغاء');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القيد؟')) return;
    
    try {
      await apiClient.delete(`/api/journal-entries/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'حدث خطأ أثناء الحذف');
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const filteredEntries = entries.filter(entry =>
    entry.entryNumber?.includes(searchQuery) ||
    entry.description?.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              قيود اليومية المحاسبية
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 ml-2" />
                قيد جديد
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث برقم القيد أو الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
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
                  <TableHead className="w-[12%]">رقم القيد</TableHead>
                  <TableHead className="w-[12%]">التاريخ</TableHead>
                  <TableHead className="w-[30%]">الوصف</TableHead>
                  <TableHead className="w-[12%]">المدين</TableHead>
                  <TableHead className="w-[12%]">الدائن</TableHead>
                  <TableHead className="w-[10%]">الحالة</TableHead>
                  <TableHead className="w-[12%]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">{entry.entryNumber}</TableCell>
                    <TableCell>
                      {entry.entryDate ? format(new Date(entry.entryDate), 'yyyy/MM/dd', { locale: ar }) : '-'}
                    </TableCell>
                    <TableCell>{entry.description || '-'}</TableCell>
                    <TableCell className="text-left font-mono">
                      {entry.totalDebit?.toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell className="text-left font-mono">
                      {entry.totalCredit?.toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[entry.status] || 'bg-gray-100'}>
                        {statusLabels[entry.status] || entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {entry.status === 'draft' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(entry)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(entry.id)}
                              className="text-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {entry.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(entry.id)}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      لا توجد قيود
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              {editingEntry ? 'تعديل قيد' : 'قيد يومية جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ القيد</Label>
                <Input
                  type="date"
                  value={formData.entryDate}
                  onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف القيد"
                />
              </div>
            </div>

            {/* Lines Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="w-[40%]">الحساب</TableHead>
                    <TableHead className="w-[25%]">مدين</TableHead>
                    <TableHead className="w-[25%]">دائن</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.lines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={line.accountId}
                          onValueChange={(value) => handleLineChange(index, 'accountId', value)}
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
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(index, 'debit', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="text-left"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(index, 'credit', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="text-left"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLine(index)}
                          disabled={formData.lines.length <= 2}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleAddLine}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة سطر
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <span className="text-gray-500 text-sm">المدين:</span>
                  <span className={`font-mono font-bold mr-2 ${!isBalanced ? 'text-red-600' : ''}`}>
                    {totalDebit.toLocaleString('ar-EG')}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-gray-500 text-sm">الدائن:</span>
                  <span className={`font-mono font-bold mr-2 ${!isBalanced ? 'text-red-600' : ''}`}>
                    {totalCredit.toLocaleString('ar-EG')}
                  </span>
                </div>
                {!isBalanced && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">القيد غير متوازن</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving || !isBalanced}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
