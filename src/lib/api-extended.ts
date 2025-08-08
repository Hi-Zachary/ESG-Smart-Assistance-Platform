
// 文件上传分析
export async function analyzeFile(file: File): Promise<any> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token');
    const response = await fetch('/api/analyze/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`文件上传失败: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('文件上传分析失败:', error)
    throw error
  }
}

// 获取分析历史
export async function getAnalysisHistory(params: {
  page?: number
  limit?: number
  search?: string
  status?: string
} = {}): Promise<any> {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)

    const token = localStorage.getItem('token');
    const response = await fetch(`/api/history?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`获取历史记录失败: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('获取历史记录失败:', error)
    throw error
  }
}

// 获取单个分析结果
export async function getAnalysisById(id: string): Promise<any> {
  try {
    const response = await fetch(`/api/analysis/${id}`)
    
    if (!response.ok) {
      throw new Error(`获取分析结果失败: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('获取分析结果失败:', error)
    throw error
  }
}

// 删除分析结果
export async function deleteAnalysis(id: string): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/analysis/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`删除分析结果失败: ${response.status}`)
    }
  } catch (error) {
    console.error('删除分析结果失败:', error)
    throw error
  }
}

// 合规检测
export async function checkCompliance(analysisId: string): Promise<any> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/compliance/check', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ analysisId })
    })
    
    if (!response.ok) {
      throw new Error(`合规检测失败: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('合规检测失败:', error)
    throw error
  }
}

// 获取合规规则
export async function getComplianceRules(): Promise<any> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/compliance/rules', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`获取合规规则失败: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('获取合规规则失败:', error)
    throw error
  }
}

// 更新合规规则
export async function updateComplianceRule(id: string, updates: any): Promise<any> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/compliance/rules/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      throw new Error(`更新合规规则失败: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('更新合规规则失败:', error)
    throw error
  }
}

// 获取统计数据
export async function getStats(): Promise<any> {
  try {
    const response = await fetch('/api/stats')
    
    if (!response.ok) {
      throw new Error(`获取统计数据失败: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('获取统计数据失败:', error)
    throw error
  }
}

// 检查API连接状态
export async function checkAPIConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/health')
    return response.ok
  } catch {
    return false
  }
}