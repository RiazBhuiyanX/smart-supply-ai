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
import { SupplierDialog } from '@/components/SupplierDialog'

interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  address: string
  contactPerson: string
  createdAt?: string
}

export function SuppliersPage() {
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('http://localhost:8080/suppliers')
      if (!res.ok) throw new Error('Failed to fetch suppliers')
      const data = await res.json()
      setSuppliers(data || [])
    } catch (err) {
      setError('Failed to load suppliers. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingSupplier(null)
    setDialogOpen(true)
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setDialogOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (data: any) => {
    const saved = data as Supplier
    if (editingSupplier) {
      setSuppliers(suppliers.map(s => s.id === saved.id ? saved : s))
    } else {
      setSuppliers([saved, ...suppliers])
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return
    
    try {
      const res = await fetch(`http://localhost:8080/suppliers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setSuppliers(suppliers.filter(s => s.id !== id))
    } catch (err) {
      alert('Failed to delete supplier')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Suppliers 🤝</h1>
          <div className="flex gap-4">
            <Button onClick={handleAddNew}>+ Add Supplier</Button>
            <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>
              View Orders
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Dashboard
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Vendor Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400">Loading suppliers...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No suppliers found.</p>
                <Button onClick={handleAddNew}>Add your first supplier</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Contact Person</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Phone</TableHead>
                    <TableHead className="text-slate-300">Address</TableHead>
                    <TableHead className="text-slate-300 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">{supplier.name}</TableCell>
                      <TableCell className="text-slate-400">{supplier.contactPerson || '-'}</TableCell>
                      <TableCell className="text-blue-400">{supplier.email || '-'}</TableCell>
                      <TableCell className="text-slate-400">{supplier.phone || '-'}</TableCell>
                      <TableCell className="text-slate-400 max-w-xs truncate">{supplier.address || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editingSupplier}
        onSave={handleSave}
      />
    </div>
  )
}
