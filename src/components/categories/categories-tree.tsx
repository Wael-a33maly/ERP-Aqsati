'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { CategoryForm } from './category-form'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  nameAr?: string | null
  code: string
  parentId?: string | null
  active: boolean
  parent?: {
    id: string
    name: string
    nameAr?: string | null
  } | null
  children?: Category[]
  _count?: {
    products: number
    children: number
  }
}

interface CategoriesTreeProps {
  companyId: string
  onCategorySelect?: (category: Category | null) => void
  selectedCategoryId?: string | null
}

export function CategoriesTree({ companyId, onCategorySelect, selectedCategoryId }: CategoriesTreeProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [parentForNew, setParentForNew] = useState<Category | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/categories?companyId=${companyId}`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.tree || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('خطأ في تحميل الفئات')
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (companyId) {
      fetchCategories()
    }
  }, [companyId, fetchCategories])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleAddCategory = (parent?: Category) => {
    setParentForNew(parent || null)
    setEditingCategory(null)
    setFormOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setParentForNew(null)
    setFormOpen(true)
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    try {
      const response = await fetch(
        `/api/categories?id=${categoryToDelete.id}&companyId=${companyId}`,
        { method: 'DELETE' }
      )
      const data = await response.json()
      if (data.success) {
        toast.success('تم حذف الفئة بنجاح')
        fetchCategories()
      } else {
        toast.error(data.error || 'خطأ في حذف الفئة')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('خطأ في حذف الفئة')
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingCategory(null)
    setParentForNew(null)
    fetchCategories()
  }

  const renderCategoryNode = (category: Category, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0
    const isExpanded = expandedIds.has(category.id)
    const isSelected = selectedCategoryId === category.id

    return (
      <div key={category.id} className="select-none">
        <div
          className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
            isSelected
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted/50'
          }`}
          style={{ paddingRight: `${depth * 16 + 8}px` }}
          onClick={() => onCategorySelect?.(category)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(category.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="h-6 w-6 shrink-0" />
          )}

          {/* Folder Icon */}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500 shrink-0" />
            )
          ) : (
            <Folder className="h-4 w-4 text-gray-400 shrink-0" />
          )}

          {/* Category Name */}
          <span className="flex-1 truncate text-right">
            {category.nameAr || category.name}
          </span>

          {/* Product Count Badge */}
          {category._count && (
            <Badge variant="secondary" className="text-xs shrink-0">
              <Package className="h-3 w-3 ml-1" />
              {category._count.products}
            </Badge>
          )}

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleAddCategory(category)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة فئة فرعية
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                <Pencil className="h-4 w-4 ml-2" />
                تعديل
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(category)}
                disabled={category._count?.children ? category._count.children > 0 : false}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-r-2 border-muted mr-4">
            {category.children!.map(child => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">الفئات</h3>
        <Button size="sm" onClick={() => handleAddCategory()}>
          <Plus className="h-4 w-4 ml-1" />
          إضافة
        </Button>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد فئات</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => handleAddCategory()}
              >
                إضافة فئة جديدة
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map(category => renderCategoryNode(category))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Category Form Dialog */}
      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        companyId={companyId}
        category={editingCategory}
        parentCategory={parentForNew}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف فئة &quot;{categoryToDelete?.nameAr || categoryToDelete?.name}&quot;؟
              {categoryToDelete?._count?.products && categoryToDelete._count.products > 0 && (
                <div className="mt-2 text-destructive">
                  تحذير: هذه الفئة تحتوي على {categoryToDelete._count.products} منتج.
                </div>
              )}
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
    </div>
  )
}
