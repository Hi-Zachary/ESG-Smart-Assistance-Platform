import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Leaf, Users, Building, X } from 'lucide-react'

// 分析结果类型定义
interface AnalysisResult {
  entities?: { type: string; value: string; confidence?: number }[]
  esg_scores?: { environmental: number; social: number; governance: number; overall?: number }
  esgScores?: { environmental: number; social: number; governance: number; overall?: number }
  key_insights?: string[]
  keyInsights?: string[]
  risks?: { level: string; description: string }[]
  analysis_content?: string
  created_at?: string
  id?: string
  [key: string]: any
}

interface Props {
  result: AnalysisResult
  onClose: () => void
}

export function AnalysisResultModal({ result, onClose }: Props) {
  if (!result) return null

  // 兼容不同的数据结构
  const entities = result.entities || []
  const esgScores = result.esg_scores || result.esgScores || { environmental: 0, social: 0, governance: 0, overall: 0 }
  const keyInsights = result.key_insights || result.keyInsights || []
  const risks = result.risks || []
  const analysisContent = result.analysis_content || ''
  const createdAt = result.created_at ? new Date(result.created_at).toLocaleString('zh-CN') : '未知时间'

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>分析详情</CardTitle>
            <CardDescription>查看完整的分析结果</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <Tabs defaultValue="scores">
            <TabsList className={`mb-4 grid w-full ${analysisContent ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="scores">ESG评分</TabsTrigger>
              <TabsTrigger value="entities">实体识别</TabsTrigger>
              <TabsTrigger value="insights">关键洞察</TabsTrigger>
              <TabsTrigger value="risks">风险预警</TabsTrigger>
              {analysisContent && <TabsTrigger value="content">分析内容</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="scores">
              <div className="space-y-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">分析时间: {createdAt}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>总体评分</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      <div className="text-6xl font-bold text-gray-900">{esgScores.overall || 0}</div>
                    </CardContent>
                  </Card>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center"><Leaf className="h-5 w-5 text-green-600 mr-2" />环境</div>
                      <div className="font-bold">{esgScores.environmental || 0}/10</div>
                    </div>
                    <Progress value={(esgScores.environmental || 0) * 10} />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center"><Users className="h-5 w-5 text-blue-600 mr-2" />社会</div>
                      <div className="font-bold">{esgScores.social || 0}/10</div>
                    </div>
                    <Progress value={(esgScores.social || 0) * 10} />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center"><Building className="h-5 w-5 text-purple-600 mr-2" />治理</div>
                      <div className="font-bold">{esgScores.governance || 0}/10</div>
                    </div>
                    <Progress value={(esgScores.governance || 0) * 10} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="entities">
              {entities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entities.map((entity, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-500">{entity.type}</div>
                        <div className="font-medium mt-1">{entity.value}</div>
                        {entity.confidence && (
                          <div className="text-xs text-gray-400 mt-2">置信度: {Math.round(entity.confidence * 100)}%</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无实体识别数据
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights">
              {keyInsights.length > 0 ? (
                <ul className="space-y-3 list-disc list-inside">
                  {keyInsights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无关键洞察数据
                </div>
              )}
            </TabsContent>

            <TabsContent value="risks">
              {risks.length > 0 ? (
                <div className="space-y-3">
                  {risks.map((risk, index) => (
                    <div key={index} className="flex items-start">
                      <div className="mr-3">{getRiskBadge(risk.level)}</div>
                      <p>{risk.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无风险预警数据
                </div>
              )}
            </TabsContent>

            {analysisContent && (
              <TabsContent value="content">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">分析内容</h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {analysisContent}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}