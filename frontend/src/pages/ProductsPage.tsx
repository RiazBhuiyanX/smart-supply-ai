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

interface Product {
  id: string
  sku: string
  name: string
  category: string
  price: number
  safetyStock: number
}

export function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Products 📦</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back to Dashboard
          </Button>
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
              <p className="text-slate-400">No products found. Add some via the API!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">SKU</TableHead>
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Category</TableHead>
                    <TableHead className="text-slate-300 text-right">Price</TableHead>
                    <TableHead className="text-slate-300 text-right">Safety Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="border-slate-700">
                      <TableCell className="text-white font-mono">{product.sku}</TableCell>
                      <TableCell className="text-white">{product.name}</TableCell>
                      <TableCell className="text-slate-400">{product.category}</TableCell>
                      <TableCell className="text-green-400 text-right">
                        ${product.price?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-slate-400 text-right">
                        {product.safetyStock}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
