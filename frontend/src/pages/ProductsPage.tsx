import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { ProductDialog } from '@/components/ProductDialog'
import { useAuth } from '@/contexts/AuthContext'
import { getPermissions } from '@/lib/permissions'
import { api } from '@/lib/api'

interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  price: number
  safetyStock: number
}

export function ProductsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const permissions = getPermissions(user?.role)
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset to page 0 when search changes
      if (page !== 0 && searchQuery) {
        setPage(0)
      } else {
        fetchProducts()
      }
    }, 300) // Debounce 300ms
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page, pageSize])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
      })
      
      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }

      const url = `/products?${queryParams.toString()}`
      const data = await api.get<{ content: Product[], totalPages: number, totalElements: number }>(url)
      
      setProducts(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setError('Failed to load products. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    if (!permissions.canCreateProducts) {
      alert('You do not have permission to create products.')
      return
    }
    setEditingProduct(null)
    setDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    if (!permissions.canEditProducts) {
      alert('You do not have permission to edit products.')
      return
    }
    setEditingProduct(product)
    setDialogOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (data: any) => {
    const saved = data as Product
    if (editingProduct) {
      setProducts(products.map(p => p.id === saved.id ? saved : p))
    } else {
      setProducts([saved, ...products])
      // Ideally re-fetch or handle pagination update
      if (products.length >= pageSize) {
        // If page is full, maybe fetch again or just let it be hidden until refresh
        fetchProducts() 
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!permissions.canDeleteProducts) {
      alert('You do not have permission to delete products.')
      return
    }
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await api.delete(`/products/${id}`)
      setProducts(products.filter(p => p.id !== id))
      // Refetch if page becomes empty?
      if (products.length === 1 && page > 0) {
        setPage(page - 1)
      } else {
        fetchProducts() // Refresh to fill up the page
      }
    } catch (err) {
      alert('Failed to delete product')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Products 📦</h1>
            <p className="text-slate-400 text-sm mt-1">
              Role: <span className="text-blue-400">{user?.role || 'Unknown'}</span>
            </p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            {permissions.canCreateProducts && (
              <Button onClick={handleAddNew} className="flex-1 sm:flex-none">+ Add</Button>
            )}
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1 sm:flex-none">
              Dashboard
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
            <CardTitle className="text-white">Product Catalog</CardTitle>
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              className="max-w-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400">Loading products...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No products found.</p>
                {permissions.canCreateProducts && (
                  <Button onClick={handleAddNew}>Create your first product</Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">SKU</TableHead>
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Category</TableHead>
                      <TableHead className="text-slate-300 text-right">Price</TableHead>
                      <TableHead className="text-slate-300 text-right">Min Stock</TableHead>
                      {(permissions.canEditProducts || permissions.canDeleteProducts) && (
                        <TableHead className="text-slate-300 text-center">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="border-slate-700">
                        <TableCell className="text-white font-mono">{product.sku}</TableCell>
                        <TableCell className="text-white">{product.name}</TableCell>
                        <TableCell className="text-slate-400">{product.category || '-'}</TableCell>
                        <TableCell className="text-green-400 text-right">
                          €{product.price?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-slate-400 text-right">
                          {product.safetyStock || '-'}
                        </TableCell>
                        {(permissions.canEditProducts || permissions.canDeleteProducts) && (
                          <TableCell className="text-center">
                            {permissions.canEditProducts && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                Edit
                              </Button>
                            )}
                            {permissions.canDeleteProducts && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                Delete
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <PaginationControls
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalElements={totalElements}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(0)
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {permissions.canCreateProducts && (
        <ProductDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={editingProduct}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
