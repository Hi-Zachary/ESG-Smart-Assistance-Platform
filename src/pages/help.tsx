import { useState } from 'react'
import {
    HelpCircle,
    Mail,
    MessageSquare,
    Phone,
    ChevronDown,
    ChevronUp,
    Search,
    Settings
} from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HelpPage() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // 常见问题分类
    const faqCategories = [
        {
            id: 'account',
            title: '账户管理',
            icon: <HelpCircle className="h-5 w-5 mr-2" />,
            questions: [
                {
                    question: '如何设置个人信息？',
                    answer: '您可以在设置页面更改各种信息，点击保存更改即可更改个人信息。'
                },
            ]
        },
        {
            id: 'features',
            title: '功能使用',
            icon: <Settings className="h-5 w-5 mr-2" />,
            questions: [
                {
                    question: '如何开始分析？',
                    answer: '在仪表板页面点击开始新分析/直接点击文本分析均可以跳转到分析页面，输入/导入文本后点击开始分析即可。'
                },
                {
                    question: '如何导出所有历史数据？',
                    answer: '在设置页面底端，选择导出模式并保存后即可点击"导出所有分析数据"按钮即可一键导出所有历史数据。'
                },
                {
                    question: '如何进行合规性检测？',
                    answer: '进行分析后，在合规性检测页面可以看到历史分析结果，选中一条结果后即可开始检测。'
                },
                {
                    question: '如何新增合规性检测的规则？',
                    answer: '在页面最下方点击导入新规则后传入含有规则信息的JSON文件即可，如果对文件格式不了解可以下载已有的规则进行查看。'
                },
            ]
        }
    ]

    // 联系支持方式
    const contactMethods = [
        {
            id: 'email',
            title: '电子邮件',
            description: '24小时内回复',
            icon: <Mail className="h-6 w-6 text-blue-600" />,
            action: '3598326404@qq.com'
        },
        {
            id: 'phone',
            title: '电话支持',
            description: '紧急问题优先处理',
            icon: <Phone className="h-6 w-6 text-purple-600" />,
            action: '13733866926'
        }
    ]

    // 过滤FAQ问题
    const filteredCategories = faqCategories.map(category => ({
        ...category,
        questions: category.questions.filter(q =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0)

    const toggleCategory = (categoryId: string) => {
        setActiveCategory(activeCategory === categoryId ? null : categoryId)
    }

    return (
        <div className="p-6 space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <HelpCircle className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">帮助中心</h1>
                        <p className="text-gray-600 mt-1">获取产品使用帮助和支持</p>
                    </div>
                </div>
            </div>

            {/* 主要内容区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* 常见问题部分 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
                                常见问题
                            </CardTitle>
                            <CardDescription>浏览用户最常遇到的问题和解答</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((category) => (
                                    <div key={category.id} className="space-y-2">
                                        <button
                                            onClick={() => toggleCategory(category.id)}
                                            className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center">
                                                {category.icon}
                                                <span className="font-medium">{category.title}</span>
                                            </div>
                                            {activeCategory === category.id ? (
                                                <ChevronUp className="h-5 w-5 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-gray-500" />
                                            )}
                                        </button>

                                        {activeCategory === category.id && (
                                            <div className="pl-8 space-y-3">
                                                {category.questions.map((item, index) => (
                                                    <div key={index} className="pb-3">
                                                        <h3 className="font-medium text-gray-900">{item.question}</h3>
                                                        <p className="mt-1 text-sm text-gray-600">{item.answer}</p>
                                                        {index < category.questions.length - 1 && (
                                                            <hr className="my-3 border-gray-200" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-gray-500">没有找到与搜索匹配的问题</p>
                                    <Button variant="link" className="mt-2">
                                        提交新问题
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 联系支持部分 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Mail className="h-5 w-5 mr-2 text-green-600" />
                                联系支持团队
                            </CardTitle>
                            <CardDescription>选择您偏好的联系方式获取帮助</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {contactMethods.map((method) => (
                                    <Card key={method.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center space-x-3">
                                                {method.icon}
                                                <div>
                                                    <CardTitle className="text-lg">{method.title}</CardTitle>
                                                    <CardDescription>{method.description}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <text className="w-full">
                                                {method.action}
                                            </text>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
