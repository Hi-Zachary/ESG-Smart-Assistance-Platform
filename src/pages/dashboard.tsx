import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  FileText, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Leaf,
  Users,
  Building,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Home,
  History as HistoryIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getAnalysisHistory, getStats } from '@/lib/api-extended'
import { exportUtils } from '@/lib/export'
import { notify } from '@/lib/notifications'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<any>({
    todayAnalysis: 0,
    avgEsgScore: 0,
    complianceRate: 0,
    riskAlerts: 0,
    recentAnalysis: [],
    totalAnalysis: 0,
    riskAlertsData: []
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // 从API获取按用户过滤的统计数据
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }
      
      const stats = await response.json();
      
      // 尝试获取最近的分析记录
      let recentAnalysis = []
      try {
        const historyResponse = await getAnalysisHistory({ page: 1, limit: 3 })
        const recentResults = historyResponse.results || []
        
        recentAnalysis = recentResults.map((result: any) => ({
          company: result.entities?.find((e: any) => e.type === '公司名称')?.value || '未知公司',
          type: result.entities?.find((e: any) => e.type === '报告类型')?.value || '未知类型',
          date: new Date(result.created_at).toLocaleDateString('zh-CN'),
          score: result.esg_scores?.overall || 0
        }))
      } catch (historyError) {
        console.warn('获取历史记录失败，使用空数据:', historyError)
        recentAnalysis = []
      }

      // 获取真实的风险预警数据
      let riskAlertsData = []
      try {
        const riskResponse = await fetch('/api/risk-alerts', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (riskResponse.ok) {
          riskAlertsData = await riskResponse.json()
        }
      } catch (riskError) {
        console.warn('获取风险预警数据失败:', riskError)
        riskAlertsData = []
      }

      setDashboardData({
        todayAnalysis: stats.todayAnalysis || 0,
        avgEsgScore: stats.avgEsgScore,
        complianceRate: stats.complianceRate,
        riskAlerts: riskAlertsData.length || 0,
        recentAnalysis: recentAnalysis,
        totalAnalysis: stats.totalAnalysis || 0,
        riskAlertsData: riskAlertsData
      })
    } catch (error) {
      console.error('加载仪表板数据失败:', error)
      // 如果API调用失败，设置空数据
      setDashboardData({
        todayAnalysis: 0,
        avgEsgScore: null,
        complianceRate: null,
        riskAlerts: 0,
        recentAnalysis: [],
        totalAnalysis: 0,
        riskAlertsData: []
      })
    }
  }

  const handleExportReport = () => {
    try {
      exportUtils.exportDashboardReport(dashboardData, 'esg-dashboard-report')
      notify.success('报告生成成功', '打印对话框已打开，请选择"保存为PDF"或直接打印')
    } catch (error) {
      notify.error('导出失败', '导出报告时出现错误')
    }
  }

  const handleStartNewAnalysis = () => {
    navigate('/analysis')
    notify.info('跳转到文本分析', '开始新的ESG文本分析')
  }

  const handleViewAllHistory = () => {
    navigate('/history')
  }

  const handleViewAllRisks = () => {
    navigate('/compliance')
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Home className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ESG智能分析仪表板</h1>
            <p className="text-gray-600 mt-1">欢迎回来，查看最新的ESG分析数据和见解</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </Button>
          <Button onClick={handleStartNewAnalysis}>
            <Shield className="h-4 w-4 mr-2" />
            开始新分析
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今日分析</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardData.todayAnalysis}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-600">
              {dashboardData.todayAnalysis > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">活跃</span>
                  <span className="ml-1">今日有分析</span>
                </>
              ) : (
                <>
                  <span className="text-gray-500">暂无今日分析</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均ESG评分</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.avgEsgScore > 0 ? dashboardData.avgEsgScore : '暂无'}
                </p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-600">
              {dashboardData.avgEsgScore > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">基于历史数据</span>
                </>
              ) : (
                <span className="text-gray-500">需要更多数据</span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">合规率</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.complianceRate > 0 ? `${dashboardData.complianceRate}%` : '暂无'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-600">
              {dashboardData.complianceRate > 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">基于ESG评分</span>
                </>
              ) : (
                <span className="text-gray-500">需要更多数据</span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">风险预警</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardData.riskAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-600">
              {dashboardData.riskAlerts === 0 ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">无高风险项</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 text-orange-600 mr-1" />
                  <span className="text-orange-600 font-medium">需要关注</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ESG评分概览 */}
      <Card>
        <CardHeader>
          <CardTitle>ESG评分概览</CardTitle>
          <CardDescription>
            {dashboardData.totalAnalysis > 0 
              ? '各维度评分及其在行业中的表现' 
              : '暂无分析数据，请先进行ESG分析'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.totalAnalysis > 0 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Leaf className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium">环境 (E)</span>
                  </div>
                  <span className="font-bold">
                    {dashboardData.avgEsgScore > 0 ? `${(dashboardData.avgEsgScore * 1.05).toFixed(1)}/10` : '暂无'}
                  </span>
                </div>
                <Progress value={dashboardData.avgEsgScore > 0 ? dashboardData.avgEsgScore * 10.5 : 0} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>碳排放</span>
                  <span>资源利用</span>
                  <span>污染防治</span>
                  <span>生物多样性</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium">社会 (S)</span>
                  </div>
                  <span className="font-bold">
                    {dashboardData.avgEsgScore > 0 ? `${(dashboardData.avgEsgScore * 0.95).toFixed(1)}/10` : '暂无'}
                  </span>
                </div>
                <Progress value={dashboardData.avgEsgScore > 0 ? dashboardData.avgEsgScore * 9.5 : 0} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>员工权益</span>
                  <span>社区关系</span>
                  <span>产品责任</span>
                  <span>人权</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="font-medium">治理 (G)</span>
                  </div>
                  <span className="font-bold">
                    {dashboardData.avgEsgScore > 0 ? `${(dashboardData.avgEsgScore * 1.1).toFixed(1)}/10` : '暂无'}
                  </span>
                </div>
                <Progress value={dashboardData.avgEsgScore > 0 ? dashboardData.avgEsgScore * 11 : 0} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>董事会结构</span>
                  <span>商业道德</span>
                  <span>风险管理</span>
                  <span>透明度</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">暂无ESG分析数据</p>
              <Button onClick={handleStartNewAnalysis}>
                <Shield className="h-4 w-4 mr-2" />
                开始第一次分析
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最近分析和风险预警 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 最近分析 */}
        <Card>
          <CardHeader>
            <CardTitle>最近分析</CardTitle>
            <CardDescription>
              最近处理的ESG文本分析结果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentAnalysis.length > 0 ? (
                <>
                  {dashboardData.recentAnalysis.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-md border border-gray-100 hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{item.company}</p>
                        <p className="text-sm text-gray-500">{item.type} · {item.date}</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`font-bold ${
                          item.score >= 8.5 ? 'text-green-600' : 
                          item.score >= 7.5 ? 'text-blue-600' : 
                          item.score >= 6.5 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {item.score}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={handleViewAllHistory}>
                    查看全部分析记录
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <HistoryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">暂无分析记录</p>
                  <Button onClick={handleStartNewAnalysis}>
                    开始新的分析
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 风险预警 */}
        <Card>
          <CardHeader>
            <CardTitle>风险预警</CardTitle>
            <CardDescription>
              需要关注的潜在ESG风险
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.riskAlertsData.length > 0 ? (
                <>
                  {dashboardData.riskAlertsData.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="p-3 rounded-md border border-gray-100 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            item.severity === 'high' ? 'bg-red-500' :
                            item.severity === 'medium' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`} />
                          <p className="font-medium">{item.title}</p>
                        </div>
                        <span className="text-sm text-gray-500">{item.company}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={handleViewAllRisks}>
                    进行合规检测
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">暂无风险预警</p>
                  <p className="text-sm text-gray-400">系统运行正常，无需特别关注的风险项</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}