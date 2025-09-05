import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Shield, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Leaf,
  Users,
  Building,
  FileText,
  Upload,
  Settings,
  Download,
  Play,
  RefreshCw,
  Search
} from 'lucide-react'
import { storage } from '@/lib/storage'
import { notify } from '@/lib/notifications'

export default function ComplianceCheck() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedAnalysis, setSelectedAnalysis] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([])
  const [complianceData, setComplianceData] = useState<any>(null)
  const [complianceRules, setComplianceRules] = useState<any[]>([])
  const [rulesModified, setRulesModified] = useState(false)

  useEffect(() => {
    loadAnalysisHistory()
    loadComplianceRules()
  }, [])

  const loadAnalysisHistory = async () => {
    try {
      // 从后端API获取分析历史，确保数据一致性
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/history?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json()
        setAnalysisHistory(data.results)
        if (data.results.length > 0 && !selectedAnalysis) {
          const firstAnalysis = data.results[0];
          const companyName = 
            firstAnalysis.entities?.find((e: any) => e.type === '公司名称')?.value ||
            firstAnalysis.entities?.find((e: any) => e.type === 'company')?.value ||
            firstAnalysis.entities?.find((e: any) => e.type === 'organization')?.value ||
            firstAnalysis.entities?.find((e: any) => e.name && (e.name.includes('公司') || e.name.includes('集团') || e.name.includes('企业')))?.name ||
            firstAnalysis.file_name?.replace(/\.(txt|pdf|docx?)$/i, '') ||
            '未知公司';
          
          const analysisTime = firstAnalysis.created_at || firstAnalysis.timestamp || firstAnalysis.createdAt;
          const timeDisplay = analysisTime ? new Date(analysisTime).toLocaleString('zh-CN') : '未知时间';
          const displayText = `${companyName} - ${timeDisplay}`;
          
          setSelectedAnalysis(displayText);
        }
      } else {
        // 如果后端失败，尝试从本地存储获取
        const results = storage.getAnalysisResults()
        setAnalysisHistory(results)
        if (results.length > 0 && !selectedAnalysis) {
          const firstAnalysis = results[0];
          const companyName = 
            firstAnalysis.entities?.find((e: any) => e.type === '公司名称')?.value ||
            firstAnalysis.entities?.find((e: any) => e.type === 'company')?.value ||
            firstAnalysis.entities?.find((e: any) => e.type === 'organization')?.value ||
            firstAnalysis.entities?.find((e: any) => e.name && (e.name.includes('公司') || e.name.includes('集团') || e.name.includes('企业')))?.name ||
            firstAnalysis.file_name?.replace(/\.(txt|pdf|docx?)$/i, '') ||
            '未知公司';
          
          const analysisTime = firstAnalysis.created_at || firstAnalysis.timestamp || firstAnalysis.createdAt;
          const timeDisplay = analysisTime ? new Date(analysisTime).toLocaleString('zh-CN') : '未知时间';
          const displayText = `${companyName} - ${timeDisplay}`;
          
          setSelectedAnalysis(displayText);
        }
      }
    } catch (error) {
      console.error('加载分析历史失败:', error)
      // 降级到本地存储
      try {
        const results = storage.getAnalysisResults()
        setAnalysisHistory(results)
        if (results.length > 0 && !selectedAnalysis) {
          setSelectedAnalysis(results[0].id)
        }
      } catch (localError) {
        notify.error('加载失败', '无法加载分析历史')
      }
    }
  }

  const loadComplianceRules = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/compliance/rules')
      if (response.ok) {
        const rules = await response.json()
        setComplianceRules(rules)
      }
    } catch (error) {
      console.error('加载合规规则失败:', error)
      // 使用默认规则
      setComplianceRules([
        {
          id: 'e1',
          category: 'environmental',
          name: '碳排放披露',
          description: '企业应披露碳排放数据及减排目标',
          enabled: true,
          threshold: 0.8
        },
        {
          id: 's1',
          category: 'social',
          name: '员工健康安全',
          description: '企业应确保工作环境安全并披露相关措施',
          enabled: true,
          threshold: 0.85
        },
        {
          id: 'g1',
          category: 'governance',
          name: '董事会独立性',
          description: '董事会应包含足够比例的独立董事',
          enabled: true,
          threshold: 0.5
        }
      ])
    }
  }

  const handleComplianceCheck = async () => {
    if (!selectedAnalysis) {
      notify.error('请选择分析结果', '请先选择要检测的ESG分析结果')
      return
    }

    // 根据选择的显示文本找到对应的分析记录ID
    const analysis = analysisHistory.find(a => {
      const companyName = 
        a.entities?.find((e: any) => e.type === '公司名称')?.value ||
        a.entities?.find((e: any) => e.type === 'company')?.value ||
        a.entities?.find((e: any) => e.type === 'organization')?.value ||
        a.entities?.find((e: any) => e.name && (e.name.includes('公司') || e.name.includes('集团') || e.name.includes('企业')))?.name ||
        a.file_name?.replace(/\.(txt|pdf|docx?)$/i, '') ||
        '未知公司';
      
      const analysisTime = a.created_at || a.timestamp || a.createdAt;
      const timeDisplay = analysisTime ? new Date(analysisTime).toLocaleString('zh-CN') : '未知时间';
      const displayText = `${companyName} - ${timeDisplay}`;
      
      return displayText === selectedAnalysis;
    });

    if (!analysis) {
      notify.error('数据错误', '找不到对应的分析记录')
      return
    }

    setIsChecking(true)
    try {
      // 只发送启用的规则给后端
      const enabledRules = complianceRules.filter(rule => rule.enabled);
      
      const response = await fetch('http://localhost:3001/api/compliance/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId: analysis.id,
          rules: enabledRules  // 发送当前启用的规则配置
        })
      })

      if (response.ok) {
        const result = await response.json()
        setComplianceData(result)
        notify.success('合规检测完成', '已生成合规检测报告')
      } else {
        throw new Error('合规检测失败')
      }
    } catch (error) {
      console.error('合规检测错误:', error)
      notify.error('检测失败', '合规检测过程中出现错误')
    } finally {
      setIsChecking(false)
    }
  }

  // 导出规则配置
  const exportRules = () => {
    try {
      const rulesData = {
        exportTime: new Date().toISOString(),
        version: "1.0",
        rules: complianceRules
      }
      
      const dataStr = JSON.stringify(rulesData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ESG合规规则配置_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      notify.success('导出成功', '合规规则配置已导出')
    } catch (error) {
      notify.error('导出失败', '导出配置时出现错误')
    }
  }

  // 保存配置
  const saveRulesConfig = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/compliance/rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rules: complianceRules })
      })

      if (response.ok) {
        setRulesModified(false)
        notify.success('保存成功', '合规规则配置已保存')
      } else {
        // 如果后端保存失败，尝试保存到本地存储
        localStorage.setItem('esg_compliance_rules', JSON.stringify(complianceRules))
        setRulesModified(false)
        notify.success('保存成功', '合规规则配置已保存到本地')
      }
    } catch (error) {
      // 降级到本地存储
      try {
        localStorage.setItem('esg_compliance_rules', JSON.stringify(complianceRules))
        setRulesModified(false)
        notify.success('保存成功', '合规规则配置已保存到本地')
      } catch (localError) {
        notify.error('保存失败', '保存配置时出现错误')
      }
    }
  }

  // 更新规则状态
  const updateRuleStatus = (ruleId: string, enabled: boolean) => {
    setComplianceRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled } : rule
      )
    )
    setRulesModified(true)
  }

  // 导入规则配置
  const importRules = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            const importedRules = data.rules || data // 支持两种格式
            if (Array.isArray(importedRules) && importedRules.length > 0) {
              setComplianceRules(importedRules)
              setRulesModified(true)
              notify.success('导入成功', `已导入 ${importedRules.length} 条合规规则`)
            } else {
              notify.error('导入失败', '文件格式不正确或为空')
            }
          } catch (error) {
            notify.error('导入失败', '文件格式不正确，请选择有效的JSON文件')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">合规</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">警告</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">不合规</Badge>
      default:
        return <Badge variant="secondary">未检测</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const exportComplianceReport = async () => {
    if (!complianceData) {
      notify.error('无数据', '请先进行合规检测')
      return
    }

    try {
      // 获取选中的分析记录信息
      const analysis = analysisHistory.find(a => {
        const companyName = 
          a.entities?.find((e: any) => e.type === '公司名称')?.value ||
          a.entities?.find((e: any) => e.type === 'company')?.value ||
          a.entities?.find((e: any) => e.type === 'organization')?.value ||
          a.entities?.find((e: any) => e.name && (e.name.includes('公司') || e.name.includes('集团') || e.name.includes('企业')))?.name ||
          a.file_name?.replace(/\.(txt|pdf|docx?)$/i, '') ||
          '未知公司';
        
        const analysisTime = a.created_at || a.timestamp || a.createdAt;
        const timeDisplay = analysisTime ? new Date(analysisTime).toLocaleString('zh-CN') : '未知时间';
        const displayText = `${companyName} - ${timeDisplay}`;
        
        return displayText === selectedAnalysis;
      });

      const companyName = analysis?.entities?.find((e: any) => e.type === '公司名称')?.value || '未知公司';

      // 创建一个新的窗口用于打印
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        notify.error('导出失败', '请允许弹出窗口以生成PDF报告')
        return;
      }

      // 生成打印页面内容
      const printContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESG合规检测报告 - ${companyName}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        body { 
            font-family: 'Microsoft YaHei', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            color: #333;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .header h1 { color: #1e40af; margin: 0; font-size: 28px; }
        .header p { color: #6b7280; margin: 10px 0 0 0; }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .summary-card { 
            background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
        }
        .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; opacity: 0.9; }
        .summary-card .value { font-size: 24px; font-weight: bold; margin: 0; }
        .section { margin-bottom: 30px; }
        .section h2 { 
            color: #1f2937; 
            border-left: 4px solid #3b82f6; 
            padding-left: 15px; 
            margin-bottom: 20px; 
        }
        .category { 
            margin-bottom: 25px; 
            padding: 20px; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            page-break-inside: avoid;
        }
        .category h3 { 
            color: #374151; 
            margin: 0 0 15px 0; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
        }
        .progress-bar { 
            background: #f3f4f6; 
            height: 8px; 
            border-radius: 4px; 
            overflow: hidden; 
            margin-bottom: 15px; 
        }
        .progress-fill { height: 100%; }
        .progress-fill.high { background: #10b981; }
        .progress-fill.medium { background: #f59e0b; }
        .progress-fill.low { background: #ef4444; }
        .rule-item { 
            display: flex; 
            align-items: center; 
            padding: 12px; 
            margin-bottom: 8px; 
            border-radius: 6px; 
            background: #f9fafb; 
        }
        .rule-status { 
            width: 20px; 
            height: 20px; 
            border-radius: 50%; 
            margin-right: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 12px; 
            font-weight: bold;
        }
        .status-passed { background: #10b981; }
        .status-warning { background: #f59e0b; }
        .status-failed { background: #ef4444; }
        .rule-content { flex: 1; }
        .rule-name { font-weight: 500; color: #374151; margin-bottom: 4px; }
        .rule-reason { font-size: 12px; color: #6b7280; }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 12px; 
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
        }
        .print-button:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">打印/保存为PDF</button>
    
    <div class="container">
        <div class="header">
            <h1>ESG合规检测报告</h1>
            <p><strong>${companyName}</strong></p>
            <p>检测时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>总体合规率</h3>
                <p class="value">${complianceData.overall.rate}%</p>
            </div>
            <div class="summary-card">
                <h3>通过项目</h3>
                <p class="value">${complianceData.overall.passed}</p>
            </div>
            <div class="summary-card">
                <h3>警告项目</h3>
                <p class="value">${complianceData.overall.warnings}</p>
            </div>
            <div class="summary-card">
                <h3>不合规项目</h3>
                <p class="value">${complianceData.overall.failed}</p>
            </div>
        </div>

        <div class="section">
            <h2>详细检测结果</h2>
            
            <div class="category">
                <h3>环境 (E) <span>${complianceData.categories.environmental.rate}%</span></h3>
                <div class="progress-bar">
                    <div class="progress-fill ${complianceData.categories.environmental.rate >= 70 ? 'high' : complianceData.categories.environmental.rate >= 40 ? 'medium' : 'low'}" 
                         style="width: ${complianceData.categories.environmental.rate}%"></div>
                </div>
                ${complianceData.categories.environmental.rules.map((rule: any) => `
                    <div class="rule-item">
                        <div class="rule-status status-${rule.status === 'passed' ? 'passed' : rule.status === 'warning' ? 'warning' : 'failed'}">
                            ${rule.status === 'passed' ? '✓' : rule.status === 'warning' ? '!' : '✗'}
                        </div>
                        <div class="rule-content">
                            <div class="rule-name">${rule.name}</div>
                            ${rule.reason ? `<div class="rule-section"><strong>📊 分析评估:</strong> ${rule.reason}</div>` : ''}
                            ${rule.details ? `<div class="rule-section"><strong>🔍 检测依据:</strong> ${rule.details}</div>` : ''}
                            ${rule.improvements ? `<div class="rule-section"><strong>💡 改进建议:</strong> ${rule.improvements}</div>` : ''}
                            ${rule.futureDirection ? `<div class="rule-section"><strong>🚀 未来发展方向:</strong> ${rule.futureDirection}</div>` : ''}
                            ${rule.riskAlert ? `<div class="rule-section"><strong>⚠️ 风险预警:</strong> ${rule.riskAlert}</div>` : ''}
                            ${rule.industryBenchmark ? `<div class="rule-section"><strong>🏆 行业对标:</strong> ${rule.industryBenchmark}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="category">
                <h3>社会 (S) <span>${complianceData.categories.social.rate}%</span></h3>
                <div class="progress-bar">
                    <div class="progress-fill ${complianceData.categories.social.rate >= 70 ? 'high' : complianceData.categories.social.rate >= 40 ? 'medium' : 'low'}" 
                         style="width: ${complianceData.categories.social.rate}%"></div>
                </div>
                ${complianceData.categories.social.rules.map((rule: any) => `
                    <div class="rule-item">
                        <div class="rule-status status-${rule.status === 'passed' ? 'passed' : rule.status === 'warning' ? 'warning' : 'failed'}">
                            ${rule.status === 'passed' ? '✓' : rule.status === 'warning' ? '!' : '✗'}
                        </div>
                        <div class="rule-content">
                            <div class="rule-name">${rule.name}</div>
                            ${rule.reason ? `<div class="rule-section"><strong>📊 分析评估:</strong> ${rule.reason}</div>` : ''}
                            ${rule.details ? `<div class="rule-section"><strong>🔍 检测依据:</strong> ${rule.details}</div>` : ''}
                            ${rule.improvements ? `<div class="rule-section"><strong>💡 改进建议:</strong> ${rule.improvements}</div>` : ''}
                            ${rule.futureDirection ? `<div class="rule-section"><strong>🚀 未来发展方向:</strong> ${rule.futureDirection}</div>` : ''}
                            ${rule.riskAlert ? `<div class="rule-section"><strong>⚠️ 风险预警:</strong> ${rule.riskAlert}</div>` : ''}
                            ${rule.industryBenchmark ? `<div class="rule-section"><strong>🏆 行业对标:</strong> ${rule.industryBenchmark}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="category">
                <h3>治理 (G) <span>${complianceData.categories.governance.rate}%</span></h3>
                <div class="progress-bar">
                    <div class="progress-fill ${complianceData.categories.governance.rate >= 70 ? 'high' : complianceData.categories.governance.rate >= 40 ? 'medium' : 'low'}" 
                         style="width: ${complianceData.categories.governance.rate}%"></div>
                </div>
                ${complianceData.categories.governance.rules.map((rule: any) => `
                    <div class="rule-item">
                        <div class="rule-status status-${rule.status === 'passed' ? 'passed' : rule.status === 'warning' ? 'warning' : 'failed'}">
                            ${rule.status === 'passed' ? '✓' : rule.status === 'warning' ? '!' : '✗'}
                        </div>
                        <div class="rule-content">
                            <div class="rule-name">${rule.name}</div>
                            ${rule.reason ? `<div class="rule-section"><strong>📊 分析评估:</strong> ${rule.reason}</div>` : ''}
                            ${rule.details ? `<div class="rule-section"><strong>🔍 检测依据:</strong> ${rule.details}</div>` : ''}
                            ${rule.improvements ? `<div class="rule-section"><strong>💡 改进建议:</strong> ${rule.improvements}</div>` : ''}
                            ${rule.futureDirection ? `<div class="rule-section"><strong>🚀 未来发展方向:</strong> ${rule.futureDirection}</div>` : ''}
                            ${rule.riskAlert ? `<div class="rule-section"><strong>⚠️ 风险预警:</strong> ${rule.riskAlert}</div>` : ''}
                            ${rule.industryBenchmark ? `<div class="rule-section"><strong>🏆 行业对标:</strong> ${rule.industryBenchmark}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <p>本报告由ESG智能分析平台自动生成</p>
            <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
    </div>

    <script>
        // 页面加载完成后自动弹出打印对话框
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 500);
        }
        
        // 监听打印完成事件
        window.onafterprint = function() {
            setTimeout(() => {
                window.close();
            }, 1000);
        }
    </script>
</body>
</html>`;

      printWindow.document.write(printContent);
      printWindow.document.close();

      notify.success('报告生成成功', '打印对话框已打开，请选择"保存为PDF"或直接打印')
    } catch (error) {
      console.error('导出报告错误:', error)
      notify.error('导出失败', '导出报告时出现错误')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">ESG合规检测</h1>
                <p className="text-gray-600 mt-1">根据预定义规则检测企业ESG合规状态</p>
            </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadAnalysisHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
          <Button variant="outline" onClick={exportComplianceReport} disabled={!complianceData}>
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </Button>
        </div>
      </div>

      {/* 分析结果选择 */}
      <Card>
        <CardHeader>
          <CardTitle>选择分析结果</CardTitle>
          <CardDescription>
            选择要进行合规检测的ESG分析结果
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择分析结果" />
                </SelectTrigger>
                <SelectContent>
                  {analysisHistory.map((analysis) => {
                    // 生成显示文本
                    const companyName = 
                      analysis.entities?.find((e: any) => e.type === '公司名称')?.value ||
                      analysis.entities?.find((e: any) => e.type === 'company')?.value ||
                      analysis.entities?.find((e: any) => e.type === 'organization')?.value ||
                      analysis.entities?.find((e: any) => e.name && (e.name.includes('公司') || e.name.includes('集团') || e.name.includes('企业')))?.name ||
                      analysis.file_name?.replace(/\.(txt|pdf|docx?)$/i, '') ||
                      '未知公司';
                    
                    const analysisTime = analysis.created_at || analysis.timestamp || analysis.createdAt;
                    const timeDisplay = analysisTime ? new Date(analysisTime).toLocaleString('zh-CN') : '未知时间';
                    const displayText = `${companyName} - ${timeDisplay}`;
                    
                    return (
                      <SelectItem key={analysis.id} value={displayText}>
                        {displayText}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleComplianceCheck} 
              disabled={!selectedAnalysis || isChecking}
              className="min-w-[120px]"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  检测中...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  开始检测
                </>
              )}
            </Button>
          </div>
          
          {selectedAnalysis && analysisHistory.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-2">选中的分析结果:</h4>
              {(() => {
                // 根据选择的显示文本找到对应的分析记录
                const analysis = analysisHistory.find(a => {
                  const companyName = 
                    a.entities?.find((e: any) => e.type === '公司名称')?.value ||
                    a.entities?.find((e: any) => e.type === 'company')?.value ||
                    a.entities?.find((e: any) => e.type === 'organization')?.value ||
                    a.entities?.find((e: any) => e.name && (e.name.includes('公司') || e.name.includes('集团') || e.name.includes('企业')))?.name ||
                    a.file_name?.replace(/\.(txt|pdf|docx?)$/i, '') ||
                    '未知公司';
                  
                  const analysisTime = a.created_at || a.timestamp || a.createdAt;
                  const timeDisplay = analysisTime ? new Date(analysisTime).toLocaleString('zh-CN') : '未知时间';
                  const displayText = `${companyName} - ${timeDisplay}`;
                  
                  return displayText === selectedAnalysis;
                });
                
                if (!analysis) return null
                
                // 获取公司名称
                const companyName = 
                  analysis.entities?.find((e: any) => e.type === '公司名称')?.value ||
                  analysis.entities?.find((e: any) => e.type === 'company')?.value ||
                  analysis.entities?.find((e: any) => e.type === 'organization')?.value ||
                  analysis.entities?.find((e: any) => e.name && (e.name.includes('公司') || e.name.includes('集团') || e.name.includes('企业')))?.name ||
                  analysis.file_name?.replace(/\.(txt|pdf|docx?)$/i, '') ||
                  '未知公司';
                
                // 获取分析时间
                const analysisTime = analysis.created_at || analysis.timestamp || analysis.createdAt;
                const timeDisplay = analysisTime ? new Date(analysisTime).toLocaleString('zh-CN') : '未知时间';
                
                // 获取ESG评分
                const esgScores = analysis.esg_scores || analysis.esgScores || {};
                
                return (
                  <div className="space-y-2 text-sm">
                    <p><strong>公司:</strong> {companyName}</p>
                    <p><strong>分析时间:</strong> {timeDisplay}</p>
                    <p><strong>ESG评分:</strong> 
                      环境 {esgScores.environmental || 0}/10, 
                      社会 {esgScores.social || 0}/10, 
                      治理 {esgScores.governance || 0}/10
                    </p>
                  </div>
                )
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 合规检测结果 */}
      {complianceData && (
        <>
          {/* 合规统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">总体合规率</p>
                    <p className="text-3xl font-bold text-blue-700">{complianceData.overall.rate}%</p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <Progress value={complianceData.overall.rate} className="h-2 mt-4" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">通过项目</p>
                    <p className="text-2xl font-bold text-green-600">{complianceData.overall.passed}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">警告项目</p>
                    <p className="text-2xl font-bold text-yellow-600">{complianceData.overall.warnings}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">不合规项目</p>
                    <p className="text-2xl font-bold text-red-600">{complianceData.overall.failed}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 合规检测详情 */}
          <Card>
            <CardHeader>
              <CardTitle>合规检测详情</CardTitle>
              <CardDescription>
                按ESG三个维度查看合规检测结果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="environmental" className="space-y-4">
                <TabsList>
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
                  <div className="space-y-4">
                    {complianceData.categories.environmental.rules.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">环境合规率: {complianceData.categories.environmental.rate}%</h3>
                          <Progress value={complianceData.categories.environmental.rate} className="w-1/3 h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          {complianceData.categories.environmental.rules.map((rule: any) => (
                            <Card key={rule.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center">
                                    <div className="mr-3">
                                      {getStatusIcon(rule.status)}
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{rule.name}</h4>
                                    </div>
                                  </div>
                                  <div>
                                    {getStatusBadge(rule.status)}
                                  </div>
                                </div>
                                <div className="ml-8 space-y-3">
                                  {/* 分析原因 */}
                                  {rule.reason && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">📊</span>分析评估
                                      </h5>
                                      <p className="text-sm text-gray-600 leading-relaxed">{rule.reason}</p>
                                    </div>
                                  )}
                                  
                                  {/* 检测依据 */}
                                  {rule.details && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">🔍</span>检测依据
                                      </h5>
                                      <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded leading-relaxed">{rule.details}</p>
                                    </div>
                                  )}
                                  
                                  {/* 改进建议 */}
                                  {rule.improvements && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">💡</span>改进建议
                                      </h5>
                                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded leading-relaxed">{rule.improvements}</p>
                                    </div>
                                  )}
                                  
                                  {/* 未来发展方向 */}
                                  {rule.futureDirection && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">🚀</span>未来发展方向
                                      </h5>
                                      <p className="text-sm text-purple-600 bg-purple-50 p-2 rounded leading-relaxed">{rule.futureDirection}</p>
                                    </div>
                                  )}
                                  
                                  {/* 风险预警 */}
                                  {rule.riskAlert && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">⚠️</span>风险预警
                                      </h5>
                                      <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded leading-relaxed">{rule.riskAlert}</p>
                                    </div>
                                  )}
                                  
                                  {/* 行业对标 */}
                                  {rule.industryBenchmark && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">🏆</span>行业对标
                                      </h5>
                                      <p className="text-sm text-green-600 bg-green-50 p-2 rounded leading-relaxed">{rule.industryBenchmark}</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Leaf className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">无环境规则</h3>
                        <p className="text-gray-500">当前配置中未启用任何环境类别的合规规则</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="social">
                  <div className="space-y-4">
                    {complianceData.categories.social.rules.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">社会合规率: {complianceData.categories.social.rate}%</h3>
                          <Progress value={complianceData.categories.social.rate} className="w-1/3 h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          {complianceData.categories.social.rules.map((rule: any) => (
                            <Card key={rule.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center">
                                    <div className="mr-3">
                                      {getStatusIcon(rule.status)}
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{rule.name}</h4>
                                    </div>
                                  </div>
                                  <div>
                                    {getStatusBadge(rule.status)}
                                  </div>
                                </div>
                                <div className="ml-8 space-y-3">
                                  {/* 分析原因 */}
                                  {rule.reason && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">📊</span>分析评估
                                      </h5>
                                      <p className="text-sm text-gray-600 leading-relaxed">{rule.reason}</p>
                                    </div>
                                  )}
                                  
                                  {/* 检测依据 */}
                                  {rule.details && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">🔍</span>检测依据
                                      </h5>
                                      <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded leading-relaxed">{rule.details}</p>
                                    </div>
                                  )}
                                  
                                  {/* 改进建议 */}
                                  {rule.improvements && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">💡</span>改进建议
                                      </h5>
                                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded leading-relaxed">{rule.improvements}</p>
                                    </div>
                                  )}
                                  
                                  {/* 未来发展方向 */}
                                  {rule.futureDirection && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">🚀</span>未来发展方向
                                      </h5>
                                      <p className="text-sm text-purple-600 bg-purple-50 p-2 rounded leading-relaxed">{rule.futureDirection}</p>
                                    </div>
                                  )}
                                  
                                  {/* 风险预警 */}
                                  {rule.riskAlert && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">⚠️</span>风险预警
                                      </h5>
                                      <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded leading-relaxed">{rule.riskAlert}</p>
                                    </div>
                                  )}
                                  
                                  {/* 行业对标 */}
                                  {rule.industryBenchmark && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">🏆</span>行业对标
                                      </h5>
                                      <p className="text-sm text-green-600 bg-green-50 p-2 rounded leading-relaxed">{rule.industryBenchmark}</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">无社会规则</h3>
                        <p className="text-gray-500">当前配置中未启用任何社会类别的合规规则</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="governance">
                  <div className="space-y-4">
                    {complianceData.categories.governance.rules.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">治理合规率: {complianceData.categories.governance.rate}%</h3>
                          <Progress value={complianceData.categories.governance.rate} className="w-1/3 h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          {complianceData.categories.governance.rules.map((rule: any) => (
                            <Card key={rule.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center">
                                    <div className="mr-3">
                                      {getStatusIcon(rule.status)}
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{rule.name}</h4>
                                    </div>
                                  </div>
                                  <div>
                                    {getStatusBadge(rule.status)}
                                  </div>
                                </div>
                                <div className="ml-8 space-y-3">
                                  {/* 分析原因 */}
                                  {rule.reason && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">📊</span>分析评估
                                      </h5>
                                      <p className="text-sm text-gray-600 leading-relaxed">{rule.reason}</p>
                                    </div>
                                  )}
                                  
                                  {/* 检测依据 */}
                                  {rule.details && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">🔍</span>检测依据
                                      </h5>
                                      <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded leading-relaxed">{rule.details}</p>
                                    </div>
                                  )}
                                  
                                  {/* 改进建议 */}
                                  {rule.improvements && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">💡</span>改进建议
                                      </h5>
                                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded leading-relaxed">{rule.improvements}</p>
                                    </div>
                                  )}
                                  
                                  {/* 未来发展方向 */}
                                  {rule.futureDirection && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">🚀</span>未来发展方向
                                      </h5>
                                      <p className="text-sm text-purple-600 bg-purple-50 p-2 rounded leading-relaxed">{rule.futureDirection}</p>
                                    </div>
                                  )}
                                  
                                  {/* 风险预警 */}
                                  {rule.riskAlert && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">⚠️</span>风险预警
                                      </h5>
                                      <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded leading-relaxed">{rule.riskAlert}</p>
                                    </div>
                                  )}
                                  
                                  {/* 行业对标 */}
                                  {rule.industryBenchmark && (
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-1 flex items-center">
                                        <span className="mr-2">🏆</span>行业对标
                                      </h5>
                                      <p className="text-sm text-green-600 bg-green-50 p-2 rounded leading-relaxed">{rule.industryBenchmark}</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Building className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">无治理规则</h3>
                        <p className="text-gray-500">当前配置中未启用任何治理类别的合规规则</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* 空状态 */}
      {!complianceData && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无合规检测结果</h3>
              <p className="text-gray-500 mb-6">
                请选择ESG分析结果并点击"开始检测"按钮进行合规检测
              </p>
              {analysisHistory.length === 0 && (
                <p className="text-sm text-gray-400 mb-4">
                  提示: 请先在"文本分析"页面进行ESG分析，生成分析结果后即可进行合规检测
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 合规规则管理 */}
      <Card>
        <CardHeader>
          <CardTitle>合规规则管理</CardTitle>
          <CardDescription>
            查看和管理ESG合规检测规则
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={rule.enabled}
                    onCheckedChange={(checked) => updateRuleStatus(rule.id, checked as boolean)}
                  />
                  <div>
                    <h4 className="font-medium">{rule.name}</h4>
                    <p className="text-sm text-gray-500">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={rule.category === 'environmental' ? 'default' : rule.category === 'social' ? 'secondary' : 'outline'}>
                    {rule.category === 'environmental' ? '环境' : rule.category === 'social' ? '社会' : '治理'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={importRules}>
                <Upload className="h-4 w-4 mr-2" />
                导入规则
              </Button>
              <Button variant="outline" onClick={exportRules}>
                <Download className="h-4 w-4 mr-2" />
                导出规则
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              {rulesModified && (
                <span className="text-sm text-orange-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  配置已修改
                </span>
              )}
              <Button 
                onClick={saveRulesConfig}
                disabled={!rulesModified}
                className={rulesModified ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                <Settings className="h-4 w-4 mr-2" />
                保存配置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}