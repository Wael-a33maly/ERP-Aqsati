import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// الفئات والميزات الافتراضية
const defaultFeatures = [
  // === إدارة الأعمال الأساسية ===
  {
    featureKey: 'max_branches',
    featureName: 'Maximum Branches',
    featureNameAr: 'الحد الأقصى للفروع',
    category: 'BRANCHES_MANAGEMENT',
    categoryAr: 'إدارة الفروع',
    description: 'Maximum number of branches allowed',
    descriptionAr: 'الحد الأقصى لعدد الفروع المسموح به',
    icon: 'Building2',
    defaultLimit: 1,
    limitUnit: 'branches'
  },
  {
    featureKey: 'max_users',
    featureName: 'Maximum Users',
    featureNameAr: 'الحد الأقصى للمستخدمين',
    category: 'USERS_MANAGEMENT',
    categoryAr: 'إدارة المستخدمين',
    description: 'Maximum number of users allowed',
    descriptionAr: 'الحد الأقصى لعدد المستخدمين المسموح به',
    icon: 'Users',
    defaultLimit: 2,
    limitUnit: 'users'
  },
  {
    featureKey: 'max_customers',
    featureName: 'Maximum Customers',
    featureNameAr: 'الحد الأقصى للعملاء',
    category: 'CUSTOMERS_MANAGEMENT',
    categoryAr: 'إدارة العملاء',
    description: 'Maximum number of customers allowed',
    descriptionAr: 'الحد الأقصى لعدد العملاء المسموح به',
    icon: 'UserCircle',
    defaultLimit: 100,
    limitUnit: 'customers'
  },
  {
    featureKey: 'max_products',
    featureName: 'Maximum Products',
    featureNameAr: 'الحد الأقصى للمنتجات',
    category: 'PRODUCTS_MANAGEMENT',
    categoryAr: 'إدارة المنتجات',
    description: 'Maximum number of products allowed',
    descriptionAr: 'الحد الأقصى لعدد المنتجات المسموح به',
    icon: 'Package',
    defaultLimit: 50,
    limitUnit: 'products'
  },
  {
    featureKey: 'max_invoices',
    featureName: 'Maximum Invoices',
    featureNameAr: 'الحد الأقصى للفواتير',
    category: 'INVOICES',
    categoryAr: 'الفواتير',
    description: 'Maximum invoices per month',
    descriptionAr: 'الحد الأقصى للفواتير شهرياً',
    icon: 'FileText',
    defaultLimit: 30,
    limitUnit: 'invoices/month'
  },
  {
    featureKey: 'max_storage',
    featureName: 'Storage Space',
    featureNameAr: 'مساحة التخزين',
    category: 'STORAGE',
    categoryAr: 'التخزين',
    description: 'Maximum storage space in MB',
    descriptionAr: 'الحد الأقصى لمساحة التخزين بالميجابايت',
    icon: 'HardDrive',
    defaultLimit: 100,
    limitUnit: 'MB'
  },

  // === الفواتير والمبيعات ===
  {
    featureKey: 'invoices_enabled',
    featureName: 'Invoices',
    featureNameAr: 'الفواتير',
    category: 'INVOICES',
    categoryAr: 'الفواتير',
    description: 'Create and manage invoices',
    descriptionAr: 'إنشاء وإدارة الفواتير',
    icon: 'FileText',
    defaultLimit: null,
    isPremium: false
  },
  {
    featureKey: 'invoice_templates',
    featureName: 'Invoice Templates',
    featureNameAr: 'قوالب الفواتير',
    category: 'INVOICES',
    categoryAr: 'الفواتير',
    description: 'Custom invoice templates',
    descriptionAr: 'قوالب فواتير مخصصة',
    icon: 'Layout',
    defaultLimit: 5,
    limitUnit: 'templates',
    isPremium: false
  },
  {
    featureKey: 'returns_enabled',
    featureName: 'Returns Management',
    featureNameAr: 'إدارة المرتجعات',
    category: 'INVOICES',
    categoryAr: 'الفواتير',
    description: 'Handle returns and refunds',
    descriptionAr: 'إدارة المرتجعات والاسترداد',
    icon: 'RotateCcw',
    isPremium: false
  },
  {
    featureKey: 'discounts_enabled',
    featureName: 'Discounts',
    featureNameAr: 'الخصومات',
    category: 'INVOICES',
    categoryAr: 'الفواتير',
    description: 'Apply discounts on invoices',
    descriptionAr: 'تطبيق الخصومات على الفواتير',
    icon: 'Percent',
    isPremium: false
  },
  {
    featureKey: 'tax_enabled',
    featureName: 'Tax Management',
    featureNameAr: 'إدارة الضرائب',
    category: 'INVOICES',
    categoryAr: 'الفواتير',
    description: 'Tax calculation and reports',
    descriptionAr: 'حساب الضرائب والتقارير',
    icon: 'Receipt',
    isPremium: false
  },

  // === الأقساط والتحصيل ===
  {
    featureKey: 'installments_enabled',
    featureName: 'Installments',
    featureNameAr: 'الأقساط',
    category: 'INSTALLMENTS',
    categoryAr: 'الأقساط',
    description: 'Manage installment contracts',
    descriptionAr: 'إدارة عقود الأقساط',
    icon: 'Calendar',
    isPremium: true
  },
  {
    featureKey: 'installment_contracts_limit',
    featureName: 'Installment Contracts Limit',
    featureNameAr: 'حد عقود الأقساط',
    category: 'INSTALLMENTS',
    categoryAr: 'الأقساط',
    description: 'Maximum active installment contracts',
    descriptionAr: 'الحد الأقصى لعقود الأقساط النشطة',
    icon: 'FileCheck',
    defaultLimit: 10,
    limitUnit: 'contracts',
    isPremium: true
  },
  {
    featureKey: 'collection_tracking',
    featureName: 'Collection Tracking',
    featureNameAr: 'تتبع التحصيل',
    category: 'INSTALLMENTS',
    categoryAr: 'الأقساط',
    description: 'Track payment collections',
    descriptionAr: 'تتبع تحصيل المدفوعات',
    icon: 'Target',
    isPremium: true
  },
  {
    featureKey: 'late_fees_enabled',
    featureName: 'Late Fees',
    featureNameAr: 'رسوم التأخير',
    category: 'INSTALLMENTS',
    categoryAr: 'الأقساط',
    description: 'Automatic late fee calculation',
    descriptionAr: 'حساب تلقائي لرسوم التأخير',
    icon: 'AlertTriangle',
    isPremium: true
  },
  {
    featureKey: 'collection_agents',
    featureName: 'Collection Agents',
    featureNameAr: 'مندوبي التحصيل',
    category: 'INSTALLMENTS',
    categoryAr: 'الأقساط',
    description: 'Assign collection agents',
    descriptionAr: 'تعيين مندوبي التحصيل',
    icon: 'UserCheck',
    defaultLimit: 2,
    limitUnit: 'agents',
    isPremium: true
  },

  // === المدفوعات الإلكترونية ===
  {
    featureKey: 'payments_enabled',
    featureName: 'Payment Recording',
    featureNameAr: 'تسجيل المدفوعات',
    category: 'PAYMENTS',
    categoryAr: 'المدفوعات',
    description: 'Record payments manually',
    descriptionAr: 'تسجيل المدفوعات يدوياً',
    icon: 'CreditCard',
    isPremium: false
  },
  {
    featureKey: 'payment_links',
    featureName: 'Payment Links',
    featureNameAr: 'روابط الدفع',
    category: 'PAYMENT_GATEWAYS',
    categoryAr: 'بوابات الدفع',
    description: 'Generate payment links',
    descriptionAr: 'إنشاء روابط الدفع',
    icon: 'Link',
    isPremium: true
  },
  {
    featureKey: 'payment_links_limit',
    featureName: 'Payment Links Limit',
    featureNameAr: 'حد روابط الدفع',
    category: 'PAYMENT_GATEWAYS',
    categoryAr: 'بوابات الدفع',
    description: 'Maximum payment links per month',
    descriptionAr: 'الحد الأقصى لروابط الدفع شهرياً',
    icon: 'Link2',
    defaultLimit: 50,
    limitUnit: 'links/month',
    isPremium: true
  },

  // === بوابات الدفع المصرية ===
  {
    featureKey: 'paymob_enabled',
    featureName: 'Paymob Gateway',
    featureNameAr: 'بوابة Paymob',
    category: 'PAYMENT_GATEWAYS',
    categoryAr: 'بوابات الدفع',
    description: 'Paymob payment gateway',
    descriptionAr: 'بوابة دفع Paymob',
    icon: 'CreditCard',
    isPremium: true
  },
  {
    featureKey: 'fawry_enabled',
    featureName: 'Fawry Gateway',
    featureNameAr: 'بوابة فوري',
    category: 'PAYMENT_GATEWAYS',
    categoryAr: 'بوابات الدفع',
    description: 'Fawry payment gateway',
    descriptionAr: 'بوابة دفع فوري',
    icon: 'CreditCard',
    isPremium: true
  },
  {
    featureKey: 'opay_enabled',
    featureName: 'OPay Gateway',
    featureNameAr: 'بوابة OPay',
    category: 'PAYMENT_GATEWAYS',
    categoryAr: 'بوابات الدفع',
    description: 'OPay payment gateway',
    descriptionAr: 'بوابة دفع OPay',
    icon: 'CreditCard',
    isPremium: true
  },
  {
    featureKey: 'vodafone_cash_enabled',
    featureName: 'Vodafone Cash',
    featureNameAr: 'فودافون كاش',
    category: 'PAYMENT_GATEWAYS',
    categoryAr: 'بوابات الدفع',
    description: 'Vodafone Cash payments',
    descriptionAr: 'مدفوعات فودافون كاش',
    icon: 'Smartphone',
    isPremium: true
  },
  {
    featureKey: 'instapay_enabled',
    featureName: 'InstaPay',
    featureNameAr: 'انستاباي',
    category: 'PAYMENT_GATEWAYS',
    categoryAr: 'بوابات الدفع',
    description: 'InstaPay bank transfers',
    descriptionAr: 'تحويلات انستاباي البنكية',
    icon: 'Building',
    isPremium: true
  },
  {
    featureKey: 'wallet_payments_enabled',
    featureName: 'Mobile Wallets',
    featureNameAr: 'محافظ إلكترونية',
    category: 'PAYMENT_GATEWAYS',
    categoryAr: 'بوابات الدفع',
    description: 'Mobile wallet payments',
    descriptionAr: 'مدفوعات المحافظ الإلكترونية',
    icon: 'Wallet',
    isPremium: true
  },

  // === المخزون ===
  {
    featureKey: 'inventory_enabled',
    featureName: 'Inventory Management',
    featureNameAr: 'إدارة المخزون',
    category: 'INVENTORY_MANAGEMENT',
    categoryAr: 'إدارة المخزون',
    description: 'Track inventory levels',
    descriptionAr: 'تتبع مستويات المخزون',
    icon: 'Package',
    isPremium: true
  },
  {
    featureKey: 'max_warehouses',
    featureName: 'Maximum Warehouses',
    featureNameAr: 'الحد الأقصى للمخازن',
    category: 'INVENTORY_MANAGEMENT',
    categoryAr: 'إدارة المخزون',
    description: 'Maximum number of warehouses',
    descriptionAr: 'الحد الأقصى لعدد المخازن',
    icon: 'Warehouse',
    defaultLimit: 1,
    limitUnit: 'warehouses'
  },
  {
    featureKey: 'inventory_alerts',
    featureName: 'Inventory Alerts',
    featureNameAr: 'تنبيهات المخزون',
    category: 'INVENTORY_MANAGEMENT',
    categoryAr: 'إدارة المخزون',
    description: 'Low stock alerts',
    descriptionAr: 'تنبيهات انخفاض المخزون',
    icon: 'Bell',
    isPremium: true
  },
  {
    featureKey: 'barcode_scanning',
    featureName: 'Barcode Scanning',
    featureNameAr: 'مسح الباركود',
    category: 'INVENTORY_MANAGEMENT',
    categoryAr: 'إدارة المخزون',
    description: 'Scan barcodes for products',
    descriptionAr: 'مسح باركود المنتجات',
    icon: 'Scan',
    isPremium: true
  },

  // === التقارير ===
  {
    featureKey: 'basic_reports',
    featureName: 'Basic Reports',
    featureNameAr: 'التقارير الأساسية',
    category: 'REPORTS',
    categoryAr: 'التقارير',
    description: 'Basic reporting features',
    descriptionAr: 'ميزات التقارير الأساسية',
    icon: 'BarChart3',
    isPremium: false
  },
  {
    featureKey: 'advanced_reports',
    featureName: 'Advanced Reports',
    featureNameAr: 'التقارير المتقدمة',
    category: 'REPORTS',
    categoryAr: 'التقارير',
    description: 'Advanced analytics and reports',
    descriptionAr: 'تحليلات وتقارير متقدمة',
    icon: 'PieChart',
    isPremium: true
  },
  {
    featureKey: 'custom_reports',
    featureName: 'Custom Reports',
    featureNameAr: 'تقارير مخصصة',
    category: 'REPORTS',
    categoryAr: 'التقارير',
    description: 'Create custom reports',
    descriptionAr: 'إنشاء تقارير مخصصة',
    icon: 'FileBarChart',
    defaultLimit: 5,
    limitUnit: 'reports',
    isPremium: true
  },
  {
    featureKey: 'export_pdf',
    featureName: 'Export to PDF',
    featureNameAr: 'تصدير PDF',
    category: 'REPORTS',
    categoryAr: 'التقارير',
    description: 'Export reports to PDF',
    descriptionAr: 'تصدير التقارير إلى PDF',
    icon: 'FileDown',
    isPremium: false
  },
  {
    featureKey: 'export_excel',
    featureName: 'Export to Excel',
    featureNameAr: 'تصدير Excel',
    category: 'REPORTS',
    categoryAr: 'التقارير',
    description: 'Export data to Excel',
    descriptionAr: 'تصدير البيانات إلى Excel',
    icon: 'Table',
    isPremium: true
  },

  // === التحليلات ===
  {
    featureKey: 'dashboard_analytics',
    featureName: 'Dashboard Analytics',
    featureNameAr: 'تحليلات لوحة التحكم',
    category: 'ANALYTICS',
    categoryAr: 'التحليلات',
    description: 'Dashboard with analytics',
    descriptionAr: 'لوحة تحكم مع تحليلات',
    icon: 'LayoutDashboard',
    isPremium: false
  },
  {
    featureKey: 'sales_analytics',
    featureName: 'Sales Analytics',
    featureNameAr: 'تحليلات المبيعات',
    category: 'ANALYTICS',
    categoryAr: 'التحليلات',
    description: 'Sales performance analytics',
    descriptionAr: 'تحليلات أداء المبيعات',
    icon: 'TrendingUp',
    isPremium: true
  },
  {
    featureKey: 'collection_analytics',
    featureName: 'Collection Analytics',
    featureNameAr: 'تحليلات التحصيل',
    category: 'ANALYTICS',
    categoryAr: 'التحليلات',
    description: 'Collection performance analytics',
    descriptionAr: 'تحليلات أداء التحصيل',
    icon: 'Target',
    isPremium: true
  },

  // === العمولات ===
  {
    featureKey: 'commissions_enabled',
    featureName: 'Agent Commissions',
    featureNameAr: 'عمولات المندوبين',
    category: 'INSTALLMENTS',
    categoryAr: 'الأقساط',
    description: 'Manage agent commissions',
    descriptionAr: 'إدارة عمولات المندوبين',
    icon: 'Coins',
    isPremium: true
  },
  {
    featureKey: 'commission_policies',
    featureName: 'Commission Policies',
    featureNameAr: 'سياسات العمولات',
    category: 'INSTALLMENTS',
    categoryAr: 'الأقساط',
    description: 'Create commission policies',
    descriptionAr: 'إنشاء سياسات العمولات',
    icon: 'Settings',
    defaultLimit: 5,
    limitUnit: 'policies',
    isPremium: true
  },

  // === API والتكاملات ===
  {
    featureKey: 'api_access',
    featureName: 'API Access',
    featureNameAr: 'وصول API',
    category: 'API_ACCESS',
    categoryAr: 'وصول API',
    description: 'Access to REST API',
    descriptionAr: 'الوصول إلى REST API',
    icon: 'Code',
    isPremium: true
  },
  {
    featureKey: 'api_rate_limit',
    featureName: 'API Rate Limit',
    featureNameAr: 'حد طلبات API',
    category: 'API_ACCESS',
    categoryAr: 'وصول API',
    description: 'API requests per minute',
    descriptionAr: 'طلبات API في الدقيقة',
    icon: 'Gauge',
    defaultLimit: 100,
    limitUnit: 'requests/min',
    isPremium: true
  },
  {
    featureKey: 'webhooks',
    featureName: 'Webhooks',
    featureNameAr: 'الويب هوك',
    category: 'INTEGRATIONS',
    categoryAr: 'التكاملات',
    description: 'Webhook notifications',
    descriptionAr: 'إشعارات الويب هوك',
    icon: 'Webhook',
    defaultLimit: 5,
    limitUnit: 'webhooks',
    isPremium: true
  },

  // === الدعم ===
  {
    featureKey: 'email_support',
    featureName: 'Email Support',
    featureNameAr: 'دعم البريد الإلكتروني',
    category: 'SUPPORT',
    categoryAr: 'الدعم',
    description: 'Email support',
    descriptionAr: 'دعم عبر البريد الإلكتروني',
    icon: 'Mail',
    isPremium: false
  },
  {
    featureKey: 'chat_support',
    featureName: 'Chat Support',
    featureNameAr: 'دعم المحادثة',
    category: 'SUPPORT',
    categoryAr: 'الدعم',
    description: 'Live chat support',
    descriptionAr: 'دعم المحادثة المباشرة',
    icon: 'MessageCircle',
    isPremium: true
  },
  {
    featureKey: 'priority_support',
    featureName: 'Priority Support',
    featureNameAr: 'دعم أولوي',
    category: 'SUPPORT',
    categoryAr: 'الدعم',
    description: 'Priority support queue',
    descriptionAr: 'طابور دعم أولوي',
    icon: 'Headphones',
    isPremium: true
  },
  {
    featureKey: 'dedicated_manager',
    featureName: 'Dedicated Account Manager',
    featureNameAr: 'مدير حساب مخصص',
    category: 'SUPPORT',
    categoryAr: 'الدعم',
    description: 'Personal account manager',
    descriptionAr: 'مدير حساب شخصي',
    icon: 'UserCog',
    isPremium: true
  },

  // === النسخ الاحتياطي ===
  {
    featureKey: 'manual_backup',
    featureName: 'Manual Backup',
    featureNameAr: 'نسخ احتياطي يدوي',
    category: 'BACKUP',
    categoryAr: 'النسخ الاحتياطي',
    description: 'Manual data backup',
    descriptionAr: 'نسخ احتياطي يدوي للبيانات',
    icon: 'Save',
    isPremium: false
  },
  {
    featureKey: 'auto_backup',
    featureName: 'Auto Backup',
    featureNameAr: 'نسخ احتياطي تلقائي',
    category: 'BACKUP',
    categoryAr: 'النسخ الاحتياطي',
    description: 'Automatic daily backup',
    descriptionAr: 'نسخ احتياطي يومي تلقائي',
    icon: 'RefreshCcw',
    isPremium: true
  },
  {
    featureKey: 'backup_retention',
    featureName: 'Backup Retention',
    featureNameAr: 'احتفاظ النسخ الاحتياطي',
    category: 'BACKUP',
    categoryAr: 'النسخ الاحتياطي',
    description: 'Backup retention in days',
    descriptionAr: 'فترة الاحتفاظ بالنسخ بالأيام',
    icon: 'Calendar',
    defaultLimit: 7,
    limitUnit: 'days',
    isPremium: true
  },

  // === الأمان ===
  {
    featureKey: 'two_factor_auth',
    featureName: 'Two-Factor Authentication',
    featureNameAr: 'المصادقة الثنائية',
    category: 'SECURITY',
    categoryAr: 'الأمان',
    description: '2FA authentication',
    descriptionAr: 'المصادقة الثنائية',
    icon: 'Shield',
    isPremium: false
  },
  {
    featureKey: 'audit_logs',
    featureName: 'Audit Logs',
    featureNameAr: 'سجلات التدقيق',
    category: 'SECURITY',
    categoryAr: 'الأمان',
    description: 'Activity audit logs',
    descriptionAr: 'سجلات تدقيق النشاط',
    icon: 'FileSearch',
    defaultLimit: 30,
    limitUnit: 'days',
    isPremium: true
  },
  {
    featureKey: 'ip_restrictions',
    featureName: 'IP Restrictions',
    featureNameAr: 'قيود IP',
    category: 'SECURITY',
    categoryAr: 'الأمان',
    description: 'IP-based access control',
    descriptionAr: 'التحكم في الوصول بناءً على IP',
    icon: 'ShieldCheck',
    isPremium: true
  },
  {
    featureKey: 'session_management',
    featureName: 'Session Management',
    featureNameAr: 'إدارة الجلسات',
    category: 'SECURITY',
    categoryAr: 'الأمان',
    description: 'Active session management',
    descriptionAr: 'إدارة الجلسات النشطة',
    icon: 'Key',
    isPremium: true
  },

  // === الإشعارات ===
  {
    featureKey: 'email_notifications',
    featureName: 'Email Notifications',
    featureNameAr: 'إشعارات البريد',
    category: 'NOTIFICATIONS',
    categoryAr: 'الإشعارات',
    description: 'Email notifications',
    descriptionAr: 'إشعارات البريد الإلكتروني',
    icon: 'Mail',
    isPremium: false
  },
  {
    featureKey: 'sms_notifications',
    featureName: 'SMS Notifications',
    featureNameAr: 'إشعارات SMS',
    category: 'NOTIFICATIONS',
    categoryAr: 'الإشعارات',
    description: 'SMS notifications',
    descriptionAr: 'إشعارات الرسائل النصية',
    icon: 'Smartphone',
    isPremium: true
  },
  {
    featureKey: 'sms_limit',
    featureName: 'SMS Limit',
    featureNameAr: 'حد SMS',
    category: 'NOTIFICATIONS',
    categoryAr: 'الإشعارات',
    description: 'SMS messages per month',
    descriptionAr: 'رسائل SMS شهرياً',
    icon: 'MessageSquare',
    defaultLimit: 100,
    limitUnit: 'sms/month',
    isPremium: true
  },
  {
    featureKey: 'push_notifications',
    featureName: 'Push Notifications',
    featureNameAr: 'إشعارات فورية',
    category: 'NOTIFICATIONS',
    categoryAr: 'الإشعارات',
    description: 'Push notifications',
    descriptionAr: 'الإشعارات الفورية',
    icon: 'Bell',
    isPremium: true
  },

  // === التطبيق المحمول ===
  {
    featureKey: 'mobile_app',
    featureName: 'Mobile App Access',
    featureNameAr: 'وصول التطبيق المحمول',
    category: 'MOBILE_APP',
    categoryAr: 'التطبيق المحمول',
    description: 'Access via mobile app',
    descriptionAr: 'الوصول عبر التطبيق المحمول',
    icon: 'Smartphone',
    isPremium: true
  },
  {
    featureKey: 'offline_mode',
    featureName: 'Offline Mode',
    featureNameAr: 'الوضع غير المتصل',
    category: 'MOBILE_APP',
    categoryAr: 'التطبيق المحمول',
    description: 'Work offline and sync later',
    descriptionAr: 'العمل بدون اتصال والمزامنة لاحقاً',
    icon: 'WifiOff',
    isPremium: true
  },
  {
    featureKey: 'gps_tracking',
    featureName: 'GPS Tracking',
    featureNameAr: 'تتبع GPS',
    category: 'MOBILE_APP',
    categoryAr: 'التطبيق المحمول',
    description: 'Agent location tracking',
    descriptionAr: 'تتبع موقع المندوب',
    icon: 'MapPin',
    isPremium: true
  },

  // === التخصيص ===
  {
    featureKey: 'custom_branding',
    featureName: 'Custom Branding',
    featureNameAr: 'علامة تجارية مخصصة',
    category: 'CUSTOMIZATION',
    categoryAr: 'التخصيص',
    description: 'Custom logo and colors',
    descriptionAr: 'شعار وألوان مخصصة',
    icon: 'Palette',
    isPremium: true
  },
  {
    featureKey: 'custom_domain',
    featureName: 'Custom Domain',
    featureNameAr: 'نطاق مخصص',
    category: 'CUSTOMIZATION',
    categoryAr: 'التخصيص',
    description: 'Use custom domain',
    descriptionAr: 'استخدام نطاق مخصص',
    icon: 'Globe',
    isPremium: true
  },
  {
    featureKey: 'receipt_templates',
    featureName: 'Receipt Templates',
    featureNameAr: 'قوالب الإيصالات',
    category: 'CUSTOMIZATION',
    categoryAr: 'التخصيص',
    description: 'Custom receipt templates',
    descriptionAr: 'قوالب إيصالات مخصصة',
    icon: 'Receipt',
    defaultLimit: 3,
    limitUnit: 'templates',
    isPremium: true
  }
]

// الخطط الافتراضية مع ميزاتها
const defaultPlans = [
  {
    name: 'Free',
    nameAr: 'المجاني',
    code: 'free',
    description: 'Perfect for small businesses starting out',
    descriptionAr: 'مثالي للشركات الصغيرة التي تبدأ للتو',
    price: 0,
    currency: 'EGP',
    billingCycle: 'YEARLY',
    trialDays: 0,
    sortOrder: 1,
    isPopular: false,
    isDefault: true,
    features: {
      // الحدود
      max_branches: { enabled: true, limitValue: 1 },
      max_users: { enabled: true, limitValue: 2 },
      max_customers: { enabled: true, limitValue: 100 },
      max_products: { enabled: true, limitValue: 50 },
      max_invoices: { enabled: true, limitValue: 30 },
      max_storage: { enabled: true, limitValue: 100 },
      max_warehouses: { enabled: true, limitValue: 1 },
      // الميزات المفعلة
      invoices_enabled: { enabled: true },
      basic_reports: { enabled: true },
      discounts_enabled: { enabled: true },
      tax_enabled: { enabled: true },
      payments_enabled: { enabled: true },
      dashboard_analytics: { enabled: true },
      export_pdf: { enabled: true },
      email_support: { enabled: true },
      two_factor_auth: { enabled: true },
      manual_backup: { enabled: true },
      email_notifications: { enabled: true }
    }
  },
  {
    name: 'Starter',
    nameAr: 'المبتدئ',
    code: 'starter',
    description: 'Great for growing businesses',
    descriptionAr: 'رائع للشركات النامية',
    price: 2999,
    currency: 'EGP',
    billingCycle: 'YEARLY',
    trialDays: 14,
    sortOrder: 2,
    isPopular: false,
    isDefault: false,
    features: {
      // الحدود
      max_branches: { enabled: true, limitValue: 2 },
      max_users: { enabled: true, limitValue: 5 },
      max_customers: { enabled: true, limitValue: 500 },
      max_products: { enabled: true, limitValue: 200 },
      max_invoices: { enabled: true, limitValue: 100 },
      max_storage: { enabled: true, limitValue: 500 },
      max_warehouses: { enabled: true, limitValue: 2 },
      commission_policies: { enabled: true, limitValue: 3 },
      // الميزات المفعلة
      invoices_enabled: { enabled: true },
      invoice_templates: { enabled: true, limitValue: 5 },
      returns_enabled: { enabled: true },
      discounts_enabled: { enabled: true },
      tax_enabled: { enabled: true },
      payments_enabled: { enabled: true },
      inventory_enabled: { enabled: true },
      inventory_alerts: { enabled: true },
      basic_reports: { enabled: true },
      advanced_reports: { enabled: true },
      dashboard_analytics: { enabled: true },
      export_pdf: { enabled: true },
      export_excel: { enabled: true },
      email_support: { enabled: true },
      chat_support: { enabled: true },
      two_factor_auth: { enabled: true },
      audit_logs: { enabled: true, limitValue: 30 },
      manual_backup: { enabled: true },
      auto_backup: { enabled: true },
      email_notifications: { enabled: true },
      mobile_app: { enabled: true }
    }
  },
  {
    name: 'Pro',
    nameAr: 'المحترف',
    code: 'pro',
    description: 'Best for established businesses',
    descriptionAr: 'الأفضل للشركات الراسخة',
    price: 5999,
    currency: 'EGP',
    billingCycle: 'YEARLY',
    trialDays: 14,
    sortOrder: 3,
    isPopular: true,
    isDefault: false,
    features: {
      // الحدود
      max_branches: { enabled: true, limitValue: 5 },
      max_users: { enabled: true, limitValue: 15 },
      max_customers: { enabled: true, limitValue: 2000 },
      max_products: { enabled: true, limitValue: 1000 },
      max_invoices: { enabled: true, limitValue: 500 },
      max_storage: { enabled: true, limitValue: 2000 },
      max_warehouses: { enabled: true, limitValue: 5 },
      installment_contracts_limit: { enabled: true, limitValue: 100 },
      collection_agents: { enabled: true, limitValue: 10 },
      commission_policies: { enabled: true, limitValue: 10 },
      custom_reports: { enabled: true, limitValue: 10 },
      api_rate_limit: { enabled: true, limitValue: 500 },
      webhooks: { enabled: true, limitValue: 10 },
      backup_retention: { enabled: true, limitValue: 30 },
      sms_limit: { enabled: true, limitValue: 500 },
      receipt_templates: { enabled: true, limitValue: 10 },
      // الميزات المفعلة
      invoices_enabled: { enabled: true },
      invoice_templates: { enabled: true, limitValue: 10 },
      returns_enabled: { enabled: true },
      discounts_enabled: { enabled: true },
      tax_enabled: { enabled: true },
      installments_enabled: { enabled: true },
      collection_tracking: { enabled: true },
      late_fees_enabled: { enabled: true },
      payments_enabled: { enabled: true },
      payment_links: { enabled: true },
      payment_links_limit: { enabled: true, limitValue: 200 },
      inventory_enabled: { enabled: true },
      inventory_alerts: { enabled: true },
      barcode_scanning: { enabled: true },
      commissions_enabled: { enabled: true },
      basic_reports: { enabled: true },
      advanced_reports: { enabled: true },
      sales_analytics: { enabled: true },
      collection_analytics: { enabled: true },
      export_pdf: { enabled: true },
      export_excel: { enabled: true },
      email_support: { enabled: true },
      chat_support: { enabled: true },
      priority_support: { enabled: true },
      two_factor_auth: { enabled: true },
      audit_logs: { enabled: true, limitValue: 90 },
      session_management: { enabled: true },
      manual_backup: { enabled: true },
      auto_backup: { enabled: true },
      email_notifications: { enabled: true },
      sms_notifications: { enabled: true },
      push_notifications: { enabled: true },
      mobile_app: { enabled: true },
      offline_mode: { enabled: true },
      gps_tracking: { enabled: true },
      custom_branding: { enabled: true }
    }
  },
  {
    name: 'Enterprise',
    nameAr: 'الشركات',
    code: 'enterprise',
    description: 'For large organizations with custom needs',
    descriptionAr: 'للمنظمات الكبيرة ذات الاحتياجات المخصصة',
    price: 12999,
    currency: 'EGP',
    billingCycle: 'YEARLY',
    trialDays: 30,
    sortOrder: 4,
    isPopular: false,
    isDefault: false,
    features: {
      // حدود غير محدودة (-1 يعني غير محدود)
      max_branches: { enabled: true, limitValue: -1 },
      max_users: { enabled: true, limitValue: -1 },
      max_customers: { enabled: true, limitValue: -1 },
      max_products: { enabled: true, limitValue: -1 },
      max_invoices: { enabled: true, limitValue: -1 },
      max_storage: { enabled: true, limitValue: 10000 },
      max_warehouses: { enabled: true, limitValue: -1 },
      installment_contracts_limit: { enabled: true, limitValue: -1 },
      collection_agents: { enabled: true, limitValue: -1 },
      commission_policies: { enabled: true, limitValue: -1 },
      custom_reports: { enabled: true, limitValue: -1 },
      api_rate_limit: { enabled: true, limitValue: 2000 },
      webhooks: { enabled: true, limitValue: -1 },
      backup_retention: { enabled: true, limitValue: 90 },
      sms_limit: { enabled: true, limitValue: -1 },
      receipt_templates: { enabled: true, limitValue: -1 },
      // كل الميزات مفعلة
      invoices_enabled: { enabled: true },
      invoice_templates: { enabled: true, limitValue: -1 },
      returns_enabled: { enabled: true },
      discounts_enabled: { enabled: true },
      tax_enabled: { enabled: true },
      installments_enabled: { enabled: true },
      collection_tracking: { enabled: true },
      late_fees_enabled: { enabled: true },
      payments_enabled: { enabled: true },
      payment_links: { enabled: true },
      payment_links_limit: { enabled: true, limitValue: -1 },
      paymob_enabled: { enabled: true },
      fawry_enabled: { enabled: true },
      opay_enabled: { enabled: true },
      vodafone_cash_enabled: { enabled: true },
      instapay_enabled: { enabled: true },
      wallet_payments_enabled: { enabled: true },
      inventory_enabled: { enabled: true },
      inventory_alerts: { enabled: true },
      barcode_scanning: { enabled: true },
      commissions_enabled: { enabled: true },
      basic_reports: { enabled: true },
      advanced_reports: { enabled: true },
      custom_reports: { enabled: true, limitValue: -1 },
      sales_analytics: { enabled: true },
      collection_analytics: { enabled: true },
      export_pdf: { enabled: true },
      export_excel: { enabled: true },
      api_access: { enabled: true },
      webhooks: { enabled: true, limitValue: -1 },
      email_support: { enabled: true },
      chat_support: { enabled: true },
      priority_support: { enabled: true },
      dedicated_manager: { enabled: true },
      two_factor_auth: { enabled: true },
      audit_logs: { enabled: true, limitValue: 365 },
      ip_restrictions: { enabled: true },
      session_management: { enabled: true },
      manual_backup: { enabled: true },
      auto_backup: { enabled: true },
      backup_retention: { enabled: true, limitValue: 90 },
      email_notifications: { enabled: true },
      sms_notifications: { enabled: true },
      sms_limit: { enabled: true, limitValue: -1 },
      push_notifications: { enabled: true },
      mobile_app: { enabled: true },
      offline_mode: { enabled: true },
      gps_tracking: { enabled: true },
      custom_branding: { enabled: true },
      custom_domain: { enabled: true },
      receipt_templates: { enabled: true, limitValue: -1 }
    }
  }
]

// إنشاء قوالب الميزات
async function ensureFeatureTemplates() {
  const existingCount = await db.featureTemplate.count()
  if (existingCount === 0) {
    for (const feature of defaultFeatures) {
      await db.featureTemplate.create({
        data: {
          
          featureKey: feature.featureKey,
          featureName: feature.featureName,
          featureNameAr: feature.featureNameAr,
          category: feature.category,
          categoryAr: feature.categoryAr,
          description: feature.description,
          descriptionAr: feature.descriptionAr,
          icon: feature.icon,
          defaultLimit: feature.defaultLimit,
          limitUnit: feature.limitUnit,
          isPremium: feature.isPremium || false,
          sortOrder: 0
        }
      })
    }
  }
}

// إنشاء الخطط الافتراضية مع ميزاتها
async function ensureDefaultPlans() {
  const existingCount = await db.subscriptionPlan.count()
  if (existingCount === 0) {
    for (const planData of defaultPlans) {
      const { features, ...planInfo } = planData
      
      const plan = await db.subscriptionPlan.create({
        data: {
          
          name: planInfo.name,
          nameAr: planInfo.nameAr,
          code: planInfo.code,
          description: planInfo.description,
          descriptionAr: planInfo.descriptionAr,
          price: planInfo.price,
          currency: planInfo.currency,
          billingCycle: planInfo.billingCycle,
          trialDays: planInfo.trialDays,
          sortOrder: planInfo.sortOrder,
          isPopular: planInfo.isPopular,
          isDefault: planInfo.isDefault,
          active: true
        }
      })

      // إنشاء ميزات الخطة
      for (const [featureKey, featureConfig] of Object.entries(features)) {
        const template = await db.featureTemplate.findUnique({
          where: { featureKey }
        })
        
        if (template) {
          await db.planFeature.create({
            data: {
              
              planId: plan.id,
              featureKey: template.featureKey,
              featureName: template.featureName,
              featureNameAr: template.featureNameAr,
              category: template.category,
              categoryAr: template.categoryAr,
              enabled: featureConfig.enabled,
              limitValue: featureConfig.limitValue || template.defaultLimit,
              limitUnit: template.limitUnit,
              description: template.description,
              descriptionAr: template.descriptionAr,
              icon: template.icon,
              sortOrder: 0
            }
          })
        }
      }
    }
  }
}

// GET - جلب الخطط المتاحة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeFeatures = searchParams.get('features') === 'true'
    const planId = searchParams.get('id')

    // التأكد من وجود قوالب الميزات والخطط الافتراضية
    await ensureFeatureTemplates()
    await ensureDefaultPlans()

    if (planId) {
      const plan = await db.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          PlanFeature: {
            orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
          }
        }
      })
      return NextResponse.json({ success: true, data: plan })
    }

    const plans = await db.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: includeFeatures ? {
        PlanFeature: {
          orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }]
        }
      } : false
    })

    // تجميع الميزات حسب الفئة
    if (includeFeatures) {
      const plansWithGroupedFeatures = plans.map(plan => {
        const groupedFeatures = {}
        for (const feature of plan.PlanFeature) {
          if (!groupedFeatures[feature.category]) {
            groupedFeatures[feature.category] = {
              category: feature.category,
              categoryAr: feature.categoryAr,
              features: []
            }
          }
          groupedFeatures[feature.category].features.push(feature)
        }
        return {
          ...plan,
          groupedFeatures: Object.values(groupedFeatures)
        }
      })
      return NextResponse.json({ success: true, data: plansWithGroupedFeatures })
    }

    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب الخطط' }, { status: 500 })
  }
}

// POST - إنشاء خطة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const plan = await db.subscriptionPlan.create({
      data: {
        
        name: body.name,
        nameAr: body.nameAr,
        code: body.code,
        description: body.description,
        descriptionAr: body.descriptionAr,
        price: body.price || 0,
        currency: body.currency || 'EGP',
        billingCycle: body.billingCycle || 'MONTHLY',
        trialDays: body.trialDays || 0,
        sortOrder: body.sortOrder || 0,
        isPopular: body.isPopular || false,
        isDefault: body.isDefault || false,
        active: body.active !== false
      }
    })

    // إنشاء ميزات الخطة من القوالب
    if (body.copyFromPlanId) {
      const sourceFeatures = await db.planFeature.findMany({
        where: { planId: body.copyFromPlanId }
      })
      
      for (const feature of sourceFeatures) {
        await db.planFeature.create({
          data: {
            
            planId: plan.id,
            featureKey: feature.featureKey,
            featureName: feature.featureName,
            featureNameAr: feature.featureNameAr,
            category: feature.category,
            categoryAr: feature.categoryAr,
            enabled: feature.enabled,
            limitValue: feature.limitValue,
            limitUnit: feature.limitUnit,
            description: feature.description,
            descriptionAr: feature.descriptionAr,
            icon: feature.icon,
            sortOrder: feature.sortOrder
          }
        })
      }
    } else {
      // إنشاء ميزات افتراضية من القوالب
      const templates = await db.featureTemplate.findMany()
      for (const template of templates) {
        await db.planFeature.create({
          data: {
            
            planId: plan.id,
            featureKey: template.featureKey,
            featureName: template.featureName,
            featureNameAr: template.featureNameAr,
            category: template.category,
            categoryAr: template.categoryAr,
            enabled: false,
            limitValue: template.defaultLimit,
            limitUnit: template.limitUnit,
            description: template.description,
            descriptionAr: template.descriptionAr,
            icon: template.icon,
            sortOrder: template.sortOrder
          }
        })
      }
    }

    return NextResponse.json({ success: true, data: plan })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ success: false, error: 'فشل في إنشاء الخطة' }, { status: 500 })
  }
}

// PUT - تحديث خطة أو ميزة
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // تحديث ميزة معينة
    if (body.featureId) {
      const feature = await db.planFeature.update({
        where: { id: body.featureId },
        data: {
          enabled: body.enabled,
          limitValue: body.limitValue,
          updatedAt: new Date()
        }
      })
      return NextResponse.json({ success: true, data: feature })
    }

    // تحديث الخطة
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف الخطة مطلوب' }, { status: 400 })
    }

    const plan = await db.subscriptionPlan.update({
      where: { id },
      data: { ...updateData, updatedAt: new Date() }
    })

    return NextResponse.json({ success: true, data: plan })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ success: false, error: 'فشل في تحديث الخطة' }, { status: 500 })
  }
}

// DELETE - حذف خطة
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف الخطة مطلوب' }, { status: 400 })
    }

    const subscriptionsCount = await db.subscription.count({
      where: { planId: id }
    })

    if (subscriptionsCount > 0) {
      await db.subscriptionPlan.update({
        where: { id },
        data: { active: false }
      })
      return NextResponse.json({ success: true, message: 'تم إلغاء تفعيل الخطة' })
    }

    // حذف ميزات الخطة أولاً
    await db.planFeature.deleteMany({ where: { planId: id } })
    await db.subscriptionPlan.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'تم حذف الخطة' })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ success: false, error: 'فشل في حذف الخطة' }, { status: 500 })
  }
}
// Force reload at Sun Mar  1 19:52:54 UTC 2026
