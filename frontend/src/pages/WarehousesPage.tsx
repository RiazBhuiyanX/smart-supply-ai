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
import { WarehouseDialog } from '@/components/WarehouseDialog'
import { useAuth } from '@/contexts/AuthContext'
import { getPermissions } from '@/lib/permissions'
import { api } from '@/lib/api'

interface Warehouse {
  id: string
  name: string
  location: string
  capacity: number
  type: 'PHYSICAL' | 'VIRTUAL'
}

export function WarehousesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const permissions = getPermissions(user?.role)
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWarehouses(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchWarehouses = async (search: string = '') => {
    try {
      setLoading(true)
      const url = search 
        ? `/warehouses?search=${encodeURIComponent(search)}`
        : '/warehouses'
      const data = await api.get<Warehouse[]>(url)
      setWarehouses(data || [])
    } catch (err) {
      setError('Failed to load warehouses. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    if (!permissions.canManageWarehouses) {
      alert('You do not have permission to add warehouses.')
      return
    }
    setEditingWarehouse(null)
    setDialogOpen(true)
  }

  const handleEdit = (warehouse: Warehouse) => {
    if (!permissions.canManageWarehouses) {
      alert('You do not have permission to edit warehouses.')
      return
    }
    setEditingWarehouse(warehouse)
    setDialogOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (data: any) => {
    const saved = data as Warehouse
    if (editingWarehouse) {
      setWarehouses(warehouses.map(w => w.id === saved.id ? saved : w))
    } else {
      setWarehouses([saved, ...warehouses])
    }
  }

  const handleDelete = async (id: string) => {
    if (!permissions.canManageWarehouses) {
      alert('You do not have permission to delete warehouses.')
      return
    }
    if (!confirm('Are you sure you want to delete this warehouse?')) return
    
    try {
      await api.delete(`/warehouses/${id}`)
      setWarehouses(warehouses.filter(w => w.id !== id))
    } catch (err) {
      alert('Failed to delete warehouse')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Warehouses 🏭</h1>
            <p className="text-slate-400 text-sm mt-1">
              Role: <span className="text-blue-400">{user?.role || 'Unknown'}</span>
            </p>
          </div>
          <div className="flex gap-4">
            {permissions.canManageWarehouses && (
              <Button onClick={handleAddNew}>+ Add Warehouse</Button>
            )}
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Back to Dashboard
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-white">Storage Locations</CardTitle>
            <Input
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400">Loading warehouses...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : warehouses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No warehouses found.</p>
                {permissions.canManageWarehouses && (
                  <Button onClick={handleAddNew}>Create your first warehouse</Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Location</TableHead>
                    <TableHead className="text-slate-300">Capacity</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    {permissions.canManageWarehouses && (
                      <TableHead className="text-slate-300 text-center">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">{warehouse.name}</TableCell>
                      <TableCell className="text-slate-400">{warehouse.location || '-'}</TableCell>
                      <TableCell className="text-slate-400">{warehouse.capacity?.toLocaleString() || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          warehouse.type === 'PHYSICAL' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {warehouse.type}
                        </span>
                      </TableCell>
                      {permissions.canManageWarehouses && (
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(warehouse)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(warehouse.id)}
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

      {permissions.canManageWarehouses && (
        <WarehouseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          warehouse={editingWarehouse}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
