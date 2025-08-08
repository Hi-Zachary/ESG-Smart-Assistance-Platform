import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/lib/auth-context'
import ProtectedRoute from '@/components/protected-route'
import Sidebar from '@/components/sidebar'
import Dashboard from '@/pages/dashboard'
import TextAnalysis from '@/pages/text-analysis'
import ComplianceCheck from '@/pages/compliance-check'
import DataVisualization from '@/pages/data-visualization'
import History from '@/pages/history'
import Login from '@/pages/login'
import Register from '@/pages/register'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 受保护路由 */}
            <Route path="/*" element={
              <ProtectedRoute>
                <>
                  <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
                  <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/analysis" element={<TextAnalysis />} />
                        <Route path="/compliance" element={<ComplianceCheck />} />
                        <Route path="/visualization" element={<DataVisualization />} />
                        <Route path="/history" element={<History />} />
                      </Routes>
                    </main>
                  </div>
                </>
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App