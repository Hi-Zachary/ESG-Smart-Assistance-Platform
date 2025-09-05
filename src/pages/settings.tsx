import { useEffect, useState } from 'react'
import { storage } from '@/lib/storage'
import { exportUtils } from '@/lib/export'
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
import { useAuth } from '@/lib/auth-context'
import { getAnalysisHistory } from '@/lib/api-extended'

export default function SettingsPage() {

    const [isLoading, setIsLoading] = useState(false)
    const [storedInfo, setStoredInfo] = useState(JSON.parse(localStorage.getItem('userInfo') || 'null'))
    const useAuthFunc = useAuth()

    const [userInfo, setUserInfo] = useState({
        user: {
            name: useAuthFunc.user?.username,
            email: useAuthFunc.user?.email,
            avatar: useAuthFunc.user?.avatar
        },
        data: {
            leadOutFormat: useAuthFunc.user?.exportFormat
        }
    })

    async function handleSave(){
        setIsLoading(true)
        try {
            await localStorage.setItem('userInfo', JSON.stringify({
                ...userInfo,
                user: {
                    ...userInfo.user,
                    avatar: userInfo.user.avatar !== '' ? userInfo.user.avatar : storedInfo.user.avatar
                }
            }))
            useAuthFunc.updateUser({
                ...useAuthFunc.user,
                username: userInfo.user.name !== '' ? userInfo.user.name : useAuthFunc.user?.username,
                email: userInfo.user.email !== '' ? userInfo.user.email : useAuthFunc.user?.email,
                avatar: userInfo.user.avatar !== '' ? userInfo.user.avatar : useAuthFunc.user?.avatar,
                exportFormat: userInfo.data.leadOutFormat !== '' ? userInfo.data.leadOutFormat : useAuthFunc.user?.exportFormat
            });
            notify.success('保存成功')
            console.log('user info saved:', userInfo)
        }
        catch (error) {
            console.error(error)
            notify.error('保存失败')
        }
        setIsLoading(false)
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.readAsDataURL(file); // 读取文件为 Base64
    
        reader.onload = () => {
            const base64 = reader.result as string; // 获取 Base64 字符串
            setUserInfo({
                ...userInfo,
                user: {
                   ...userInfo.user,
                    avatar: base64
                }
            })
        };
    
        reader.onerror = () => {
            console.error('文件读取失败'); 
        };
    };

    async function handleExportAll(){
        try{
            const data = useAuthFunc.user?.exportFormat
            const history = await getAnalysisHistory({ page: 1, limit: 100 })
            const savedResults = history.results || []
            if(!data){
                notify.error('未设置导出格式')
                return
            }
            console.log('saved:', savedResults)
            if(data === 'pdf')exportUtils.exportAnalysisReport(savedResults)
            else if(data === 'csv')exportUtils.exportToCSV(savedResults)
            else if(data === 'html')exportUtils.exportAnalysisReportHTML(savedResults)
            else if(data === 'json')exportUtils.exportToJSON(savedResults)
        }
        catch(error){
            console.error('导出失败 ', error)
        }
    }

    function removeLocalStorage(){
        storage.clearAll()
        useAuthFunc.logout()
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
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <X className="h-4 w-4 mr-2" />
                        放弃更改
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
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
                                    {userInfo.user.avatar ? (
                                        <img
                                            src={userInfo.user.avatar}
                                            alt="用户头像"
                                            className="h-full w-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-8 w-8 text-gray-500" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <input type="file" accept=".jpg,.png" onChange={handleFileChange}></input>
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
                                        value={userInfo.user.name}
                                        onChange={(e) => setUserInfo({
                                            ...userInfo,
                                            user: {
                                               ...userInfo.user,
                                                name: e.target.value
                                            }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        电子邮箱
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={userInfo.user.email}
                                        onChange={(e) => setUserInfo({
                                            ...userInfo,
                                            user: {
                                               ...userInfo.user,
                                                email: e.target.value
                                            }
                                        })}
                                    />
                                </div>
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
                            <CardDescription>配置导出选项</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                                        导出模式
                                    </label>
                                    <p className="text-sm text-gray-500">选择导出格式</p>
                                </div>
                                <Select
                                    value={userInfo.data.leadOutFormat}
                                    onValueChange={(value) => setUserInfo(
                                        {
                                            ...userInfo,
                                            data: {
                                                ...userInfo.data,
                                                leadOutFormat: value
                                            }
                                        }
                                    )}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="选择格式" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pdf">
                                            <div className="flex items-center">
                                                pdf
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="csv">
                                            <div className="flex items-center">
                                                csv
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="html">
                                            <div className="flex items-center">
                                                html
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="json">
                                            <div className="flex items-center">
                                                JSON
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Button variant="outline" className="w-full" onClick={handleExportAll}>
                                    导出所有分析数据
                                </Button>
                                <Button variant="outline" className="w-full text-red-600 hover:text-red-700" onClick={removeLocalStorage}>
                                    清除本地缓存（退出登录）
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
