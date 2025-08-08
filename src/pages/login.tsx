import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toaster'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff, Leaf, Shield, BarChart3, Users } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // 添加超时控制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('登录请求超时，请稍后再试')), 10000) // 10秒超时
    })

    try {
      const fetchPromise = fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      // 使用Promise.race竞争，哪个先完成就用哪个结果
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
      const data = await response.json()

      if (response.ok) {
        login(data.user, data.token)
        toast({
          title: '登录成功',
          description: `欢迎回来，${data.user.username}！`,
          variant: 'success',
        })
        navigate('/')
      } else {
        toast({
          title: '登录失败',
          description: data.message || '用户名或密码错误',
          variant: 'error',
        })
      }
    } catch (err: any) {
      toast({
        title: '登录失败',
        description: err.message,
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 动态背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 浮动圆圈动效 */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full animate-bounce delay-500"></div>
        
        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full p-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* 品牌标题 */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 rounded-2xl mb-4 shadow-lg animate-pulse">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              ESG智能分析平台
            </h1>
            <p className="text-gray-600 mt-2 animate-slide-up delay-300">
              专业的企业可持续发展分析工具
            </p>
          </div>

          {/* 登录卡片 */}
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl animate-slide-up delay-500">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">登录账户</CardTitle>
              <CardDescription className="text-gray-600">
                输入您的凭据以访问您的账户
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    用户名
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    密码
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pr-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      登录中...
                    </div>
                  ) : (
                    '登录'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  还没有账户？{' '}
                  <Link
                    to="/register"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                  >
                    立即注册
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 功能特色展示 */}
          <div className="mt-8 grid grid-cols-3 gap-4 animate-fade-in delay-700">
            <div className="text-center p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-300 transform hover:scale-105">
              <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium">安全可靠</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-300 transform hover:scale-105">
              <BarChart3 className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium">智能分析</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-300 transform hover:scale-105">
              <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium">团队协作</p>
            </div>
          </div>
        </div>
      </div>

      {/* 内联样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.8s ease-out forwards;
          }

          .animate-slide-up {
            animation: slide-up 0.8s ease-out forwards;
          }

          .delay-300 {
            animation-delay: 0.3s;
          }

          .delay-500 {
            animation-delay: 0.5s;
          }

          .delay-700 {
            animation-delay: 0.7s;
          }

          .delay-1000 {
            animation-delay: 1s;
          }
        `
      }} />
    </div>
  )
}
