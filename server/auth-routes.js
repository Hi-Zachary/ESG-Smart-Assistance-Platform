const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('./database'); // 确保db对象被正确导出

const router = express.Router();

// 注册路由
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: '所有字段都是必填项' });
  }

  try {
    // 检查用户是否已存在
    const existingUser = await db.getUserByUsernameOrEmail(username, email);
    if (existingUser) {
      return res.status(409).json({ error: '用户名或电子邮件已被注册' });
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 保存用户到数据库
    const newUser = await db.createUser(username, email, hashedPassword);
    
    // 不返回密码哈希
    const userResponse = { id: newUser.id, username: newUser.username, email: newUser.email };

    res.status(201).json({ message: '用户注册成功', user: userResponse });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// 登录路由
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码是必填项' });
  }

  try {
    // 查找用户
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: '无效的用户名或密码' });
    }

    // 比较密码
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: '无效的用户名或密码' });
    }

    // 生成JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your_jwt_secret', // 使用环境变量或默认秘密
      { expiresIn: '1h' } // Token有效期
    );

    // 不返回密码哈希
    const userResponse = { id: user.id, username: user.username, email: user.email };

    res.json({ message: '登录成功', user: userResponse, token });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      console.error('JWT验证失败:', err);
      return res.status(403).json({ error: '无效或过期的认证令牌' });
    }
    req.user = user; // 将解码后的用户信息附加到请求对象
    next();
  });
};

module.exports = { router, authenticateToken };