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
import { SupplierDialog } from '@/components/SupplierDialog'
import { useAuth } from '@/contexts/AuthContext'
import { getPermissions } from '@/lib/permissions'

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
  const { user } = useAuth()
  const permissions = getPermissions(user?.role)
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchSuppliers = async (search: string = '') => {
    try {
      setLoading(true)
      const url = search 
        ? `http://localhost:8080/suppliers/search?query=${encodeURIComponent(search)}`
        : 'http://localhost:8080/suppliers'
      const res = await fetch(url)
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
    if (!permissions.canManageSuppliers) {
      alert('You do not have permission to add suppliers.')
      return
    }
    setEditingSupplier(null)
    setDialogOpen(true)
  }

  const handleEdit = (supplier: Supplier) => {
    if (!permissions.canManageSuppliers) {
      alert('You do not have permission to edit suppliers.')
      return
    }
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
    if (!permissions.canManageSuppliers) {
      alert('You do not have permission to delete suppliers.')
      return
    }
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
          <div>
            <h1 className="text-4xl font-bold text-white">Suppliers 🤝</h1>
            <p className="text-slate-400 text-sm mt-1">
              Role: <span className="text-blue-400">{user?.role || 'Unknown'}</span>
            </p>
          </div>
          <div className="flex gap-4">
            {permissions.canManageSuppliers && (
              <Button onClick={handleAddNew}>+ Add Supplier</Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>
              View Orders
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Dashboard
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-white">Vendor Directory</CardTitle>
            <Input
              placeholder="Search suppliers by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400">Loading suppliers...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No suppliers found.</p>
                {permissions.canManageSuppliers && (
                  <Button onClick={handleAddNew}>Add your first supplier</Button>
                )}
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
                    {permissions.canManageSuppliers && (
                      <TableHead className="text-slate-300 text-center">Actions</TableHead>
                    )}
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
                      {permissions.canManageSuppliers && (
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
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {permissions.canManageSuppliers && (
        <SupplierDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          supplier={editingSupplier}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
