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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import {
  BarChart3,
  FileText,
  TrendingUp,
  Scale,
  Calendar,
  Download,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

interface IncomeStatementItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  percentage?: number;
}

interface BalanceSheetItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  percentage?: number;
}

export function FinancialReports() {
  const [activeReport, setActiveReport] = useState('trial-balance');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  // Date filters
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let params: any = {};

      switch (activeReport) {
        case 'trial-balance':
          endpoint = '/api/accounting-reports/trial-balance';
          params.asOfDate = asOfDate;
          break;
        case 'income-statement':
          endpoint = '/api/accounting-reports/income-statement';
          params.fromDate = fromDate;
          params.toDate = toDate;
          break;
        case 'balance-sheet':
          endpoint = '/api/accounting-reports/balance-sheet';
          params.asOfDate = asOfDate;
          break;
      }

      const queryString = new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString();

      const response = await apiClient.get(`${endpoint}?${queryString}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error loading report:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  const handleExport = () => {
    // TODO: Implement export
    alert('سيتم إضافة ميزة التصدير قريباً');
  };

  const formatNumber = (num: number) => {
    return num?.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) || '0.00';
  };

  const renderTrialBalance = () => {
    const data = reportData as any;
    if (!data) return null;

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">إجمالي المدين الافتتاحي</p>
              <p className="text-xl font-bold">{formatNumber(data.totalOpeningDebit)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-green-600 dark:text-green-400">إجمالي الدائن الافتتاحي</p>
              <p className="text-xl font-bold">{formatNumber(data.totalOpeningCredit)}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-purple-600 dark:text-purple-400">إجمالي المدين للفترة</p>
              <p className="text-xl font-bold">{formatNumber(data.totalPeriodDebit)}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-orange-600 dark:text-orange-400">إجمالي الدائن للفترة</p>
              <p className="text-xl font-bold">{formatNumber(data.totalPeriodCredit)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Balance Status */}
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          data.isBalanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {data.isBalanced ? (
            <>
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">ميزان المراجعة متوازن</span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5" />
              <span className="font-medium">ميزان المراجعة غير متوازن - الفرق: {formatNumber(Math.abs(data.totalClosingDebit - data.totalClosingCredit))}</span>
            </>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead rowSpan={2} className="border-l">الحساب</TableHead>
                <TableHead colSpan={2} className="text-center border-l">الافتتاحي</TableHead>
                <TableHead colSpan={2} className="text-center border-l">الحركة</TableHead>
                <TableHead colSpan={2} className="text-center">الختامي</TableHead>
              </TableRow>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead className="text-left border-l">مدين</TableHead>
                <TableHead className="text-left border-l">دائن</TableHead>
                <TableHead className="text-left border-l">مدين</TableHead>
                <TableHead className="text-left border-l">دائن</TableHead>
                <TableHead className="text-left border-l">مدين</TableHead>
                <TableHead className="text-left">دائن</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items?.map((item: TrialBalanceItem) => (
                <TableRow key={item.accountId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{item.accountCode}</span>
                      <span>{item.accountName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-left font-mono">
                    {item.openingDebit > 0 ? formatNumber(item.openingDebit) : '-'}
                  </TableCell>
                  <TableCell className="text-left font-mono">
                    {item.openingCredit > 0 ? formatNumber(item.openingCredit) : '-'}
                  </TableCell>
                  <TableCell className="text-left font-mono">
                    {item.periodDebit > 0 ? formatNumber(item.periodDebit) : '-'}
                  </TableCell>
                  <TableCell className="text-left font-mono">
                    {item.periodCredit > 0 ? formatNumber(item.periodCredit) : '-'}
                  </TableCell>
                  <TableCell className="text-left font-mono font-bold">
                    {item.closingDebit > 0 ? formatNumber(item.closingDebit) : '-'}
                  </TableCell>
                  <TableCell className="text-left font-mono font-bold">
                    {item.closingCredit > 0 ? formatNumber(item.closingCredit) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-100 dark:bg-gray-700 font-bold">
                <TableCell>الإجمالي</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(data.totalOpeningDebit)}</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(data.totalOpeningCredit)}</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(data.totalPeriodDebit)}</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(data.totalPeriodCredit)}</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(data.totalClosingDebit)}</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(data.totalClosingCredit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    const data = reportData as any;
    if (!data) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-green-600 dark:text-green-400">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-green-700">{formatNumber(data.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-red-600 dark:text-red-400">إجمالي المصروفات</p>
              <p className="text-2xl font-bold text-red-700">{formatNumber(data.totalExpenses)}</p>
            </CardContent>
          </Card>
          <Card className={`${data.netIncome >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <CardContent className="p-4">
              <p className={`text-sm ${data.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                صافي الدخل
              </p>
              <p className={`text-2xl font-bold ${data.netIncome >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {formatNumber(data.netIncome)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-600 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {data.revenue?.map((item: IncomeStatementItem) => (
                  <TableRow key={item.accountId}>
                    <TableCell className="w-[15%] font-mono">{item.accountCode}</TableCell>
                    <TableCell className="w-[55%]">{item.accountName}</TableCell>
                    <TableCell className="w-[15%] text-left font-mono">{formatNumber(item.amount)}</TableCell>
                    <TableCell className="w-[15%] text-left text-gray-500">
                      {item.percentage?.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-green-50 dark:bg-green-900/20 font-bold">
                  <TableCell colSpan={2}>إجمالي الإيرادات</TableCell>
                  <TableCell className="text-left font-mono">{formatNumber(data.totalRevenue)}</TableCell>
                  <TableCell className="text-left">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expenses Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-600 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 rotate-180" />
              المصروفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {data.expenses?.map((item: IncomeStatementItem) => (
                  <TableRow key={item.accountId}>
                    <TableCell className="w-[15%] font-mono">{item.accountCode}</TableCell>
                    <TableCell className="w-[55%]">{item.accountName}</TableCell>
                    <TableCell className="w-[15%] text-left font-mono">{formatNumber(item.amount)}</TableCell>
                    <TableCell className="w-[15%] text-left text-gray-500">
                      {item.percentage?.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-red-50 dark:bg-red-900/20 font-bold">
                  <TableCell colSpan={2}>إجمالي المصروفات</TableCell>
                  <TableCell className="text-left font-mono">{formatNumber(data.totalExpenses)}</TableCell>
                  <TableCell className="text-left">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Net Income Summary */}
        <Card className={`${data.netIncome >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">
                {data.netIncome >= 0 ? 'صافي الربح' : 'صافي الخسارة'}
              </span>
              <span className={`text-3xl font-bold ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(Math.abs(data.netIncome))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    const data = reportData as any;
    if (!data) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">إجمالي الأصول</p>
              <p className="text-2xl font-bold">{formatNumber(data.assets?.totalAssets)}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">إجمالي الخصوم</p>
              <p className="text-2xl font-bold">{formatNumber(data.liabilities?.totalLiabilities)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <p className="text-sm text-green-600">إجمالي حقوق الملكية</p>
              <p className="text-2xl font-bold">{formatNumber(data.equity?.totalEquity)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Balance Status */}
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          data.isBalanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {data.isBalanced ? (
            <>
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">الميزانية متوازنة</span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5" />
              <span className="font-medium">الميزانية غير متوازنة</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-600 flex items-center gap-2">
                <Scale className="h-5 w-5" />
                الأصول
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {data.assets?.items?.map((item: BalanceSheetItem) => (
                    <TableRow key={item.accountId}>
                      <TableCell className="font-mono text-xs">{item.accountCode}</TableCell>
                      <TableCell>{item.accountName}</TableCell>
                      <TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50 dark:bg-blue-900/20 font-bold">
                    <TableCell colSpan={2}>إجمالي الأصول</TableCell>
                    <TableCell className="text-left font-mono">{formatNumber(data.assets?.totalAssets)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Liabilities & Equity */}
          <div className="space-y-6">
            {/* Liabilities */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  الخصوم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {data.liabilities?.items?.map((item: BalanceSheetItem) => (
                      <TableRow key={item.accountId}>
                        <TableCell className="font-mono text-xs">{item.accountCode}</TableCell>
                        <TableCell>{item.accountName}</TableCell>
                        <TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-red-50 dark:bg-red-900/20 font-bold">
                      <TableCell colSpan={2}>إجمالي الخصوم</TableCell>
                      <TableCell className="text-left font-mono">{formatNumber(data.liabilities?.totalLiabilities)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Equity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-600 flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  حقوق الملكية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {data.equity?.items?.map((item: BalanceSheetItem) => (
                      <TableRow key={item.accountId}>
                        <TableCell className="font-mono text-xs">{item.accountCode}</TableCell>
                        <TableCell>{item.accountName}</TableCell>
                        <TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-green-50 dark:bg-green-900/20 font-bold">
                      <TableCell colSpan={2}>إجمالي حقوق الملكية</TableCell>
                      <TableCell className="text-left font-mono">{formatNumber(data.equity?.totalEquity)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              التقارير المالية
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadReport}>
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trial-balance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ميزان المراجعة
          </TabsTrigger>
          <TabsTrigger value="income-statement" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            قائمة الدخل
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            الميزانية العمومية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Label>حتى تاريخ</Label>
                </div>
                <Input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-40"
                />
                <Button onClick={loadReport}>عرض</Button>
              </div>
            </CardContent>
          </Card>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : renderTrialBalance()}
        </TabsContent>

        <TabsContent value="income-statement" className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Label>من</Label>
                </div>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-40"
                />
                <div className="flex items-center gap-2">
                  <Label>إلى</Label>
                </div>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-40"
                />
                <Button onClick={loadReport}>عرض</Button>
              </div>
            </CardContent>
          </Card>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : renderIncomeStatement()}
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Label>حتى تاريخ</Label>
                </div>
                <Input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-40"
                />
                <Button onClick={loadReport}>عرض</Button>
              </div>
            </CardContent>
          </Card>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : renderBalanceSheet()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
