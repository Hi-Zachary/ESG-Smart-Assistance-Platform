const { Pool } = require('pg');

// 数据库连接配置
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ESG',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// 检查必需的环境变量
if (!process.env.DB_PASSWORD) {
  console.error('❌ 错误: DB_PASSWORD 环境变量未设置');
  console.error('请在 .env 文件中设置数据库密码');
  process.exit(1);
}

// 数据库初始化
const initDatabase = async () => {
  try {
    console.log('🔄 初始化数据库...');
    
    // 创建用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建ESG分析结果表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        input_text TEXT NOT NULL,
        file_name VARCHAR(255),
        entities JSONB,
        esg_scores JSONB NOT NULL,
        key_insights TEXT[],
        risks JSONB,
        recommendations TEXT[],
        status VARCHAR(20) DEFAULT 'completed',
        source VARCHAR(50) DEFAULT 'deepseek',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建合规规则表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compliance_rules (
        id VARCHAR(10) PRIMARY KEY,
        category VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT true,
        threshold DECIMAL(3,2) DEFAULT 0.8,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建合规检测结果表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compliance_results (
        id SERIAL PRIMARY KEY,
        analysis_id INTEGER REFERENCES analysis_results(id),
        overall_rate INTEGER NOT NULL,
        passed_count INTEGER NOT NULL,
        warnings_count INTEGER NOT NULL,
        failed_count INTEGER NOT NULL,
        detailed_results JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 插入默认合规规则
    await pool.query(`
      INSERT INTO compliance_rules (id, category, name, description, enabled, threshold) 
      VALUES 
        ('e1', 'environmental', '碳排放披露', '企业应披露碳排放数据及减排目标', true, 0.8),
        ('e2', 'environmental', '能源使用效率', '企业应披露能源使用效率及改进措施', true, 0.8),
        ('e3', 'environmental', '废弃物管理', '企业应披露废弃物处理方法及减量措施', true, 0.7),
        ('e4', 'environmental', '水资源管理', '企业应披露水资源使用及节水措施', true, 0.7),
        ('s1', 'social', '员工健康安全', '企业应确保工作环境安全并披露相关措施', true, 0.85),
        ('s2', 'social', '多元化与包容性', '企业应促进员工多元化并防止歧视', true, 0.7),
        ('s3', 'social', '供应链劳工标准', '企业应确保供应链符合劳工标准', true, 0.8),
        ('s4', 'social', '社区参与', '企业应积极参与社区发展并披露相关活动', true, 0.6),
        ('g1', 'governance', '董事会独立性', '董事会应包含足够比例的独立董事', true, 0.5),
        ('g2', 'governance', '反腐败政策', '企业应制定并实施反腐败政策', true, 0.8),
        ('g3', 'governance', '高管薪酬透明度', '企业应披露高管薪酬及其决定机制', true, 0.7),
        ('g4', 'governance', '风险管理体系', '企业应建立全面的风险管理体系', true, 0.8)
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};

// 数据库操作函数
const db = {
  // 用户相关操作
  async createUser(username, email, passwordHash, role = 'user') {
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, passwordHash, role]
    );
    return result.rows[0];
  },

  async getUserByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  },

  async getUserByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  // ESG分析结果相关操作
  async saveAnalysisResult(data) {
    try {
      console.log('💾 开始保存分析结果到数据库...');
      console.log('数据预览:', {
        hasInputText: !!data.inputText,
        hasEntities: !!data.entities,
        hasEsgScores: !!data.esgScores,
        hasKeyInsights: !!data.keyInsights,
        hasRisks: !!data.risks,
        hasRecommendations: !!data.recommendations
      });

      const {
        userId = null,
        inputText,
        fileName = null,
        entities,
        esgScores,
        keyInsights,
        risks,
        recommendations,
        status = 'completed',
        source = 'deepseek'
      } = data;

      // 确保必要字段不为空
      if (!inputText) {
        throw new Error('输入文本不能为空');
      }
      if (!esgScores) {
        throw new Error('ESG评分不能为空');
      }

      // 安全地处理JSON字段
      const entitiesJson = entities ? JSON.stringify(entities) : null;
      const esgScoresJson = JSON.stringify(esgScores);
      const risksJson = risks ? JSON.stringify(risks) : null;
      const keyInsightsArray = Array.isArray(keyInsights) ? keyInsights : (keyInsights ? [keyInsights] : []);
      const recommendationsArray = Array.isArray(recommendations) ? recommendations : (recommendations ? [recommendations] : []);

      console.log('📝 准备插入数据库，参数:', {
        userId,
        inputTextLength: inputText.length,
        fileName,
        entitiesCount: entities ? entities.length : 0,
        esgScores,
        keyInsightsCount: keyInsightsArray.length,
        risksCount: risks ? risks.length : 0,
        recommendationsCount: recommendationsArray.length,
        status,
        source
      });

      const result = await pool.query(`
        INSERT INTO analysis_results 
        (user_id, input_text, file_name, entities, esg_scores, key_insights, risks, recommendations, status, source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [userId, inputText, fileName, entitiesJson, esgScoresJson, 
          keyInsightsArray, risksJson, recommendationsArray, status, source]);
      
      console.log('✅ 分析结果保存成功，ID:', result.rows[0].id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ 保存分析结果失败:', error);
      throw error;
    }
  },

  async getAnalysisResults(page = 1, limit = 10, search = '', status = 'all') {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (input_text ILIKE $${paramIndex} OR file_name ILIKE $${paramIndex + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    if (status !== 'all') {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const offset = (page - 1) * limit;
    
    const countResult = await pool.query(`SELECT COUNT(*) FROM analysis_results ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(`
      SELECT * FROM analysis_results 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    return {
      results: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  async getAnalysisById(id) {
    const result = await pool.query('SELECT * FROM analysis_results WHERE id = $1', [id]);
    return result.rows[0];
  },

  async deleteAnalysisResult(id) {
    // 首先删除关联的合规检测结果，以避免外键约束冲突
    await pool.query('DELETE FROM compliance_results WHERE analysis_id = $1', [id]);
    // 然后删除分析结果本身
    const result = await pool.query('DELETE FROM analysis_results WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  // 合规规则相关操作
  async getComplianceRules() {
    const result = await pool.query('SELECT * FROM compliance_rules ORDER BY category, id');
    return result.rows;
  },

  async updateComplianceRule(id, updates) {
    const { name, description, enabled, threshold } = updates;
    const result = await pool.query(`
      UPDATE compliance_rules 
      SET name = COALESCE($2, name), 
          description = COALESCE($3, description),
          enabled = COALESCE($4, enabled),
          threshold = COALESCE($5, threshold),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `, [id, name, description, enabled, threshold]);
    return result.rows[0];
  },

  // 合规检测结果相关操作
  async saveComplianceResult(analysisId, complianceData) {
    const { overall, categories } = complianceData;
    
    const result = await pool.query(`
      INSERT INTO compliance_results 
      (analysis_id, overall_rate, passed_count, warnings_count, failed_count, detailed_results)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [analysisId, overall.rate, overall.passed, overall.warnings, overall.failed, JSON.stringify(categories)]);
    
    return result.rows[0];
  },

  async getComplianceResultByAnalysisId(analysisId) {
    const result = await pool.query('SELECT * FROM compliance_results WHERE analysis_id = $1 ORDER BY created_at DESC LIMIT 1', [analysisId]);
    return result.rows[0];
  },

  // 统计数据
  async getStats() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
    
    const todayAnalysisResult = await pool.query(
      "SELECT COUNT(*) FROM analysis_results WHERE DATE(created_at) = $1", 
      [today]
    );
    
    const avgScoreResult = await pool.query(`
      SELECT AVG((esg_scores->>'overall')::numeric) as avg_score 
      FROM analysis_results 
      WHERE esg_scores->>'overall' IS NOT NULL AND (esg_scores->>'overall')::numeric > 0
    `);
    
    const totalAnalysisResult = await pool.query('SELECT COUNT(*) FROM analysis_results');
    
    const riskAlertsResult = await pool.query(`
      SELECT COUNT(*) FROM analysis_results 
      WHERE jsonb_array_length(COALESCE(risks, '[]'::jsonb)) > 0
    `);

    const totalCount = parseInt(totalAnalysisResult.rows[0].count);
    const avgScore = parseFloat(avgScoreResult.rows[0].avg_score) || null;
    
    return {
      todayAnalysis: parseInt(todayAnalysisResult.rows[0].count),
      avgEsgScore: avgScore ? Number(avgScore.toFixed(1)) : null,
      complianceRate: avgScore ? Math.round(avgScore * 10) : null,
      riskAlerts: parseInt(riskAlertsResult.rows[0].count),
      totalAnalysis: totalCount
    };
  },

  // 获取风险预警数据
  async getRiskAlerts(limit = 10) {
    try {
      const result = await pool.query(`
        SELECT 
          ar.id,
          ar.created_at,
          ar.entities,
          ar.risks,
          ar.esg_scores
        FROM analysis_results ar
        WHERE jsonb_array_length(COALESCE(ar.risks, '[]'::jsonb)) > 0
        ORDER BY ar.created_at DESC
        LIMIT $1
      `, [limit]);

      const riskAlerts = [];
      
      for (const row of result.rows) {
        const entities = row.entities || [];
        const risks = row.risks || [];
        const esgScores = row.esg_scores || {};
        
        // 获取公司名称
        const companyName = entities.find(e => e.type === '公司名称')?.value ||
                           entities.find(e => e.type === 'company')?.value ||
                           entities.find(e => e.type === 'organization')?.value ||
                           '未知公司';

        // 处理每个风险项
        for (const risk of risks) {
          // 根据ESG评分和风险描述确定严重程度
          let severity = 'low';
          const overallScore = esgScores.overall || 0;
          
          if (overallScore < 5 || risk.level === 'high') {
            severity = 'high';
          } else if (overallScore < 7 || risk.level === 'medium') {
            severity = 'medium';
          }

          riskAlerts.push({
            id: `${row.id}_${riskAlerts.length}`,
            title: risk.title || risk.description?.substring(0, 20) + '...' || '风险预警',
            company: companyName,
            severity: severity,
            description: risk.description || '需要关注的ESG风险项',
            analysisDate: new Date(row.created_at).toLocaleDateString('zh-CN'),
            esgScore: overallScore
          });
        }
      }

      return riskAlerts.slice(0, limit);
    } catch (error) {
      console.error('获取风险预警数据失败:', error);
      return [];
    }
  }
};

module.exports = { pool, initDatabase, db };