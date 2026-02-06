import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'

interface Product {
  id?: string
  name: string
  sku: string
  description: string
  price: number
  safetyStock: number
  category: string
}

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (product: any) => void
}

export function ProductDialog({ open, onOpenChange, product, onSave }: ProductDialogProps) {
  const [formData, setFormData] = useState<Product>({
    name: '',
    sku: '',
    description: '',
    price: 0,
    safetyStock: 10,
    category: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (product) {
      setFormData(product)
    } else {
      setFormData({
        name: '',
        sku: '',
        description: '',
        price: 0,
        safetyStock: 10,
        category: '',
      })
    }
  }, [product, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = product?.id 
        ? `/products/${product.id}`
        : '/products'
      
      const saved = product?.id 
        ? await api.put(url, formData)
        : await api.post(url, formData)

      // api client throws on error automatically
      onSave(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {product?.id ? 'Edit Product' : 'Add Product'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {product?.id ? 'Update product details' : 'Create a new product'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">SKU *</label>
              <Input
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400">Description</label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-400">Price *</label>
              <Input
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Min Stock</label>
              <Input
                name="safetyStock"
                type="number"
                value={formData.safetyStock}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Category</label>
              <Input
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
