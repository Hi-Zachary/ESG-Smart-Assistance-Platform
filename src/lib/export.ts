// 导出功能工具函数
export const exportUtils = {
  // 导出为JSON格式
  exportToJSON: (data: any, filename: string = 'esg-analysis') => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    downloadFile(blob, `${filename}.json`)
  },

  // 导出为CSV格式
  exportToCSV: (data: any[], filename: string = 'esg-data') => {
    if (!data.length) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // 处理包含逗号或引号的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `${filename}.csv`)
  },

  // 导出分析报告为PDF格式（通过打印功能）
  exportAnalysisReport: (analysisResult: any, filename: string = 'esg-analysis-report') => {
    const htmlContent = generateAnalysisReportHTML(analysisResult, true) // 传入true表示为PDF优化
    
    // 创建一个新窗口来显示报告并触发打印
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // 等待内容加载完成后触发打印
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // 打印完成后关闭窗口
          printWindow.onafterprint = () => {
            printWindow.close()
          }
        }, 1000)
      }
    } else {
      // 如果无法打开新窗口，则回退到HTML下载
      const blob = new Blob([htmlContent], { type: 'text/html' })
      downloadFile(blob, `${filename}.html`)
    }
  },

  // 导出分析报告为HTML格式（备用方法）
  exportAnalysisReportHTML: (analysisResult: any, filename: string = 'esg-analysis-report') => {
    const htmlContent = generateAnalysisReportHTML(analysisResult, false)
    const blob = new Blob([htmlContent], { type: 'text/html' })
    downloadFile(blob, `${filename}.html`)
  },

  // 导出历史记录
  exportHistoryData: (historyData: any[], format: 'json' | 'csv' = 'json') => {
    if (format === 'csv') {
      const csvData = historyData.map(item => {
        // 从rawData中获取更详细的信息
        const rawData = item.rawData || {}
        const esgScores = rawData.esg_scores || {}
        const entities = rawData.entities || []
        
        return {
          '公司名称': item.company || entities.find((e: any) => e.type === '公司名称')?.value || '未知公司',
          '报告类型': item.reportType || entities.find((e: any) => e.type === '报告类型')?.value || '未知类型',
          '分析日期': item.analysisDate || (rawData.created_at ? new Date(rawData.created_at).toLocaleDateString('zh-CN') : ''),
          'ESG总评分': item.esgScore || esgScores.overall || 0,
          '环境评分': esgScores.environmental || 0,
          '社会评分': esgScores.social || 0,
          '治理评分': esgScores.governance || 0,
          '合规率': item.complianceRate || Math.round((esgScores.overall || 0) * 10) + '%',
          '状态': item.status === 'completed' ? '已完成' : item.status === 'processing' ? '处理中' : item.status === 'failed' ? '失败' : item.status || '未知',
          '分析师': item.analyst || '系统分析',
          '关键洞察数量': (rawData.key_insights || []).length,
          '风险预警数量': (rawData.risks || []).length,
          '数据来源': rawData.source || 'deepseek-api'
        }
      })
      exportUtils.exportToCSV(csvData, 'esg-history')
    } else {
      // 导出完整的JSON数据，包含rawData
      const enrichedData = historyData.map(item => ({
        ...item,
        exportTime: new Date().toISOString(),
        detailedAnalysis: item.rawData || {}
      }))
      exportUtils.exportToJSON(enrichedData, 'esg-history')
    }
  },

  // 导出仪表板报告为PDF格式
  exportDashboardReport: (dashboardData: any, filename: string = 'esg-dashboard-report') => {
    const htmlContent = generateDashboardReportHTML(dashboardData)
    
    // 创建一个新窗口来显示报告并触发打印
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // 等待内容加载完成后触发打印
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // 打印完成后关闭窗口
          printWindow.onafterprint = () => {
            printWindow.close()
          }
        }, 1000)
      }
    } else {
      // 如果无法打开新窗口，则回退到HTML下载
      const blob = new Blob([htmlContent], { type: 'text/html' })
      downloadFile(blob, `${filename}.html`)
    }
  }
}

// 下载文件的通用函数
function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// 生成仪表板报告HTML
function generateDashboardReportHTML(dashboardData: any): string {
  const currentDate = new Date().toLocaleString('zh-CN')
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESG智能分析仪表板报告</title>
    <style>
        @media print {
            body { 
                margin: 0; 
                padding: 0; 
                background-color: white !important;
                font-size: 12pt;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            .container {
                box-shadow: none !important;
                border-radius: 0 !important;
                padding: 20px !important;
                margin: 0 !important;
                max-width: none !important;
            }
            .stats-grid {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 15px !important;
            }
            .section {
                page-break-inside: avoid;
            }
            .no-print {
                display: none !important;
            }
        }
        @page {
            margin: 1cm;
            size: A4;
        }
        
        body {
            font-family: 'Microsoft YaHei', 'SimSun', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 1.1em;
            opacity: 0.9;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            color: #007bff;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        .analysis-item {
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #007bff;
            background-color: #f8f9fa;
            border-radius: 0 8px 8px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .analysis-info h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        .analysis-info p {
            margin: 0;
            color: #666;
            font-size: 0.9em;
        }
        .analysis-score {
            font-size: 1.5em;
            font-weight: bold;
            color: #007bff;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #e9ecef;
            padding-top: 20px;
        }
        .no-data {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .print-instruction {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="print-instruction no-print">
            <p><strong>提示：</strong>请在打印对话框中选择"另存为PDF"或"打印到PDF"来保存为PDF文件</p>
            <button class="print-button no-print" onclick="window.print()">打印/保存为PDF</button>
        </div>
        
        <div class="header">
            <h1>ESG智能分析仪表板报告</h1>
            <p>数据统计与分析概览</p>
            <p>报告生成时间: ${currentDate}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${dashboardData.todayAnalysis || 0}</div>
                <div class="stat-label">今日分析</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${dashboardData.avgEsgScore > 0 ? dashboardData.avgEsgScore.toFixed(1) : '暂无'}</div>
                <div class="stat-label">平均ESG评分</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${dashboardData.complianceRate > 0 ? dashboardData.complianceRate + '%' : '暂无'}</div>
                <div class="stat-label">合规率</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${dashboardData.riskAlerts || 0}</div>
                <div class="stat-label">风险预警</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${dashboardData.totalAnalysis || 0}</div>
                <div class="stat-label">总分析次数</div>
            </div>
        </div>

        <div class="section">
            <h2>最近分析记录</h2>
            ${dashboardData.recentAnalysis && dashboardData.recentAnalysis.length > 0 ? 
                dashboardData.recentAnalysis.map((item: any) => `
                    <div class="analysis-item">
                        <div class="analysis-info">
                            <h4>${item.company}</h4>
                            <p>${item.type} · ${item.date}</p>
                        </div>
                        <div class="analysis-score">${item.score}</div>
                    </div>
                `).join('') 
                : '<div class="no-data">暂无分析记录</div>'
            }
        </div>

        <div class="section">
            <h2>系统概览</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <p><strong>系统状态：</strong> 正常运行</p>
                <p><strong>数据来源：</strong> DeepSeek AI API</p>
                <p><strong>分析能力：</strong> ESG文本分析、合规检测、风险预警</p>
                <p><strong>支持格式：</strong> 文本、PDF、Word文档</p>
            </div>
        </div>

        <div class="footer">
            <p>本报告由ESG智能分析平台自动生成</p>
            <p>报告生成时间: ${currentDate}</p>
            <p>数据统计截止时间: ${currentDate}</p>
        </div>
    </div>
</body>
</html>
  `
}

// 生成分析报告HTML
function generateAnalysisReportHTML(analysisResult: any, forPrint: boolean = false): string {
  const currentDate = new Date().toLocaleDateString('zh-CN')
  
  // 兼容不同的数据结构
  const esgScores = analysisResult?.esg_scores || analysisResult?.esgScores || {}
  const keyInsights = analysisResult?.key_insights || analysisResult?.keyInsights || []
  const risks = analysisResult?.risks || []
  const entities = analysisResult?.entities || []
  const createdAt = analysisResult?.created_at ? new Date(analysisResult.created_at).toLocaleString('zh-CN') : currentDate
  
  // 获取公司名称
  const companyName = entities.find((e: any) => e.type === '公司名称')?.value || 
                     entities.find((e: any) => e.type === 'company')?.value || 
                     '未知公司'
  
  // 获取报告类型
  const reportType = entities.find((e: any) => e.type === '报告类型')?.value || 
                    entities.find((e: any) => e.type === 'report_type')?.value || 
                    '未知类型'
  
  // PDF打印样式
  const printStyles = forPrint ? `
    @media print {
      body { 
        margin: 0; 
        padding: 0; 
        background-color: white !important;
        font-size: 12pt;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      .container {
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 20px !important;
        margin: 0 !important;
        max-width: none !important;
      }
      .score-section {
        background: #f5f5f5 !important;
        color: #333 !important;
        border: 1px solid #ddd !important;
        page-break-inside: avoid;
      }
      .score-value {
        color: #333 !important;
      }
      .section {
        page-break-inside: avoid;
      }
      .page-break {
        page-break-before: always;
      }
      .no-print {
        display: none !important;
      }
    }
    @page {
      margin: 1cm;
      size: A4;
    }
  ` : ''
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESG分析报告 - ${companyName}</title>
    <style>
        ${printStyles}
        
        body {
            font-family: 'Microsoft YaHei', 'SimSun', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .company-info {
            background-color: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .score-section {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            padding: 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            color: white;
        }
        .score-item {
            text-align: center;
            flex: 1;
        }
        .score-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .score-label {
            font-size: 1.1em;
            opacity: 0.9;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            color: #007bff;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        .insight-item, .risk-item {
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #007bff;
            background-color: #f8f9fa;
            border-radius: 0 8px 8px 0;
        }
        .risk-high { 
            border-left-color: #dc3545; 
            background-color: #f8d7da;
        }
        .risk-medium { 
            border-left-color: #ffc107; 
            background-color: #fff3cd;
        }
        .risk-low { 
            border-left-color: #28a745; 
            background-color: #d4edda;
        }
        .entities-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .entity-item {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .entity-type {
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }
        .entity-value {
            color: #333;
        }
        .entity-confidence {
            font-size: 0.8em;
            color: #666;
            margin-top: 5px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #e9ecef;
            padding-top: 20px;
        }
        .no-data {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .print-instruction {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        ${forPrint ? `
        <div class="print-instruction no-print">
            <p><strong>提示：</strong>请在打印对话框中选择"另存为PDF"或"打印到PDF"来保存为PDF文件</p>
        </div>
        ` : ''}
        
        <div class="header">
            <h1>ESG分析报告</h1>
            <p><strong>${companyName}</strong> - ${reportType}</p>
            <p>分析时间: ${createdAt}</p>
        </div>

        <div class="company-info">
            <h3>基本信息</h3>
            <p><strong>公司名称:</strong> ${companyName}</p>
            <p><strong>报告类型:</strong> ${reportType}</p>
            <p><strong>分析日期:</strong> ${createdAt}</p>
        </div>

        <div class="score-section">
            <div class="score-item">
                <div class="score-value">${esgScores.environmental || 0}</div>
                <div class="score-label">环境 (E)</div>
            </div>
            <div class="score-item">
                <div class="score-value">${esgScores.social || 0}</div>
                <div class="score-label">社会 (S)</div>
            </div>
            <div class="score-item">
                <div class="score-value">${esgScores.governance || 0}</div>
                <div class="score-label">治理 (G)</div>
            </div>
            <div class="score-item">
                <div class="score-value">${esgScores.overall || 0}</div>
                <div class="score-label">总体评分</div>
            </div>
        </div>

        <div class="section">
            <h2>实体识别</h2>
            ${entities.length > 0 ? `
                <div class="entities-section">
                    ${entities.map((entity: any) => `
                        <div class="entity-item">
                            <div class="entity-type">${entity.type}</div>
                            <div class="entity-value">${entity.value}</div>
                            ${entity.confidence ? `<div class="entity-confidence">置信度: ${Math.round(entity.confidence * 100)}%</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : '<div class="no-data">暂无实体识别数据</div>'}
        </div>

        <div class="section">
            <h2>关键洞察</h2>
            ${keyInsights.length > 0 ? 
                keyInsights.map((insight: string, index: number) => 
                    `<div class="insight-item"><strong>${index + 1}.</strong> ${insight}</div>`
                ).join('') 
                : '<div class="no-data">暂无关键洞察数据</div>'
            }
        </div>

        <div class="section">
            <h2>风险预警</h2>
            ${risks.length > 0 ? 
                risks.map((risk: any) => 
                    `<div class="risk-item risk-${risk.level}">
                        <strong>[${risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}]</strong> 
                        ${risk.description}
                    </div>`
                ).join('') 
                : '<div class="no-data">暂无风险预警数据</div>'
            }
        </div>

        ${analysisResult?.input_text ? `
            <div class="section page-break">
                <h2>分析文本摘要</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; font-size: 0.9em; line-height: 1.5;">
                    <p>${analysisResult.input_text.substring(0, 800)}${analysisResult.input_text.length > 800 ? '...' : ''}</p>
                </div>
            </div>
        ` : ''}

        <div class="footer">
            <p>本报告由ESG智能分析平台生成</p>
            <p>报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
    </div>
</body>
</html>
  `
}