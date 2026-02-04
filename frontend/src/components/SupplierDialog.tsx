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

interface Supplier {
  id?: string
  name: string
  email: string
  phone: string
  address: string
  contactPerson: string
}

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: Supplier | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (supplier: any) => void
}

export function SupplierDialog({ open, onOpenChange, supplier, onSave }: SupplierDialogProps) {
  const [formData, setFormData] = useState<Supplier>({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (supplier) {
      setFormData(supplier)
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: '',
      })
    }
  }, [supplier, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = supplier?.id 
        ? `http://localhost:8080/suppliers/${supplier.id}`
        : 'http://localhost:8080/suppliers'
      
      const response = await fetch(url, {
        method: supplier?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save supplier')
      
      const saved = await response.json()
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
            {supplier?.id ? 'Edit Supplier' : 'Add Supplier'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {supplier?.id ? 'Update supplier details' : 'Add a new vendor'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">Company Name *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Contact Person</label>
              <Input
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Email *</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Phone</label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Address</label>
              <Input
                name="address"
                value={formData.address}
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
