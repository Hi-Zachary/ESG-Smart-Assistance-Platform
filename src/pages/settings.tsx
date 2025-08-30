import { useState, useEffect } from 'react'
import {
    Settings as SettingsIcon,
    User,
    Bell,
    Database,
    Moon,
    Sun,
    Save,
    X
} from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { notify } from '@/lib/notifications'

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        profile: {
            name: '',
            email: '',
            avatar: ''
        },
        preferences: {
            theme: 'light',
            language: 'zh-CN',
            timezone: 'Asia/Shanghai'
        },
        notifications: {
            email: true,
            push: true,
            weeklyReport: false,
            riskAlerts: true
        },
        data: {
            autoBackup: true,
            backupFrequency: 'weekly',
            exportFormat: 'csv'
        }
    })

    const [isLoading, setIsLoading] = useState(true)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        const loadSettings = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 800))

                const mockSettings = {
                    profile: {
                        name: '',
                        email: '',
                        avatar: ''
                    },
                    preferences: {
                        theme: 'light',
                        language: 'zh-CN',
                        timezone: 'Asia/Shanghai'
                    },
                    notifications: {
                        email: true,
                        push: true,
                        weeklyReport: false,
                        riskAlerts: true
                    },
                    data: {
                        autoBackup: true,
                        backupFrequency: 'weekly',
                        exportFormat: 'csv'
                    }
                }

                setSettings(mockSettings)
                setIsLoading(false)
            } catch (error) {
                console.error('加载设置失败:', error)
                notify.error('加载失败', '无法加载用户设置')
            }
        }

        loadSettings()
    }, [])

    const handleChange = (section: string, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev],
                [key]: value
            }
        }))
        setHasChanges(true)
    }

    const handleSave = () => {
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            setHasChanges(false)
            notify.success('设置已保存', '您的偏好设置已更新')
        }, 1000)
    }

    return (
        <div className="p-6 space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <SettingsIcon className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
                        <p className="text-gray-600 mt-1">管理您的账户偏好和系统配置</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    {hasChanges && (
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            <X className="h-4 w-4 mr-2" />
                            放弃更改
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={!hasChanges || isLoading}>
                        {isLoading ? (
                            <span className="animate-pulse">保存中...</span>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                保存更改
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* 设置内容区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* 个人资料设置 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="h-5 w-5 mr-2 text-blue-600" />
                                个人资料
                            </CardTitle>
                            <CardDescription>更新您的个人信息和联系方式</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                                    {settings.profile.avatar ? (
                                        <img
                                            src={settings.profile.avatar}
                                            alt="用户头像"
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-8 w-8 text-gray-500" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Button variant="outline" size="sm">
                                        更换头像
                                    </Button>
                                    <p className="text-xs text-gray-500">支持 JPG, PNG 格式，最大 2MB</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        用户名
                                    </label>
                                    <Input
                                        id="name"
                                        value={settings.profile.name}
                                        onChange={(e) => handleChange('profile', 'name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        电子邮箱
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={settings.profile.email}
                                        onChange={(e) => handleChange('profile', 'email', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 偏好设置 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Moon className="h-5 w-5 mr-2 text-purple-600" />
                                显示偏好
                            </CardTitle>
                            <CardDescription>自定义界面外观和行为</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                                        主题模式
                                    </label>
                                    <p className="text-sm text-gray-500">选择亮色或暗色主题</p>
                                </div>
                                <Select
                                    value={settings.preferences.theme}
                                    onValueChange={(value) => handleChange('preferences', 'theme', value)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="选择主题" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">
                                            <div className="flex items-center">
                                                <Sun className="h-4 w-4 mr-2" />
                                                亮色模式
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            <div className="flex items-center">
                                                <Moon className="h-4 w-4 mr-2" />
                                                暗色模式
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="system">
                                            <div className="flex items-center">
                                                <SettingsIcon className="h-4 w-4 mr-2" />
                                                系统默认
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                        </CardContent>
                    </Card>

                    {/* 通知设置 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Bell className="h-5 w-5 mr-2 text-orange-600" />
                                通知设置
                            </CardTitle>
                            <CardDescription>管理您接收通知的方式和频率</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label htmlFor="email-notifications" className="block text-sm font-medium text-gray-700 mb-1">
                                        电子邮件通知
                                    </label>
                                    <p className="text-sm text-gray-500">重要系统通知和分析报告</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="email-notifications"
                                        className="sr-only peer"
                                        checked={settings.notifications.email}
                                        onChange={(e) => handleChange('notifications', 'email', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label htmlFor="push-notifications" className="block text-sm font-medium text-gray-700 mb-1">
                                        推送通知
                                    </label>
                                    <p className="text-sm text-gray-500">实时风险预警和系统提醒</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="push-notifications"
                                        className="sr-only peer"
                                        checked={settings.notifications.push}
                                        onChange={(e) => handleChange('notifications', 'push', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label htmlFor="weekly-report" className="block text-sm font-medium text-gray-700 mb-1">
                                        每周摘要报告
                                    </label>
                                    <p className="text-sm text-gray-500">每周一发送上周分析摘要</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="weekly-report"
                                        className="sr-only peer"
                                        checked={settings.notifications.weeklyReport}
                                        onChange={(e) => handleChange('notifications', 'weeklyReport', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>


                    {/* 数据管理 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Database className="h-5 w-5 mr-2 text-green-600" />
                                数据管理
                            </CardTitle>
                            <CardDescription>配置数据备份和导出选项</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label htmlFor="auto-backup" className="block text-sm font-medium text-gray-700 mb-1">
                                        自动备份
                                    </label>
                                    <p className="text-sm text-gray-500">定期备份您的分析数据</p>
                                </div>
                                <input
                                    type="checkbox"
                                    id="auto-backup"
                                    className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={settings.data.autoBackup}
                                    onChange={(e) => handleChange('data', 'autoBackup', e.target.checked)}
                                />
                            </div>

                            {settings.data.autoBackup && (
                                <div>
                                    <label htmlFor="backup-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                                        备份频率
                                    </label>
                                    <Select
                                        value={settings.data.backupFrequency}
                                        onValueChange={(value) => handleChange('data', 'backupFrequency', value)}
                                    >
                                        <SelectTrigger id="backup-frequency" className="w-full">
                                            <SelectValue placeholder="选择备份频率" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">每日</SelectItem>
                                            <SelectItem value="weekly">每周</SelectItem>
                                            <SelectItem value="monthly">每月</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div>
                                <label htmlFor="export-format" className="block text-sm font-medium text-gray-700 mb-1">
                                    默认导出格式
                                </label>
                                <Select
                                    value={settings.data.exportFormat}
                                    onValueChange={(value) => handleChange('data', 'exportFormat', value)}
                                >
                                    <SelectTrigger id="export-format" className="w-full">
                                        <SelectValue placeholder="选择导出格式" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="csv">CSV</SelectItem>
                                        <SelectItem value="excel">Excel</SelectItem>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Button variant="outline" className="w-full">
                                    立即备份数据
                                </Button>
                                <Button variant="outline" className="w-full">
                                    导出所有分析数据
                                </Button>
                                <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                                    清除本地缓存
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
