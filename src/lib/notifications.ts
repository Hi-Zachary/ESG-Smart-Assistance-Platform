// 通知系统
export interface Notification {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

class NotificationManager {
  private notifications: Notification[] = []
  private listeners: ((notifications: Notification[]) => void)[] = []

  // 添加通知
  add(notification: Omit<Notification, 'id'>): string {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    }

    this.notifications.unshift(newNotification)
    this.notifyListeners()

    // 自动移除通知
    if (newNotification.duration > 0) {
      setTimeout(() => {
        this.remove(id)
      }, newNotification.duration)
    }

    return id
  }

  // 移除通知
  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.notifyListeners()
  }

  // 清空所有通知
  clear() {
    this.notifications = []
    this.notifyListeners()
  }

  // 获取所有通知
  getAll(): Notification[] {
    return [...this.notifications]
  }

  // 订阅通知变化
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]))
  }
}

export const notificationManager = new NotificationManager()

// 便捷方法
export const notify = {
  success: (title: string, description?: string) => 
    notificationManager.add({ title, description, type: 'success' }),
  
  error: (title: string, description?: string) => 
    notificationManager.add({ title, description, type: 'error' }),
  
  warning: (title: string, description?: string) => 
    notificationManager.add({ title, description, type: 'warning' }),
  
  info: (title: string, description?: string) => 
    notificationManager.add({ title, description, type: 'info' })
}