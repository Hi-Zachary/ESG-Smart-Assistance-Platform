# ESG 智能分析平台

[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=nodedotjs)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue?logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-purple?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

ESG 智能分析平台是一个功能强大的全栈Web应用，旨在利用人工智能（AI）技术，对企业的环境（Environmental）、社会（Social）和治理（Governance）报告进行深度分析、合规性检测和风险评估。

## ✨ 主要功能

- **智能文本分析**：支持直接输入文本，利用DeepSeek AI大模型进行全面的ESG分析。
- **文件上传分析**：支持上传多种格式文件（.txt, .pdf, .docx），系统自动提取文本并进行分析。
- **数据可视化仪表板**：以图表和卡片形式直观展示关键统计数据，如平均ESG评分、合规率、风险预警数量等。
- **历史记录管理**：自动保存每一次分析结果，支持按关键词、状态进行搜索和筛选。
- **动态合规检测**：根据可自定义的规则库，对分析报告进行合规性评估，并生成详细的检测结果。
- **风险与洞察**：自动识别报告中潜在的ESG风险，并提炼关键洞察，为决策提供支持。
- **报告导出**：支持将分析报告、历史记录、仪表板数据导出为JSON, CSV, 或PDF格式，便于归档和分享。

## 🚀 技术架构

本项目采用前后端分离的架构。

### 前端 (Frontend)

- **核心框架**: [React](https://reactjs.org/) 18.3 + [Vite](https://vitejs.dev/)
- **编程语言**: [TypeScript](https://www.typescriptlang.org/)
- **UI 组件库**: [shadcn/ui](https://ui.shadcn.com/)
- **CSS 方案**: [Tailwind CSS](https://tailwindcss.com/)
- **路由管理**: [React Router](https://reactrouter.com/)
- **图表库**: [Recharts](https://recharts.org/)
- **HTTP客户端**: [Axios](https://axios-http.com/)

### 后端 (Backend)

- **核心框架**: [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/)
- **数据库**: [PostgreSQL](https://www.postgresql.org/)
- **数据库客户端**: [pg](https://node-postgres.com/)
- **文件上传**: [Multer](https://github.com/expressjs/multer)
- **环境变量管理**: [dotenv](https://github.com/motdotla/dotenv)
- **AI 服务**: [DeepSeek API](https://platform.deepseek.com/)

## 🛠️ 项目配置与启动

请遵循以下步骤在本地环境中配置和运行本项目。

### 1. 环境要求

在开始之前，请确保您的系统中已安装以下软件：

- [Node.js](https://nodejs.org/) (建议版本 v18.x 或 v20.x)
- [npm](https://www.npmjs.com/) (通常随Node.js一起安装)
- [PostgreSQL](https://www.postgresql.org/download/) (建议版本 12 或更高)

### 2. 安装步骤

**a. 克隆项目仓库**
```bash
git clone https://github.com/your-username/esg-analysis-system.git
cd esg-analysis-system
```

**b. 安装依赖**

您需要分别为前端和后端安装依赖。请在项目根目录下打开终端，然后执行以下命令：

1.  **安装前端依赖**
    ```bash
    npm install
    ```

2.  **安装后端依赖**
    ```bash
    cd server
    npm install
    cd ..
    ```

### 3. 数据库配置

**a. 创建数据库**

请先在您的PostgreSQL中创建一个新的数据库。例如，可以命名为 `ESG`。

**b. 配置环境变量**

后端服务通过环境变量连接数据库和AI服务。

1.  进入 `server` 目录。
2.  复制环境变量示例文件 `.env.example` 并重命名为 `.env`。
3.  打开并编辑 `.env` 文件，填入您的本地配置信息。

```dotenv
# server/.env

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ESG  # 替换为您创建的数据库名
DB_USER=postgres # 替换为您的PostgreSQL用户名
DB_PASSWORD=your-database-password # 替换为您的PostgreSQL密码

# DeepSeek API配置
DEEPSEEK_API_KEY=your-deepseek-api-key # 替换为您自己的DeepSeek API密钥

# 服务器配置
PORT=3001
NODE_ENV=development

# API配置 (通常无需修改)
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_TIMEOUT=180000
DEEPSEEK_MAX_RETRIES=2
```

**重要**: 首次启动后端服务器时，系统会自动执行数据库初始化脚本，创建所需的表和默认数据。

### 4. 运行项目

**a. 使用启动脚本 (Windows)**

如果您使用的是Windows系统，可以直接运行根目录下的 `start.bat` 文件。它会自动完成以下操作：
1.  设置命令行窗口编码为UTF-8以正确显示中文。
2.  在一个新的命令行窗口中启动后端服务器。
3.  在另一个新的命令行窗口中启动前端开发服务器。

**b. 手动运行 (所有平台)**

您也可以使用 `concurrently` 脚本来同时启动前后端服务：
```bash
npm run start:full
```

或者，在两个独立的终端中分别启动：

**终端 1: 启动后端服务器**
```bash
npm run start:server
# 或者使用开发模式（带热重载）
# npm run dev:server
```
当您看到 `ESG分析服务器运行在端口 3001` 时，表示后端启动成功。

**终端 2: 启动前端服务器**
```bash
npm run dev
```
前端开发服务器通常会运行在 `http://localhost:5173`。

### 5. 访问平台

当所有服务都成功启动后，在浏览器中打开以下地址即可访问平台：
[http://localhost:5173](http://localhost:5173)

## 📁 项目结构

```
.
├── server/                # 后端代码
│   ├── .env.example       # 环境变量示例文件
│   ├── app.js             # Express应用主文件
│   ├── database.js        # 数据库连接与操作
│   ├── deepseek-api.js    # DeepSeek API封装
│   └── package.json       # 后端依赖
│
├── src/                   # 前端代码 (React)
│   ├── components/        # UI组件
│   ├── lib/               # 工具函数和API封装
│   ├── pages/             # 页面组件
│   ├── main.tsx           # 前端入口文件
│   └── App.tsx            # 应用根组件
│
├── public/                # 静态资源
├── .gitignore             # Git忽略配置
├── package.json           # 前端与项目脚本依赖
├── README.md              # 项目说明文件
└── start.bat              # Windows启动脚本
```

## 🤝 贡献

欢迎对本项目进行贡献！如果您有任何好的想法或建议，请随时提交Pull Request或创建Issue。

## 📄 许可证

本项目采用专有许可证。源代码可供参考和非商业性使用。

**商业使用**: 未经作者明确书面授权，禁止将本项目的任何部分用于商业目的。如需商业授权，请联系作者。
