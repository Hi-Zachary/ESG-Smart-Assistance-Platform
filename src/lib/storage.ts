// 本地存储工具函数 - 仅作为备用，主要使用后端API
export const storage = {
  // 清空本地存储
  clearAll: () => {
    localStorage.removeItem('esg-analysis-results')
    localStorage.removeItem('userInfo')
  },

  // 获取所有分析结果 - 仅作为备用
  getAnalysisResults: () => {
    try {
      const results = localStorage.getItem('esg-analysis-results')
      return results ? JSON.parse(results) : []
    } catch {
      return []
    }
  },

  // 保存分析结果
  saveAnalysisResult: (result: any) => {
    const results = storage.getAnalysisResults()
    const newResult = { ...result, id: new Date().toISOString(), savedAt: new Date().toISOString() }
    results.unshift(newResult)
    localStorage.setItem('esg-analysis-results', JSON.stringify(results))
  },

  // 删除分析结果
  deleteAnalysisResult: (id: string) => {
    const results = storage.getAnalysisResults()
    const filtered = results.filter((result: any) => result.id !== id)
    localStorage.setItem('esg-analysis-results', JSON.stringify(filtered))
  },

  // 清空所有结果
  clearAnalysisResults: () => {
    localStorage.removeItem('esg-analysis-results')
  },

  // 保存用户设置
  saveSettings: (settings: any) => {
    localStorage.setItem('esg-settings', JSON.stringify(settings))
  },

  // 获取用户设置
  getSettings: () => {
    try {
      const settings = localStorage.getItem('esg-settings')
      return settings ? JSON.parse(settings) : {
        theme: 'light',
        autoSave: true,
        notifications: true
      }
    } catch {
      return {
        theme: 'light',
        autoSave: true,
        notifications: true
      }
    }
  }
}