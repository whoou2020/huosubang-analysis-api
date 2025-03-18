/**
 * 统一路由管理
 * 该文件集中注册所有API路由，避免重复路由和职责不明确的问题
 */

const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require('../middleware/errorHandlers');

// 导入各个路由模块
const apiRoutes = require('./apiRoutes');
const advancedOrderRoutes = require('./advancedOrderRoutes');
const advancedMemberRoutes = require('./advancedMemberRoutes');
const advancedCourierRoutes = require('./advancedCourierRoutes');
const advancedApiRoutes = require('./advancedApiRoutes');
const comprehensiveAnalysisRoutes = require('./comprehensiveAnalysisRoutes');

// 健康检查路由（定义在主路由，便于监控服务状态）
router.get('/health', (req, res) => {
  res.json(successResponse({ 
    status: 'ok', 
    message: 'API服务正常运行',
    version: process.env.API_VERSION || '1.0.0'
  }));
});

// 注册基础API路由
router.use('/api/v1', apiRoutes);

// 注册高级分析API路由
router.use('/api/v1/advanced/orders', advancedOrderRoutes);
router.use('/api/v1/advanced/members', advancedMemberRoutes);
router.use('/api/v1/advanced/couriers', advancedCourierRoutes);
router.use('/api', advancedApiRoutes); // 这些路由已经包含了完整路径
router.use('/api/v1', comprehensiveAnalysisRoutes);

// 通用错误处理中间件
router.use((err, req, res, next) => {
  console.error('API错误:', err);
  
  res.status(err.status || 500).json(
    errorResponse(
      err.code || 'SERVER_ERROR',
      err.message || '服务器内部错误',
      process.env.NODE_ENV === 'production' ? undefined : err.stack
    )
  );
});

// 404处理中间件
router.use((req, res) => {
  res.status(404).json(
    errorResponse(
      'NOT_FOUND',
      '请求的资源不存在',
      `路径 ${req.originalUrl} 不存在或方法 ${req.method} 不支持`
    )
  );
});

module.exports = router; 