import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { WarehousesPage } from '@/pages/WarehousesPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { SuppliersPage } from '@/pages/SuppliersPage'
import { PurchaseOrdersPage } from '@/pages/PurchaseOrdersPage'
import { InventoryMovementsPage } from '@/pages/InventoryMovementsPage'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute><ProductsPage /></ProtectedRoute>
          } />
          <Route path="/warehouses" element={
            <ProtectedRoute><WarehousesPage /></ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute><InventoryPage /></ProtectedRoute>
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute><SuppliersPage /></ProtectedRoute>
          } />
          <Route path="/purchase-orders" element={
            <ProtectedRoute><PurchaseOrdersPage /></ProtectedRoute>
          } />
          <Route path="/inventory-movements" element={
            <ProtectedRoute><InventoryMovementsPage /></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
