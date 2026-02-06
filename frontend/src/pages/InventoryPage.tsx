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
import { PaginationControls } from '@/components/ui/pagination-controls'
import { StockAdjustmentDialog } from '@/components/StockAdjustmentDialog'
import { useAuth } from '@/contexts/AuthContext'
import { getPermissions } from '@/lib/permissions'
import { api } from '@/lib/api'

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
  const { user } = useAuth()
  const permissions = getPermissions(user?.role)
  
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  
  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset to page 0 when search queries change, but not on initial load if we want to keep page? 
      // Actually usually valid to reset page on search change.
      if (page !== 0 && searchQuery) {
        setPage(0)
      } else {
        fetchInventory()
      }
    }, 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, page, pageSize])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
      })
      
      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }

      const url = `/inventory?${queryParams.toString()}`
      const data = await api.get<{ content: InventoryItem[], totalPages: number, totalElements: number }>(url)
      
      // Spring Data Page interface: content, totalPages, totalElements, number (current page)
      setInventory(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
    } catch (err) {
      setError('Failed to load inventory. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustClick = (item: InventoryItem) => {
    if (!permissions.canAdjustStock) {
      alert('You do not have permission to adjust stock.')
      return
    }
    setSelectedItem(item)
    setAdjustDialogOpen(true)
  }

  const handleAdjustComplete = (updatedItem: InventoryItem) => {
    setInventory(inventory.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ))
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.available <= 0) return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-400' }
    if (item.quantity <= 10) return { label: 'Low Stock', color: 'bg-yellow-500/20 text-yellow-400' }
    return { label: 'In Stock', color: 'bg-green-500/20 text-green-400' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Inventory 📊</h1>
            <p className="text-slate-400 text-sm mt-1">
              Role: <span className="text-blue-400">{user?.role || 'Unknown'}</span>
              {permissions.canAdjustStock && (
                <span className="text-green-400 ml-2">• Can adjust stock</span>
              )}
            </p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <Button variant="secondary" onClick={() => navigate('/warehouses')} className="flex-1 sm:flex-none">
              View Warehouses
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1 sm:flex-none">
              Dashboard
            </Button>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
            <CardTitle className="text-white">Stock Levels by Location</CardTitle>
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0) // Reset to first page on search
              }}
              className="max-w-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400">Loading inventory...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : inventory.length === 0 ? (
              <p className="text-slate-400">No inventory items found.</p>
            ) : (
              <>
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
                      {permissions.canAdjustStock && (
                        <TableHead className="text-slate-300 text-center">Actions</TableHead>
                      )}
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
                          {permissions.canAdjustStock && (
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAdjustClick(item)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                Adjust
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                <PaginationControls
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalElements={totalElements}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size)
                    setPage(0)
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <StockAdjustmentDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        inventoryItem={selectedItem}
        onAdjust={handleAdjustComplete}
      />
    </div>
  )
}
