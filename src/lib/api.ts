// API集成工具函数
export interface ESGAnalysisRequest {
  text: string
  options?: {
    language?: string
    includeEntities?: boolean
    includeRisks?: boolean
    includeInsights?: boolean
  }
}

export interface ESGAnalysisResponse {
  entities: Array<{
    type: string
    value: string
    confidence: number
  }>
  esgScores: {
    environmental: number
    social: number
    governance: number
    overall: number
  }
  keyInsights: string[]
  risks: Array<{
    level: 'high' | 'medium' | 'low'
    description: string
  }>
}

class ESGAnalysisAPI {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string = '/api', apiKey: string = '') {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  // 设置API配置
  setConfig(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  // 分析文本
  async analyzeText(request: ESGAnalysisRequest): Promise<ESGAnalysisResponse> {
    // 如果没有配置API，使用模拟数据
    if (!this.baseUrl || !this.apiKey) {
      return this.getMockAnalysis(request.text)
    }

    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API调用失败，使用模拟数据:', error)
      return this.getMockAnalysis(request.text)
    }
  }

  // 获取模拟分析结果
  private getMockAnalysis(text: string): ESGAnalysisResponse {
    // 基于文本内容生成更智能的模拟数据
    const textLower = text.toLowerCase()
    
    // 基于文本内容检测公司名称（通用检测）
    let detectedCompany = '未知公司'
    
    // 尝试从文本中提取可能的公司名称
    const companyMatch = text.match(/([A-Za-z\u4e00-\u9fa5]+(?:公司|集团|有限公司|股份有限公司|Corporation|Corp|Inc|Ltd))/i)
    if (companyMatch) {
      detectedCompany = companyMatch[1]
    }

    // 检测报告类型
    let reportType = '未知类型'
    if (textLower.includes('可持续发展') || textLower.includes('sustainability')) {
      reportType = '可持续发展报告'
    } else if (textLower.includes('社会责任') || textLower.includes('csr')) {
      reportType = '社会责任报告'
    } else if (textLower.includes('年报') || textLower.includes('annual')) {
      reportType = '年度报告'
    } else if (textLower.includes('环境') || textLower.includes('environmental')) {
      reportType = '环境信息披露'
    }

    // 基于文本内容调整评分
    let envScore = 7.5 + Math.random() * 2
    let socialScore = 7.0 + Math.random() * 2
    let govScore = 8.0 + Math.random() * 1.5

    // 环境关键词检测
    if (textLower.includes('碳排放') || textLower.includes('减排') || textLower.includes('绿色')) {
      envScore += 0.5
    }
    if (textLower.includes('污染') || textLower.includes('排放超标')) {
      envScore -= 0.8
    }

    // 社会关键词检测
    if (textLower.includes('员工') || textLower.includes('培训') || textLower.includes('福利')) {
      socialScore += 0.3
    }
    if (textLower.includes('劳工') || textLower.includes('歧视') || textLower.includes('安全事故')) {
      socialScore -= 0.6
    }

    // 治理关键词检测
    if (textLower.includes('董事会') || textLower.includes('透明') || textLower.includes('合规')) {
      govScore += 0.3
    }
    if (textLower.includes('腐败') || textLower.includes('违规') || textLower.includes('处罚')) {
      govScore -= 0.8
    }

    // 确保评分在合理范围内
    envScore = Math.max(1, Math.min(10, envScore))
    socialScore = Math.max(1, Math.min(10, socialScore))
    govScore = Math.max(1, Math.min(10, govScore))

    const overallScore = (envScore + socialScore + govScore) / 3

    return {
      entities: [
        { type: '公司名称', value: detectedCompany, confidence: 0.85 + Math.random() * 0.1 },
        { type: '报告类型', value: reportType, confidence: 0.80 + Math.random() * 0.15 },
        { type: '报告年份', value: '2023年', confidence: 0.90 + Math.random() * 0.08 }
      ],
      esgScores: {
        environmental: Number(envScore.toFixed(1)),
        social: Number(socialScore.toFixed(1)),
        governance: Number(govScore.toFixed(1)),
        overall: Number(overallScore.toFixed(1))
      },
      keyInsights: this.generateInsights(textLower, envScore, socialScore, govScore),
      risks: this.generateRisks(textLower, envScore, socialScore, govScore)
    }
  }

  private generateInsights(text: string, envScore: number, socialScore: number, govScore: number): string[] {
    const insights = []

    if (envScore > 8) {
      insights.push('公司在环境保护方面表现优秀，碳减排措施效果显著')
    } else if (envScore < 6) {
      insights.push('环境管理方面需要加强，建议制定更严格的环保目标')
    }

    if (socialScore > 8) {
      insights.push('社会责任履行良好，员工权益保障到位')
    } else if (socialScore < 6) {
      insights.push('社会责任方面有待改善，需要关注员工福利和社区关系')
    }

    if (govScore > 8.5) {
      insights.push('公司治理结构完善，透明度和合规性表现出色')
    } else if (govScore < 7) {
      insights.push('治理结构需要优化，建议加强内控制度建设')
    }

    if (text.includes('创新') || text.includes('技术')) {
      insights.push('公司注重技术创新，有助于可持续发展目标的实现')
    }

    if (insights.length === 0) {
      insights.push('公司ESG表现整体稳定，建议持续关注各项指标的改善')
    }

    return insights.slice(0, 4) // 最多返回4个洞察
  }

  private generateRisks(text: string, envScore: number, socialScore: number, govScore: number): Array<{level: 'high' | 'medium' | 'low', description: string}> {
    const risks = []

    if (envScore < 6) {
      risks.push({ level: 'high' as const, description: '环境合规风险较高，可能面临监管处罚' })
    } else if (envScore < 7.5) {
      risks.push({ level: 'medium' as const, description: '环境管理存在改善空间，需要关注政策变化' })
    }

    if (socialScore < 6) {
      risks.push({ level: 'high' as const, description: '社会责任风险突出，可能影响品牌声誉' })
    } else if (socialScore < 7.5) {
      risks.push({ level: 'medium' as const, description: '员工关系和社区参与需要加强' })
    }

    if (govScore < 7) {
      risks.push({ level: 'high' as const, description: '治理风险较高，内控制度需要完善' })
    } else if (govScore < 8.5) {
      risks.push({ level: 'medium' as const, description: '治理透明度有待提升' })
    }

    if (text.includes('供应链')) {
      risks.push({ level: 'medium' as const, description: '供应链ESG风险需要持续监控' })
    }

    if (risks.length === 0) {
      risks.push({ level: 'low' as const, description: '整体ESG风险可控，建议定期评估' })
    }

    return risks.slice(0, 3) // 最多返回3个风险
  }

  // 检查API连接状态
  async checkConnection(): Promise<boolean> {
    if (!this.baseUrl || !this.apiKey) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// 导出单例实例
export const esgAPI = new ESGAnalysisAPI()

// 导出配置函数
export const configureAPI = (baseUrl: string, apiKey: string) => {
  esgAPI.setConfig(baseUrl, apiKey)
}