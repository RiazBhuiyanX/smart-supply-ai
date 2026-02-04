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

interface Warehouse {
  id: string
  name: string
  location: string
  type: 'PHYSICAL' | 'VIRTUAL'
  capacity: number
}

interface WarehouseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouse?: Warehouse | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (warehouse: any) => void
}

export function WarehouseDialog({ open, onOpenChange, warehouse, onSave }: WarehouseDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'PHYSICAL' as 'PHYSICAL' | 'VIRTUAL',
    capacity: 10000,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        location: warehouse.location || '',
        type: warehouse.type || 'PHYSICAL',
        capacity: warehouse.capacity || 10000,
      })
    } else {
      setFormData({ name: '', location: '', type: 'PHYSICAL', capacity: 10000 })
    }
    setError('')
  }, [warehouse, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = warehouse
        ? `http://localhost:8080/warehouses/${warehouse.id}`
        : 'http://localhost:8080/warehouses'
      
      const res = await fetch(url, {
        method: warehouse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save warehouse')
      }

      const saved = await res.json()
      onSave(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save warehouse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{warehouse ? 'Edit Warehouse' : 'Add New Warehouse'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {warehouse ? 'Update warehouse details' : 'Create a new warehouse location'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Warehouse Name *</label>
            <Input
              name="name"
              placeholder="e.g., Sofia Central Warehouse"
              value={formData.name}
              onChange={handleChange}
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Location</label>
            <Input
              name="location"
              placeholder="e.g., Sofia, Bulgaria"
              value={formData.location}
              onChange={handleChange}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              <option value="PHYSICAL">Physical</option>
              <option value="VIRTUAL">Virtual</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Capacity (units)</label>
            <Input
              name="capacity"
              type="number"
              placeholder="10000"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              className="bg-slate-700 border-slate-600 text-white"
              min={1}
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : warehouse ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

