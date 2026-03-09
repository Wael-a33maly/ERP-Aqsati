'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  BarChart3, Download, Printer, Calendar, TrendingUp, TrendingDown,
  DollarSign, Building2, CreditCard, PieChart, LineChart, FileSpreadsheet
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Sample financial data
const balanceSheetData = {
  assets: {
    current: [
      { name: 'النقدية والبنوك', amount: 50000 },
      { name: 'العملاء', amount: 75000 },
      { name: 'المخزون', amount: 25000 },
      { name: 'مدينون آخرون', amount: 5000 },
    ],
    fixed: [
      { name: 'الأصول الثابتة', amount: 150000 },
      { name: 'الإهلاك المتراكم', amount: -30000 },
      { name: 'أصول أخرى', amount: 10000 },
    ],
    total: 285000,
  },
  liabilities: {
    current: [
      { name: 'الموردين', amount: 45000 },
      { name: 'دائنون آخرون', amount: 15000 },
      { name: 'مستحقات', amount: 20000 },
    ],
    longTerm: [
      { name: 'قروض طويلة الأجل', amount: 50000 },
    ],
    total: 130000,
  },
  equity: {
    items: [
      { name: 'رأس المال', amount: 100000 },
      { name: 'الأرباح المحتجزة', amount: 55000 },
    ],
    total: 155000,
  },
}

const incomeStatementData = {
  revenue: [
    { name: 'المبيعات', amount: 500000 },
    { name: 'إيرادات أخرى', amount: 25000 },
  ],
  costOfSales: [
    { name: 'تكلفة البضاعة المباعة', amount: 300000 },
  ],
  expenses: [
    { name: 'مصروفات البيع والتوزيع', amount: 50000 },
    { name: 'مصروفات إدارية وعمومية', amount: 35000 },
    { name: 'مصروفات أخرى', amount: 10000 },
  ],
  grossProfit: 225000,
  netProfit: 130000,
}

const cashFlowData = {
  operating: [
    { name: 'صافي الربح', amount: 130000 },
    { name: 'تعديلات الإهلاك', amount: 15000 },
    { name: 'تغيرات رأس المال العامل', amount: -20000 },
  ],
  investing: [
    { name: 'شراء أصول ثابتة', amount: -40000 },
  ],
  financing: [
    { name: 'سداد قروض', amount: -25000 },
    { name: 'توزيعات', amount: -10000 },
  ],
  netChange: 50000,
  openingBalance: 30000,
  closingBalance: 80000,
}

export default function FinancialReportsManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [activeReport, setActiveReport] = useState('balance-sheet')

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting ${activeReport} as ${format}`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-teal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">التقارير المالية</h1>
            <p className="text-muted-foreground">Financial Reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="السنة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="الفترة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">الفترة الحالية</SelectItem>
            <SelectItem value="q1">الربع الأول</SelectItem>
            <SelectItem value="q2">الربع الثاني</SelectItem>
            <SelectItem value="q3">الربع الثالث</SelectItem>
            <SelectItem value="q4">الربع الرابع</SelectItem>
            <SelectItem value="annual">سنوي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Tabs */}
      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance-sheet">الميزانية العمومية</TabsTrigger>
          <TabsTrigger value="income-statement">قائمة الدخل</TabsTrigger>
          <TabsTrigger value="cash-flow">قائمة التدفقات النقدية</TabsTrigger>
        </TabsList>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  الأصول (Assets)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Assets */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">الأصول المتداولة</h4>
                    <Table>
                      <TableBody>
                        {balanceSheetData.assets.current.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-left font-mono">{item.amount.toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي الأصول المتداولة</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {balanceSheetData.assets.current.reduce((sum, a) => sum + a.amount, 0).toLocaleString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Fixed Assets */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">الأصول الثابتة</h4>
                    <Table>
                      <TableBody>
                        {balanceSheetData.assets.fixed.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className={cn(
                              "text-left font-mono",
                              item.amount < 0 && 'text-red-600'
                            )}>{item.amount.toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي الأصول الثابتة</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {balanceSheetData.assets.fixed.reduce((sum, a) => sum + a.amount, 0).toLocaleString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total Assets */}
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-green-700 dark:text-green-400">إجمالي الأصول</span>
                    <span className="font-mono font-bold text-green-700 dark:text-green-400">
                      {balanceSheetData.assets.total.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities & Equity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  الخصوم وحقوق الملكية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Liabilities */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">الخصوم المتداولة</h4>
                    <Table>
                      <TableBody>
                        {balanceSheetData.liabilities.current.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-left font-mono">{item.amount.toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Long-term Liabilities */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">الخصوم طويلة الأجل</h4>
                    <Table>
                      <TableBody>
                        {balanceSheetData.liabilities.longTerm.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-left font-mono">{item.amount.toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي الخصوم</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {balanceSheetData.liabilities.total.toLocaleString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Equity */}
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">حقوق الملكية</h4>
                    <Table>
                      <TableBody>
                        {balanceSheetData.equity.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-left font-mono">{item.amount.toLocaleString('ar-EG')}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">إجمالي حقوق الملكية</TableCell>
                          <TableCell className="text-left font-mono font-bold">
                            {balanceSheetData.equity.total.toLocaleString('ar-EG')}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total Liabilities & Equity */}
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-red-700 dark:text-red-400">إجمالي الخصوم وحقوق الملكية</span>
                    <span className="font-mono font-bold text-red-700 dark:text-red-400">
                      {(balanceSheetData.liabilities.total + balanceSheetData.equity.total).toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Income Statement */}
        <TabsContent value="income-statement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-500" />
                قائمة الدخل - Income Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Revenue */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">الإيرادات</h4>
                  <Table>
                    <TableBody>
                      {incomeStatementData.revenue.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-left font-mono text-green-600">{item.amount.toLocaleString('ar-EG')}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-green-50 dark:bg-green-900/20">
                        <TableCell className="font-medium">إجمالي الإيرادات</TableCell>
                        <TableCell className="text-left font-mono font-bold text-green-600">
                          {incomeStatementData.revenue.reduce((sum, a) => sum + a.amount, 0).toLocaleString('ar-EG')}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Cost of Sales */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">تكلفة المبيعات</h4>
                  <Table>
                    <TableBody>
                      {incomeStatementData.costOfSales.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-left font-mono text-red-600">({item.amount.toLocaleString('ar-EG')})</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Gross Profit */}
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-blue-700 dark:text-blue-400">إجمالي الربح</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                    {incomeStatementData.grossProfit.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                {/* Expenses */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">المصروفات</h4>
                  <Table>
                    <TableBody>
                      {incomeStatementData.expenses.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-left font-mono text-red-600">({item.amount.toLocaleString('ar-EG')})</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-red-50 dark:bg-red-900/20">
                        <TableCell className="font-medium">إجمالي المصروفات</TableCell>
                        <TableCell className="text-left font-mono font-bold text-red-600">
                          ({incomeStatementData.expenses.reduce((sum, a) => sum + a.amount, 0).toLocaleString('ar-EG')})
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Net Profit */}
                <div className="p-4 bg-gradient-to-l from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-xl text-green-700 dark:text-green-400">صافي الربح</span>
                  <span className="font-mono font-bold text-2xl text-green-700 dark:text-green-400">
                    {incomeStatementData.netProfit.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow */}
        <TabsContent value="cash-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-500" />
                قائمة التدفقات النقدية - Cash Flow Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Operating Activities */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">أنشطة تشغيلية</h4>
                  <Table>
                    <TableBody>
                      {cashFlowData.operating.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className={cn(
                            "text-left font-mono",
                            item.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {item.amount >= 0 ? '' : '('}{Math.abs(item.amount).toLocaleString('ar-EG')}{item.amount >= 0 ? '' : ')'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Investing Activities */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">أنشطة استثمارية</h4>
                  <Table>
                    <TableBody>
                      {cashFlowData.investing.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-left font-mono text-red-600">
                            ({Math.abs(item.amount).toLocaleString('ar-EG')})
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Financing Activities */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">أنشطة تمويلية</h4>
                  <Table>
                    <TableBody>
                      {cashFlowData.financing.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-left font-mono text-red-600">
                            ({Math.abs(item.amount).toLocaleString('ar-EG')})
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                    <span className="font-medium">صافي التغير في النقدية</span>
                    <span className="font-mono font-bold text-green-600">
                      {cashFlowData.netChange.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                    <span className="font-medium">رصيد الافتتاح</span>
                    <span className="font-mono">{cashFlowData.openingBalance.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-purple-700 dark:text-purple-400">رصيد الإقفال</span>
                    <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                      {cashFlowData.closingBalance.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
