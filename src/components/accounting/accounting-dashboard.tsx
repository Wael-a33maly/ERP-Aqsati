'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountTree } from './account-tree';
import { JournalEntries } from './journal-entries';
import { Vouchers } from './vouchers';
import { FinancialReports } from './financial-reports';
import { 
  TreeDeciduous, 
  BookOpen, 
  Receipt, 
  BarChart3,
  Calculator
} from 'lucide-react';

export function AccountingDashboard() {
  const [activeTab, setActiveTab] = useState('accounts');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            النظام المحاسبي
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة شجرة الحسابات والقيود والسندات المالية
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">الحسابات</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <TreeDeciduous className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">القيود اليومية</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">السندات</p>
                <p className="text-2xl font-bold">--</p>
              </div>
              <Receipt className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">التقارير</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <TreeDeciduous className="h-4 w-4" />
            <span className="hidden sm:inline">شجرة الحسابات</span>
          </TabsTrigger>
          <TabsTrigger value="journals" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">قيود اليومية</span>
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">السندات</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">التقارير</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <AccountTree />
        </TabsContent>

        <TabsContent value="journals" className="space-y-4">
          <JournalEntries />
        </TabsContent>

        <TabsContent value="vouchers" className="space-y-4">
          <Vouchers />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
