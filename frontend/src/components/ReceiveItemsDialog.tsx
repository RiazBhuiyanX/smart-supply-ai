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

interface PurchaseOrderItem {
  id: string
  productId: string
  productSku: string
  productName: string
  quantityOrdered: number
  quantityReceived: number
  unitPrice: number
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierName: string
  status: string
  items: PurchaseOrderItem[]
}

interface Warehouse {
  id: string
  name: string
  location: string
}

interface ReceiveItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrder: PurchaseOrder | null
  onReceive: (updatedOrder: PurchaseOrder) => void
}

export function ReceiveItemsDialog({ 
  open, 
  onOpenChange, 
  purchaseOrder, 
  onReceive 
}: ReceiveItemsDialogProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [receivingQuantities, setReceivingQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      fetchWarehouses()
      // Reset quantities
      if (purchaseOrder) {
        const initial: Record<string, number> = {}
        purchaseOrder.items.forEach(item => {
          const remaining = item.quantityOrdered - item.quantityReceived
          initial[item.id] = remaining > 0 ? remaining : 0
        })
        setReceivingQuantities(initial)
      }
    }
  }, [open, purchaseOrder])

  const fetchWarehouses = async () => {
    try {
      const data = await api.get<Warehouse[]>('/warehouses')
      setWarehouses(data || [])
      if (data.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(data[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch warehouses', err)
    }
  }

  const handleQuantityChange = (itemId: string, value: number) => {
    setReceivingQuantities(prev => ({ ...prev, [itemId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchaseOrder || !selectedWarehouse) return

    setLoading(true)
    setError('')

    try {
      // Filter items that have quantity to receive
      const itemsToReceive = Object.entries(receivingQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, qty]) => ({
          purchaseOrderItemId: itemId,
          quantityReceived: qty
        }))

      if (itemsToReceive.length === 0) {
        throw new Error('Please enter quantity for at least one item')
      }

      const updated = await api.post<PurchaseOrder>(`/purchase-orders/${purchaseOrder.id}/receive`, {
        warehouseId: selectedWarehouse,
        items: itemsToReceive
      })

      onReceive(updated)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to receive items')
    } finally {
      setLoading(false)
    }
  }

  if (!purchaseOrder) return null

  const totalReceiving = Object.values(receivingQuantities).reduce((sum, qty) => sum + qty, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receive Items 📦</DialogTitle>
          <DialogDescription className="text-slate-400">
            {purchaseOrder.orderNumber} from {purchaseOrder.supplierName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Receive into Warehouse *</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              required
            >
              <option value="">Select warehouse...</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name} - {wh.location}</option>
              ))}
            </select>
          </div>

          <div className="bg-slate-900/50 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left p-3 text-slate-300">Product</th>
                  <th className="text-center p-3 text-slate-300">Ordered</th>
                  <th className="text-center p-3 text-slate-300">Already Received</th>
                  <th className="text-center p-3 text-slate-300">Receive Now</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrder.items.map(item => {
                  const remaining = item.quantityOrdered - item.quantityReceived
                  const isFullyReceived = remaining <= 0
                  return (
                    <tr key={item.id} className={`border-t border-slate-700 ${isFullyReceived ? 'opacity-50' : ''}`}>
                      <td className="p-3">
                        <div className="text-white font-medium">{item.productName}</div>
                        <div className="text-slate-500 text-xs">{item.productSku}</div>
                      </td>
                      <td className="p-3 text-center text-slate-400">{item.quantityOrdered}</td>
                      <td className="p-3 text-center">
                        <span className={item.quantityReceived > 0 ? 'text-green-400' : 'text-slate-500'}>
                          {item.quantityReceived}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isFullyReceived ? (
                          <span className="text-green-400 text-xs">✓ Complete</span>
                        ) : (
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            value={receivingQuantities[item.id] || 0}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 text-center bg-slate-700 border-slate-600 text-white mx-auto"
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
            <p className="text-slate-400 text-sm">Total items to receive</p>
            <p className="text-3xl font-bold text-blue-400">{totalReceiving}</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-white"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || totalReceiving === 0}>
              {loading ? 'Processing...' : `Receive ${totalReceiving} Items`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
