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
import { ReceiveItemsDialog } from '@/components/ReceiveItemsDialog'
import { useAuth } from '@/contexts/AuthContext'
import { getPermissions } from '@/lib/permissions'

interface PurchaseOrderItem {
  id: string
  productId: string
  productSku: string
  productName: string
  quantityOrdered: number
  quantityReceived: number
  unitPrice: number
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  totalAmount: number
  expectedDate: string
  createdAt: string
  items: PurchaseOrderItem[]
}

export function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const permissions = getPermissions(user?.role)
  
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)

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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:8080/purchase-orders/${orderId}/status?status=${newStatus}`, {
        method: 'PATCH'
      })
      if (!res.ok) throw new Error('Failed to update status')
      fetchOrders()
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const handleReceive = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setReceiveDialogOpen(true)
  }

  const handleReceived = () => {
    fetchOrders()
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm('Delete this purchase order?')) return
    try {
      const res = await fetch(`http://localhost:8080/purchase-orders/${orderId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete')
      }
      fetchOrders()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete order')
    }
  }

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-slate-500/20 text-slate-400',
      SUBMITTED: 'bg-yellow-500/20 text-yellow-400',
      APPROVED: 'bg-purple-500/20 text-purple-400',
      ORDERED: 'bg-blue-500/20 text-blue-400',
      PARTIALLY_RECEIVED: 'bg-orange-500/20 text-orange-400',
      RECEIVED: 'bg-green-500/20 text-green-400',
      CANCELLED: 'bg-red-500/20 text-red-400',
    }
    return styles[status] || styles.DRAFT
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const getNextAction = (order: PurchaseOrder) => {
    const canManage = permissions.canManageOrders
    
    switch (order.status) {
      case 'DRAFT':
        return (
          <div className="flex gap-1">
            {canManage && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(order.id, 'SUBMITTED')}>
                  Submit
                </Button>
                <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(order.id)}>
                  Delete
                </Button>
              </>
            )}
          </div>
        )
      case 'SUBMITTED':
        return canManage ? (
          <Button size="sm" onClick={() => handleStatusChange(order.id, 'APPROVED')}>
            Approve
          </Button>
        ) : null
      case 'APPROVED':
        return canManage ? (
          <Button size="sm" onClick={() => handleStatusChange(order.id, 'ORDERED')}>
            Mark Ordered
          </Button>
        ) : null
      case 'ORDERED':
      case 'PARTIALLY_RECEIVED':
        return (
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleReceive(order)}>
            📦 Receive
          </Button>
        )
      case 'RECEIVED':
        return <span className="text-green-400 text-xs">✓ Complete</span>
      case 'CANCELLED':
        return <span className="text-red-400 text-xs">Cancelled</span>
      default:
        return null
    }
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

        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'].map(status => {
            const count = orders.filter(o => o.status === status).length
            return (
              <Card key={status} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className={`text-xs ${getStatusBadge(status as PurchaseOrder['status']).split(' ')[1]}`}>
                    {status.replace('_', ' ')}
                  </p>
                </CardContent>
              </Card>
            )
          })}
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
                    <TableHead className="text-slate-300">Expected</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                    <TableHead className="text-slate-300 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-slate-700">
                      <TableCell className="text-white font-mono">{order.orderNumber}</TableCell>
                      <TableCell className="text-slate-400">{order.supplierName}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {order.status.replace('_', ' ')}
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
                      <TableCell className="text-center">
                        {getNextAction(order)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ReceiveItemsDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        purchaseOrder={selectedOrder}
        onReceive={handleReceived}
      />
    </div>
  )
}

