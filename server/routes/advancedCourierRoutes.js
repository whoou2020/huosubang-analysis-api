// 高级骑手API路由
const express = require('express');
const router = express.Router();
const courierPerformanceService = require('../services/courierPerformanceService');
const { validateTimeRange, validatePaginationParams } = require('../middleware/validators');
const { asyncHandler, errorResponse, successResponse } = require('../middleware/errorHandlers');

// 按在线状态查询骑手
router.get('/v1/advanced/couriers/by-online-status', validatePaginationParams, asyncHandler(async (req, res) => {
  const { status, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (status === undefined) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '在线状态是必需的', '请提供有效的status参数')
    );
  }
  
  const options = {
    status: parseInt(status),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await courierPerformanceService.getCouriersByOnlineStatus(options);
  res.json(successResponse(result.couriers, {
    total: result.total,
    page,
    limit
  }));
}));

// 按是否正式骑手查询
router.get('/v1/advanced/couriers/by-employment-type', validatePaginationParams, asyncHandler(async (req, res) => {
  const { is_fulltime, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (is_fulltime === undefined) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '骑手类型是必需的', '请提供有效的is_fulltime参数')
    );
  }
  
  const options = {
    isFulltime: parseInt(is_fulltime),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await courierPerformanceService.getCouriersByEmploymentType(options);
  res.json(successResponse(result.couriers, {
    total: result.total,
    page,
    limit
  }));
}));

// 按是否离职查询骑手
router.get('/v1/advanced/couriers/by-resignation-status', validatePaginationParams, asyncHandler(async (req, res) => {
  const { is_resigned, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (is_resigned === undefined) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '离职状态是必需的', '请提供有效的is_resigned参数')
    );
  }
  
  const options = {
    isResigned: parseInt(is_resigned),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await courierPerformanceService.getCouriersByResignationStatus(options);
  res.json(successResponse(result.couriers, {
    total: result.total,
    page,
    limit
  }));
}));

// 骑手绩效分析路由

// 分析骑手配送订单数
router.get('/v1/advanced/couriers/order-count-analysis', validatePaginationParams, asyncHandler(async (req, res) => {
  const { start_time, end_time, min_orders } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (!start_time || !end_time) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '开始时间和结束时间是必需的', '请提供有效的start_time和end_time参数')
    );
  }
  
  const options = {
    startTime: parseInt(start_time),
    endTime: parseInt(end_time),
    minOrders: min_orders !== undefined ? parseInt(min_orders) : 1,
    limit,
    page
  };
  
  const result = await courierPerformanceService.analyzeCourierOrderCount(options);
  res.json(successResponse(result.couriers, {
    time_range: {
      start: options.startTime,
      end: options.endTime
    },
    pagination: {
      page,
      limit,
      total: result.total
    }
  }));
}));

// 分析骑手收益
router.get('/v1/advanced/couriers/earnings-analysis', validatePaginationParams, asyncHandler(async (req, res) => {
  const { start_time, end_time, min_earnings } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (!start_time || !end_time) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '开始时间和结束时间是必需的', '请提供有效的start_time和end_time参数')
    );
  }
  
  const options = {
    startTime: parseInt(start_time),
    endTime: parseInt(end_time),
    minEarnings: min_earnings !== undefined ? parseFloat(min_earnings) : 0,
    limit,
    page
  };
  
  const result = await courierPerformanceService.analyzeCourierEarnings(options);
  res.json(successResponse(result.couriers, {
    time_range: {
      start: options.startTime,
      end: options.endTime
    },
    pagination: {
      page,
      limit,
      total: result.total
    }
  }));
}));

// 分析骑手平均配送时长
router.get('/v1/advanced/couriers/delivery-duration-analysis', validatePaginationParams, asyncHandler(async (req, res) => {
  const { start_time, end_time, min_orders } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (!start_time || !end_time) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '开始时间和结束时间是必需的', '请提供有效的start_time和end_time参数')
    );
  }
  
  const options = {
    startTime: parseInt(start_time),
    endTime: parseInt(end_time),
    minOrders: min_orders !== undefined ? parseInt(min_orders) : 5,
    limit,
    page
  };
  
  const result = await courierPerformanceService.analyzeCourierDeliveryDuration(options);
  res.json(successResponse(result, {
    time_range: {
      start: options.startTime,
      end: options.endTime
    },
    pagination: {
      page,
      limit,
      total: result.total
    }
  }));
}));

module.exports = router; 