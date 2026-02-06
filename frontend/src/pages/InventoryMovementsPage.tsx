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
import { api } from '@/lib/api'

interface InventoryMovement {
  id: string
  productSku: string
  productName: string
  warehouseName: string
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER'
  quantity: number
  quantityBefore: number
  quantityAfter: number
  reason: string
  createdAt: string
}

export function InventoryMovementsPage() {
  const navigate = useNavigate()
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    try {
      const data = await api.get<{ content: InventoryMovement[] }>('/inventory-movements')
      setMovements(data.content || [])
    } catch (err) {
      setError('Failed to load movements. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type: InventoryMovement['movementType']) => {
    const styles: Record<string, string> = {
      IN: 'bg-green-500/20 text-green-400',
      OUT: 'bg-red-500/20 text-red-400',
      ADJUSTMENT: 'bg-yellow-500/20 text-yellow-400',
      TRANSFER: 'bg-blue-500/20 text-blue-400',
    }
    return styles[type] || styles.ADJUSTMENT
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Audit Trail 📝</h1>
          <div className="flex w-full sm:w-auto gap-3">
            <Button variant="secondary" onClick={() => navigate('/inventory')} className="flex-1 sm:flex-none">
              Inventory
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1 sm:flex-none">
              Dashboard
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Inventory Movements</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400">Loading movements...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : movements.length === 0 ? (
              <p className="text-slate-400">No movements recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Product</TableHead>
                    <TableHead className="text-slate-300">Warehouse</TableHead>
                    <TableHead className="text-slate-300 text-right">Qty</TableHead>
                    <TableHead className="text-slate-300 text-center">Before → After</TableHead>
                    <TableHead className="text-slate-300">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id} className="border-slate-700">
                      <TableCell className="text-slate-400 text-sm">
                        {new Date(movement.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadge(movement.movementType)}`}>
                          {movement.movementType}
                        </span>
                      </TableCell>
                      <TableCell className="text-white">
                        <span className="font-mono text-xs text-slate-500">{movement.productSku}</span>
                        <br />
                        {movement.productName}
                      </TableCell>
                      <TableCell className="text-slate-400">{movement.warehouseName}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        movement.movementType === 'IN' ? 'text-green-400' : 
                        movement.movementType === 'OUT' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {movement.movementType === 'IN' ? '+' : movement.movementType === 'OUT' ? '-' : '±'}
                        {movement.quantity}
                      </TableCell>
                      <TableCell className="text-center text-slate-400">
                        {movement.quantityBefore} → {movement.quantityAfter}
                      </TableCell>
                      <TableCell className="text-slate-500 max-w-xs truncate">
                        {movement.reason || '-'}
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
