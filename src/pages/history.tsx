import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  History as HistoryIcon, 
  Search, 
  Filter,
  Download,
  Eye,
  Trash2,
  Calendar,
  Building,
  FileText,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAnalysisHistory, deleteAnalysis, getStats } from '@/lib/api-extended'
import { exportUtils } from '@/lib/export'
import { notify } from '@/lib/notifications'
import { AnalysisResultModal } from '@/components/analysis-result-modal'

export default function History() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [historyData, setHistoryData] = useState<any[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all-status')
  const [timeFilter, setTimeFilter] = useState('all-time')
  const [viewingItem, setViewingItem] = useState<any>(null)

  // 加载历史数据
  useEffect(() => {
    loadHistoryData()
  }, [])

  const loadHistoryData = async () => {
    try {
      const response = await getAnalysisHistory({ page: 1, limit: 100 })
      const savedResults = response.results || []
      setTotalRecords(response.total || 0)
      
      // 转换数据格式以匹配UI显示
      const formattedData = savedResults.map((result: any) => ({
        id: result.id.toString(),
        company: result.entities?.find((e: any) => e.type === '公司名称')?.value || '未知公司',
        reportType: result.entities?.find((e: any) => e.type === '报告类型')?.value || '未知类型',
        analysisDate: new Date(result.created_at).toLocaleDateString('zh-CN'),
        esgScore: result.esg_scores?.overall || 0,
        status: result.status || 'completed',
        complianceRate: Math.round((result.esg_scores?.overall || 0) * 10),
        analyst: '系统分析',
        rawData: result
      }))

      setHistoryData(formattedData)
    } catch (error) {
      console.error('加载历史数据失败:', error)
      // 如果API失败，显示空数据
      setHistoryData([])
      notify.error('加载失败', '无法加载历史记录数据')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">已完成</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">处理中</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">失败</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-600'
    if (score >= 7.5) return 'text-blue-600'
    if (score >= 6.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredData.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      notify.warning('请选择要删除的项目', '至少选择一个项目进行删除')
      return
    }

    try {
      await Promise.all(selectedItems.map(id => deleteAnalysis(id)))
      await loadHistoryData()
      setSelectedItems([])
      notify.success('删除成功', `已删除 ${selectedItems.length} 个项目`)
    } catch (error) {
      notify.error('删除失败', '删除项目时出现错误')
    }
  }

  const handleExportSelected = () => {
    if (selectedItems.length === 0) {
      notify.warning('请选择要导出的项目', '至少选择一个项目进行导出')
      return
    }

    try {
      const selectedData = historyData.filter(item => selectedItems.includes(item.id))
      exportUtils.exportHistoryData(selectedData, 'csv')
      notify.success('导出成功', `已导出 ${selectedItems.length} 个项目`)
    } catch (error) {
      notify.error('导出失败', '导出数据时出现错误')
    }
  }

  const handleViewDetails = (item: any) => {
    if (item.rawData) {
      setViewingItem(item.rawData)
    } else {
      notify.info('无详细数据', '该记录没有可供查看的详细原始数据')
    }
  }

  const handleExportSingle = (item: any) => {
    try {
      if (item.rawData) {
        exportUtils.exportAnalysisReport(item.rawData, `${item.company}-分析报告`)
      } else {
        exportUtils.exportToJSON([item], `${item.company}-数据`)
      }
      notify.success('导出成功', `已导出 ${item.company} 的报告`)
    } catch (error) {
      notify.error('导出失败', '导出报告时出现错误')
    }
  }

  const handleDeleteSingle = async (id: string) => {
    try {
      await deleteAnalysis(id)
      await loadHistoryData()
      notify.success('删除成功', '项目已删除')
    } catch (error) {
      notify.error('删除失败', '删除项目时出现错误')
    }
  }

  const filteredData = historyData.filter(item => {
    const matchesSearch = item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reportType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.analyst.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all-status' || item.status === statusFilter
    
    const matchesTime = timeFilter === 'all-time' || (() => {
      const itemDate = new Date(item.rawData.created_at) // 使用原始时间戳以保证准确性
      const now = new Date()
      
      switch (timeFilter) {
        case 'today':
          return itemDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
          return itemDate >= weekAgo
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          return itemDate >= monthAgo
        default:
          return true
      }
    })()
    
    return matchesSearch && matchesStatus && matchesTime
  })

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <HistoryIcon className="h-8 w-8 text-blue-600" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">历史记录</h1>
                    <p className="text-gray-600 mt-1">查看和管理所有ESG分析历史记录</p>
                </div>
            </div>
        <div className="flex space-x-2">
          {selectedItems.length > 0 && (
            <>
              <Button variant="outline" onClick={handleExportSelected}>
                <Download className="h-4 w-4 mr-2" />
                批量导出 ({selectedItems.length})
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                批量删除
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总分析次数</p>
                <p className="text-2xl font-bold text-blue-600">{totalRecords}</p>
              </div>
              <HistoryIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均ESG评分</p>
                <p className="text-2xl font-bold text-green-600">
                  {historyData.length > 0 
                    ? (historyData.reduce((sum, item) => sum + item.esgScore, 0) / historyData.length).toFixed(1)
                    : '暂无数据'
                  }
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均合规率</p>
                <p className="text-2xl font-bold text-purple-600">
                  {historyData.length > 0 
                    ? `${Math.round(historyData.reduce((sum, item) => sum + item.complianceRate, 0) / historyData.length)}%`
                    : '暂无数据'
                  }
                </p>
              </div>
              <Building className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">本月分析</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(() => {
                    const now = new Date()
                    const currentMonth = now.getMonth()
                    const currentYear = now.getFullYear()
                    const thisMonthCount = historyData.filter(item => {
                      const itemDate = new Date(item.analysisDate)
                      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
                    }).length
                    return thisMonthCount
                  })()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>筛选和搜索</CardTitle>
          <CardDescription>
            使用筛选条件快速找到需要的分析记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索公司名称、报告类型或分析师..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-status">所有状态</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">所有时间</SelectItem>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              高级筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>分析记录</CardTitle>
            <CardDescription>
              显示 {filteredData.length} 条记录，共 {historyData.length} 条
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.length > 0 && selectedItems.length === filteredData.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>公司名称</TableHead>
                  <TableHead>报告类型</TableHead>
                  <TableHead>分析日期</TableHead>
                  <TableHead>ESG评分</TableHead>
                  <TableHead>合规率</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>分析师</TableHead>
                  <TableHead className="w-12">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.company}</TableCell>
                    <TableCell>{item.reportType}</TableCell>
                    <TableCell>{item.analysisDate}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${getScoreColor(item.esgScore)}`}>
                        {item.esgScore}
                      </span>
                    </TableCell>
                    <TableCell>{item.complianceRate}%</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.analyst}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportSingle(item)}>
                            <Download className="h-4 w-4 mr-2" />
                            导出报告
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteSingle(item.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除记录
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {viewingItem && (
        <AnalysisResultModal 
          result={viewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}
    </>
  )
}
