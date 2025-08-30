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
import { Input } from '@/components/ui/input'

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
                    question: '如何导出数据分析报告？',
                    answer: '在数据管理页面，选择需要导出的数据集，点击"导出"按钮并选择格式(PDF/Excel/CSV)。'
                },
                {
                    question: '如何进行合规性检测？',
                    answer: '进行分析后，在合规性检测页面可以看到历史分析结果，选中一条结果后即可开始检测。'
                },
                {
                    question: '如何新增合规性检测的规则？',
                    answer: '在页面最下方点击导入新规则后传入含有规则信息的JSON文件即可。'
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
            action: 'email@example.com'
        },
        {
            id: 'phone',
            title: '电话支持',
            description: '紧急问题优先处理',
            icon: <Phone className="h-6 w-6 text-purple-600" />,
            action: 'tele-number'
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

            {/* 搜索栏 */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    type="text"
                    placeholder="搜索帮助内容..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
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

                    {/* 提交问题表单 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
                                未找到您的问题？
                            </CardTitle>
                            <CardDescription>提交您的问题，我们的团队会尽快回复</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                        问题主题
                                    </label>
                                    <Input id="subject" placeholder="简要描述您的问题" />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        详细描述
                                    </label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="请尽可能详细地描述您遇到的问题..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        联系邮箱
                                    </label>
                                    <Input id="email" type="email" placeholder="用于接收回复" />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">提交问题</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
