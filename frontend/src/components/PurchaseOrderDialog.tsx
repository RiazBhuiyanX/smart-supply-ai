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

interface Supplier {
  id: string
  name: string
}

interface Product {
  id: string
  sku: string
  name: string
  price: number
}

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

interface PurchaseOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (order: any) => void
}

export function PurchaseOrderDialog({ open, onOpenChange, onSave }: PurchaseOrderDialogProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (open) {
      fetchSuppliers()
      fetchProducts()
      setSelectedSupplier('')
      setExpectedDate('')
      setItems([])
      setError('')
    }
  }, [open])

  const fetchSuppliers = async () => {
    try {
      const data = await api.get<Supplier[]>('/suppliers')
      setSuppliers(data)
    } catch (err) {
      console.error('Failed to fetch suppliers', err)
    }
  }

  const fetchProducts = async () => {
    try {
      const data = await api.get<{ content: Product[] } | Product[]>('/products')
      // Handle both paginated and list responses just in case
      // @ts-ignore
      setProducts(data.content || data || [])
    } catch (err) {
      console.error('Failed to fetch products', err)
    }
  }

  const handleAddItem = () => {
    if (!selectedProduct) return
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    if (items.some(i => i.productId === product.id)) {
      setError('Product already added')
      return
    }

    setItems([...items, {
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      unitPrice: product.price
    }])
    
    setSelectedProduct('')
    setQuantity(1)
    setError('')
  }

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplier || items.length === 0) {
      setError('Please select a supplier and add at least one item')
      return
    }

    setLoading(true)
    setError('')

    try {
      const created = await api.post('/purchase-orders', {
        supplierId: selectedSupplier,
        expectedDate: expectedDate || null,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        }))
      })

      onSave(created)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order 📝</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new order to replenish inventory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Supplier */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Supplier *</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full h-10 px-3 bg-slate-700 border border-slate-600 rounded-md text-white"
              required
            >
              <option value="">Select supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Expected Date */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Expected Date</label>
            <Input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full h-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>

          {/* Add Item */}
          <div className="bg-slate-900/50 p-3 rounded-lg space-y-2">
            <label className="text-sm text-slate-400 block">Add Item</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full h-10 px-3 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
            >
              <option value="">Select product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="flex-1 h-10 bg-slate-700 border-slate-600 text-white"
                placeholder="Quantity"
              />
              <Button type="button" onClick={handleAddItem} disabled={!selectedProduct} className="h-10">
                + Add
              </Button>
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.productId} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{item.productName}</p>
                    <p className="text-slate-500 text-xs">
                      {item.quantity} × ${item.unitPrice.toFixed(2)} = <span className="text-green-400">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-400 ml-2 shrink-0"
                    onClick={() => handleRemoveItem(item.productId)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <div className="text-right pt-2 border-t border-slate-700">
                <span className="text-slate-400">Total: </span>
                <span className="text-green-400 font-bold text-lg">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4 text-sm">No items added yet</p>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
