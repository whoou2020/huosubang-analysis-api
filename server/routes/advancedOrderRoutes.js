// 高级订单API路由
const express = require('express');
const router = express.Router();
const joinQueryService = require('../services/joinQueryService');
const comprehensiveAnalysisService = require('../services/comprehensiveAnalysisService');
const { validateTimeRange, validatePaginationParams } = require('../middleware/validators');
const { asyncHandler, errorResponse, successResponse } = require('../middleware/errorHandlers');

// 按状态查询订单
router.get('/by-status', validatePaginationParams, asyncHandler(async (req, res) => {
  const { status, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (status === undefined) {
    return res.status(400).json(
      errorResponse('MISSING_PARAMETER', '订单状态是必需的', '请提供有效的status参数')
    );
  }
  
  const options = {
    status: parseInt(status),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await joinQueryService.getOrdersByStatus(options);
  res.json(successResponse(result.orders, {
    total: result.total,
    page,
    limit
  }));
}));

// 按价格范围查询订单
router.get('/by-price-range', validatePaginationParams, asyncHandler(async (req, res) => {
  const { min_price, max_price, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (min_price === undefined || max_price === undefined) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '价格范围参数缺失', '请提供min_price和max_price参数')
    );
  }
  
  const options = {
    minPrice: parseFloat(min_price),
    maxPrice: parseFloat(max_price),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await joinQueryService.getOrdersByPriceRange(options);
  res.json(successResponse(result.orders, {
    total: result.total,
    page,
    limit
  }));
}));

// 按配送时间查询订单
router.get('/by-delivery-time', validatePaginationParams, asyncHandler(async (req, res) => {
  const { min_time, max_time, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (min_time === undefined || max_time === undefined) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '配送时间范围参数缺失', '请提供min_time和max_time参数')
    );
  }
  
  const options = {
    minTime: parseInt(min_time),
    maxTime: parseInt(max_time),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await joinQueryService.getOrdersByDeliveryTime(options);
  res.json(successResponse(result.orders, {
    total: result.total,
    page,
    limit
  }));
}));

// 按区域查询订单
router.get('/by-area', validatePaginationParams, asyncHandler(async (req, res) => {
  const { area_type, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (area_type === undefined) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '区域类型是必需的', '请提供有效的area_type参数')
    );
  }
  
  const options = {
    areaType: parseInt(area_type),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await joinQueryService.getOrdersByArea(options);
  res.json(successResponse(result.orders, {
    total: result.total,
    page,
    limit
  }));
}));

// 按订单类型查询订单
router.get('/by-order-type', validatePaginationParams, asyncHandler(async (req, res) => {
  const { order_type, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (order_type === undefined) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '订单类型是必需的', '请提供有效的order_type参数')
    );
  }
  
  const options = {
    orderType: parseInt(order_type),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await joinQueryService.getOrdersByOrderType(options);
  res.json(successResponse(result.orders, {
    total: result.total,
    page,
    limit
  }));
}));

// 周度订单分析
router.get('/weekly-analysis', validateTimeRange, asyncHandler(async (req, res) => {
  const { startTime, endTime } = req.validatedTimeRange;
  
  const options = {
    startTime,
    endTime
  };
  
  const result = await comprehensiveAnalysisService.getWeeklyOrderAnalysis(options);
  res.json(successResponse(result, {
    time_range: {
      start: startTime,
      end: endTime
    }
  }));
}));

// 订单客户分析
router.get('/customer-analysis', validateTimeRange, asyncHandler(async (req, res) => {
  const { startTime, endTime } = req.validatedTimeRange;
  
  const options = {
    startTime,
    endTime
  };
  
  const result = await comprehensiveAnalysisService.getOrderCustomerAnalysis(options);
  res.json(successResponse(result, {
    time_range: {
      start: startTime,
      end: endTime
    }
  }));
}));

// 每日数据环比分析
router.get('/daily-comparison', asyncHandler(async (req, res) => {
  const { base_date, metrics } = req.query;
  
  // 验证基准日期
  if (!base_date) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '基准日期是必需的', '请提供有效的base_date参数')
    );
  }

  // 验证日期格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(base_date)) {
    return res.status(400).json(
      errorResponse('INVALID_DATE_FORMAT', '日期格式无效，应为 YYYY-MM-DD', '请使用YYYY-MM-DD格式的日期')
    );
  }

  // 验证日期是否为未来日期
  if (new Date(base_date) > new Date()) {
    return res.status(400).json(
      errorResponse('INVALID_DATE', '基准日期不能是未来日期', '请选择今天或过去的日期')
    );
  }
  
  // 验证指标参数
  if (!metrics) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '指标参数是必需的', '请提供至少一个有效的指标')
    );
  }

  // 将单个指标转换为数组
  const metricsArray = Array.isArray(metrics) ? metrics : [metrics];

  // 验证指标名称
  const validMetrics = ['order_count', 'total_amount', 'avg_amount', 'avg_delivery_time'];
  const invalidMetrics = metricsArray.filter(metric => !validMetrics.includes(metric));
  if (invalidMetrics.length > 0) {
    return res.status(400).json(
      errorResponse('INVALID_METRIC', `无效的指标名称: ${invalidMetrics.join(', ')}`, `有效的指标包括: ${validMetrics.join(', ')}`)
    );
  }

  const result = await comprehensiveAnalysisService.getDailyComparison({
    base_date,
    metrics: metricsArray
  });

  res.json(successResponse(result));
}));

module.exports = router; 