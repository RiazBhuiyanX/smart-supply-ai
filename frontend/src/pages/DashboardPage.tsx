import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          SmartSupply AI 📦
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Products</CardTitle>
              <CardDescription className="text-slate-400">
                Manage your product catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => navigate('/products')}
              >
                View Products
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Warehouses</CardTitle>
              <CardDescription className="text-slate-400">
                Manage storage locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => navigate('/warehouses')}
              >
                View Warehouses
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Inventory</CardTitle>
              <CardDescription className="text-slate-400">
                Track stock levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => navigate('/inventory')}
              >
                View Inventory
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Authentication</CardTitle>
              <CardDescription className="text-slate-400">
                Login to access all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
