import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Sidebar from '@/components/sidebar'
import Dashboard from '@/pages/dashboard'
import TextAnalysis from '@/pages/text-analysis'
import ComplianceCheck from '@/pages/compliance-check'
import DataVisualization from '@/pages/data-visualization'
import History from '@/pages/history'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
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
        <Toaster />
      </div>
    </Router>
  )
}

export default App