// 高级API路由
const express = require('express');
const router = express.Router();
const comprehensiveAnalysisService = require('../services/comprehensiveAnalysisService');
const { validateTimeRange, validatePaginationParams } = require('../middleware/validators');
const { asyncHandler, errorResponse, successResponse } = require('../middleware/errorHandlers');

// 高级订单筛选路由

// 按配送费查询订单
router.get('/v1/advanced/orders/by-delivery-fee', validatePaginationParams, asyncHandler(async (req, res) => {
  const { min_fee, max_fee, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (min_fee === undefined || max_fee === undefined) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '配送费范围参数缺失', '请提供min_fee和max_fee参数')
    );
  }
  
  const options = {
    minFee: parseFloat(min_fee),
    maxFee: parseFloat(max_fee),
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await comprehensiveAnalysisService.getOrdersByFeeRange(options);
  res.json(successResponse(result.orders, {
    total: result.total,
    page,
    limit
  }));
}));

// 按配送距离类型查询订单
router.get('/v1/advanced/orders/by-distance-flag', validatePaginationParams, asyncHandler(async (req, res) => {
  const { is_long_distance, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (is_long_distance === undefined) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '距离标志参数缺失', '请提供is_long_distance参数')
    );
  }
  
  const options = {
    isLongDistance: is_long_distance === 'true',
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await comprehensiveAnalysisService.getOrdersByDistanceFlag(options);
  res.json(successResponse(result.orders, {
    total: result.total,
    page,
    limit
  }));
}));

// 按预约标志查询订单
router.get('/v1/advanced/orders/by-reservation-flag', validatePaginationParams, asyncHandler(async (req, res) => {
  const { is_reserved, use_chinese } = req.query;
  const { limit, page } = req.pagination;
  
  // 验证必要参数
  if (is_reserved === undefined) {
    return res.status(400).json(
      errorResponse('INVALID_PARAMS', '预约标志参数缺失', '请提供is_reserved参数')
    );
  }
  
  const options = {
    isReserved: is_reserved === 'true',
    limit,
    page,
    useEnglishFields: use_chinese !== 'true'
  };
  
  const result = await comprehensiveAnalysisService.getOrdersByReservationFlag(options);
  res.json(successResponse(result.orders, {
    total: result.total,
    page,
    limit
  }));
}));

// 订单时间分析路由

// 分析订单配送时长
router.get('/v1/advanced/orders/delivery-duration-analysis', validateTimeRange, validatePaginationParams, asyncHandler(async (req, res) => {
  const { order_type, courier_id, is_del = 0 } = req.query;
  const { startTime, endTime } = req.validatedTimeRange;
  const { limit, page } = req.pagination;
  
  const options = {
    startTime,
    endTime,
    orderType: order_type !== undefined ? parseInt(order_type) : undefined,
    courierId: courier_id !== undefined ? parseInt(courier_id) : undefined,
    isDel: parseInt(is_del),
    limit,
    page
  };
  
  const result = await comprehensiveAnalysisService.analyzeDeliveryDuration(options);
  res.json(successResponse(result.data, {
    time_range: {
      start: options.startTime,
      end: options.endTime
    },
    pagination: {
      total: result.total || 0,
      page,
      limit
    }
  }));
}));

// 分析订单各阶段时间
router.get('/v1/advanced/orders/stages-duration-analysis', validateTimeRange, validatePaginationParams, asyncHandler(async (req, res) => {
  const { order_type, courier_id, is_del = 0 } = req.query;
  const { startTime, endTime } = req.validatedTimeRange;
  const { limit, page } = req.pagination;
  
  const options = {
    startTime,
    endTime,
    orderType: order_type !== undefined ? parseInt(order_type) : undefined,
    courierId: courier_id !== undefined ? parseInt(courier_id) : undefined,
    isDel: parseInt(is_del),
    limit,
    page
  };
  
  const result = await comprehensiveAnalysisService.analyzeOrderStagesDuration(options);
  res.json(successResponse(result.data, {
    time_range: {
      start: options.startTime,
      end: options.endTime
    },
    pagination: {
      total: result.total || 0,
      page,
      limit
    }
  }));
}));

module.exports = router; 