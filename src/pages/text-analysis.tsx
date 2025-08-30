import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Send, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Leaf,
  Users,
  Building,
  Download
} from 'lucide-react'
import { exportUtils } from '@/lib/export'
import { notify } from '@/lib/notifications'
import { useAuth } from '@/lib/auth-context'

export default function TextAnalysis() {
  const { token } = useAuth()
  const [inputText, setInputText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleAnalysis = async () => {
    if (!inputText.trim()) {
      notify.warning('请输入文本内容', '需要输入文本才能进行分析')
      return
    }
    
    setIsAnalyzing(true)
    
    try {
      // 调用后端 DeepSeek API
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: inputText.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // 确保结果包含必要的字段
      const processedResult = {
        inputText: inputText.trim(),
        entities: result.entities || [],
        esgScores: result.esgScores || {
          environmental: 0,
          social: 0,
          governance: 0,
          overall: 0
        },
        keyInsights: result.keyInsights || [],
        risks: result.risks || [],
        status: result.status || 'completed',
        source: result.source || 'deepseek-api'
      }
      
      setAnalysisResult(processedResult)
      notify.success('分析完成', 'ESG文本分析已成功完成')
    } catch (error) {
      console.error('分析错误:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      notify.error('分析失败', `分析过程中出现错误: ${errorMessage}`)
    } finally {
      setIsAnalyzing(false);
    }
  }


  const handleExportReport = () => {
    if (!analysisResult) {
      notify.warning('没有可导出的结果', '请先进行文本分析')
      return
    }

    try {
      exportUtils.exportAnalysisReport(analysisResult)
      notify.success('导出成功', '分析报告已导出为HTML文件')
    } catch (error) {
      notify.error('导出失败', '导出报告时出现错误')
    }
  }

  const handleUploadFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.doc,.docx,.pdf'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          setInputText(text)
          notify.success('文件上传成功', `已加载文件: ${file.name}`)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">高风险</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">中风险</Badge>
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">低风险</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-3">
        <FileText className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ESG文本分析</h1>
          <p className="text-gray-600 mt-1">上传或粘贴企业报告文本，自动提取ESG关键信息</p>
        </div>
      </div>
      {/* 输入区域 */}
      <Card>
        <CardHeader>
          <CardTitle>文本输入</CardTitle>
          <CardDescription>
            粘贴企业报告、新闻或其他ESG相关文本
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea 
              placeholder="在此粘贴文本内容..." 
              className="min-h-[200px]"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {inputText ? `${inputText.length} 个字符` : '请输入文本'}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleUploadFile}>
                  <FileText className="h-4 w-4 mr-2" />
                  上传文件
                </Button>
                <Button 
                  onClick={handleAnalysis}
                  disabled={!inputText.trim() || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      开始分析
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分析状态 */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">正在分析文本...</h3>
                  <p className="text-sm text-gray-500">这可能需要几秒钟时间</p>
                </div>
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
              <Progress value={65} className="h-2" />
              <div className="grid grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <div className="text-blue-600">
                    <CheckCircle className="h-5 w-5 mx-auto" />
                  </div>
                  <p className="mt-1">文本预处理</p>
                </div>
                <div>
                  <div className="text-blue-600">
                    <CheckCircle className="h-5 w-5 mx-auto" />
                  </div>
                  <p className="mt-1">实体识别</p>
                </div>
                <div>
                  <div className="text-blue-600">
                    <Loader2 className="h-5 w-5 mx-auto animate-spin" />
                  </div>
                  <p className="mt-1">ESG评分</p>
                </div>
                <div>
                  <div className="text-gray-400">
                    <AlertCircle className="h-5 w-5 mx-auto" />
                  </div>
                  <p className="mt-1">风险分析</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分析结果 */}
      {analysisResult && !isAnalyzing && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>分析结果</CardTitle>
              <CardDescription>
                基于DeepSeek API的文本解析结果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="entities">
                <TabsList className="mb-4">
                  <TabsTrigger value="entities">实体识别</TabsTrigger>
                  <TabsTrigger value="scores">ESG评分</TabsTrigger>
                  <TabsTrigger value="insights">关键洞察</TabsTrigger>
                  <TabsTrigger value="risks">风险预警</TabsTrigger>
                </TabsList>
                
                <TabsContent value="entities">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analysisResult.entities.map((entity: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="text-sm text-gray-500">{entity.type}</div>
                            <div className="text-lg font-medium mt-1">{entity.value}</div>
                            <div className="mt-2 flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${entity.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500 ml-2">
                                {Math.round(entity.confidence * 100)}%
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="scores">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-gray-600">环境 (E)</div>
                              <div className="text-2xl font-bold text-green-600">
                                {analysisResult.esgScores.environmental}
                              </div>
                            </div>
                            <Leaf className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-gray-600">社会 (S)</div>
                              <div className="text-2xl font-bold text-blue-600">
                                {analysisResult.esgScores.social}
                              </div>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-purple-50 border-purple-100">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-gray-600">治理 (G)</div>
                              <div className="text-2xl font-bold text-purple-600">
                                {analysisResult.esgScores.governance}
                              </div>
                            </div>
                            <Building className="h-8 w-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-50 border-gray-100">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-gray-600">总体评分</div>
                              <div className="text-2xl font-bold text-gray-900">
                                {analysisResult.esgScores.overall}
                              </div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              ESG
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>评分详情</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Leaf className="h-5 w-5 text-green-600 mr-2" />
                                <span className="font-medium">环境 (E)</span>
                              </div>
                              <span className="font-bold">{analysisResult.esgScores.environmental}/10</span>
                            </div>
                            <Progress value={analysisResult.esgScores.environmental * 10} className="h-2" />
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
                              <span className="font-bold">{analysisResult.esgScores.social}/10</span>
                            </div>
                            <Progress value={analysisResult.esgScores.social * 10} className="h-2" />
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
                              <span className="font-bold">{analysisResult.esgScores.governance}/10</span>
                            </div>
                            <Progress value={analysisResult.esgScores.governance * 10} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>董事会结构</span>
                              <span>商业道德</span>
                              <span>风险管理</span>
                              <span>透明度</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="insights">
                  <div className="space-y-4">
                    {analysisResult.keyInsights.map((insight: string, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                              {index + 1}
                            </div>
                            <p>{insight}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="risks">
                  <div className="space-y-4">
                    {analysisResult.risks.map((risk: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="mr-3">
                                {getRiskBadge(risk.level)}
                              </div>
                              <p>{risk.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              导出报告
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}