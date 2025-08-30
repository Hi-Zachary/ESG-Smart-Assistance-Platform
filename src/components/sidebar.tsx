import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  FileText, 
  Shield, 
  TrendingUp, 
  History,
  Menu,
  X,
  Home,
  Settings,
  HelpCircle,
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  
  const isActive = (path: string) => {
    return location.pathname === path
  }
  
  // 处理登出
  const handleLogout = () => {
    logout();
    // 登出后会自动重定向到登录页面，因为受保护路由会检测到未登录状态
  }

  const navItems = [
    {
      name: '仪表板',
      path: '/',
      icon: <Home className="h-5 w-5" />
    },
    {
      name: '文本分析',
      path: '/analysis',
      icon: <FileText className="h-5 w-5" />
    },
    {
      name: '合规检测',
      path: '/compliance',
      icon: <Shield className="h-5 w-5" />
    },
    {
      name: '数据可视化',
      path: '/visualization',
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      name: '历史记录',
      path: '/history',
      icon: <History className="h-5 w-5" />
    },
    {
      name: '设置',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />
    },
    {
      name: '帮助',
      path: '/help',
      icon: <HelpCircle className="h-5 w-5" />
    }
  ]

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
      open ? "w-64" : "w-16"
    )}>
      {/* 顶部标题和折叠按钮 */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {open &&
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h1 className="ml-2 text-xl font-bold text-gray-900">ESG分析</h1>
          </div>
        }
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="text-gray-500 hover:text-gray-900"
        >
         {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center rounded-md text-sm font-medium transition-colors",
              open ? "px-3 py-2" : "px-2 py-2 justify-center",
              isActive(item.path)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {item.icon}
            {open && <span className="ml-3">{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* 底部菜单 */}
      <div className="p-4 border-t border-gray-200">
        {open ? (
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user?.username?.[0]?.toUpperCase() || '用户'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.username || '未登录'}</p>
                <p className="text-xs text-gray-500">{user?.email || ''}</p>
              </div>
            </div>
          </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="h-4 w-4 mr-1" />
                设置
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-red-500 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" />
                登出
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">用户</span>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900">
              <Settings className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}