import { useState } from 'react'
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

interface InventoryItem {
  id: string
  productId: string
  productSku: string
  productName: string
  warehouseId: string
  warehouseName: string
  quantity: number
  reserved: number
  available: number
  lastUpdated: string
}

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventoryItem: InventoryItem | null
  onAdjust: (updatedItem: InventoryItem) => void
}

export function StockAdjustmentDialog({ 
  open, 
  onOpenChange, 
  inventoryItem, 
  onAdjust 
}: StockAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<'SET' | 'ADD' | 'REMOVE'>('ADD')
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculateNewQuantity = () => {
    if (!inventoryItem) return 0
    switch (adjustmentType) {
      case 'SET': return amount
      case 'ADD': return inventoryItem.quantity + amount
      case 'REMOVE': return Math.max(0, inventoryItem.quantity - amount)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inventoryItem) return
    
    setLoading(true)
    setError('')

    try {
      const newQuantity = calculateNewQuantity()
      
      const updated = await api.post<InventoryItem>(`/inventory/${inventoryItem.id}/adjust`, {
        newQuantity,
        reason: reason || `Stock ${adjustmentType.toLowerCase()}: ${amount} units`,
      })

      onAdjust(updated)
      onOpenChange(false)
      
      // Reset form
      setAmount(0)
      setReason('')
      setAdjustmentType('ADD')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock')
    } finally {
      setLoading(false)
    }
  }

  if (!inventoryItem) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Adjust Stock 📦</DialogTitle>
          <DialogDescription className="text-slate-400">
            {inventoryItem.productName} @ {inventoryItem.warehouseName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-slate-400 text-sm">Current</p>
                <p className="text-2xl font-bold text-white">{inventoryItem.quantity}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Reserved</p>
                <p className="text-2xl font-bold text-yellow-400">{inventoryItem.reserved}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Available</p>
                <p className="text-2xl font-bold text-green-400">
                  {inventoryItem.quantity - inventoryItem.reserved}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ADD', 'REMOVE', 'SET'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAdjustmentType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    adjustmentType === type
                      ? type === 'ADD' 
                        ? 'bg-green-600 text-white'
                        : type === 'REMOVE'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {type === 'ADD' ? '+ Add' : type === 'REMOVE' ? '- Remove' : '= Set'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              {adjustmentType === 'SET' ? 'New Quantity' : 'Amount'}
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600 text-white text-lg"
              min={0}
              required
            />
          </div>

          <div className="bg-slate-900/50 p-3 rounded-lg">
            <p className="text-slate-400 text-sm">New Quantity</p>
            <p className="text-3xl font-bold text-blue-400">{calculateNewQuantity()}</p>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Reason (optional)</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Physical count correction"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-white bg-slate-700 hover:bg-slate-600"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || amount === 0}>
              {loading ? 'Saving...' : 'Confirm Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
