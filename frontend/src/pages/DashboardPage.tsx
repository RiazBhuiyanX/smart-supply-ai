import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const navigate = useNavigate()

  const cards = [
    { title: 'Products', desc: 'Manage your product catalog', path: '/products', color: 'secondary' },
    { title: 'Warehouses', desc: 'Manage storage locations', path: '/warehouses', color: 'secondary' },
    { title: 'Inventory', desc: 'Track stock levels', path: '/inventory', color: 'secondary' },
    { title: 'Suppliers', desc: 'Manage vendor directory', path: '/suppliers', color: 'secondary' },
    { title: 'Purchase Orders', desc: 'Manage procurement', path: '/purchase-orders', color: 'secondary' },
    { title: 'Audit Trail', desc: 'View inventory movements', path: '/inventory-movements', color: 'secondary' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">SmartSupply AI 📦</h1>
          <Button variant="default" onClick={() => navigate('/login')}>
            Login
          </Button>
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
      </div>
    </div>
  )
}
