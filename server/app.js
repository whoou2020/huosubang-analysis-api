const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const os = require('os');
const path = require('path');
const { testConnection } = require('./config/database');
const dotenv = require('dotenv');
const routes = require('./routes');

dotenv.config();

const app = express();

// 增加响应大小限制
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 更新CORS配置
app.use(cors({
  origin: '*',  // 临时允许所有源访问
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false  // 当origin为*时，credentials必须为false
}));

// 请求限速（每分钟100次）
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 每个IP每分钟最多100个请求
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  }
});
app.use(limiter);

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] 访问: ${req.method} ${req.originalUrl}`);
  const logParams = {
    query: req.query
  };
  
  // 只在非生产环境记录请求体
  if (process.env.NODE_ENV !== 'production' && req.body && Object.keys(req.body).length > 0) {
    logParams.body = req.body;
  }
  
  console.log('请求参数:', logParams);
  next();
});

// 健康检查端点（需放在默认处理前）
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK', 
    version: process.env.API_VERSION || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 添加文档路由
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/API.md'));
});

// 测试数据库连接
(async () => {
  try {
    const connected = await testConnection();
    if (connected) {
      console.log('✅ 数据库连接测试成功');
    } else {
      console.error('❌ 数据库连接测试失败');
    }
  } catch (error) {
    console.error('❌ 数据库连接测试异常:', error.message);
  }
})();

// 使用统一路由管理
app.use('/', routes);

// 根路由重定向到健康检查
app.get('/', (req, res) => {
  res.redirect('/health');
});

// 添加进程异常监控
process.on('uncaughtException', (err) => {
  console.error('⚠️ 未捕获异常:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ 未处理的Promise拒绝:', reason);
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 服务已启动在端口 ${PORT}`);
  
  // 获取本机IP
  const nets = os.networkInterfaces();
  const ips = Object.values(nets).flat().filter(n => n.family === 'IPv4' && !n.internal);
  
  console.log('可用访问地址:');
  console.log(`本地: http://localhost:${PORT}`);
  ips.forEach(({ address }) => console.log(`网络: http://${address}:${PORT}`));
});

module.exports = app; 
