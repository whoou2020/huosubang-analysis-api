// 综合分析API路由
const express = require('express');
const router = express.Router();
const comprehensiveAnalysisService = require('../services/comprehensiveAnalysisService');
const { validateTimeRange } = require('../middleware/validators');
const { asyncHandler, errorResponse, successResponse } = require('../middleware/errorHandlers');

// 多维度订单统计分析
router.get('/analysis/orders/multi-dimension', validateTimeRange, asyncHandler(async (req, res) => {
  const { dimensions } = req.query;
  const { startTime, endTime } = req.validatedTimeRange;
  
  const options = {
    startTime,
    endTime
  };
  
  // 如果提供了维度参数，解析为数组
  if (dimensions) {
    options.dimensions = dimensions.split(',');
  }
  
  const result = await comprehensiveAnalysisService.analyzeOrdersByMultipleDimensions(options);
  res.json(successResponse(result, {
    time_range: {
      start: startTime,
      end: endTime
    },
    dimensions: options.dimensions
  }));
}));

// 订单趋势分析
router.get('/analysis/orders/trends', validateTimeRange, asyncHandler(async (req, res) => {
  const { time_unit, metrics } = req.query;
  const { startTime, endTime } = req.validatedTimeRange;
  
  const options = {
    startTime,
    endTime
  };
  
  // 可选参数
  if (time_unit) {
    options.timeUnit = time_unit;
  }
  
  // 如果提供了指标参数，解析为数组
  if (metrics) {
    options.metrics = metrics.split(',');
  }
  
  const result = await comprehensiveAnalysisService.analyzeOrderTrends(options);
  res.json(successResponse(result, {
    time_range: {
      start: startTime,
      end: endTime
    },
    time_unit: options.timeUnit,
    metrics: options.metrics
  }));
}));

// 骑手绩效趋势分析
router.get('/analysis/couriers/performance-trends', validateTimeRange, asyncHandler(async (req, res) => {
  const { time_unit, courier_id } = req.query;
  const { startTime, endTime } = req.validatedTimeRange;
  
  const options = {
    startTime,
    endTime
  };
  
  // 可选参数
  if (time_unit) {
    options.timeUnit = time_unit;
  }
  
  if (courier_id) {
    options.courierId = parseInt(courier_id);
  }
  
  const result = await comprehensiveAnalysisService.analyzeCourierPerformanceTrends(options);
  res.json(successResponse(result, {
    time_range: {
      start: startTime,
      end: endTime
    },
    time_unit: options.timeUnit,
    courier_id: options.courierId
  }));
}));

// 会员消费趋势分析
router.get('/analysis/members/spending-trends', validateTimeRange, asyncHandler(async (req, res) => {
  const { time_unit, member_id } = req.query;
  const { startTime, endTime } = req.validatedTimeRange;
  
  // 这个功能需要额外实现，目前返回一个模拟响应
  res.json(successResponse({
    message: '会员消费趋势分析功能正在开发中',
    query_params: {
      start_time: startTime,
      end_time: endTime,
      time_unit,
      member_id
    }
  }));
}));

// 综合业务指标看板
router.get('/analysis/dashboard', validateTimeRange, asyncHandler(async (req, res) => {
  const { startTime, endTime } = req.validatedTimeRange;
  
  // 获取多维度分析的汇总数据
  const multiDimensionResult = await comprehensiveAnalysisService.analyzeOrdersByMultipleDimensions({
    startTime,
    endTime,
    dimensions: ['status'] // 只需要状态维度的数据
  });
  
  // 获取趋势数据
  const trendResult = await comprehensiveAnalysisService.analyzeOrderTrends({
    startTime,
    endTime,
    timeUnit: 'day',
    metrics: ['order_count', 'revenue']
  });
  
  // 构建看板数据
  const dashboard = {
    summary: multiDimensionResult.summary,
    status_distribution: multiDimensionResult.status_dimension,
    recent_trends: {
      order_count: trendResult.order_count_trend ? trendResult.order_count_trend.slice(-7) : [],
      revenue: trendResult.revenue_trend ? trendResult.revenue_trend.slice(-7) : []
    }
  };
  
  res.json(successResponse(dashboard, {
    time_range: {
      start: startTime,
      end: endTime
    }
  }));
}));

module.exports = router; 