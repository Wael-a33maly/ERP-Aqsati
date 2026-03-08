'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, Search, Edit, FileText, Users, Phone, 
  Loader2, AlertCircle 
} from 'lucide-react'
import { toast } from 'sonner'

const customerSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  nameAr: z.string().optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  nationalId: z.string().optional(),
  creditLimit: z.number().min(0).default(0),
  notes: z.string().optional(),
})

type CustomerForm = z.infer<typeof customerSchema>

interface Customer {
  id: string
  code: string
  name: string
  nameAr?: string | null
  phone?: string | null
  phone2?: string | null
  email?: string | null
  address?: string | null
  nationalId?: string | null
  creditLimit: number
  balance: number
  notes?: string | null
  active: boolean
}

export function CustomersList() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', { search, page }],
    queryFn: () => customersApi.list({ search, page, limit: 10 }),
  })

  const mutation = useMutation({
    mutationFn: (formData: CustomerForm) => {
      if (selectedCustomer) {
        return customersApi.update(selectedCustomer.id, formData)
      }
      return customersApi.create(formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(selectedCustomer ? 'Customer updated' : 'Customer created')
      setDialogOpen(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Operation failed')
    },
  })

  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      code: '', name: '', nameAr: '', phone: '', phone2: '', email: '',
      address: '', nationalId: '', creditLimit: 0, notes: '',
    },
  })

  const onSubmit = (data: CustomerForm) => mutation.mutate(data)

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    resetForm({
      code: customer.code, name: customer.name, nameAr: customer.nameAr || '',
      phone: customer.phone || '', phone2: customer.phone2 || '', email: customer.email || '',
      address: customer.address || '', nationalId: customer.nationalId || '',
      creditLimit: customer.creditLimit, notes: customer.notes || '',
    })
    setDialogOpen(true)
  }

  const openNewDialog = () => {
    setSelectedCustomer(null)
    resetForm()
    setDialogOpen(true)
  }

  const customers = data?.data?.customers || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Customers / العملاء</h2>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer / إضافة عميل
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code / الكود</Label>
                  <Input {...register('code')} placeholder="C001" />
                  {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Name / الاسم</Label>
                  <Input {...register('name')} placeholder="Customer name" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Arabic Name</Label>
                  <Input {...register('nameAr')} placeholder="اسم العميل" dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...register('phone')} placeholder="+966..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...register('email')} placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Credit Limit</Label>
                  <Input type="number" {...register('creditLimit', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...register('address')} placeholder="Full address" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedCustomer ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load customers</AlertDescription>
            </Alert>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mb-4" />
              <p>No customers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: Customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono">{customer.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        {customer.nameAr && <p className="text-sm text-muted-foreground">{customer.nameAr}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>
                      <span className={customer.balance > 0 ? 'text-red-600 font-medium' : ''}>
                        SAR {customer.balance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.active ? 'default' : 'secondary'}>
                        {customer.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
