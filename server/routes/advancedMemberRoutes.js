// 高级会员API路由
const express = require('express');
const router = express.Router();
const memberBehaviorService = require('../services/memberBehaviorService');
const { validateTimeRange, validatePaginationParams } = require('../middleware/validators');
const { asyncHandler, errorResponse, successResponse } = require('../middleware/errorHandlers');

// 会员分析路由

// 按注册时间查询会员
router.get('/members/by-registration-time', validatePaginationParams, asyncHandler(async (req, res) => {
  const { start_time, end_time, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (!start_time || !end_time) {
    return res.status(400).json(
      errorResponse('MISSING_PARAMETERS', '开始时间和结束时间是必需的', '请提供start_time和end_time参数')
    );
  }
  
  const options = {
    startTime: parseInt(start_time),
    endTime: parseInt(end_time),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await memberBehaviorService.getMembersByRegistrationTime(options);
  res.json(successResponse(result.members, {
    total: result.total,
    time_range: {
      start: options.startTime,
      end: options.endTime
    },
    page,
    limit
  }));
}));

// 按会员等级查询会员
router.get('/members/by-level', validatePaginationParams, asyncHandler(async (req, res) => {
  const { level, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (level === undefined) {
    return res.status(400).json(
      errorResponse('MISSING_PARAMETERS', '会员等级是必需的', '请提供level参数')
    );
  }
  
  const options = {
    level: parseInt(level),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await memberBehaviorService.getMembersByLevel(options);
  res.json(successResponse(result.members, {
    total: result.total,
    page,
    limit
  }));
}));

// 按余额范围查询会员
router.get('/members/by-balance-range', validatePaginationParams, asyncHandler(async (req, res) => {
  const { min_balance, max_balance, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  const options = {
    minBalance: min_balance !== undefined ? parseFloat(min_balance) : 0,
    maxBalance: max_balance !== undefined ? parseFloat(max_balance) : 10000,
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await memberBehaviorService.getMembersByBalanceRange(options);
  res.json(successResponse(result.members, {
    total: result.total,
    balance_range: {
      min: options.minBalance,
      max: options.maxBalance
    },
    page,
    limit
  }));
}));

// 会员行为分析路由

// 分析会员下单频率
router.get('/members/order-frequency-analysis', validatePaginationParams, asyncHandler(async (req, res) => {
  const { start_time, end_time, min_orders } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (!start_time || !end_time) {
    return res.status(400).json(
      errorResponse('MISSING_PARAMETERS', '开始时间和结束时间是必需的', '请提供start_time和end_time参数')
    );
  }
  
  const options = {
    startTime: parseInt(start_time),
    endTime: parseInt(end_time),
    minOrders: min_orders !== undefined ? parseInt(min_orders) : 1,
    limit,
    page
  };
  
  const result = await memberBehaviorService.analyzeMemberOrderFrequency(options);
  res.json(successResponse(result.members, {
    total: result.total,
    time_range: {
      start: options.startTime,
      end: options.endTime
    },
    page,
    limit
  }));
}));

// 分析会员消费金额
router.get('/members/spending-analysis', validatePaginationParams, asyncHandler(async (req, res) => {
  const { start_time, end_time, min_spending } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (!start_time || !end_time) {
    return res.status(400).json(
      errorResponse('MISSING_PARAMETERS', '开始时间和结束时间是必需的', '请提供start_time和end_time参数')
    );
  }
  
  const options = {
    startTime: parseInt(start_time),
    endTime: parseInt(end_time),
    minSpending: min_spending !== undefined ? parseFloat(min_spending) : 0,
    limit,
    page
  };
  
  const result = await memberBehaviorService.analyzeMemberSpending(options);
  res.json(successResponse(result.members, {
    total: result.total,
    time_range: {
      start: options.startTime,
      end: options.endTime
    },
    page,
    limit
  }));
}));

module.exports = router; 