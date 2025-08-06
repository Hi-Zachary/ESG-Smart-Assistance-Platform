// 加载环境变量配置
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeTextWithDeepSeek } = require('./deepseek-api');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化数据库
initDatabase().catch(error => {
  console.error('❌ 数据库初始化失败:', error.message);
  console.log('⚠️ 系统将继续运行，但可能无法保存数据到数据库');
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// API路由

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ESG文本分析 - 使用DeepSeek API
app.post('/api/analyze', async (req, res) => {
  console.log('🔍 API /analyze 被调用');
  console.log('请求体:', req.body);
  console.log('请求头:', req.headers);
  
  try {
    console.log('收到分析请求:', {
      textLength: req.body.text?.length,
      hasOptions: !!req.body.options,
      timestamp: new Date().toISOString()
    });
    
    const { text, options = {} } = req.body;
    
    if (!text || text.trim().length === 0) {
      console.log('❌ 文本内容为空');
      return res.status(400).json({ error: '文本内容不能为空' });
    }

    console.log('✅ 开始ESG文本分析，文本长度:', text.length);
    console.log('文本预览:', text.substring(0, 100) + '...');

    // 直接调用DeepSeek API分析函数
    console.log('📡 调用DeepSeek API...');
    const result = await analyzeTextWithDeepSeek(text, options);
    
    console.log('✅ DeepSeek API调用成功，结果:', {
      hasEntities: !!result.entities,
      hasScores: !!result.esgScores,
      hasInsights: !!result.keyInsights,
      status: result.status,
      source: result.source
    });
    
    // 保存到PostgreSQL数据库
    console.log('💾 准备保存到数据库...');
    const savedResult = await db.saveAnalysisResult({
      inputText: text,
      fileName: options.fileName || null,
      entities: result.entities,
      esgScores: result.esgScores,
      keyInsights: result.keyInsights,
      risks: result.risks,
      recommendations: result.recommendations,
      status: result.status,
      source: result.source
    });

    console.log('✅ ESG分析完成，结果已保存到数据库，ID:', savedResult.id);
    res.json({
      ...result,
      id: savedResult.id
    });
  } catch (error) {
    console.error('❌ 分析错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    
    // 如果是DeepSeek API错误，返回更详细的错误信息
    if (error.message.includes('DeepSeek API')) {
      console.error('🔥 DeepSeek API专项错误:', error.message);
      res.status(503).json({ 
        error: 'DeepSeek API服务暂时不可用',
        details: error.message,
        suggestion: '请稍后重试，或检查网络连接和API密钥'
      });
    } else {
      console.error('🔥 服务器内部错误:', error.message);
      res.status(500).json({ 
        error: '分析过程中出现错误: ' + error.message,
        details: error.message,
        stack: error.stack?.substring(0, 500)
      });
    }
  }
});

// 文件上传分析
app.post('/api/analyze/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const filePath = req.file.path;
    let text = '';

    // 根据文件类型提取文本
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    if (ext === '.txt') {
      text = fs.readFileSync(filePath, 'utf8');
    } else if (ext === '.pdf') {
      // 这里应该使用PDF解析库，暂时返回模拟文本
      text = `这是从PDF文件"${req.file.originalname}"中提取的文本内容。该文件包含了公司的ESG相关信息，包括环境保护措施、社会责任履行情况以及公司治理结构等重要内容。公司在碳排放控制、员工权益保护、董事会独立性等方面都有详细的披露和说明。`;
    } else if (['.doc', '.docx'].includes(ext)) {
      // 这里应该使用Word文档解析库，暂时返回模拟文本
      text = `这是从Word文档"${req.file.originalname}"中提取的文本内容。文档详细描述了公司的可持续发展战略，包括环境管理体系、社会责任项目、治理结构优化等方面的具体措施和成果。公司致力于实现碳中和目标，加强员工培训和福利保障，完善内控制度和风险管理体系。`;
    } else {
      return res.status(400).json({ error: '不支持的文件格式' });
    }

    // 清理上传的文件
    fs.unlinkSync(filePath);

    console.log('文件上传分析，文件名:', req.file.originalname, '文本长度:', text.length);

    // 使用DeepSeek API分析文本
    const result = await analyzeTextWithDeepSeek(text, { fileName: req.file.originalname });
    
    // 保存到PostgreSQL数据库
    const savedResult = await db.saveAnalysisResult({
      inputText: text,
      fileName: req.file.originalname,
      entities: result.entities,
      esgScores: result.esgScores,
      keyInsights: result.keyInsights,
      risks: result.risks,
      recommendations: result.recommendations,
      status: result.status,
      source: result.source
    });

    console.log('文件分析完成，结果已保存到数据库，ID:', savedResult.id);
    res.json({
      ...result,
      id: savedResult.id
    });
  } catch (error) {
    console.error('文件分析错误:', error);
    res.status(500).json({ 
      error: '文件分析过程中出现错误: ' + error.message 
    });
  }
});

// 获取分析历史
app.get('/api/history', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    
    console.log('📋 获取分析历史，参数:', { page, limit, search, status });
    
    const results = await db.getAnalysisResults(
      parseInt(page),
      parseInt(limit),
      search,
      status === 'all' ? 'all' : status
    );
    
    console.log('✅ 历史记录获取成功，结果数量:', results.results?.length || 0);
    res.json(results);
  } catch (error) {
    console.error('❌ 获取分析历史错误:', error);
    res.status(500).json({ error: '获取分析历史失败', details: error.message });
  }
});

// 获取单个分析结果
app.get('/api/analysis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.getAnalysisById(id);
    
    if (!result) {
      return res.status(404).json({ error: '分析结果不存在' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('获取分析结果错误:', error);
    res.status(500).json({ error: '获取分析结果失败' });
  }
});

// 删除分析结果
app.delete('/api/analysis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteAnalysisResult(id);
    
    if (!success) {
      return res.status(404).json({ error: '分析结果不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除分析结果错误:', error);
    res.status(500).json({ error: '删除分析结果失败' });
  }
});

// 合规检测
app.post('/api/compliance/check', async (req, res) => {
  try {
    console.log('收到合规检测请求:', req.body);
    const { analysisId, rules } = req.body;
    
    if (!analysisId) {
      console.log('❌ 分析ID为空');
      return res.status(400).json({ error: '分析ID不能为空' });
    }
    
    console.log('🔍 查找分析结果，ID:', analysisId);
    const analysis = await db.getAnalysisById(analysisId);
    
    if (!analysis) {
      console.log('❌ 未找到分析结果，ID:', analysisId);
      return res.status(404).json({ 
        error: '分析结果不存在',
        requestedId: analysisId
      });
    }
    
    console.log('✅ 找到分析结果，开始AI合规检测');
    console.log('📈 ESG评分:', analysis.esg_scores);
    console.log('📋 使用的规则配置:', rules ? `${rules.length}条启用规则` : '使用默认规则');
    
    // 使用DeepSeek AI进行合规检测分析
    const complianceResult = await generateAIComplianceResult(analysis, rules);
    
    // 保存合规检测结果到数据库
    await db.saveComplianceResult(analysisId, complianceResult);
    
    console.log('✅ AI合规检测完成，结果:', complianceResult.overall);
    
    res.json(complianceResult);
  } catch (error) {
    console.error('合规检测错误:', error);
    res.status(500).json({ error: '合规检测过程中出现错误: ' + error.message });
  }
});

// 获取合规规则
app.get('/api/compliance/rules', async (req, res) => {
  try {
    const rules = await db.getComplianceRules();
    res.json(rules);
  } catch (error) {
    console.error('获取合规规则错误:', error);
    res.status(500).json({ error: '获取合规规则失败' });
  }
});

// 更新合规规则
app.put('/api/compliance/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedRule = await db.updateComplianceRule(id, updates);
    if (!updatedRule) {
      return res.status(404).json({ error: '规则不存在' });
    }
    
    res.json(updatedRule);
  } catch (error) {
    console.error('更新合规规则错误:', error);
    res.status(500).json({ error: '更新合规规则失败' });
  }
});

// 统计数据
app.get('/api/stats', async (req, res) => {
  try {
    console.log('📊 获取统计数据...');
    const stats = await db.getStats();
    console.log('✅ 统计数据获取成功:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ 获取统计数据错误:', error);
    res.status(500).json({ 
      error: '获取统计数据失败',
      details: error.message 
    });
  }
});

// 获取风险预警数据
app.get('/api/risk-alerts', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    console.log('⚠️ 获取风险预警数据，限制数量:', limit);
    
    const riskAlerts = await db.getRiskAlerts(parseInt(limit));
    console.log('✅ 风险预警数据获取成功，数量:', riskAlerts.length);
    
    res.json(riskAlerts);
  } catch (error) {
    console.error('❌ 获取风险预警数据错误:', error);
    res.status(500).json({ 
      error: '获取风险预警数据失败',
      details: error.message 
    });
  }
});

// 获取风险预警数据
app.get('/api/risks', async (req, res) => {
  try {
    console.log('⚠️ 获取风险预警数据...');
    const risks = await db.getRiskAlerts();
    console.log('✅ 风险预警数据获取成功，数量:', risks.length);
    res.json(risks);
  } catch (error) {
    console.error('❌ 获取风险预警数据错误:', error);
    res.status(500).json({ 
      error: '获取风险预警数据失败',
      details: error.message 
    });
  }
});

// 使用AI生成合规检测结果
async function generateAIComplianceResult(analysis, customRules = null) {
  const esgScores = analysis.esg_scores || { environmental: 0, social: 0, governance: 0 };
  const inputText = analysis.input_text || '';
  
  // 获取公司名称
  const companyName = analysis.entities?.find(e => e.type === '公司名称')?.value ||
                     analysis.entities?.find(e => e.type === 'company')?.value || 
                     analysis.entities?.find(e => e.type === 'organization')?.value ||
                     analysis.file_name?.replace(/\.(txt|pdf|docx?)$/i, '') ||
                     '该公司';

  // 定义所有可能的规则
  const allPossibleRules = {
    'e1': { id: 'e1', category: 'environmental', name: '碳排放披露', description: '企业应披露碳排放数据及减排目标' },
    'e2': { id: 'e2', category: 'environmental', name: '能源使用效率', description: '企业应披露能源使用效率及改进措施' },
    'e3': { id: 'e3', category: 'environmental', name: '废弃物管理', description: '企业应披露废弃物处理方法及减量措施' },
    'e4': { id: 'e4', category: 'environmental', name: '水资源管理', description: '企业应披露水资源使用及节水措施' },
    's1': { id: 's1', category: 'social', name: '员工健康安全', description: '企业应确保工作环境安全并披露相关措施' },
    's2': { id: 's2', category: 'social', name: '多元化与包容性', description: '企业应促进员工多元化并建立包容性文化' },
    's3': { id: 's3', category: 'social', name: '供应链劳工标准', description: '企业应确保供应链符合劳工标准' },
    's4': { id: 's4', category: 'social', name: '社区参与', description: '企业应积极参与社区发展和公益活动' },
    'g1': { id: 'g1', category: 'governance', name: '董事会独立性', description: '董事会应包含足够比例的独立董事' },
    'g2': { id: 'g2', category: 'governance', name: '反腐败政策', description: '企业应建立完善的反腐败制度和培训体系' },
    'g3': { id: 'g3', category: 'governance', name: '高管薪酬透明度', description: '企业应透明披露高管薪酬决定机制' },
    'g4': { id: 'g4', category: 'governance', name: '风险管理体系', description: '企业应建立完善的风险识别和管控体系' }
  };

  // 根据传入的规则配置决定要检测的规则
  let rulesToCheck = [];
  if (customRules && Array.isArray(customRules)) {
    console.log('🔧 使用自定义规则配置，启用规则数量:', customRules.length);
    rulesToCheck = customRules.filter(rule => rule.enabled).map(rule => rule.id);
  } else {
    console.log('🔧 使用默认规则配置');
    rulesToCheck = Object.keys(allPossibleRules);
  }

  console.log('📋 将要检测的规则ID:', rulesToCheck);

  try {
    console.log('🤖 开始AI合规检测分析...');
    
    // 直接使用OpenAI客户端调用DeepSeek API进行合规分析
    const OpenAI = require('openai');
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
      timeout: 120000, // 2分钟超时，适合长文本分析
      maxRetries: 1
    });

    // 构建AI分析提示词
    const rulesText = rulesToCheck.map(ruleId => {
      const rule = allPossibleRules[ruleId];
      return `- ${rule.id}: ${rule.name} - ${rule.description}`;
    }).join('\n');

    const systemPrompt = `你是一个资深的ESG合规检测专家，拥有丰富的企业可持续发展评估经验。请对企业文本进行全面深入的合规分析，并严格按照JSON格式返回结果。

分析要求：
1. 深度解读企业文本内容，识别显性和隐性的ESG信息
2. 结合ESG评分和行业最佳实践进行综合判断
3. 提供详细的分析逻辑和证据支撑
4. 给出具体可行的改进建议和未来发展方向
5. 识别潜在风险和机遇
6. 状态分类：passed（合规优秀）、warning（需要关注）、failed（不合规）

请严格按照以下JSON格式返回，不要添加任何其他文字：
{
  "rules": [
    {
      "id": "规则ID",
      "name": "规则名称", 
      "status": "passed/warning/failed",
      "reason": "深入分析该规则的合规状况，包括当前表现、行业对标、关键优势或不足",
      "details": "具体的文本证据、数据支撑和评估依据",
      "improvements": "针对性的改进建议和具体实施路径",
      "futureDirection": "未来3-5年的发展方向和战略建议",
      "riskAlert": "潜在风险预警和应对策略",
      "industryBenchmark": "行业标杆对比和最佳实践参考"
    }
  ]
}`;

    const userPrompt = `企业名称：${companyName}
ESG评分：环境${esgScores.environmental}/10，社会${esgScores.social}/10，治理${esgScores.governance}/10

需要检测的合规规则：
${rulesText}

企业文本内容：
${inputText}

请对每个规则进行详细分析并返回JSON结果。`;

    console.log('📡 调用DeepSeek API进行合规分析...');
    
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 3000,
      stream: false
    });

    const responseContent = completion.choices[0].message.content;
    console.log('✅ DeepSeek API响应成功');
    console.log('🔍 AI响应内容:', responseContent.substring(0, 300) + '...');

    // 解析AI返回的JSON结果
    let aiRules = [];
    try {
      // 提取JSON部分
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResult = JSON.parse(jsonMatch[0]);
        aiRules = parsedResult.rules || [];
        console.log('✅ JSON解析成功，获得规则数量:', aiRules.length);
      } else {
        throw new Error('未找到JSON格式的响应');
      }
    } catch (parseError) {
      console.warn('⚠️ AI结果JSON解析失败:', parseError.message);
      console.log('🔄 使用备用合规检测逻辑');
      return generateComplianceResult(analysis, customRules);
    }

    // 按类别分组规则
    const environmentalRules = [];
    const socialRules = [];
    const governanceRules = [];

    aiRules.forEach(rule => {
      const ruleConfig = allPossibleRules[rule.id];
      if (ruleConfig) {
        const processedRule = {
          id: rule.id,
          name: rule.name || ruleConfig.name,
          status: rule.status || 'warning',
          reason: rule.reason || '未提供分析原因',
          details: rule.details || '未提供检测依据',
          improvements: rule.improvements || '建议加强相关制度建设和信息披露',
          futureDirection: rule.futureDirection || '持续关注行业发展趋势，制定长期战略规划',
          riskAlert: rule.riskAlert || '需要关注相关合规风险，建立预警机制',
          industryBenchmark: rule.industryBenchmark || '参考行业领先企业的最佳实践'
        };

        if (ruleConfig.category === 'environmental') {
          environmentalRules.push(processedRule);
        } else if (ruleConfig.category === 'social') {
          socialRules.push(processedRule);
        } else if (ruleConfig.category === 'governance') {
          governanceRules.push(processedRule);
        }
      }
    });

    const allRules = [...environmentalRules, ...socialRules, ...governanceRules];
    const passed = allRules.filter(r => r.status === 'passed').length;
    const warnings = allRules.filter(r => r.status === 'warning').length;
    const failed = allRules.filter(r => r.status === 'failed').length;

    console.log('📊 AI合规检测统计:', { 
      total: allRules.length, 
      passed, 
      warnings, 
      failed,
      environmental: environmentalRules.length,
      social: socialRules.length,
      governance: governanceRules.length
    });

    return {
      overall: {
        rate: allRules.length > 0 ? Math.round((passed / allRules.length) * 100) : 0,
        passed,
        warnings,
        failed
      },
      categories: {
        environmental: {
          rate: environmentalRules.length > 0 ? Math.round((environmentalRules.filter(r => r.status === 'passed').length / environmentalRules.length) * 100) : 0,
          rules: environmentalRules
        },
        social: {
          rate: socialRules.length > 0 ? Math.round((socialRules.filter(r => r.status === 'passed').length / socialRules.length) * 100) : 0,
          rules: socialRules
        },
        governance: {
          rate: governanceRules.length > 0 ? Math.round((governanceRules.filter(r => r.status === 'passed').length / governanceRules.length) * 100) : 0,
          rules: governanceRules
        }
      }
    };

  } catch (error) {
    console.error('❌ AI合规检测失败:', error.message);
    console.log('🔄 使用备用合规检测逻辑');
    return generateComplianceResult(analysis, customRules);
  }
}

// 备用合规检测结果生成函数
function generateComplianceResult(analysis, customRules = null) {
  const esgScores = analysis.esg_scores || { environmental: 0, social: 0, governance: 0 };
  const inputText = analysis.input_text || '';
  const keyInsights = analysis.key_insights || [];
  
  // 获取公司名称
  const companyName = analysis.entities?.find(e => e.type === '公司名称')?.value ||
                     analysis.entities?.find(e => e.type === 'company')?.value || 
                     analysis.entities?.find(e => e.type === 'organization')?.value ||
                     analysis.file_name?.replace(/\.(txt|pdf|docx?)$/i, '') ||
                     '该公司';
  
  // 定义所有可能的规则检测逻辑
  const allPossibleRules = {
    'e1': {
      id: 'e1',
      category: 'environmental',
      name: '碳排放披露',
      getStatus: () => esgScores.environmental > 7 ? 'passed' : (esgScores.environmental > 4 ? 'warning' : 'failed'),
      getReason: (status) => status === 'passed'
        ? `${companyName}在碳排放披露方面表现优秀，ESG环境评分达到${esgScores.environmental}/10，已建立完善的碳排放监测和报告体系，数据披露透明度高，符合国际标准要求。`
        : status === 'warning'
        ? `${companyName}的碳排放披露存在改进空间，ESG环境评分为${esgScores.environmental}/10，虽有基础披露但缺乏系统性和完整性，需要进一步提升数据质量和透明度。`
        : `${companyName}在碳排放披露方面存在重大缺陷，ESG环境评分仅为${esgScores.environmental}/10，缺乏基本的碳排放数据披露，急需建立完整的碳排放监测、核算和报告体系。`,
      getDetails: () => inputText.includes('碳排放') || inputText.includes('温室气体') 
        ? '文本中包含碳排放、温室气体等相关关键词，显示企业对碳排放管理有一定认知和实践' 
        : '文本中未发现明确的碳排放披露信息，缺乏具体的排放数据、减排目标或相关管理措施',
      getImprovements: (status) => status === 'passed'
        ? '建议进一步完善碳排放数据的第三方验证机制，加强供应链碳足迹管理，探索碳中和路径规划。'
        : status === 'warning'
        ? '建议建立完整的碳排放核算体系，设定科学的减排目标，加强数据收集和监测能力，提升披露频率和质量。'
        : '建议立即启动碳排放基线调研，建立数据收集体系，制定减排目标和行动计划，参考GHG Protocol等国际标准。',
      getFutureDirection: () => '未来3-5年应重点关注：1）实现碳中和目标路径规划；2）发展清洁能源和节能技术；3）建立碳资产管理体系；4）参与碳交易市场；5）推动供应链低碳转型。',
      getRiskAlert: (status) => status === 'failed'
        ? '高风险：面临碳税、碳边境调节机制等政策风险，可能影响国际贸易和投资吸引力，建议尽快制定应对策略。'
        : '中等风险：需关注碳价格波动、监管政策变化对业务的潜在影响，建立风险预警和应对机制。',
      getIndustryBenchmark: () => '参考行业领先企业如微软、苹果等的碳中和承诺和实践，学习CDP、SBTi等国际倡议的最佳实践，对标同行业头部企业的披露标准。'
    },
    'e2': {
      id: 'e2',
      category: 'environmental',
      name: '能源使用效率',
      getStatus: () => esgScores.environmental > 6 ? 'passed' : (esgScores.environmental > 3 ? 'warning' : 'failed'),
      getReason: (status) => status === 'passed'
        ? `${companyName}在能源使用效率方面达标，环境管理措施较为完善。`
        : status === 'warning'
        ? `${companyName}的能源使用效率有待提升，建议制定更明确的节能目标和措施。`
        : `${companyName}在能源使用效率方面存在重大缺陷，缺乏有效的能源管理体系。`,
      getDetails: () => inputText.includes('节能') || inputText.includes('能源效率') 
        ? '文本中提及节能或能源效率相关措施' 
        : '文本中缺乏能源使用效率的具体信息'
    },
    'e3': {
      id: 'e3',
      category: 'environmental',
      name: '废弃物管理',
      getStatus: () => inputText.includes('废弃物') || inputText.includes('回收') ? 'passed' : 'warning',
      getReason: (status) => status === 'passed'
        ? `${companyName}在废弃物管理方面有相关披露，显示了环境责任意识。`
        : `${companyName}在废弃物管理方面的披露不够充分，建议加强废弃物处理和回收利用的信息披露。`,
      getDetails: () => inputText.includes('废弃物') || inputText.includes('回收') 
        ? '文本中包含废弃物管理相关内容' 
        : '文本中未发现废弃物管理的具体措施'
    },
    's1': {
      id: 's1',
      category: 'social',
      name: '员工健康安全',
      getStatus: () => esgScores.social > 7 ? 'passed' : (esgScores.social > 4 ? 'warning' : 'failed'),
      getReason: (status) => status === 'passed'
        ? `${companyName}在员工健康安全方面表现优秀，ESG社会评分为${esgScores.social}/10，建立了完善的安全保障体系。`
        : status === 'warning'
        ? `${companyName}的员工健康安全措施需要改进，ESG社会评分为${esgScores.social}/10，建议加强安全培训和防护措施。`
        : `${companyName}在员工健康安全方面存在严重不足，ESG社会评分仅为${esgScores.social}/10，急需建立完整的职业健康安全管理体系。`,
      getDetails: () => inputText.includes('安全') || inputText.includes('健康') 
        ? '文本中提及员工安全或健康相关措施' 
        : '文本中缺乏员工健康安全的具体保障措施'
    },
    's2': {
      id: 's2',
      category: 'social',
      name: '多元化与包容性',
      getStatus: () => inputText.includes('多元化') || inputText.includes('平等') ? 'passed' : 'warning',
      getReason: (status) => status === 'passed'
        ? `${companyName}在多元化与包容性方面有积极表现，体现了企业的社会责任。`
        : `${companyName}在多元化与包容性方面的披露有限，建议加强相关政策的制定和实施。`,
      getDetails: () => inputText.includes('多元化') || inputText.includes('平等') 
        ? '文本中体现了多元化和包容性理念' 
        : '文本中未明确体现多元化和包容性政策'
    },
    's3': {
      id: 's3',
      category: 'social',
      name: '供应链劳工标准',
      getStatus: () => esgScores.social > 6 && (inputText.includes('供应链') || inputText.includes('供应商')) ? 'passed' : 'warning',
      getReason: (status) => status === 'passed'
        ? `${companyName}对供应链劳工标准有相关管理措施，体现了负责任的供应链管理。`
        : `${companyName}在供应链劳工标准方面需要加强管理，建议建立更完善的供应商评估和监督机制。`,
      getDetails: () => inputText.includes('供应链') || inputText.includes('供应商') 
        ? '文本中提及供应链管理相关内容' 
        : '文本中缺乏供应链劳工标准的管理措施'
    },
    'g1': {
      id: 'g1',
      category: 'governance',
      name: '董事会独立性',
      getStatus: () => esgScores.governance > 7 ? 'passed' : (esgScores.governance > 4 ? 'warning' : 'failed'),
      getReason: (status) => status === 'passed'
        ? `${companyName}的董事会独立性良好，ESG治理评分为${esgScores.governance}/10，治理结构较为完善。`
        : status === 'warning'
        ? `${companyName}的董事会独立性有待提升，ESG治理评分为${esgScores.governance}/10，建议增加独立董事比例。`
        : `${companyName}的董事会独立性存在重大缺陷，ESG治理评分仅为${esgScores.governance}/10，治理结构需要重大改革。`,
      getDetails: () => inputText.includes('董事会') || inputText.includes('独立董事') 
        ? '文本中提及董事会治理相关内容' 
        : '文本中缺乏董事会独立性的具体信息'
    },
    'g2': {
      id: 'g2',
      category: 'governance',
      name: '反腐败政策',
      getStatus: () => inputText.includes('反腐') || inputText.includes('廉洁') || inputText.includes('合规') ? 'passed' : 'warning',
      getReason: (status) => status === 'passed'
        ? `${companyName}建立了反腐败相关政策，体现了良好的商业道德标准。`
        : `${companyName}在反腐败政策方面的披露不够明确，建议建立更完善的反腐败制度和培训体系。`,
      getDetails: () => inputText.includes('反腐') || inputText.includes('廉洁') || inputText.includes('合规') 
        ? '文本中体现了反腐败或合规管理措施' 
        : '文本中未明确提及反腐败政策'
    },
    'g3': {
      id: 'g3',
      category: 'governance',
      name: '高管薪酬透明度',
      getStatus: () => inputText.includes('薪酬') || inputText.includes('高管') ? 'passed' : 'warning',
      getReason: (status) => status === 'passed'
        ? `${companyName}在高管薪酬透明度方面有相关披露，体现了良好的治理透明度。`
        : `${companyName}在高管薪酬透明度方面的披露不够充分，建议加强高管薪酬决定机制的透明度。`,
      getDetails: () => inputText.includes('薪酬') || inputText.includes('高管') 
        ? '文本中提及高管薪酬相关内容' 
        : '文本中缺乏高管薪酬透明度的具体信息'
    },
    'g4': {
      id: 'g4',
      category: 'governance',
      name: '风险管理体系',
      getStatus: () => esgScores.governance > 6 && inputText.includes('风险') ? 'passed' : 'warning',
      getReason: (status) => status === 'passed'
        ? `${companyName}建立了较为完善的风险管理体系，能够有效识别和控制各类风险。`
        : `${companyName}的风险管理体系需要进一步完善，建议加强风险识别、评估和应对机制。`,
      getDetails: () => inputText.includes('风险') 
        ? '文本中提及风险管理相关措施' 
        : '文本中缺乏风险管理体系的具体描述'
    },
    'e4': {
      id: 'e4',
      category: 'environmental',
      name: '水资源管理',
      getStatus: () => inputText.includes('水资源') || inputText.includes('节水') ? 'passed' : 'warning',
      getReason: (status) => status === 'passed'
        ? `${companyName}在水资源管理方面有相关措施，体现了环境保护意识。`
        : `${companyName}在水资源管理方面的披露不够充分，建议加强水资源使用效率和节水措施的信息披露。`,
      getDetails: () => inputText.includes('水资源') || inputText.includes('节水') 
        ? '文本中包含水资源管理相关内容' 
        : '文本中未发现水资源管理的具体措施'
    },
    's4': {
      id: 's4',
      category: 'social',
      name: '社区参与',
      getStatus: () => inputText.includes('社区') || inputText.includes('公益') ? 'passed' : 'warning',
      getReason: (status) => status === 'passed'
        ? `${companyName}在社区参与方面有积极表现，体现了企业的社会责任担当。`
        : `${companyName}在社区参与方面的披露有限，建议加强社区发展项目的参与和信息披露。`,
      getDetails: () => inputText.includes('社区') || inputText.includes('公益') 
        ? '文本中体现了社区参与相关活动' 
        : '文本中未明确体现社区参与和发展项目'
    }
  };

  // 根据传入的规则配置决定要检测的规则
  let rulesToCheck = [];
  if (customRules && Array.isArray(customRules)) {
    // 使用前端传来的启用规则
    console.log('🔧 使用自定义规则配置，启用规则数量:', customRules.length);
    rulesToCheck = customRules.filter(rule => rule.enabled).map(rule => rule.id);
  } else {
    // 使用默认的所有规则
    console.log('🔧 使用默认规则配置');
    rulesToCheck = Object.keys(allPossibleRules);
  }

  console.log('📋 将要检测的规则ID:', rulesToCheck);

  // 生成检测结果
  const environmentalRules = [];
  const socialRules = [];
  const governanceRules = [];

  rulesToCheck.forEach(ruleId => {
    const ruleConfig = allPossibleRules[ruleId];
    if (!ruleConfig) {
      console.warn(`⚠️ 未找到规则配置: ${ruleId}`);
      return;
    }

    const status = ruleConfig.getStatus();
    const rule = {
      id: ruleConfig.id,
      name: ruleConfig.name,
      status: status,
      reason: ruleConfig.getReason(status),
      details: ruleConfig.getDetails(),
      improvements: ruleConfig.getImprovements ? ruleConfig.getImprovements(status) : '建议加强相关制度建设和信息披露',
      futureDirection: ruleConfig.getFutureDirection ? ruleConfig.getFutureDirection() : '持续关注行业发展趋势，制定长期战略规划',
      riskAlert: ruleConfig.getRiskAlert ? ruleConfig.getRiskAlert(status) : '需要关注相关合规风险，建立预警机制',
      industryBenchmark: ruleConfig.getIndustryBenchmark ? ruleConfig.getIndustryBenchmark() : '参考行业领先企业的最佳实践'
    };

    // 根据类别分组
    if (ruleConfig.category === 'environmental') {
      environmentalRules.push(rule);
    } else if (ruleConfig.category === 'social') {
      socialRules.push(rule);
    } else if (ruleConfig.category === 'governance') {
      governanceRules.push(rule);
    }
  });

  const allRules = [...environmentalRules, ...socialRules, ...governanceRules];
  const passed = allRules.filter(r => r.status === 'passed').length;
  const warnings = allRules.filter(r => r.status === 'warning').length;
  const failed = allRules.filter(r => r.status === 'failed').length;

  console.log('📊 合规检测统计:', { 
    total: allRules.length, 
    passed, 
    warnings, 
    failed,
    environmental: environmentalRules.length,
    social: socialRules.length,
    governance: governanceRules.length
  });

  return {
    overall: {
      rate: allRules.length > 0 ? Math.round((passed / allRules.length) * 100) : 0,
      passed,
      warnings,
      failed
    },
    categories: {
      environmental: {
        rate: environmentalRules.length > 0 ? Math.round((environmentalRules.filter(r => r.status === 'passed').length / environmentalRules.length) * 100) : 0,
        rules: environmentalRules
      },
      social: {
        rate: socialRules.length > 0 ? Math.round((socialRules.filter(r => r.status === 'passed').length / socialRules.length) * 100) : 0,
        rules: socialRules
      },
      governance: {
        rate: governanceRules.length > 0 ? Math.round((governanceRules.filter(r => r.status === 'passed').length / governanceRules.length) * 100) : 0,
        rules: governanceRules
      }
    }
  };
}

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误详情:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  res.status(500).json({ 
    error: '服务器内部错误',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`ESG分析服务器运行在端口 ${PORT}`);
  console.log(`API地址: http://localhost:${PORT}/api`);
  console.log('PostgreSQL数据库集成已启用');
});

module.exports = app;