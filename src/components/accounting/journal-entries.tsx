'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, Search, Loader2, Edit, Trash2, BookOpen, 
  Calendar, FileText, ArrowRightLeft, Filter, X, CheckCircle, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface JournalLine {
  id: string
  accountId: string
  accountName: string
  accountCode: string
  debit: number
  credit: number
  description: string
}

interface JournalEntry {
  id: string
  entryNumber: string
  date: string
  description: string
  reference?: string
  status: 'DRAFT' | 'POSTED' | 'REVERSED'
  lines: JournalLine[]
  totalDebit: number
  totalCredit: number
  createdAt: string
  createdBy: string
}

// الحسابات المتاحة
const accounts = [
  { id: '1.1', code: '1.1', name: 'النقدية والبنوك', type: 'ASSET' },
  { id: '1.2', code: '1.2', name: 'العملاء', type: 'ASSET' },
  { id: '1.3', code: '1.3', name: 'المخزون', type: 'ASSET' },
  { id: '1.4', code: '1.4', name: 'الأصول الثابتة', type: 'ASSET' },
  { id: '2.1', code: '2.1', name: 'الموردين', type: 'LIABILITY' },
  { id: '2.2', code: '2.2', name: 'القروض', type: 'LIABILITY' },
  { id: '2.3', code: '2.3', name: 'ضريبة القيمة المضافة', type: 'LIABILITY' },
  { id: '3.1', code: '3.1', name: 'رأس المال', type: 'EQUITY' },
  { id: '3.2', code: '3.2', name: 'الأرباح المحتجزة', type: 'EQUITY' },
  { id: '4.1', code: '4.1', name: 'المبيعات', type: 'REVENUE' },
  { id: '4.2', code: '4.2', name: 'الإيرادات الأخرى', type: 'REVENUE' },
  { id: '5.1', code: '5.1', name: 'تكلفة المبيعات', type: 'EXPENSE' },
  { id: '5.2', code: '5.2', name: 'المصروفات التشغيلية', type: 'EXPENSE' },
  { id: '5.3', code: '5.3', name: 'مصروفات الرواتب', type: 'EXPENSE' },
  { id: '5.4', code: '5.4', name: 'مصروفات الإيجار', type: 'EXPENSE' },
]

const statusColors = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  POSTED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REVERSED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const statusLabels = {
  DRAFT: 'مسودة',
  POSTED: 'مرحل',
  REVERSED: 'ملغي',
}

// توليد رقم القيد التلقائي
const generateEntryNumber = (entries: JournalEntry[]): string => {
  const lastNumber = entries.reduce((max, entry) => {
    const num = parseInt(entry.entryNumber.replace('JE-', ''))
    return num > max ? num : max
  }, 0)
  return `JE-${String(lastNumber + 1).padStart(4, '0')}`
}

// توليد ID فريد
const generateId = () => `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export default function JournalEntriesManagement() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreating, setIsCreating] = useState(false)

  // فورم القيد الجديد
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { id: generateId(), accountId: '', accountName: '', accountCode: '', debit: 0, credit: 0, description: '' },
      { id: generateId(), accountId: '', accountName: '', accountCode: '', debit: 0, credit: 0, description: '' },
    ] as JournalLine[]
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      // محاكاة API call - في الواقع سيتم جلب البيانات من الـ API
      await new Promise(resolve => setTimeout(resolve, 500))
      // البيانات التجريبية فارغة في البداية
      setEntries([])
    } catch (error) {
      console.error('Error fetching journal entries:', error)
    } finally {
      setLoading(false)
    }
  }

  // حساب المجاميع
  const totalDebit = formData.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
  const totalCredit = formData.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0)
  const isBalanced = totalDebit === totalCredit && totalDebit > 0

  // إضافة سطر جديد
  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { id: generateId(), accountId: '', accountName: '', accountCode: '', debit: 0, credit: 0, description: '' }
      ]
    })
  }

  // حذف سطر
  const handleRemoveLine = (lineId: string) => {
    if (formData.lines.length <= 2) {
      toast.error('يجب أن يحتوي القيد على سطرين على الأقل')
      return
    }
    setFormData({
      ...formData,
      lines: formData.lines.filter(line => line.id !== lineId)
    })
  }

  // تحديث سطر
  const handleUpdateLine = (lineId: string, field: keyof JournalLine, value: string | number) => {
    setFormData({
      ...formData,
      lines: formData.lines.map(line => {
        if (line.id === lineId) {
          // إذا تم اختيار حساب
          if (field === 'accountId') {
            const account = accounts.find(a => a.id === value)
            return {
              ...line,
              accountId: value as string,
              accountName: account?.name || '',
              accountCode: account?.code || ''
            }
          }
          // إذا تم تعبئة مدين، مسح الدائن
          if (field === 'debit' && Number(value) > 0) {
            return { ...line, debit: Number(value), credit: 0 }
          }
          // إذا تم تعبئة دائن، مسح المدين
          if (field === 'credit' && Number(value) > 0) {
            return { ...line, credit: Number(value), debit: 0 }
          }
          return { ...line, [field]: value }
        }
        return line
      })
    })
  }

  // فتح نافذة قيد جديد
  const handleOpenNewEntry = () => {
    setSelectedEntry(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      lines: [
        { id: generateId(), accountId: '', accountName: '', accountCode: '', debit: 0, credit: 0, description: '' },
        { id: generateId(), accountId: '', accountName: '', accountCode: '', debit: 0, credit: 0, description: '' },
      ]
    })
    setDialogOpen(true)
  }

  // حفظ القيد مع الترحيل التلقائي
  const handleSaveEntry = async () => {
    // التحقق من البيانات
    if (!formData.description.trim()) {
      toast.error('يرجى إدخال وصف القيد')
      return
    }

    if (!isBalanced) {
      toast.error('القيد غير متوازن - يجب أن يتساوى المدين والدائن')
      return
    }

    // التحقق من اختيار الحسابات
    const invalidLines = formData.lines.filter(line => !line.accountId)
    if (invalidLines.length > 0) {
      toast.error('يرجى اختيار الحسابات لجميع السطور')
      return
    }

    // التحقق من وجود قيم
    const emptyLines = formData.lines.filter(line => line.debit === 0 && line.credit === 0)
    if (emptyLines.length > 0) {
      toast.error('يرجى إدخال قيم لجميع السطور')
      return
    }

    setIsCreating(true)

    try {
      // إنشاء القيد الجديد مع الترحيل التلقائي
      const newEntry: JournalEntry = {
        id: generateId(),
        entryNumber: generateEntryNumber(entries),
        date: formData.date,
        description: formData.description,
        reference: formData.reference || undefined,
        status: 'POSTED', // الترحيل التلقائي
        lines: formData.lines,
        totalDebit,
        totalCredit,
        createdAt: new Date().toISOString(),
        createdBy: 'المستخدم الحالي',
      }

      // إضافة القيد للقائمة
      setEntries([newEntry, ...entries])
      
      toast.success(`تم إنشاء وترحيل القيد ${newEntry.entryNumber} بنجاح`)
      setDialogOpen(false)
      
      // إعادة تعيين الفورم
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        lines: [
          { id: generateId(), accountId: '', accountName: '', accountCode: '', debit: 0, credit: 0, description: '' },
          { id: generateId(), accountId: '', accountName: '', accountCode: '', debit: 0, credit: 0, description: '' },
        ]
      })
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ القيد')
    } finally {
      setIsCreating(false)
    }
  }

  // عرض تفاصيل القيد
  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    setDialogOpen(true)
  }

  // إلغاء قيد مرحل
  const handleReverseEntry = async (id: string) => {
    if (confirm('هل أنت متأكد من إلغاء هذا القيد؟ سيتم إنشاء قيد عكسي.')) {
      const entry = entries.find(e => e.id === id)
      if (entry) {
        // إنشاء قيد عكسي
        const reverseEntry: JournalEntry = {
          id: generateId(),
          entryNumber: generateEntryNumber(entries),
          date: new Date().toISOString().split('T')[0],
          description: `قيد عكسي لـ ${entry.entryNumber}`,
          reference: entry.entryNumber,
          status: 'POSTED',
          lines: entry.lines.map(line => ({
            ...line,
            id: generateId(),
            debit: line.credit,
            credit: line.debit,
          })),
          totalDebit: entry.totalCredit,
          totalCredit: entry.totalDebit,
          createdAt: new Date().toISOString(),
          createdBy: 'المستخدم الحالي',
        }
        
        // تحديث حالة القيد الأصلي
        setEntries(entries.map(e => 
          e.id === id ? { ...e, status: 'REVERSED' as const } : e
        ))
        
        // إضافة القيد العكسي
        setEntries(prev => [reverseEntry, ...prev])
        
        toast.success('تم إلغاء القيد وإنشاء قيد عكسي')
      }
    }
  }

  // تصفية القيود
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = search === '' || 
      entry.entryNumber.toLowerCase().includes(search.toLowerCase()) ||
      entry.description.includes(search) ||
      entry.reference?.includes(search)
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">القيود المحاسبية</h1>
            <p className="text-muted-foreground">Journal Entries</p>
          </div>
        </div>
        <Button onClick={handleOpenNewEntry}>
          <Plus className="h-4 w-4 ml-2" />
          قيد جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي القيود</p>
                <p className="text-xl font-bold">{entries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مرحلة</p>
                <p className="text-xl font-bold">{entries.filter(e => e.status === 'POSTED').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ملغاة</p>
                <p className="text-xl font-bold">{entries.filter(e => e.status === 'REVERSED').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">اليوم</p>
                <p className="text-xl font-bold">{entries.filter(e => e.date === new Date().toISOString().split('T')[0]).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث برقم القيد أو الوصف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 ml-2" />
            <SelectValue placeholder="تصفية بالحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="POSTED">مرحلة</SelectItem>
            <SelectItem value="REVERSED">ملغاة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">لا توجد قيود محاسبية</p>
              <p className="text-sm mb-4">ابدأ بإنشاء قيد محاسبي جديد</p>
              <Button onClick={handleOpenNewEntry}>
                <Plus className="h-4 w-4 ml-2" />
                قيد جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم القيد</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المرجع</TableHead>
                  <TableHead>مدين</TableHead>
                  <TableHead>دائن</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewEntry(entry)}>
                    <TableCell className="font-mono font-medium">{entry.entryNumber}</TableCell>
                    <TableCell>{new Date(entry.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                    <TableCell className="font-mono">{entry.reference || '-'}</TableCell>
                    <TableCell className="font-mono text-green-600">{entry.totalDebit.toLocaleString('ar-EG')}</TableCell>
                    <TableCell className="font-mono text-red-600">{entry.totalCredit.toLocaleString('ar-EG')}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[entry.status]}>
                        {statusLabels[entry.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {entry.status === 'POSTED' && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleReverseEntry(entry.id) }}>
                            إلغاء
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Entry / View Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? `قيد رقم ${selectedEntry.entryNumber}` : 'قيد محاسبي جديد'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntry ? (
            // عرض القيد الموجود
            <div className="space-y-4">
              {/* Entry Header */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">التاريخ</p>
                  <p className="font-medium">{new Date(selectedEntry.date).toLocaleDateString('ar-EG')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المرجع</p>
                  <p className="font-medium">{selectedEntry.reference || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الحالة</p>
                  <Badge className={statusColors[selectedEntry.status]}>
                    {statusLabels[selectedEntry.status]}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium mb-1">الوصف</p>
                <p className="text-muted-foreground">{selectedEntry.description}</p>
              </div>

              {/* Entry Lines */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الحساب</TableHead>
                    <TableHead>اسم الحساب</TableHead>
                    <TableHead>مدين</TableHead>
                    <TableHead>دائن</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedEntry.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono">{line.accountCode}</TableCell>
                      <TableCell>{line.accountName}</TableCell>
                      <TableCell className="font-mono text-green-600">
                        {line.debit > 0 ? line.debit.toLocaleString('ar-EG') : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-red-600">
                        {line.credit > 0 ? line.credit.toLocaleString('ar-EG') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>المجموع</TableCell>
                    <TableCell className="font-mono text-green-600">
                      {selectedEntry.totalDebit.toLocaleString('ar-EG')}
                    </TableCell>
                    <TableCell className="font-mono text-red-600">
                      {selectedEntry.totalCredit.toLocaleString('ar-EG')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            // فورم القيد الجديد
            <div className="space-y-4 flex-1 overflow-hidden">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>التاريخ</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>المرجع (اختياري)</Label>
                  <Input
                    placeholder="مثال: INV-0001"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  />
                </div>
                <div className="md:col-span-1">
                  <Label>الوصف</Label>
                  <Input
                    placeholder="وصف القيد"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Lines */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <Label>سطور القيد</Label>
                  <Button size="sm" variant="outline" onClick={handleAddLine}>
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة سطر
                  </Button>
                </div>
                
                <ScrollArea className="h-[250px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">الحساب</TableHead>
                        <TableHead className="w-[150px]">مدين</TableHead>
                        <TableHead className="w-[150px]">دائن</TableHead>
                        <TableHead className="w-[150px]">الوصف</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.lines.map((line, index) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Select
                              value={line.accountId}
                              onValueChange={(value) => handleUpdateLine(line.id, 'accountId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الحساب" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.code} - {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="0"
                              value={line.debit || ''}
                              onChange={(e) => handleUpdateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                              className="text-green-600 font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="0"
                              value={line.credit || ''}
                              onChange={(e) => handleUpdateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                              className="text-red-600 font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="وصف السطر"
                              value={line.description}
                              onChange={(e) => handleUpdateLine(line.id, 'description', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveLine(line.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                  <p className="text-xl font-bold text-green-600 font-mono">
                    {totalDebit.toLocaleString('ar-EG')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                  <p className="text-xl font-bold text-red-600 font-mono">
                    {totalCredit.toLocaleString('ar-EG')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  {isBalanced ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-bold">متوازن ✓</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-bold">غير متوازن ({(totalDebit - totalCredit).toLocaleString('ar-EG')})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {!selectedEntry && (
              <>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button 
                  onClick={handleSaveEntry} 
                  disabled={!isBalanced || isCreating}
                  className="gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      حفظ وترحيل
                    </>
                  )}
                </Button>
              </>
            )}
            {selectedEntry && (
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                إغلاق
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
