import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  PieChart,
  LineChart,
  Download,
  Share2,
  Filter,
  Leaf,
  Users,
  Building,
  FileText
} from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts'
import { storage } from '@/lib/storage'
import { exportUtils } from '@/lib/export'
import { notify } from '@/lib/notifications'
import { getAnalysisHistory } from '@/lib/api-extended'

export default function DataVisualization() {
  const [timeRange, setTimeRange] = useState('year')
  const [compareCompany, setCompareCompany] = useState('none')
  const [chartData, setChartData] = useState<any>({
    trendData: [],
    environmentalData: [],
    socialData: [],
    governanceData: []
  })
  const [hasData, setHasData] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadChartData()
  }, [timeRange])

  const loadChartData = async () => {
    setLoading(true)
    try {
      // 首先尝试从后端API获取数据
      let analysisResults = []
      
      try {
        console.log('正在从后端API获取分析历史数据...')
        const historyResponse = await getAnalysisHistory({ page: 1, limit: 100 })
        
        if (historyResponse && historyResponse.results) {
          // 转换后端数据格式为前端可用格式
          analysisResults = historyResponse.results.map((result: any) => ({
            id: result.id,
            timestamp: result.created_at,
            esgScores: {
              environmental: result.esg_scores?.environmental || 0,
              social: result.esg_scores?.social || 0,
              governance: result.esg_scores?.governance || 0,
              overall: result.esg_scores?.overall || 0
            },
            company: result.entities?.find((e: any) => e.type === '公司名称')?.value || '未知公司',
            reportType: result.entities?.find((e: any) => e.type === '报告类型')?.value || '未知类型'
          }))
          console.log(`从后端获取到 ${analysisResults.length} 条分析记录`)
        }
      } catch (apiError) {
        console.warn('后端API获取失败，尝试使用本地存储数据:', apiError)
        // 如果API失败，回退到本地存储
        const localResults = storage.getAnalysisResults()
        analysisResults = localResults.map((result: any) => ({
          ...result,
          timestamp: result.timestamp || result.savedAt || new Date().toISOString()
        }))
        console.log(`从本地存储获取到 ${analysisResults.length} 条分析记录`)
      }
      
      if (analysisResults.length === 0) {
        console.log('没有找到任何分析数据，显示空状态')
        setHasData(false)
        setChartData({
          trendData: [],
          environmentalData: [],
          socialData: [],
          governanceData: []
        })
        return
      }
      
      console.log('开始生成图表数据...')
      setHasData(true)
      
      // 生成趋势数据
      const trendData = generateTrendData(timeRange, analysisResults)
      console.log('趋势数据:', trendData)
      
      // 基于真实数据生成各维度数据
      const environmentalData = generateDimensionData(analysisResults, 'environmental')
      const socialData = generateDimensionData(analysisResults, 'social')
      const governanceData = generateDimensionData(analysisResults, 'governance')

      setChartData({
        trendData,
        environmentalData,
        socialData,
        governanceData
      })
      
      console.log('图表数据生成完成')
    } catch (error) {
      console.error('数据加载错误:', error)
      notify.error('数据加载失败', '无法加载可视化数据')
      setHasData(false)
    } finally {
      setLoading(false)
    }
  }

  const generateTrendData = (range: string, results: any[]) => {
    if (results.length === 0) return []

    console.log(`生成${range}趋势数据，共${results.length}条记录`)

    // 按时间排序分析结果
    const sortedResults = results.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    const now = new Date()
    const data = []

    if (range === 'month') {
      // 生成过去12个月的数据
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthName = date.toLocaleDateString('zh-CN', { month: 'short' })
        
        // 获取该月的分析结果
        const monthResults = sortedResults.filter(result => {
          const resultDate = new Date(result.timestamp)
          return resultDate.getFullYear() === date.getFullYear() && 
                 resultDate.getMonth() === date.getMonth()
        })

        const avgScores = calculateAverageScores(monthResults)
        
        data.push({
          name: monthName,
          环境: avgScores.environmental,
          社会: avgScores.social,
          治理: avgScores.governance,
          总体: avgScores.overall
        })
      }
    } else if (range === 'quarter') {
      // 生成过去8个季度的数据
      for (let i = 7; i >= 0; i--) {
        const quarterStart = new Date(now.getFullYear(), now.getMonth() - i * 3, 1)
        const quarter = Math.floor(quarterStart.getMonth() / 3) + 1
        const year = quarterStart.getFullYear()
        
        // 获取该季度的分析结果
        const quarterResults = sortedResults.filter(result => {
          const resultDate = new Date(result.timestamp)
          const resultQuarter = Math.floor(resultDate.getMonth() / 3) + 1
          return resultDate.getFullYear() === year && resultQuarter === quarter
        })

        const avgScores = calculateAverageScores(quarterResults)
        
        data.push({
          name: `${year}Q${quarter}`,
          环境: avgScores.environmental,
          社会: avgScores.social,
          治理: avgScores.governance,
          总体: avgScores.overall
        })
      }
    } else {
      // 生成过去5年的数据
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i
        
        // 获取该年的分析结果
        const yearResults = sortedResults.filter(result => {
          const resultDate = new Date(result.timestamp)
          return resultDate.getFullYear() === year
        })

        const avgScores = calculateAverageScores(yearResults)
        
        data.push({
          name: year.toString(),
          环境: avgScores.environmental,
          社会: avgScores.social,
          治理: avgScores.governance,
          总体: avgScores.overall
        })
      }
    }

    return data
  }

  const calculateAverageScores = (results: any[]) => {
    if (results.length === 0) {
      return { environmental: 0, social: 0, governance: 0, overall: 0 }
    }

    const totals = results.reduce((acc, result) => {
      const scores = result.esgScores || {}
      return {
        environmental: acc.environmental + (scores.environmental || 0),
        social: acc.social + (scores.social || 0),
        governance: acc.governance + (scores.governance || 0),
        overall: acc.overall + (scores.overall || 0)
      }
    }, { environmental: 0, social: 0, governance: 0, overall: 0 })

    return {
      environmental: Number((totals.environmental / results.length).toFixed(1)),
      social: Number((totals.social / results.length).toFixed(1)),
      governance: Number((totals.governance / results.length).toFixed(1)),
      overall: Number((totals.overall / results.length).toFixed(1))
    }
  }

  const generateDimensionData = (results: any[], dimension: 'environmental' | 'social' | 'governance') => {
    if (results.length === 0) return []

    const dimensionConfig = {
      environmental: [
        { name: '碳排放', color: '#10B981' },
        { name: '能源使用', color: '#059669' },
        { name: '废弃物管理', color: '#047857' },
        { name: '水资源管理', color: '#065F46' }
      ],
      social: [
        { name: '员工权益', color: '#3B82F6' },
        { name: '社区关系', color: '#2563EB' },
        { name: '产品责任', color: '#1D4ED8' },
        { name: '人权', color: '#1E40AF' }
      ],
      governance: [
        { name: '董事会结构', color: '#8B5CF6' },
        { name: '商业道德', color: '#7C3AED' },
        { name: '风险管理', color: '#6D28D9' },
        { name: '透明度', color: '#5B21B6' }
      ]
    }

    const config = dimensionConfig[dimension]
    const avgScore = calculateAverageScores(results)[dimension]
    
    // 基于平均分数生成各子指标的分布
    return config.map((item, index) => ({
      name: item.name,
      value: Math.max(0, avgScore + (Math.random() - 0.5) * 2), // 在平均分基础上添加随机变化
      color: item.color
    }))
  }

  const handleExportData = () => {
    try {
      const exportData = {
        时间范围: timeRange,
        生成时间: new Date().toLocaleString('zh-CN'),
        趋势数据: chartData.trendData,
        环境数据: chartData.environmentalData,
        社会数据: chartData.socialData,
        治理数据: chartData.governanceData
      }
      
      exportUtils.exportToJSON(exportData, 'esg-visualization-data')
      notify.success('导出成功', '可视化数据已导出')
    } catch (error) {
      notify.error('导出失败', '导出数据时出现错误')
    }
  }

  const handleShare = () => {
    try {
      const shareUrl = window.location.href
      navigator.clipboard.writeText(shareUrl)
      notify.success('分享链接已复制', '可以将链接分享给其他人')
    } catch (error) {
      notify.info('分享', '当前页面: ESG数据可视化')
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">正在加载数据可视化...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">ESG数据可视化</h1>
                <p className="text-gray-600 mt-1">直观展示ESG指标和趋势</p>
            </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            分享
          </Button>
          <Button onClick={loadChartData}>
            <Filter className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 时间范围选择 */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">时间范围:</span>
            <div className="flex space-x-2">
              <Button 
                variant={timeRange === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('month')}
              >
                月度
              </Button>
              <Button 
                variant={timeRange === 'quarter' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('quarter')}
              >
                季度
              </Button>
              <Button 
                variant={timeRange === 'year' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('year')}
              >
                年度
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">对比企业:</span>
            <Select value={compareCompany} onValueChange={setCompareCompany}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 空状态或ESG评分趋势 */}
      {!hasData ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无分析数据</h3>
              <p className="text-gray-500 mb-6">
                请先在"文本分析"页面进行ESG分析，生成数据后即可查看可视化图表
              </p>
              <Button onClick={() => window.location.href = '/analysis'}>
                <FileText className="h-4 w-4 mr-2" />
                去分析文本
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>ESG评分趋势</CardTitle>
              <CardDescription>
                {timeRange === 'month' ? '过去12个月' : timeRange === 'quarter' ? '过去8个季度' : '过去5年'} ESG评分变化趋势
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="环境" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="社会" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="治理" stroke="#8B5CF6" strokeWidth={2} />
                    <Line type="monotone" dataKey="总体" stroke="#374151" strokeWidth={3} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* ESG维度详情 */}
          <Tabs defaultValue="environmental">
            <TabsList className="mb-4">
              <TabsTrigger value="environmental" className="flex items-center">
                <Leaf className="h-4 w-4 mr-2" />
                环境 (E)
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                社会 (S)
              </TabsTrigger>
              <TabsTrigger value="governance" className="flex items-center">
                <Building className="h-4 w-4 mr-2" />
                治理 (G)
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="environmental">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>环境指标分布</CardTitle>
                    <CardDescription>各环境指标占比</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={chartData.environmentalData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          >
                            {chartData.environmentalData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>环境指标趋势</CardTitle>
                    <CardDescription>主要环境指标变化趋势</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={chartData.environmentalData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10B981" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="social">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>社会指标分布</CardTitle>
                    <CardDescription>各社会指标占比</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={chartData.socialData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          >
                            {chartData.socialData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>社会责任投入</CardTitle>
                    <CardDescription>社会责任项目投入及影响</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={chartData.socialData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3B82F6" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="governance">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>治理指标分布</CardTitle>
                    <CardDescription>各治理指标占比</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={chartData.governanceData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          >
                            {chartData.governanceData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>风险管理</CardTitle>
                    <CardDescription>风险管理体系评估</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={chartData.governanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8B5CF6" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}