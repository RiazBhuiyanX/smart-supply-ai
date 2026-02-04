import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProductDialog } from '@/components/ProductDialog'
import { useAuth } from '@/contexts/AuthContext'
import { getPermissions } from '@/lib/permissions'

interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  price: number
  minStockLevel: number
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

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:8080/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data.content || [])
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
    }
  }

  const handleDelete = async (id: string) => {
    if (!permissions.canDeleteProducts) {
      alert('You do not have permission to delete products.')
      return
    }
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const res = await fetch(`http://localhost:8080/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      alert('Failed to delete product')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Products 📦</h1>
            <p className="text-slate-400 text-sm mt-1">
              Role: <span className="text-blue-400">{user?.role || 'Unknown'}</span>
            </p>
          </div>
          <div className="flex gap-4">
            {permissions.canCreateProducts && (
              <Button onClick={handleAddNew}>+ Add Product</Button>
            )}
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Dashboard
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Product Catalog</CardTitle>
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
                        ${product.price?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-slate-400 text-right">
                        {product.minStockLevel}
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
