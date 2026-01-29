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

interface Warehouse {
  id: string
  name: string
  location: string
  type: 'PHYSICAL' | 'VIRTUAL'
}

export function WarehousesPage() {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('http://localhost:8080/warehouses')
      if (!res.ok) throw new Error('Failed to fetch warehouses')
      const data = await res.json()
      setWarehouses(data || [])
    } catch (err) {
      setError('Failed to load warehouses. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Warehouses 🏭</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back to Dashboard
          </Button>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Storage Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400">Loading warehouses...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : warehouses.length === 0 ? (
              <p className="text-slate-400">No warehouses found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Location</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">{warehouse.name}</TableCell>
                      <TableCell className="text-slate-400">{warehouse.location}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          warehouse.type === 'PHYSICAL' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {warehouse.type}
                        </span>
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
