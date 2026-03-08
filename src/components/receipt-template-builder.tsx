'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Building2, User, FileText, CreditCard, Package, Calendar, Hash,
  Type, Image, Minus, Square, Pen, Save, Eye, Printer, Download,
  Plus, Trash2, Copy, Move, Settings, Palette, Layout, ShoppingBag,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Grid3X3,
  Layers, ArrowUp, ArrowDown, Lock, Unlock, Search, Star, Clock,
  AlignLeft, AlignCenterHorizontal, AlignRight, MoveRight, MoveDown,
  Check, DownloadCloud
} from 'lucide-react'
import { predefinedTemplates } from '@/lib/receipt-templates'

// ============== CURRENCY HOOK ==============
const defaultCurrencies = [
  { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', rate: 1 },
  { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري', rate: 8.25 },
  { code: 'AED', symbol: 'د.إ', name: 'درهم إماراتي', rate: 0.98 },
  { code: 'USD', symbol: '$', name: 'دولار أمريكي', rate: 0.27 },
  { code: 'EUR', symbol: '€', name: 'يورو', rate: 0.25 },
]

function useCurrency() {
  const [currency, setCurrency] = useState({ code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي', rate: 1 })
  
  useEffect(() => {
    const loadCurrency = () => {
      const savedSettings = localStorage.getItem('erp_settings')
      const savedCurrencies = localStorage.getItem('erp_custom_currencies')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        const allCurrencies = [...defaultCurrencies, ...(savedCurrencies ? JSON.parse(savedCurrencies) : [])]
        const curr = allCurrencies.find((c: any) => c.code === settings.currency) || defaultCurrencies[0]
        setCurrency(curr)
      }
    }
    loadCurrency()
    window.addEventListener('storage', loadCurrency)
    return () => window.removeEventListener('storage', loadCurrency)
  }, [])
  
  return currency
}

// دالة تحويل السعر
function convertPrice(priceSAR: number, targetCurrency: { rate: number; symbol: string }): string {
  const convertedPrice = priceSAR * targetCurrency.rate
  return `${convertedPrice.toFixed(0)} ${targetCurrency.symbol}`
}

// ============== TYPES ==============
type ElementType = 
  | 'text' | 'image' | 'line' | 'rectangle' | 'signature' | 'barcode' | 'qr'
  | 'company_name' | 'company_logo' | 'company_address' | 'company_phone'
  | 'branch_name' | 'branch_address' | 'branch_phone'
  | 'customer_name' | 'customer_phone' | 'customer_address' | 'customer_national_id'
  | 'invoice_number' | 'invoice_date' | 'invoice_total' | 'invoice_remaining'
  | 'installment_number' | 'installment_amount' | 'installment_date' | 'installment_due_date'
  | 'contract_number' | 'agent_name'
  | 'products_table' | 'payment_method' | 'amount_received' | 'change'

interface ElementStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  color: string
  backgroundColor: string
  textAlign: 'left' | 'center' | 'right'
  borderWidth: number
  borderColor: string
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none'
  borderRadius: number
  paddingTop: number
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
}

interface TemplateElement {
  id: string
  type: ElementType
  label: string
  labelAr: string
  x: number
  y: number
  width: number
  height: number
  style: ElementStyle
  visible: boolean
  locked: boolean
  zIndex: number
  dataSource?: string
  format?: 'text' | 'number' | 'date' | 'currency'
  prefix?: string
  suffix?: string
  staticText?: string
  conditional?: {
    field: string
    operator: 'equals' | 'not_equals' | 'greater' | 'less'
    value: string
  }
}

interface Template {
  id?: string
  name: string
  nameAr: string
  paperSize: 'A4' | 'A4_THIRD' | 'A5' | 'THERMAL_80' | 'CUSTOM'
  customWidth?: number
  customHeight?: number
  orientation: 'portrait' | 'landscape'
  elements: TemplateElement[]
  settings: {
    showGrid: boolean
    snapToGrid: boolean
    gridSize: number
    backgroundColor: string
    showAlignmentGuides: boolean
  }
}

interface AlignmentGuide {
  type: 'vertical' | 'horizontal'
  position: number
  elements: string[]
}

// ============== DEFAULT STYLES ==============
const defaultStyle: ElementStyle = {
  fontFamily: 'Arial',
  fontSize: 12,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  backgroundColor: 'transparent',
  textAlign: 'right',
  borderWidth: 0,
  borderColor: '#000000',
  borderStyle: 'none',
  borderRadius: 0,
  paddingTop: 2,
  paddingBottom: 2,
  paddingLeft: 5,
  paddingRight: 5
}

// ============== ELEMENTS DEFINITIONS ==============
const elementGroups = [
  {
    id: 'company',
    title: 'بيانات الشركة',
    titleEn: 'Company Data',
    color: 'purple',
    elements: [
      { type: 'company_name', labelAr: 'اسم الشركة', label: 'Company Name', defaultWidth: 200, defaultHeight: 30 },
      { type: 'company_logo', labelAr: 'شعار الشركة', label: 'Company Logo', defaultWidth: 80, defaultHeight: 80 },
      { type: 'company_address', labelAr: 'عنوان الشركة', label: 'Company Address', defaultWidth: 200, defaultHeight: 25 },
      { type: 'company_phone', labelAr: 'هاتف الشركة', label: 'Company Phone', defaultWidth: 150, defaultHeight: 25 },
    ]
  },
  {
    id: 'branch',
    title: 'بيانات الفرع',
    titleEn: 'Branch Data',
    color: 'blue',
    elements: [
      { type: 'branch_name', labelAr: 'اسم الفرع', label: 'Branch Name', defaultWidth: 180, defaultHeight: 25 },
      { type: 'branch_address', labelAr: 'عنوان الفرع', label: 'Branch Address', defaultWidth: 200, defaultHeight: 25 },
      { type: 'branch_phone', labelAr: 'هاتف الفرع', label: 'Branch Phone', defaultWidth: 150, defaultHeight: 25 },
    ]
  },
  {
    id: 'customer',
    title: 'بيانات العميل',
    titleEn: 'Customer Data',
    color: 'cyan',
    elements: [
      { type: 'customer_name', labelAr: 'اسم العميل', label: 'Customer Name', defaultWidth: 180, defaultHeight: 25 },
      { type: 'customer_phone', labelAr: 'هاتف العميل', label: 'Customer Phone', defaultWidth: 150, defaultHeight: 25 },
      { type: 'customer_address', labelAr: 'عنوان العميل', label: 'Customer Address', defaultWidth: 200, defaultHeight: 25 },
      { type: 'customer_national_id', labelAr: 'الرقم القومي', label: 'National ID', defaultWidth: 150, defaultHeight: 25 },
    ]
  },
  {
    id: 'invoice',
    title: 'بيانات الفاتورة',
    titleEn: 'Invoice Data',
    color: 'emerald',
    elements: [
      { type: 'invoice_number', labelAr: 'رقم الفاتورة', label: 'Invoice Number', defaultWidth: 150, defaultHeight: 25 },
      { type: 'invoice_date', labelAr: 'تاريخ الفاتورة', label: 'Invoice Date', defaultWidth: 150, defaultHeight: 25 },
      { type: 'invoice_total', labelAr: 'إجمالي الفاتورة', label: 'Invoice Total', defaultWidth: 150, defaultHeight: 25 },
      { type: 'invoice_remaining', labelAr: 'المبلغ المتبقي', label: 'Remaining Amount', defaultWidth: 150, defaultHeight: 25 },
    ]
  },
  {
    id: 'installment',
    title: 'بيانات القسط',
    titleEn: 'Installment Data',
    color: 'amber',
    elements: [
      { type: 'contract_number', labelAr: 'رقم العقد', label: 'Contract Number', defaultWidth: 150, defaultHeight: 25 },
      { type: 'installment_number', labelAr: 'رقم القسط', label: 'Installment Number', defaultWidth: 120, defaultHeight: 25 },
      { type: 'installment_amount', labelAr: 'قيمة القسط', label: 'Installment Amount', defaultWidth: 150, defaultHeight: 25 },
      { type: 'installment_date', labelAr: 'تاريخ السداد', label: 'Payment Date', defaultWidth: 150, defaultHeight: 25 },
      { type: 'installment_due_date', labelAr: 'تاريخ الاستحقاق', label: 'Due Date', defaultWidth: 150, defaultHeight: 25 },
    ]
  },
  {
    id: 'payment',
    title: 'بيانات الدفع',
    titleEn: 'Payment Data',
    color: 'green',
    elements: [
      { type: 'payment_method', labelAr: 'طريقة الدفع', label: 'Payment Method', defaultWidth: 150, defaultHeight: 25 },
      { type: 'amount_received', labelAr: 'المبلغ المحصل', label: 'Amount Received', defaultWidth: 150, defaultHeight: 25 },
      { type: 'agent_name', labelAr: 'اسم المندوب', label: 'Agent Name', defaultWidth: 150, defaultHeight: 25 },
    ]
  },
  {
    id: 'static',
    title: 'عناصر ثابتة',
    titleEn: 'Static Elements',
    color: 'gray',
    elements: [
      { type: 'text', labelAr: 'نص ثابت', label: 'Static Text', defaultWidth: 150, defaultHeight: 25 },
      { type: 'image', labelAr: 'صورة', label: 'Image', defaultWidth: 100, defaultHeight: 100 },
      { type: 'line', labelAr: 'خط', label: 'Line', defaultWidth: 200, defaultHeight: 2 },
      { type: 'rectangle', labelAr: 'مستطيل', label: 'Rectangle', defaultWidth: 200, defaultHeight: 50 },
      { type: 'signature', labelAr: 'توقيع', label: 'Signature', defaultWidth: 150, defaultHeight: 50 },
      { type: 'barcode', labelAr: 'باركود', label: 'Barcode', defaultWidth: 150, defaultHeight: 50 },
      { type: 'qr', labelAr: 'QR Code', label: 'QR Code', defaultWidth: 80, defaultHeight: 80 },
    ]
  },
  {
    id: 'tables',
    title: 'جداول',
    titleEn: 'Tables',
    color: 'rose',
    elements: [
      { type: 'products_table', labelAr: 'جدول المنتجات', label: 'Products Table', defaultWidth: 350, defaultHeight: 100 },
    ]
  }
]

// ============== PAPER SIZES ==============
const paperSizes = {
  A4: { width: 794, height: 1123, label: 'A4 كامل' },
  A4_THIRD: { width: 794, height: 374, label: 'ثلث A4' },
  A5: { width: 559, height: 794, label: 'A5' },
  THERMAL_80: { width: 302, height: 566, label: 'حراري 80 مم' },
  CUSTOM: { width: 300, height: 200, label: 'مخصص' }
}

// ============== MAIN COMPONENT ==============
export default function ReceiptTemplateBuilder() {
  // Currency
  const currency = useCurrency()
  
  // State
  const [template, setTemplate] = useState<Template>({
    name: 'قالب جديد',
    nameAr: 'قالب جديد',
    paperSize: 'A4_THIRD',
    orientation: 'portrait',
    elements: [],
    settings: {
      showGrid: true,
      snapToGrid: true,
      gridSize: 10,
      backgroundColor: '#ffffff',
      showAlignmentGuides: true
    }
  })

  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [activeTab, setActiveTab] = useState<'elements' | 'properties' | 'layers'>('elements')
  const [showPreview, setShowPreview] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showMarketplace, setShowMarketplace] = useState(false)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<typeof predefinedTemplates[0] | null>(null)
  const [marketplaceCategory, setMarketplaceCategory] = useState<string>('all')
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [elementStartPos, setElementStartPos] = useState({ x: 0, y: 0 })
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null)
  
  // Resize state
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const [elementStartSize, setElementStartSize] = useState({ width: 0, height: 0, x: 0, y: 0 })
  
  // Alignment guides
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])

  const canvasRef = useRef<HTMLDivElement>(null)

  // حساب أبعاد الورقة
  const getPaperDimensions = useCallback(() => {
    const size = paperSizes[template.paperSize]
    return {
      width: template.paperSize === 'CUSTOM' 
        ? (template.customWidth || 300) * 2.83 
        : size.width,
      height: template.paperSize === 'CUSTOM' 
        ? (template.customHeight || 200) * 2.83 
        : size.height
    }
  }, [template.paperSize, template.customWidth, template.customHeight])

  // حساب خطوط المحاذاة
  const calculateAlignmentGuides = useCallback((currentElement: TemplateElement | null, currentX?: number, currentY?: number) => {
    if (!template.settings.showAlignmentGuides || !currentElement) {
      setAlignmentGuides([])
      return
    }

    const guides: AlignmentGuide[] = []
    const paperDims = getPaperDimensions()
    const THRESHOLD = 5
    
    const x = currentX ?? currentElement.x
    const y = currentY ?? currentElement.y
    const right = x + currentElement.width
    const bottom = y + currentElement.height
    const centerX = x + currentElement.width / 2
    const centerY = y + currentElement.height / 2

    // Paper center guides
    const paperCenterX = paperDims.width / 2
    const paperCenterY = paperDims.height / 2
    
    if (Math.abs(centerX - paperCenterX) < THRESHOLD) {
      guides.push({ type: 'vertical', position: paperCenterX, elements: ['paper-center'] })
    }
    if (Math.abs(centerY - paperCenterY) < THRESHOLD) {
      guides.push({ type: 'horizontal', position: paperCenterY, elements: ['paper-center'] })
    }

    // Element alignment guides
    template.elements.forEach(el => {
      if (el.id === currentElement.id || !el.visible) return

      const elRight = el.x + el.width
      const elBottom = el.y + el.height
      const elCenterX = el.x + el.width / 2
      const elCenterY = el.y + el.height / 2

      // Vertical guides (left, center, right edges)
      if (Math.abs(x - el.x) < THRESHOLD) {
        guides.push({ type: 'vertical', position: el.x, elements: [el.id] })
      }
      if (Math.abs(right - elRight) < THRESHOLD) {
        guides.push({ type: 'vertical', position: elRight, elements: [el.id] })
      }
      if (Math.abs(x - elRight) < THRESHOLD) {
        guides.push({ type: 'vertical', position: elRight, elements: [el.id] })
      }
      if (Math.abs(right - el.x) < THRESHOLD) {
        guides.push({ type: 'vertical', position: el.x, elements: [el.id] })
      }
      if (Math.abs(centerX - elCenterX) < THRESHOLD) {
        guides.push({ type: 'vertical', position: elCenterX, elements: [el.id] })
      }

      // Horizontal guides (top, center, bottom edges)
      if (Math.abs(y - el.y) < THRESHOLD) {
        guides.push({ type: 'horizontal', position: el.y, elements: [el.id] })
      }
      if (Math.abs(bottom - elBottom) < THRESHOLD) {
        guides.push({ type: 'horizontal', position: elBottom, elements: [el.id] })
      }
      if (Math.abs(y - elBottom) < THRESHOLD) {
        guides.push({ type: 'horizontal', position: elBottom, elements: [el.id] })
      }
      if (Math.abs(bottom - el.y) < THRESHOLD) {
        guides.push({ type: 'horizontal', position: el.y, elements: [el.id] })
      }
      if (Math.abs(centerY - elCenterY) < THRESHOLD) {
        guides.push({ type: 'horizontal', position: elCenterY, elements: [el.id] })
      }
    })

    setAlignmentGuides(guides)
  }, [template.elements, template.settings.showAlignmentGuides, getPaperDimensions])

  // إضافة عنصر جديد
  const addElement = useCallback((elementType: ElementType, groupElement?: any) => {
    const paperDims = getPaperDimensions()
    const newElement: TemplateElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: elementType,
      label: groupElement?.label || elementType,
      labelAr: groupElement?.labelAr || elementType,
      x: 50 + (template.elements.length % 5) * 20,
      y: 50 + (template.elements.length % 5) * 20,
      width: groupElement?.defaultWidth || (elementType === 'line' ? 200 : 150),
      height: groupElement?.defaultHeight || (elementType === 'line' ? 2 : 25),
      style: { ...defaultStyle },
      visible: true,
      locked: false,
      zIndex: template.elements.length + 1,
      format: ['invoice_total', 'invoice_remaining', 'installment_amount', 'amount_received'].includes(elementType) 
        ? 'currency' 
        : ['invoice_date', 'installment_date', 'installment_due_date'].includes(elementType) 
          ? 'date' 
          : 'text'
    }

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }))
    setSelectedElement(newElement.id)
    toast.success(`تم إضافة ${groupElement?.labelAr || elementType}`)
  }, [template.elements.length, getPaperDimensions])

  // تحديث عنصر
  const updateElement = useCallback((id: string, updates: Partial<TemplateElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    }))
  }, [])

  // حذف عنصر
  const deleteElement = useCallback((id: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }))
    if (selectedElement === id) setSelectedElement(null)
    toast.success('تم حذف العنصر')
  }, [selectedElement])

  // تكرار عنصر
  const duplicateElement = useCallback((id: string) => {
    const element = template.elements.find(el => el.id === id)
    if (!element) return

    const newElement: TemplateElement = {
      ...element,
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 15,
      y: element.y + 15,
      label: `${element.label} (نسخة)`,
      labelAr: `${element.labelAr} (نسخة)`,
      zIndex: template.elements.length + 1
    }

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }))
    setSelectedElement(newElement.id)
    toast.success('تم تكرار العنصر')
  }, [template.elements])

  // العنصر المحدد
  const selectedElementData = template.elements.find(el => el.id === selectedElement)

  // معالجة السحب - Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    const element = template.elements.find(el => el.id === elementId)
    if (!element || element.locked) return

    e.preventDefault()
    e.stopPropagation()

    setSelectedElement(elementId)
    setIsDragging(true)
    setDraggingElementId(elementId)
    setDragStartPos({ x: e.clientX, y: e.clientY })
    setElementStartPos({ x: element.x, y: element.y })
  }, [template.elements])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return

    if (isDragging && draggingElementId) {
      const element = template.elements.find(el => el.id === draggingElementId)
      if (!element) return

      const rect = canvasRef.current.getBoundingClientRect()
      const scale = zoom / 100
      
      let deltaX = (e.clientX - dragStartPos.x) / scale
      let deltaY = (e.clientY - dragStartPos.y) / scale
      
      let newX = elementStartPos.x + deltaX
      let newY = elementStartPos.y + deltaY

      // Snap to grid
      if (template.settings.snapToGrid) {
        newX = Math.round(newX / template.settings.gridSize) * template.settings.gridSize
        newY = Math.round(newY / template.settings.gridSize) * template.settings.gridSize
      }

      // Snap to alignment guides
      alignmentGuides.forEach(guide => {
        if (guide.type === 'vertical') {
          const centerX = newX + element.width / 2
          const rightX = newX + element.width
          if (Math.abs(newX - guide.position) < 5) newX = guide.position
          else if (Math.abs(centerX - guide.position) < 5) newX = guide.position - element.width / 2
          else if (Math.abs(rightX - guide.position) < 5) newX = guide.position - element.width
        } else {
          const centerY = newY + element.height / 2
          const bottomY = newY + element.height
          if (Math.abs(newY - guide.position) < 5) newY = guide.position
          else if (Math.abs(centerY - guide.position) < 5) newY = guide.position - element.height / 2
          else if (Math.abs(bottomY - guide.position) < 5) newY = guide.position - element.height
        }
      })

      // Keep within bounds
      const paperDims = getPaperDimensions()
      newX = Math.max(0, Math.min(newX, paperDims.width - element.width))
      newY = Math.max(0, Math.min(newY, paperDims.height - element.height))

      updateElement(draggingElementId, { x: newX, y: newY })
      calculateAlignmentGuides(element, newX, newY)
    }

    if (isResizing && resizeHandle && selectedElement) {
      const element = template.elements.find(el => el.id === selectedElement)
      if (!element) return

      const scale = zoom / 100
      const deltaX = (e.clientX - resizeStartPos.x) / scale
      const deltaY = (e.clientY - resizeStartPos.y) / scale
      const minSize = 20

      let updates: Partial<TemplateElement> = {}

      switch (resizeHandle) {
        case 'nw':
          updates = {
            x: Math.min(elementStartSize.x + deltaX, elementStartSize.x + elementStartSize.width - minSize),
            y: Math.min(elementStartSize.y + deltaY, elementStartSize.y + elementStartSize.height - minSize),
            width: Math.max(minSize, elementStartSize.width - deltaX),
            height: Math.max(minSize, elementStartSize.height - deltaY)
          }
          break
        case 'n':
          updates = {
            y: Math.min(elementStartSize.y + deltaY, elementStartSize.y + elementStartSize.height - minSize),
            height: Math.max(minSize, elementStartSize.height - deltaY)
          }
          break
        case 'ne':
          updates = {
            y: Math.min(elementStartSize.y + deltaY, elementStartSize.y + elementStartSize.height - minSize),
            width: Math.max(minSize, elementStartSize.width + deltaX),
            height: Math.max(minSize, elementStartSize.height - deltaY)
          }
          break
        case 'w':
          updates = {
            x: Math.min(elementStartSize.x + deltaX, elementStartSize.x + elementStartSize.width - minSize),
            width: Math.max(minSize, elementStartSize.width - deltaX)
          }
          break
        case 'e':
          updates = {
            width: Math.max(minSize, elementStartSize.width + deltaX)
          }
          break
        case 'sw':
          updates = {
            x: Math.min(elementStartSize.x + deltaX, elementStartSize.x + elementStartSize.width - minSize),
            width: Math.max(minSize, elementStartSize.width - deltaX),
            height: Math.max(minSize, elementStartSize.height + deltaY)
          }
          break
        case 's':
          updates = {
            height: Math.max(minSize, elementStartSize.height + deltaY)
          }
          break
        case 'se':
          updates = {
            width: Math.max(minSize, elementStartSize.width + deltaX),
            height: Math.max(minSize, elementStartSize.height + deltaY)
          }
          break
      }

      // Snap to grid for resize
      if (template.settings.snapToGrid) {
        if (updates.width) updates.width = Math.round(updates.width / template.settings.gridSize) * template.settings.gridSize
        if (updates.height) updates.height = Math.round(updates.height / template.settings.gridSize) * template.settings.gridSize
        if (updates.x) updates.x = Math.round(updates.x / template.settings.gridSize) * template.settings.gridSize
        if (updates.y) updates.y = Math.round(updates.y / template.settings.gridSize) * template.settings.gridSize
      }

      updateElement(selectedElement, updates)
    }
  }, [isDragging, isResizing, draggingElementId, selectedElement, dragStartPos, elementStartPos, 
      resizeHandle, resizeStartPos, elementStartSize, template.elements, template.settings, zoom, 
      updateElement, getPaperDimensions, alignmentGuides, calculateAlignmentGuides])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggingElementId(null)
    setIsResizing(false)
    setResizeHandle(null)
    setAlignmentGuides([])
  }, [])

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()

    const element = template.elements.find(el => el.id === selectedElement)
    if (!element || element.locked) return

    setIsResizing(true)
    setResizeHandle(handle)
    setResizeStartPos({ x: e.clientX, y: e.clientY })
    setElementStartSize({ width: element.width, height: element.height, x: element.x, y: element.y })
  }, [selectedElement, template.elements])

  // Global mouse events
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElement) return

      const element = template.elements.find(el => el.id === selectedElement)
      if (!element || element.locked) return

      const step = e.shiftKey ? 10 : template.settings.gridSize

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
            deleteElement(selectedElement)
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          updateElement(selectedElement, { x: element.x - step })
          break
        case 'ArrowRight':
          e.preventDefault()
          updateElement(selectedElement, { x: element.x + step })
          break
        case 'ArrowUp':
          e.preventDefault()
          updateElement(selectedElement, { y: element.y - step })
          break
        case 'ArrowDown':
          e.preventDefault()
          updateElement(selectedElement, { y: element.y + step })
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElement, template.elements, template.settings.gridSize, updateElement, deleteElement])

  // حفظ القالب
  const saveTemplate = useCallback(async () => {
    try {
      const response = await fetch('/api/receipt-templates/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'default-company',
          name: template.name,
          nameAr: template.nameAr,
          templateJson: JSON.stringify(template),
          paperSize: template.paperSize,
          customWidth: template.customWidth,
          customHeight: template.customHeight
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('تم حفظ القالب بنجاح')
        setShowSaveDialog(false)
      } else {
        toast.error(data.error || 'فشل في حفظ القالب')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ')
    }
  }, [template])

  // طباعة المعاينة
  const printPreview = useCallback(() => {
    const { width, height } = getPaperDimensions()
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>معاينة الإيصال</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: Arial, Tahoma, sans-serif;
              margin: 0; 
              padding: 20px; 
              display: flex; 
              justify-content: center; 
              background: #f5f5f5;
            }
            .receipt {
              width: ${width}px;
              height: ${height}px;
              background: ${template.settings.backgroundColor};
              position: relative;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .element {
              position: absolute;
              overflow: hidden;
            }
            @media print { 
              body { padding: 0; background: white; }
              .receipt { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${template.elements
              .filter(el => el.visible)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map(el => {
                const styleArr = [
                  `left: ${el.x}px`,
                  `top: ${el.y}px`,
                  `width: ${el.width}px`,
                  `height: ${el.height}px`,
                  `font-family: ${el.style.fontFamily}`,
                  `font-size: ${el.style.fontSize}px`,
                  `font-weight: ${el.style.fontWeight}`,
                  `font-style: ${el.style.fontStyle}`,
                  `color: ${el.style.color}`,
                  `text-align: ${el.style.textAlign}`,
                  `padding: ${el.style.paddingTop}px ${el.style.paddingRight}px ${el.style.paddingBottom}px ${el.style.paddingLeft}px`,
                  `border: ${el.style.borderWidth}px ${el.style.borderStyle} ${el.style.borderColor}`,
                  `border-radius: ${el.style.borderRadius}px`,
                  `background-color: ${el.style.backgroundColor}`,
                  `z-index: ${el.zIndex}`
                ]
                
                let content = ''
                if (el.type === 'text') {
                  content = el.staticText || 'نص ثابت'
                } else if (el.type === 'line') {
                  content = `<div style="width:100%;height:100%;background:${el.style.color}"></div>`
                } else if (el.type === 'image') {
                  content = `<div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999">[صورة]</div>`
                } else {
                  content = `<span style="opacity:0.5">[${el.labelAr}]</span>`
                }
                
                return `<div class="element" style="${styleArr.join(';')}">${content}</div>`
              })
              .join('')}
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => printWindow.print(), 500)
    }
  }, [template, getPaperDimensions])

  // تصدير PDF
  const exportPDF = useCallback(() => {
    toast.info('جاري إعداد ملف PDF...')
  }, [])

  // محاذاة العناصر
  const alignElements = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedElementData) return

    const paperDims = getPaperDimensions()
    let updates: Partial<TemplateElement> = {}

    switch (alignment) {
      case 'left':
        updates.x = 10
        break
      case 'center':
        updates.x = (paperDims.width - selectedElementData.width) / 2
        break
      case 'right':
        updates.x = paperDims.width - selectedElementData.width - 10
        break
      case 'top':
        updates.y = 10
        break
      case 'middle':
        updates.y = (paperDims.height - selectedElementData.height) / 2
        break
      case 'bottom':
        updates.y = paperDims.height - selectedElementData.height - 10
        break
    }

    if (template.settings.snapToGrid) {
      if (updates.x !== undefined) updates.x = Math.round(updates.x / template.settings.gridSize) * template.settings.gridSize
      if (updates.y !== undefined) updates.y = Math.round(updates.y / template.settings.gridSize) * template.settings.gridSize
    }

    updateElement(selectedElementData.id, updates)
    toast.success('تمت المحاذاة')
  }, [selectedElementData, getPaperDimensions, template.settings.snapToGrid, template.settings.gridSize, updateElement])

  const paperDims = getPaperDimensions()
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500/10 text-purple-600 border-purple-200',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-200',
    cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-200',
    green: 'bg-green-500/10 text-green-600 border-green-200',
    gray: 'bg-gray-500/10 text-gray-600 border-gray-200',
    rose: 'bg-rose-500/10 text-rose-600 border-rose-200'
  }

  const resizeHandles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
  const handleCursors: Record<string, string> = {
    nw: 'cursor-nw-resize', n: 'cursor-n-resize', ne: 'cursor-ne-resize',
    w: 'cursor-w-resize', e: 'cursor-e-resize',
    sw: 'cursor-sw-resize', s: 'cursor-s-resize', se: 'cursor-se-resize'
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Layout className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">مصمم إيصالات الأقساط</h1>
              <p className="text-xs text-muted-foreground">Installment Receipt Template Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Size */}
            <Select value={template.paperSize} onValueChange={(v) => setTemplate(prev => ({ ...prev, paperSize: v as any }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paperSizes).map(([key, size]) => (
                  <SelectItem key={key} value={key}>{size.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs w-12 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Grid Toggle */}
            <Button
              variant={template.settings.showGrid ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTemplate(prev => ({
                ...prev,
                settings: { ...prev.settings, showGrid: !prev.settings.showGrid }
              }))}
            >
              <Grid3X3 className="h-4 w-4 ml-1" />
              شبكة
            </Button>

            {/* Alignment Guides Toggle */}
            <Button
              variant={template.settings.showAlignmentGuides ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTemplate(prev => ({
                ...prev,
                settings: { ...prev.settings, showAlignmentGuides: !prev.settings.showAlignmentGuides }
              }))}
            >
              <MoveRight className="h-4 w-4 ml-1" />
              محاذاة
            </Button>

            {/* Actions */}
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 ml-1" />
              معاينة
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowMarketplace(true)}>
              <ShoppingBag className="h-4 w-4 ml-1" />
              المتجر
            </Button>
            <Button size="sm" onClick={() => setShowSaveDialog(true)}>
              <Save className="h-4 w-4 ml-1" />
              حفظ
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Elements */}
        <div className="w-64 flex-shrink-0 border-l bg-background overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-2 mt-2">
              <TabsTrigger value="elements" className="text-xs">العناصر</TabsTrigger>
              <TabsTrigger value="properties" className="text-xs">الخصائص</TabsTrigger>
              <TabsTrigger value="layers" className="text-xs">الطبقات</TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
                  {elementGroups.map(group => (
                    <div key={group.id} className="space-y-1">
                      <div className={`px-2 py-1.5 rounded-lg text-sm font-medium ${colorMap[group.color]}`}>
                        {group.title}
                      </div>
                      <div className="grid grid-cols-2 gap-1 pr-1">
                        {group.elements.map((el, idx) => (
                          <div
                            key={`${group.id}-${idx}`}
                            onClick={() => addElement(el.type as ElementType, el)}
                            className="p-2 text-xs bg-muted/50 hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer transition-all hover:scale-[1.02] text-center border border-transparent hover:border-primary/30 select-none"
                          >
                            {el.labelAr}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="properties" className="flex-1 overflow-hidden m-0">
              {selectedElementData ? (
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-4">
                    {/* Element Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">العنصر المحدد</Label>
                        <Badge variant="outline">{selectedElementData.labelAr}</Badge>
                      </div>
                    </div>

                    {/* Quick Alignment */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">محاذاة سريعة</Label>
                      <div className="grid grid-cols-3 gap-1">
                        <Button variant="outline" size="sm" className="h-8" onClick={() => alignElements('left')}>
                          <AlignRight className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => alignElements('center')}>
                          <AlignCenterHorizontal className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => alignElements('right')}>
                          <AlignLeft className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => alignElements('top')}>
                          <MoveDown className="h-3 w-3 rotate-180" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => alignElements('middle')}>
                          <MoveRight className="h-3 w-3 rotate-90" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => alignElements('bottom')}>
                          <MoveDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">الموقع والحجم</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">X</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElementData.x)}
                            onChange={(e) => updateElement(selectedElementData.id, { x: Number(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElementData.y)}
                            onChange={(e) => updateElement(selectedElementData.id, { y: Number(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">العرض</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElementData.width)}
                            onChange={(e) => updateElement(selectedElementData.id, { width: Number(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">الارتفاع</Label>
                          <Input
                            type="number"
                            value={Math.round(selectedElementData.height)}
                            onChange={(e) => updateElement(selectedElementData.id, { height: Number(e.target.value) })}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Font */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">الخط</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={selectedElementData.style.fontFamily}
                          onValueChange={(v) => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, fontFamily: v }
                          })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Tahoma">Tahoma</SelectItem>
                            <SelectItem value="Cairo">Cairo</SelectItem>
                            <SelectItem value="Tajawal">Tajawal</SelectItem>
                            <SelectItem value="Amiri">Amiri</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={selectedElementData.style.fontSize}
                          onChange={(e) => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, fontSize: Number(e.target.value) }
                          })}
                          className="h-8"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant={selectedElementData.style.fontWeight === 'bold' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 h-8"
                          onClick={() => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, fontWeight: selectedElementData.style.fontWeight === 'bold' ? 'normal' : 'bold' }
                          })}
                        >
                          B
                        </Button>
                        <Button
                          variant={selectedElementData.style.fontStyle === 'italic' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 h-8 italic"
                          onClick={() => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, fontStyle: selectedElementData.style.fontStyle === 'italic' ? 'normal' : 'italic' }
                          })}
                        >
                          I
                        </Button>
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">الألوان</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">النص</Label>
                          <div className="flex gap-1">
                            <Input
                              type="color"
                              value={selectedElementData.style.color}
                              onChange={(e) => updateElement(selectedElementData.id, {
                                style: { ...selectedElementData.style, color: e.target.value }
                              })}
                              className="h-8 w-8 p-0 border-0"
                            />
                            <Input
                              value={selectedElementData.style.color}
                              onChange={(e) => updateElement(selectedElementData.id, {
                                style: { ...selectedElementData.style, color: e.target.value }
                              })}
                              className="h-8 flex-1 text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">الخلفية</Label>
                          <div className="flex gap-1">
                            <Input
                              type="color"
                              value={selectedElementData.style.backgroundColor === 'transparent' ? '#ffffff' : selectedElementData.style.backgroundColor}
                              onChange={(e) => updateElement(selectedElementData.id, {
                                style: { ...selectedElementData.style, backgroundColor: e.target.value }
                              })}
                              className="h-8 w-8 p-0 border-0"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 flex-1 text-xs"
                              onClick={() => updateElement(selectedElementData.id, {
                                style: { ...selectedElementData.style, backgroundColor: 'transparent' }
                              })}
                            >
                              شفاف
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Text Align */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">المحاذاة</Label>
                      <div className="flex gap-1">
                        {(['right', 'center', 'left'] as const).map(align => (
                          <Button
                            key={align}
                            variant={selectedElementData.style.textAlign === align ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => updateElement(selectedElementData.id, {
                              style: { ...selectedElementData.style, textAlign: align }
                            })}
                          >
                            {align === 'right' ? 'يمين' : align === 'center' ? 'وسط' : 'يسار'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Border */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">الإطار</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          placeholder="السمك"
                          value={selectedElementData.style.borderWidth}
                          onChange={(e) => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, borderWidth: Number(e.target.value) }
                          })}
                          className="h-8"
                        />
                        <Input
                          type="color"
                          value={selectedElementData.style.borderColor}
                          onChange={(e) => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, borderColor: e.target.value }
                          })}
                          className="h-8 w-full"
                        />
                        <Select
                          value={selectedElementData.style.borderStyle}
                          onValueChange={(v) => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, borderStyle: v as any }
                          })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون</SelectItem>
                            <SelectItem value="solid">مستمر</SelectItem>
                            <SelectItem value="dashed">متقطع</SelectItem>
                            <SelectItem value="dotted">منقط</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Padding */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">الهوامش الداخلية</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="أعلى"
                          value={selectedElementData.style.paddingTop}
                          onChange={(e) => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, paddingTop: Number(e.target.value) }
                          })}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="أسفل"
                          value={selectedElementData.style.paddingBottom}
                          onChange={(e) => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, paddingBottom: Number(e.target.value) }
                          })}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="يمين"
                          value={selectedElementData.style.paddingRight}
                          onChange={(e) => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, paddingRight: Number(e.target.value) }
                          })}
                          className="h-8"
                        />
                        <Input
                          type="number"
                          placeholder="يسار"
                          value={selectedElementData.style.paddingLeft}
                          onChange={(e) => updateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, paddingLeft: Number(e.target.value) }
                          })}
                          className="h-8"
                        />
                      </div>
                    </div>

                    {/* Format */}
                    {selectedElementData.format && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">تنسيق القيمة</Label>
                        <Select
                          value={selectedElementData.format}
                          onValueChange={(v) => updateElement(selectedElementData.id, { format: v as any })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">نص</SelectItem>
                            <SelectItem value="number">رقم</SelectItem>
                            <SelectItem value="date">تاريخ</SelectItem>
                            <SelectItem value="currency">عملة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Static Text */}
                    {selectedElementData.type === 'text' && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">النص الثابت</Label>
                        <Input
                          value={selectedElementData.staticText || ''}
                          onChange={(e) => updateElement(selectedElementData.id, { staticText: e.target.value })}
                          placeholder="أدخل النص هنا"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateElement(selectedElementData.id, { locked: !selectedElementData.locked })}
                      >
                        {selectedElementData.locked ? <Lock className="h-4 w-4 ml-1" /> : <Unlock className="h-4 w-4 ml-1" />}
                        {selectedElementData.locked ? 'فك القفل' : 'قفل'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => duplicateElement(selectedElementData.id)}
                      >
                        <Copy className="h-4 w-4 ml-1" />
                        تكرار
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => deleteElement(selectedElementData.id)}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف العنصر
                    </Button>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                  <Palette className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">اختر عنصراً لتعديل خصائصه</p>
                  <p className="text-xs mt-1">أو أضف عنصراً جديداً من قائمة العناصر</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="layers" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {template.elements.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">لا توجد عناصر</p>
                    </div>
                  ) : (
                    template.elements
                      .slice()
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map((el, idx) => (
                        <div
                          key={el.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                            selectedElement === el.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedElement(el.id)}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateElement(el.id, { visible: !el.visible })
                            }}
                          >
                            {el.visible ? <Eye className="h-3 w-3" /> : <Eye className="h-3 w-3 opacity-30" />}
                          </Button>
                          <span className="flex-1 text-xs truncate">{el.labelAr}</span>
                          <span className="text-[10px] text-muted-foreground">{Math.round(el.x)},{Math.round(el.y)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateElement(el.id, { locked: !el.locked })
                            }}
                          >
                            {el.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3 opacity-30" />}
                          </Button>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 overflow-auto bg-muted/50 flex items-center justify-center p-8">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl transition-transform origin-center"
            style={{
              width: paperDims.width,
              height: paperDims.height,
              transform: `scale(${zoom / 100})`,
              backgroundImage: template.settings.showGrid
                ? `linear-gradient(to right, #f0f0f0 1px, transparent 1px),
                   linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)`
                : 'none',
              backgroundSize: template.settings.showGrid
                ? `${template.settings.gridSize}px ${template.settings.gridSize}px`
                : 'auto'
            }}
            onClick={() => setSelectedElement(null)}
          >
            {/* Alignment Guides */}
            {alignmentGuides.map((guide, idx) => (
              <div
                key={`guide-${idx}`}
                className={`absolute ${guide.type === 'vertical' ? 'w-px h-full top-0' : 'h-px w-full left-0'}`}
                style={{
                  [guide.type === 'vertical' ? 'left' : 'top']: guide.position,
                  backgroundColor: guide.elements.includes('paper-center') ? '#3b82f6' : '#ef4444',
                  zIndex: 9999,
                  pointerEvents: 'none'
                }}
              />
            ))}

            {/* Elements */}
            {template.elements
              .filter(el => el.visible)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map(el => (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id) }}
                  className={`absolute transition-shadow ${
                    selectedElement === el.id 
                      ? 'ring-2 ring-primary ring-offset-1' 
                      : 'hover:ring-1 hover:ring-primary/30'
                  } ${el.locked ? 'cursor-not-allowed opacity-75' : 'cursor-move'}`}
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    fontFamily: el.style.fontFamily,
                    fontSize: el.style.fontSize,
                    fontWeight: el.style.fontWeight,
                    fontStyle: el.style.fontStyle,
                    color: el.style.color,
                    backgroundColor: el.style.backgroundColor,
                    textAlign: el.style.textAlign,
                    borderWidth: el.style.borderWidth,
                    borderColor: el.style.borderColor,
                    borderStyle: el.style.borderStyle,
                    borderRadius: el.style.borderRadius,
                    paddingTop: el.style.paddingTop,
                    paddingBottom: el.style.paddingBottom,
                    paddingLeft: el.style.paddingLeft,
                    paddingRight: el.style.paddingRight,
                    zIndex: el.zIndex,
                    userSelect: 'none'
                  }}
                >
                  {el.type === 'text' ? (
                    <span className="block w-full h-full overflow-hidden">{el.staticText || 'نص ثابت'}</span>
                  ) : el.type === 'line' ? (
                    <div className="w-full h-full bg-current" />
                  ) : el.type === 'image' ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs border border-dashed border-muted-foreground/30">
                      [صورة]
                    </div>
                  ) : el.type === 'signature' ? (
                    <div className="w-full h-full border-b-2 border-current flex items-end justify-center text-xs text-muted-foreground">
                      توقيع
                    </div>
                  ) : el.type === 'barcode' ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                      ||| || ||| ||
                    </div>
                  ) : el.type === 'qr' ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <div className="w-3/4 h-3/4 border-2 border-current grid grid-cols-3 grid-rows-3 gap-0.5 p-1">
                        {[0,1,2,3,4,5,6,7,8].map(i => (
                          <div key={i} className={`${[0,2,6,8].includes(i) ? 'bg-current' : i === 4 ? 'bg-current' : ''}`} />
                        ))}
                      </div>
                    </div>
                  ) : el.type === 'products_table' ? (
                    <div className="w-full h-full border border-current text-xs p-1">
                      <div className="border-b border-current pb-1 mb-1 font-bold text-center">جدول المنتجات</div>
                      <div className="grid grid-cols-4 gap-1 text-[10px]">
                        <span>المنتج</span>
                        <span>الكمية</span>
                        <span>السعر</span>
                        <span>الإجمالي</span>
                      </div>
                    </div>
                  ) : (
                    <span className="opacity-50 text-xs flex items-center justify-center h-full w-full">[{el.labelAr}]</span>
                  )}

                  {/* Resize Handles - Only show when selected and not locked */}
                  {selectedElement === el.id && !el.locked && (
                    resizeHandles.map(handle => (
                      <div
                        key={handle}
                        onMouseDown={(e) => handleResizeStart(e, handle)}
                        className={`absolute w-2.5 h-2.5 bg-white border-2 border-primary rounded-sm ${handleCursors[handle]} z-50`}
                        style={{
                          top: handle.includes('n') ? -5 : handle.includes('s') ? 'auto' : '50%',
                          bottom: handle.includes('s') ? -5 : 'auto',
                          left: handle.includes('w') ? -5 : handle.includes('e') ? 'auto' : '50%',
                          right: handle.includes('e') ? -5 : 'auto',
                          transform: (!handle.includes('n') && !handle.includes('s')) || (!handle.includes('e') && !handle.includes('w')) 
                            ? 'translate(-50%, -50%)' 
                            : 'none'
                        }}
                      />
                    ))
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              معاينة الإيصال
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-muted rounded-lg overflow-auto max-h-[60vh]">
            <div
              className="bg-white shadow-lg relative flex-shrink-0"
              style={{
                width: paperDims.width,
                height: paperDims.height,
                backgroundColor: template.settings.backgroundColor
              }}
            >
              {template.elements
                .filter(el => el.visible)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map(el => {
                  const styleObj: React.CSSProperties = {
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    fontFamily: el.style.fontFamily,
                    fontSize: el.style.fontSize,
                    fontWeight: el.style.fontWeight,
                    fontStyle: el.style.fontStyle,
                    color: el.style.color,
                    textAlign: el.style.textAlign,
                    paddingTop: el.style.paddingTop,
                    paddingBottom: el.style.paddingBottom,
                    paddingLeft: el.style.paddingLeft,
                    paddingRight: el.style.paddingRight,
                    borderWidth: el.style.borderWidth,
                    borderColor: el.style.borderColor,
                    borderStyle: el.style.borderStyle,
                    borderRadius: el.style.borderRadius,
                    backgroundColor: el.style.backgroundColor,
                    zIndex: el.zIndex,
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }

                  return (
                    <div key={el.id} style={styleObj}>
                      {el.type === 'text' ? (
                        el.staticText || 'نص ثابت'
                      ) : el.type === 'line' ? (
                        <div style={{ width: '100%', height: '100%', backgroundColor: el.style.color }} />
                      ) : el.type === 'image' ? (
                        <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                          [صورة]
                        </div>
                      ) : el.type === 'signature' ? (
                        <div style={{ width: '100%', height: '100%', borderBottom: '2px solid currentColor', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontSize: 10, color: '#999' }}>
                          توقيع
                        </div>
                      ) : el.type === 'barcode' ? (
                        <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                          ||| || ||| ||
                        </div>
                      ) : el.type === 'qr' ? (
                        <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '80%', height: '80%', border: '2px solid currentColor', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: 1, padding: 2 }}>
                            {[0,1,2,3,4,5,6,7,8].map(i => (
                              <div key={i} style={{ backgroundColor: [0,2,4,6,8].includes(i) ? 'currentColor' : 'transparent' }} />
                            ))}
                          </div>
                        </div>
                      ) : el.type === 'products_table' ? (
                        <div style={{ width: '100%', height: '100%', border: '1px solid currentColor', fontSize: 10, padding: 2, boxSizing: 'border-box' }}>
                          <div style={{ borderBottom: '1px solid currentColor', paddingBottom: 2, marginBottom: 2, fontWeight: 'bold', textAlign: 'center' }}>جدول المنتجات</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, fontSize: 9 }}>
                            <span>المنتج</span>
                            <span>الكمية</span>
                            <span>السعر</span>
                            <span>الإجمالي</span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ opacity: 0.5, fontSize: 10 }}>[{el.labelAr}]</span>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              إغلاق
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              <Download className="h-4 w-4 ml-1" />
              PDF
            </Button>
            <Button onClick={printPreview}>
              <Printer className="h-4 w-4 ml-1" />
              طباعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حفظ القالب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم القالب (عربي)</Label>
              <Input
                value={template.nameAr}
                onChange={(e) => setTemplate(prev => ({ ...prev, nameAr: e.target.value }))}
                placeholder="اسم القالب"
              />
            </div>
            <div>
              <Label>اسم القالب (إنجليزي)</Label>
              <Input
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Template Name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={saveTemplate}>
              <Save className="h-4 w-4 ml-1" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marketplace Dialog */}
      <Dialog open={showMarketplace} onOpenChange={setShowMarketplace}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="h-6 w-6 text-primary" />
              متجر القوالب
            </DialogTitle>
          </DialogHeader>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 py-2 border-b">
            {[
              { id: 'all', name: 'الكل' },
              { id: 'installment', name: 'أقساط' },
              { id: 'thermal', name: 'حراري' },
              { id: 'corporate', name: 'شركات' },
              { id: 'minimal', name: 'بسيط' },
              { id: 'classic', name: 'كلاسيكي' },
              { id: 'modern', name: 'عصري' },
              { id: 'full', name: 'كامل' }
            ].map(cat => (
              <Button
                key={cat.id}
                variant={marketplaceCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMarketplaceCategory(cat.id)}
                className="rounded-full"
              >
                {cat.name}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4 overflow-y-auto max-h-[65vh]">
            {predefinedTemplates
              .filter(tpl => marketplaceCategory === 'all' || tpl.category === marketplaceCategory)
              .map((tpl, idx) => (
              <Card key={tpl.id} className="overflow-hidden hover:shadow-xl transition-all cursor-pointer border-2 hover:border-primary/50 group">
                {/* معاينة القالب */}
                <div 
                  className="aspect-[2.5/1] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative overflow-hidden"
                  style={{ direction: 'rtl' }}
                >
                  {/* Mini Preview based on paper size */}
                  <div 
                    className="bg-white shadow-lg relative overflow-hidden"
                    style={{
                      width: tpl.templateJson.paperSize === 'THERMAL_80' ? 120 : 
                             tpl.templateJson.paperSize === 'A5' ? 200 : 220,
                      height: tpl.templateJson.paperSize === 'THERMAL_80' ? 180 :
                             tpl.templateJson.paperSize === 'A5' ? 140 : 95,
                      transform: 'scale(0.85)',
                      transformOrigin: 'center',
                      fontSize: 5,
                      backgroundColor: tpl.templateJson.settings?.backgroundColor || '#ffffff'
                    }}
                  >
                    {/* Render preview based on template style */}
                    {tpl.category === 'thermal' ? (
                      <>
                        <div className="text-center font-bold pt-2" style={{ fontSize: 8 }}>[اسم الشركة]</div>
                        <div className="border-t border-dashed border-gray-300 my-1 mx-2" />
                        <div className="px-2 text-right" style={{ fontSize: 6 }}>
                          <div>العميل: [الاسم]</div>
                          <div>الهاتف: [الرقم]</div>
                          <div className="font-bold mt-1">القسط: 3</div>
                        </div>
                        <div className="mx-2 my-1 bg-gray-100 text-center font-bold p-1 rounded" style={{ fontSize: 10 }}>
                          {convertPrice(750, currency)}
                        </div>
                        <div className="text-center text-gray-500" style={{ fontSize: 5 }}>المندوب: محمد</div>
                      </>
                    ) : tpl.category === 'minimal' ? (
                      <>
                        <div className="text-center font-bold pt-3" style={{ fontSize: 10 }}>[اسم الشركة]</div>
                        <div className="text-center text-gray-400 mt-1" style={{ fontSize: 6 }}>───────</div>
                        <div className="text-center font-bold mt-2" style={{ fontSize: 9 }}>العميل: أحمد</div>
                        <div className="text-center text-gray-500" style={{ fontSize: 6 }}>0501234567</div>
                        <div className="text-center font-bold mt-2" style={{ fontSize: 14 }}>{convertPrice(750, currency)}</div>
                      </>
                    ) : tpl.category === 'corporate' ? (
                      <>
                        <div className="bg-blue-900 text-white text-center font-bold py-1" style={{ fontSize: 8 }}>[اسم الشركة]</div>
                        <div className="p-2">
                          <div className="grid grid-cols-2 gap-1 text-right" style={{ fontSize: 5 }}>
                            <div className="bg-blue-50 p-0.5">رقم الإيصال</div>
                            <div>INV-001</div>
                            <div className="bg-blue-50 p-0.5">العميل</div>
                            <div>أحمد محمد</div>
                          </div>
                          <div className="bg-blue-900 text-white text-center mt-1 p-1 rounded" style={{ fontSize: 10 }}>
                            {convertPrice(750, currency)}
                          </div>
                        </div>
                      </>
                    ) : tpl.category === 'classic' ? (
                      <>
                        <div className="text-center text-amber-800 pt-1" style={{ fontSize: 6 }}>❧ ❧ ❧</div>
                        <div className="text-center font-bold text-amber-900" style={{ fontSize: 9 }}>[اسم الشركة]</div>
                        <div className="text-center text-amber-600" style={{ fontSize: 6 }}>الفرع الرئيسي</div>
                        <div className="bg-amber-100 text-amber-800 text-center mx-2 my-1 py-0.5 rounded-full" style={{ fontSize: 6 }}>
                          ✦ إيصال قسط ✦
                        </div>
                        <div className="bg-amber-50 border border-amber-200 mx-2 p-1 text-center font-bold rounded" style={{ fontSize: 10, color: '#78350f' }}>
                          {convertPrice(750, currency)}
                        </div>
                      </>
                    ) : tpl.category === 'modern' ? (
                      <>
                        <div className="flex">
                          <div className="w-1/4 h-1 bg-pink-500" />
                          <div className="w-1/4 h-1 bg-purple-500" />
                          <div className="w-1/4 h-1 bg-cyan-500" />
                          <div className="w-1/4 h-1 bg-green-500" />
                        </div>
                        <div className="text-center font-bold pt-2" style={{ fontSize: 9 }}>[اسم الشركة]</div>
                        <div className="flex gap-1 p-1">
                          <div className="flex-1 bg-pink-50 border border-pink-200 rounded p-1 text-center" style={{ fontSize: 5 }}>
                            <div className="text-pink-600">👤 العميل</div>
                            <div className="font-bold">أحمد</div>
                          </div>
                          <div className="flex-1 bg-green-50 border border-green-200 rounded p-1 text-center" style={{ fontSize: 5 }}>
                            <div className="text-green-600">💰 القسط</div>
                            <div className="font-bold">3/12</div>
                          </div>
                        </div>
                        <div className="bg-purple-50 mx-1 p-1 rounded text-center" style={{ fontSize: 10 }}>
                          <span className="text-purple-800 font-bold">{convertPrice(750, currency)}</span>
                        </div>
                        <div className="flex mt-1">
                          <div className="w-1/4 h-1 bg-green-500" />
                          <div className="w-1/4 h-1 bg-cyan-500" />
                          <div className="w-1/4 h-1 bg-purple-500" />
                          <div className="w-1/4 h-1 bg-pink-500" />
                        </div>
                      </>
                    ) : tpl.category === 'full' ? (
                      <>
                        <div className="bg-green-50 text-center py-1">
                          <div className="font-bold text-green-800" style={{ fontSize: 8 }}>[اسم الشركة]</div>
                          <div className="text-green-600" style={{ fontSize: 5 }}>الفرع الرئيسي</div>
                        </div>
                        <div className="p-1">
                          <div className="bg-gray-50 border rounded p-1 mb-1">
                            <div className="bg-green-600 text-white text-center rounded text-[5px] py-0.5">📋 بيانات العميل</div>
                            <div className="grid grid-cols-2 gap-0.5 mt-0.5 text-[4px]">
                              <div>الاسم: أحمد</div>
                              <div>الهاتف: 0501234</div>
                            </div>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded p-1 text-center">
                            <div className="font-bold text-green-700" style={{ fontSize: 10 }}>{convertPrice(750, currency)}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Standard installment template preview */}
                        <div className="absolute top-1 left-2 right-2 flex justify-between items-center" style={{ fontSize: 6 }}>
                          <span className="font-normal">[الفرع]</span>
                          <span className="font-bold text-center">[اسم الشركة]</span>
                          <span className="text-left">[الهاتف]</span>
                        </div>
                        <div className="absolute top-4 left-2 right-2 h-px bg-blue-400" />
                        <div className="absolute top-5 left-2 right-2 flex gap-1" style={{ fontSize: 4 }}>
                          <div className="flex-1 bg-blue-50 p-0.5 rounded">
                            <div className="font-bold text-blue-700 text-center text-[5px] mb-0.5">بيانات الأقساط</div>
                            <div>القسط: 3/12</div>
                            <div className="text-green-600 font-bold">{convertPrice(750, currency)}</div>
                          </div>
                          <div className="flex-1 bg-gray-50 p-0.5 rounded">
                            <div className="font-bold text-center text-[5px] mb-0.5">بيانات العميل</div>
                            <div>الاسم: أحمد</div>
                            <div>الهاتف: 0501234</div>
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between text-gray-500" style={{ fontSize: 4 }}>
                          <span>المندوب: محمد</span>
                          <span>فاتورة: INV-001</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Badge */}
                  <div className="absolute top-2 right-2">
                    {tpl.isFree ? (
                      <Badge className="bg-green-500 text-white text-xs">مجاني</Badge>
                    ) : (
                      <Badge className="bg-amber-500 text-white text-xs">{convertPrice(tpl.price, currency)}</Badge>
                    )}
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {tpl.category === 'installment' ? 'أقساط' :
                       tpl.category === 'thermal' ? 'حراري' :
                       tpl.category === 'corporate' ? 'شركات' :
                       tpl.category === 'minimal' ? 'بسيط' :
                       tpl.category === 'classic' ? 'كلاسيكي' :
                       tpl.category === 'modern' ? 'عصري' : 'كامل'}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-base">{tpl.nameAr}</h4>
                    {tpl.isFree ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        مجاني
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        {convertPrice(tpl.price, currency)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tpl.descriptionAr}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {tpl.templateJson.paperSize === 'A4_THIRD' ? 'ثلث A4' :
                       tpl.templateJson.paperSize === 'THERMAL_80' ? 'حراري 80mm' :
                       tpl.templateJson.paperSize === 'A5' ? 'A5' : 'مخصص'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {tpl.templateJson.elements?.length || 0} عنصر
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[1,2,3,4,5].map(star => (
                        <Star 
                          key={star} 
                          className={`h-3 w-3 ${star <= Math.round(tpl.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{tpl.rating}</span>
                    <span className="text-xs text-muted-foreground">({tpl.downloads} تثبيت)</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setPreviewTemplate(tpl)
                        setShowTemplatePreview(true)
                      }}
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      معاينة
                    </Button>
                    <Button 
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setTemplate({
                          ...tpl.templateJson,
                          elements: tpl.templateJson.elements.map(el => ({
                            ...el,
                            id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                          }))
                        })
                        setShowMarketplace(false)
                        toast.success('تم تحميل القالب بنجاح! يمكنك الآن تعديله وحفظه')
                      }}
                    >
                      <DownloadCloud className="h-4 w-4 ml-2" />
                      {tpl.isFree ? 'تثبيت' : 'شراء'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* قوالب إضافية قادمة قريباً */}
            {marketplaceCategory === 'all' && (
              <>
                {[1, 2].map(i => (
                  <Card key={`coming-${i}`} className="overflow-hidden border-dashed border-2 border-muted-foreground/20">
                    <div className="aspect-[2.5/1] bg-muted/30 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <span className="text-sm">قالب جديد قريباً</span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm text-muted-foreground">قالب قيد التطوير</h4>
                        <Badge variant="outline">قريباً</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        قوالب جديدة قادمة قريباً...
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>📦 {predefinedTemplates.length} قالب</span>
              <span>🆓 {predefinedTemplates.filter(t => t.isFree).length} مجاني</span>
              <span>💎 {predefinedTemplates.filter(t => !t.isFree).length} مدفوع</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowMarketplace(false)}>
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              معاينة القالب: {previewTemplate?.nameAr}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-muted rounded-lg overflow-auto max-h-[70vh]">
            {previewTemplate && (
              <div
                className="bg-white shadow-xl relative flex-shrink-0"
                style={{
                  width: paperSizes[previewTemplate.templateJson.paperSize as keyof typeof paperSizes]?.width || 794,
                  height: paperSizes[previewTemplate.templateJson.paperSize as keyof typeof paperSizes]?.height || 374,
                  backgroundColor: previewTemplate.templateJson.settings?.backgroundColor || '#ffffff'
                }}
              >
                {previewTemplate.templateJson.elements
                  .filter(el => el.visible)
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map(el => {
                    const styleObj: React.CSSProperties = {
                      position: 'absolute',
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      fontFamily: el.style.fontFamily,
                      fontSize: el.style.fontSize,
                      fontWeight: el.style.fontWeight,
                      fontStyle: el.style.fontStyle,
                      color: el.style.color,
                      textAlign: el.style.textAlign,
                      paddingTop: el.style.paddingTop,
                      paddingBottom: el.style.paddingBottom,
                      paddingLeft: el.style.paddingLeft,
                      paddingRight: el.style.paddingRight,
                      borderWidth: el.style.borderWidth,
                      borderColor: el.style.borderColor,
                      borderStyle: el.style.borderStyle,
                      borderRadius: el.style.borderRadius,
                      backgroundColor: el.style.backgroundColor,
                      zIndex: el.zIndex,
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                      direction: 'rtl'
                    }

                    let content = ''
                    if (el.type === 'text') {
                      content = el.staticText || 'نص ثابت'
                    } else if (el.type === 'line') {
                      content = ''
                    } else if (el.type === 'company_name') {
                      content = '[اسم الشركة]'
                    } else if (el.type === 'company_logo') {
                      content = '[الشعار]'
                    } else if (el.type === 'company_phone') {
                      content = '[هاتف الشركة]'
                    } else if (el.type === 'branch_name') {
                      content = '[اسم الفرع]'
                    } else if (el.type === 'customer_name') {
                      content = '[اسم العميل]'
                    } else if (el.type === 'customer_phone') {
                      content = (el.prefix || '') + '[هاتف العميل]'
                    } else if (el.type === 'customer_address') {
                      content = '[عنوان العميل]'
                    } else if (el.type === 'invoice_number') {
                      content = (el.prefix || '') + 'INV-2024-000001'
                    } else if (el.type === 'invoice_total') {
                      content = (el.prefix || '') + convertPrice(12500, currency)
                    } else if (el.type === 'invoice_remaining') {
                      content = (el.prefix || '') + convertPrice(8750, currency)
                    } else if (el.type === 'installment_number') {
                      content = (el.prefix || '') + '3' + (el.suffix || '')
                    } else if (el.type === 'installment_amount') {
                      content = (el.prefix || '') + convertPrice(750, currency)
                    } else if (el.type === 'installment_date') {
                      content = (el.prefix || '') + '15/01/2025'
                    } else if (el.type === 'installment_due_date') {
                      content = (el.prefix || '') + '15/02/2025'
                    } else if (el.type === 'contract_number') {
                      content = (el.prefix || '') + 'CNT-2024-001'
                    } else if (el.type === 'agent_name') {
                      content = (el.prefix || '') + '[اسم المندوب]'
                    } else if (el.type === 'products_table') {
                      return (
                        <div key={el.id} style={styleObj}>
                          <div style={{ borderBottom: '1px solid currentColor', paddingBottom: 4, marginBottom: 4, fontWeight: 'bold', textAlign: 'center' }}>
                            جدول المنتجات
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, fontSize: 9 }}>
                            <span style={{ fontWeight: 'bold' }}>المنتج</span>
                            <span style={{ fontWeight: 'bold' }}>العدد</span>
                            <span style={{ fontWeight: 'bold' }}>السعر</span>
                            <span style={{ fontWeight: 'bold' }}>الإجمالي</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, fontSize: 9, marginTop: 4, paddingTop: 4, borderTop: '1px dashed #ccc' }}>
                            <span>لابتوب HP</span>
                            <span>1</span>
                            <span>10,000</span>
                            <span>10,000</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, fontSize: 9, marginTop: 2 }}>
                            <span>ماوس لاسلكي</span>
                            <span>2</span>
                            <span>150</span>
                            <span>300</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, fontSize: 9, marginTop: 2 }}>
                            <span>حقيبة لابتوب</span>
                            <span>1</span>
                            <span>200</span>
                            <span>200</span>
                          </div>
                        </div>
                      )
                    } else {
                      content = `[${el.labelAr}]`
                    }

                    return (
                      <div key={el.id} style={styleObj}>
                        {el.type === 'line' ? (
                          <div style={{ width: '100%', height: '100%', backgroundColor: el.style.color }} />
                        ) : (
                          content
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplatePreview(false)}>
              إغلاق
            </Button>
            {previewTemplate && (
              <Button onClick={() => {
                setTemplate({
                  ...previewTemplate.templateJson,
                  elements: previewTemplate.templateJson.elements.map(el => ({
                    ...el,
                    id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                  }))
                })
                setShowTemplatePreview(false)
                setShowMarketplace(false)
                toast.success('تم تحميل القالب بنجاح!')
              }}>
                <DownloadCloud className="h-4 w-4 ml-2" />
                تثبيت القالب
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
