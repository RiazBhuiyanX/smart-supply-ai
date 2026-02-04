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

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierName: string
  status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED'
  totalAmount: number
  expectedDate: string
  createdAt: string
}

export function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:8080/purchase-orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data.content || [])
    } catch (err) {
      setError('Failed to load orders. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-slate-500/20 text-slate-400',
      SENT: 'bg-blue-500/20 text-blue-400',
      RECEIVED: 'bg-green-500/20 text-green-400',
      CANCELLED: 'bg-red-500/20 text-red-400',
    }
    return styles[status] || styles.DRAFT
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Purchase Orders 📋</h1>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => navigate('/suppliers')}>
              View Suppliers
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Dashboard
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400">Loading orders...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : orders.length === 0 ? (
              <p className="text-slate-400">No purchase orders found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Order #</TableHead>
                    <TableHead className="text-slate-300">Supplier</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300 text-right">Total</TableHead>
                    <TableHead className="text-slate-300">Expected Date</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-slate-700">
                      <TableCell className="text-white font-mono">{order.orderNumber}</TableCell>
                      <TableCell className="text-slate-400">{order.supplierName}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-green-400 text-right font-medium">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {order.expectedDate || '-'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
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
