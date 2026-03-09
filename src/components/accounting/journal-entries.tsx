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
import { 
  Plus, Search, Loader2, Edit, Trash2, BookOpen, 
  Calendar, FileText, ArrowRightLeft, Filter
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
  description?: string
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

// Sample journal entries
const sampleJournalEntries: JournalEntry[] = [
  {
    id: '1',
    entryNumber: 'JE-0001',
    date: '2024-01-15',
    description: 'قيد فاتورة مبيعات رقم INV-0001',
    reference: 'INV-0001',
    status: 'POSTED',
    lines: [
      { id: '1', accountId: '1.2', accountName: 'العملاء', accountCode: '1.2', debit: 11500, credit: 0, description: 'فاتورة مبيعات' },
      { id: '2', accountId: '4.1', accountName: 'المبيعات', accountCode: '4.1', debit: 0, credit: 10000, description: 'إيرادات المبيعات' },
      { id: '3', accountId: '2.3', accountName: 'ضريبة القيمة المضافة', accountCode: '2.3', debit: 0, credit: 1500, description: 'ضريبة 15%' },
    ],
    totalDebit: 11500,
    totalCredit: 11500,
    createdAt: '2024-01-15T10:30:00Z',
    createdBy: 'أحمد محمد',
  },
  {
    id: '2',
    entryNumber: 'JE-0002',
    date: '2024-01-16',
    description: 'قيد سداد من العميل',
    reference: 'PAY-0001',
    status: 'POSTED',
    lines: [
      { id: '1', accountId: '1.1', accountName: 'النقدية والبنوك', accountCode: '1.1', debit: 5000, credit: 0 },
      { id: '2', accountId: '1.2', accountName: 'العملاء', accountCode: '1.2', debit: 0, credit: 5000 },
    ],
    totalDebit: 5000,
    totalCredit: 5000,
    createdAt: '2024-01-16T14:00:00Z',
    createdBy: 'سارة أحمد',
  },
  {
    id: '3',
    entryNumber: 'JE-0003',
    date: '2024-01-17',
    description: 'قيد شراء أصول ثابتة',
    reference: 'PO-0010',
    status: 'DRAFT',
    lines: [
      { id: '1', accountId: '1.4', accountName: 'الأصول الثابتة', accountCode: '1.4', debit: 25000, credit: 0 },
      { id: '2', accountId: '2.1', accountName: 'الموردين', accountCode: '2.1', debit: 0, credit: 25000 },
    ],
    totalDebit: 25000,
    totalCredit: 25000,
    createdAt: '2024-01-17T09:15:00Z',
    createdBy: 'محمد علي',
  },
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

export default function JournalEntriesManagement() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      setEntries(sampleJournalEntries)
    } catch (error) {
      console.error('Error fetching journal entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    setDialogOpen(true)
  }

  const handlePostEntry = async (id: string) => {
    toast.success('تم ترحيل القيد بنجاح')
    fetchEntries()
  }

  const handleReverseEntry = async (id: string) => {
    if (confirm('هل أنت متأكد من إلغاء هذا القيد؟')) {
      toast.success('تم إلغاء القيد بنجاح')
      fetchEntries()
    }
  }

  // Filter entries
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
        <Button onClick={() => setDialogOpen(true)}>
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
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مسودات</p>
                <p className="text-xl font-bold">{entries.filter(e => e.status === 'DRAFT').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-green-500" />
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
            <SelectItem value="DRAFT">مسودات</SelectItem>
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
                        {entry.status === 'DRAFT' && (
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handlePostEntry(entry.id) }}>
                            ترحيل
                          </Button>
                        )}
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

      {/* View Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? `قيد رقم ${selectedEntry.entryNumber}` : 'قيد محاسبي جديد'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
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

              {/* Balance Check */}
              {selectedEntry.totalDebit !== selectedEntry.totalCredit && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  ⚠️ القيد غير متوازن - الفرق: {(selectedEntry.totalDebit - selectedEntry.totalCredit).toLocaleString('ar-EG')}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
