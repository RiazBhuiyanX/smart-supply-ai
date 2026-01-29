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

export function InventoryPage() {
  const navigate = useNavigate()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const res = await fetch('http://localhost:8080/inventory')
      if (!res.ok) throw new Error('Failed to fetch inventory')
      const data = await res.json()
      setInventory(data.content || [])
    } catch (err) {
      setError('Failed to load inventory. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.available <= 0) return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-400' }
    if (item.quantity <= 10) return { label: 'Low Stock', color: 'bg-yellow-500/20 text-yellow-400' }
    return { label: 'In Stock', color: 'bg-green-500/20 text-green-400' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Inventory 📊</h1>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => navigate('/warehouses')}>
              View Warehouses
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Dashboard
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Stock Levels by Location</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400">Loading inventory...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : inventory.length === 0 ? (
              <p className="text-slate-400">No inventory items found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">SKU</TableHead>
                    <TableHead className="text-slate-300">Product</TableHead>
                    <TableHead className="text-slate-300">Warehouse</TableHead>
                    <TableHead className="text-slate-300 text-right">Quantity</TableHead>
                    <TableHead className="text-slate-300 text-right">Reserved</TableHead>
                    <TableHead className="text-slate-300 text-right">Available</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => {
                    const status = getStockStatus(item)
                    return (
                      <TableRow key={item.id} className="border-slate-700">
                        <TableCell className="text-white font-mono">{item.productSku}</TableCell>
                        <TableCell className="text-white">{item.productName}</TableCell>
                        <TableCell className="text-slate-400">{item.warehouseName}</TableCell>
                        <TableCell className="text-white text-right">{item.quantity}</TableCell>
                        <TableCell className="text-orange-400 text-right">{item.reserved}</TableCell>
                        <TableCell className="text-green-400 text-right font-medium">{item.available}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
