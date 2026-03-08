'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Package,
  Barcode,
  Filter,
  Download,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ProductForm } from './product-form'
import { ProductDetails } from './product-details'
import { toast } from 'sonner'

interface Product {
  id: string
  sku: string
  name: string
  nameAr?: string | null
  description?: string | null
  unit: string
  costPrice: number
  sellPrice: number
  minPrice?: number | null
  barcode?: string | null
  image?: string | null
  active: boolean
  category?: {
    id: string
    name: string
    nameAr?: string | null
  } | null
  inventory?: {
    warehouseId: string
    warehouse: {
      id: string
      name: string
      nameAr?: string | null
    }
    quantity: number
  }[]
  totalStock?: number
}

interface Category {
  id: string
  name: string
  nameAr?: string | null
  children?: Category[]
}

interface ProductsListProps {
  companyId: string
  selectedCategoryId?: string | null
}

export function ProductsList({ companyId, selectedCategoryId }: ProductsListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>(selectedCategoryId || '')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [barcodeInput, setBarcodeInput] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        companyId,
        page: page.toString(),
        limit: '20',
        includeInventory: 'true',
        ...(search && { search }),
        ...(categoryFilter && { categoryId: categoryFilter }),
      })

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('خطأ في تحميل المنتجات')
    } finally {
      setLoading(false)
    }
  }, [companyId, page, search, categoryFilter])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`/api/categories?companyId=${companyId}`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [companyId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    setCategoryFilter(selectedCategoryId || '')
  }, [selectedCategoryId])

  // Barcode scanner support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Most barcode scanners send Enter after the barcode
      if (e.key === 'Enter' && barcodeInput) {
        searchByBarcode(barcodeInput)
        setBarcodeInput('')
      } else if (e.key.length === 1) {
        setBarcodeInput(prev => prev + e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [barcodeInput])

  const searchByBarcode = async (barcode: string) => {
    try {
      const response = await fetch(
        `/api/products?companyId=${companyId}&barcode=${barcode}&includeInventory=true`
      )
      const data = await response.json()

      if (data.success && data.data?.length > 0) {
        setProducts(data.data)
        setViewingProduct(data.data[0])
        setDetailsOpen(true)
        toast.success('تم العثور على المنتج')
      } else {
        toast.error('لم يتم العثور على منتج بهذا الباركود')
      }
    } catch (error) {
      console.error('Error searching by barcode:', error)
      toast.error('خطأ في البحث بالباركود')
    }
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setFormOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormOpen(true)
  }

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product)
    setDetailsOpen(true)
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(
        `/api/products?id=${productToDelete.id}&companyId=${companyId}`,
        { method: 'DELETE' }
      )
      const data = await response.json()

      if (data.success) {
        toast.success('تم حذف المنتج بنجاح')
        fetchProducts()
      } else {
        toast.error(data.error || 'خطأ في حذف المنتج')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('خطأ في حذف المنتج')
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingProduct(null)
    fetchProducts()
  }

  const exportToExcel = () => {
    // Simple CSV export
    const headers = ['SKU', 'الاسم', 'الاسم عربي', 'الفئة', 'سعر التكلفة', 'سعر البيع', 'الكمية']
    const rows = products.map(p => [
      p.sku,
      p.name,
      p.nameAr || '',
      p.category?.nameAr || p.category?.name || '',
      p.costPrice,
      p.sellPrice,
      p.totalStock || 0,
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `products-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('تم تصدير البيانات')
  }

  const getStockStatus = (product: Product) => {
    const stock = product.totalStock || 0
    if (stock <= 0) {
      return { label: 'نفذ المخزون', variant: 'destructive' as const }
    }
    if (stock <= 5) {
      return { label: 'مخزون منخفض', variant: 'warning' as const }
    }
    return { label: 'متوفر', variant: 'success' as const }
  }

  // Flatten categories for select
  const flattenCategories = (cats: Category[], level = 0): { id: string; name: string; level: number }[] => {
    return cats.reduce((acc, cat) => {
      acc.push({ id: cat.id, name: cat.nameAr || cat.name, level })
      if (cat.children?.length) {
        acc.push(...flattenCategories(cat.children, level + 1))
      }
      return acc
    }, [] as { id: string; name: string; level: number }[])
  }

  const flatCategories = flattenCategories(categories)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            المنتجات
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="h-4 w-4 ml-1" />
              تصدير
            </Button>
            <Button size="sm" onClick={handleAddProduct}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة منتج
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، SKU، الباركود..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 ml-1" />
              <SelectValue placeholder="كل الفئات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفئات</SelectItem>
              {flatCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {'  '.repeat(cat.level)}
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Barcode Scanner Input */}
          <div className="relative">
            <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={barcodeInputRef}
              placeholder="امسح الباركود..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && barcodeInput) {
                  searchByBarcode(barcodeInput)
                  setBarcodeInput('')
                }
              }}
              className="w-[150px] pr-9"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>لا توجد منتجات</p>
              <Button variant="link" size="sm" onClick={handleAddProduct}>
                إضافة منتج جديد
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">SKU</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">سعر التكلفة</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right">المخزون</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product)
                  return (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewProduct(product)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{product.nameAr || product.name}</div>
                            {product.nameAr && (
                              <div className="text-sm text-muted-foreground">{product.name}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        {product.category?.nameAr || product.category?.name || '-'}
                      </TableCell>
                      <TableCell>{product.costPrice.toLocaleString()} ر.س</TableCell>
                      <TableCell>{product.sellPrice.toLocaleString()} ر.س</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={product.totalStock && product.totalStock <= 5 ? 'text-destructive font-medium' : ''}>
                            {product.totalStock || 0}
                          </span>
                          {product.totalStock !== undefined && product.totalStock <= 5 && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={stockStatus.variant === 'destructive' ? 'destructive' : stockStatus.variant === 'warning' ? 'secondary' : 'default'}
                          className={
                            stockStatus.variant === 'success' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' :
                            stockStatus.variant === 'warning' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' : ''
                          }
                        >
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                              <Eye className="h-4 w-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(product)}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              السابق
            </Button>
            <span className="text-sm text-muted-foreground">
              صفحة {page} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              التالي
            </Button>
          </div>
        )}
      </CardContent>

      {/* Product Form Dialog */}
      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        companyId={companyId}
        product={editingProduct}
        defaultCategoryId={selectedCategoryId}
        onSuccess={handleFormSuccess}
      />

      {/* Product Details Dialog */}
      <ProductDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        product={viewingProduct}
        onEdit={() => {
          setDetailsOpen(false)
          if (viewingProduct) {
            handleEditProduct(viewingProduct)
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف منتج &quot;{productToDelete?.nameAr || productToDelete?.name}&quot;؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
