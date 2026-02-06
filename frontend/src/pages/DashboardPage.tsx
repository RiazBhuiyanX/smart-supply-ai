import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'


export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()


  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-500/10 text-purple-400 border-purple-500/20 ring-purple-500/20'
      case 'MANAGER': return 'bg-blue-500/10 text-blue-400 border-blue-500/20 ring-blue-500/20'
      case 'PROCUREMENT': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-emerald-500/20'
      case 'WAREHOUSE_OP': return 'bg-amber-500/10 text-amber-400 border-amber-500/20 ring-amber-500/20'
      default: return 'bg-slate-700 text-slate-300 border-slate-600'
    }
  }

  const cards = [
    { title: 'Products', desc: 'Manage your product catalog', path: '/products' },
    { title: 'Warehouses', desc: 'Manage storage locations', path: '/warehouses' },
    { title: 'Inventory', desc: 'Track stock levels', path: '/inventory' },
    { title: 'Suppliers', desc: 'Manage vendor directory', path: '/suppliers' },
    { title: 'Purchase Orders', desc: 'Manage procurement', path: '/purchase-orders' },
    { title: 'Audit Trail', desc: 'View inventory movements', path: '/inventory-movements' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">SmartSupply AI 📦</h1>
            {user && (
              <p className="text-slate-400 mt-2 flex items-center gap-2">
                <span>Welcome, {user.firstName} {user.lastName}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getRoleBadgeStyles(user.role)}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </p>
            )}
          </div>
          <div className="flex w-full sm:w-auto gap-4">
             <Button variant="destructive" onClick={handleLogout} className="flex-1 sm:flex-none">
              Logout
            </Button>

          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.path} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardHeader>
                <CardTitle className="text-white">{card.title}</CardTitle>
                <CardDescription className="text-slate-400">
                  {card.desc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => navigate(card.path)}
                >
                  View {card.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statistics Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Key Metrics 📊</h2>
          <DashboardStats />
        </div>
      </div>
    </div>
  )
}

function DashboardStats() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    api.get<any>('/statistics/dashboard')
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats', err))
  }, [])

  if (!stats) return <p className="text-slate-400">Loading statistics...</p>

  const StatCard = ({ title, value, subtext, color }: any) => (
    <Card className="bg-slate-800/40 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</div>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Top Row: Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Suppliers" value={stats.totalSuppliers} color="text-blue-400" />
        <StatCard title="Total Products" value={stats.totalProducts} color="text-purple-400" />
        <StatCard title="Warehouses" value={stats.totalWarehouses} color="text-yellow-400" />
        <StatCard title="Total Orders" value={stats.totalOrders} color="text-green-400" />
      </div>

      {/* Second Row: Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Best Supplier" 
          value={stats.bestSupplierName} 
          subtext={`Total Volume: €${stats.bestSupplierTotalAmount?.toFixed(2)}`}
          color="text-indigo-400"
        />
        <StatCard 
          title="Most Stocked Product" 
          value={stats.mostStockedProduct} 
          subtext={`Quantity: ${stats.mostStockedQuantity}`}
          color="text-emerald-400"
        />
        <StatCard 
          title="Least Stocked Product" 
          value={stats.leastStockedProduct} 
          subtext={`Quantity: ${stats.leastStockedQuantity}`}
          color="text-rose-400"
        />
      </div>
    </div>
  )
}
