// 综合分析服务
const pool = require('../config/database');
const { mapDatabaseToApi } = require('../utils/fieldMapper');
const { formatMinutes, formatTimestamp } = require('../utils/timeUtils');

/**
 * 多维度订单统计分析
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} - 多维度订单统计分析结果
 */
async function analyzeOrdersByMultipleDimensions(options = {}) {
  const {
    startTime,
    endTime,
    dimensions = ['time', 'area', 'order_type', 'status']
  } = options;

  if (!startTime || !endTime) {
    throw new Error('开始时间和结束时间是必需的');
  }

  const result = {};
  
  try {
    // 按时间维度统计（按天）
    if (dimensions.includes('time')) {
      const [timeStats] = await pool.execute(
        `SELECT 
          FROM_UNIXTIME(add_time, '%Y-%m-%d') as date,
          COUNT(*) as order_count,
          SUM(price) as total_price,
          SUM(peisongfei) as total_delivery_fee,
          AVG(price) as avg_price,
          COUNT(CASE WHEN status = 5 THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = -2 THEN 1 END) as cancelled_count
        FROM 
          lzb_peisong_order
        WHERE 
          add_time BETWEEN ? AND ?
        GROUP BY 
          date
        ORDER BY 
          date ASC`,
        [startTime, endTime]
      );
      
      result.time_dimension = timeStats;
    }
    
    // 按区域维度统计
    if (dimensions.includes('area')) {
      const [areaStats] = await pool.execute(
        `SELECT 
          quyu_type,
          CASE 
            WHEN quyu_type = 0 THEN '未知'
            WHEN quyu_type = 1 THEN '新城'
            WHEN quyu_type = 2 THEN '古城'
            WHEN quyu_type = 3 THEN '响嘡新村/秦庄/新站/老站'
            WHEN quyu_type = 4 THEN '其他'
            ELSE '未分类'
          END as area_name,
          COUNT(*) as order_count,
          SUM(price) as total_price,
          SUM(peisongfei) as total_delivery_fee,
          AVG(price) as avg_price,
          COUNT(CASE WHEN status = 5 THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = -2 THEN 1 END) as cancelled_count
        FROM 
          lzb_peisong_order
        WHERE 
          add_time BETWEEN ? AND ?
        GROUP BY 
          quyu_type, area_name
        ORDER BY 
          order_count DESC`,
        [startTime, endTime]
      );
      
      result.area_dimension = areaStats;
    }
    
    // 按订单类型维度统计
    if (dimensions.includes('order_type')) {
      const [orderTypeStats] = await pool.execute(
        `SELECT 
          order_type,
          CASE 
            WHEN order_type = 1 THEN '帮我送'
            WHEN order_type = 2 THEN '帮我取'
            WHEN order_type = 3 THEN '代买'
            WHEN order_type = 4 THEN '语音订单'
            WHEN order_type = 5 THEN '外卖'
            WHEN order_type = 6 THEN '文字订单'
            WHEN order_type = 7 THEN '团购订单'
            ELSE '其他'
          END as order_type_name,
          COUNT(*) as order_count,
          SUM(price) as total_price,
          SUM(peisongfei) as total_delivery_fee,
          AVG(price) as avg_price,
          COUNT(CASE WHEN status = 5 THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = -2 THEN 1 END) as cancelled_count
        FROM 
          lzb_peisong_order
        WHERE 
          add_time BETWEEN ? AND ?
        GROUP BY 
          order_type, order_type_name
        ORDER BY 
          order_count DESC`,
        [startTime, endTime]
      );
      
      result.order_type_dimension = orderTypeStats;
    }
    
    // 按订单状态维度统计
    if (dimensions.includes('status')) {
      const [statusStats] = await pool.execute(
        `SELECT 
          status,
          CASE 
            WHEN status = -2 THEN '取消订单'
            WHEN status = -1 THEN '关闭订单'
            WHEN status = 0 THEN '待付款'
            WHEN status = 1 THEN '待接单'
            WHEN status = 2 THEN '待取货'
            WHEN status = 3 THEN '配送中'
            WHEN status = 4 THEN '已送达'
            WHEN status = 5 THEN '已完成'
            ELSE '未知状态'
          END as status_name,
          COUNT(*) as order_count,
          SUM(price) as total_price,
          SUM(peisongfei) as total_delivery_fee,
          AVG(price) as avg_price
        FROM 
          lzb_peisong_order
        WHERE 
          add_time BETWEEN ? AND ?
        GROUP BY 
          status, status_name
        ORDER BY 
          status ASC`,
        [startTime, endTime]
      );
      
      result.status_dimension = statusStats;
    }
    
    // 计算总体统计数据
    const [totalStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(price) as total_price,
        SUM(peisongfei) as total_delivery_fee,
        AVG(price) as avg_price,
        COUNT(CASE WHEN status = 5 THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = -2 THEN 1 END) as cancelled_count,
        COUNT(DISTINCT memberid) as customer_count,
        COUNT(DISTINCT qishouid) as courier_count
      FROM 
        lzb_peisong_order
      WHERE 
        add_time BETWEEN ? AND ?`,
      [startTime, endTime]
    );
    
    result.summary = totalStats[0];
    
    return result;
  } catch (error) {
    console.error('多维度订单统计分析失败:', error);
    throw error;
  }
}

/**
 * 订单趋势分析
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} - 订单趋势分析结果
 */
async function analyzeOrderTrends(options = {}) {
  const {
    startTime,
    endTime,
    timeUnit = 'day', // day, week, month
    metrics = ['order_count', 'revenue', 'delivery_duration']
  } = options;

  if (!startTime || !endTime) {
    throw new Error('开始时间和结束时间是必需的');
  }

  const result = {};
  
  try {
    // 时间格式化表达式
    let timeFormat;
    let groupByClause;
    
    switch (timeUnit) {
      case 'week':
        timeFormat = '%Y-%u'; // ISO周格式 (年-周)
        groupByClause = 'YEARWEEK(FROM_UNIXTIME(add_time))';
        break;
      case 'month':
        timeFormat = '%Y-%m'; // 年-月
        groupByClause = 'DATE_FORMAT(FROM_UNIXTIME(add_time), "%Y-%m")';
        break;
      case 'day':
      default:
        timeFormat = '%Y-%m-%d'; // 年-月-日
        groupByClause = 'DATE(FROM_UNIXTIME(add_time))';
        break;
    }
    
    // 订单量趋势
    if (metrics.includes('order_count')) {
      const [orderCountTrend] = await pool.execute(
        `SELECT 
          DATE_FORMAT(FROM_UNIXTIME(add_time), ?) as time_period,
          COUNT(*) as order_count,
          COUNT(CASE WHEN status = 5 THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = -2 THEN 1 END) as cancelled_count
        FROM 
          lzb_peisong_order
        WHERE 
          add_time BETWEEN ? AND ?
        GROUP BY 
          time_period
        ORDER BY 
          time_period ASC`,
        [timeFormat, startTime, endTime]
      );
      
      result.order_count_trend = orderCountTrend;
    }
    
    // 收入趋势
    if (metrics.includes('revenue')) {
      const [revenueTrend] = await pool.execute(
        `SELECT 
          DATE_FORMAT(FROM_UNIXTIME(add_time), ?) as time_period,
          SUM(price) as total_price,
          SUM(peisongfei) as total_delivery_fee,
          SUM(price + peisongfei) as total_revenue,
          AVG(price) as avg_price,
          AVG(peisongfei) as avg_delivery_fee
        FROM 
          lzb_peisong_order
        WHERE 
          add_time BETWEEN ? AND ?
          AND status = 5 -- 只统计已完成的订单
        GROUP BY 
          time_period
        ORDER BY 
          time_period ASC`,
        [timeFormat, startTime, endTime]
      );
      
      result.revenue_trend = revenueTrend;
    }
    
    // 配送时长趋势
    if (metrics.includes('delivery_duration')) {
      const [durationTrend] = await pool.execute(
        `SELECT 
          DATE_FORMAT(FROM_UNIXTIME(add_time), ?) as time_period,
          AVG(yong_shi) as avg_delivery_duration,
          MIN(yong_shi) as min_delivery_duration,
          MAX(yong_shi) as max_delivery_duration,
          AVG(set_shichang) as avg_expected_duration,
          AVG(yong_shi - set_shichang) as avg_duration_diff
        FROM 
          lzb_peisong_order
        WHERE 
          add_time BETWEEN ? AND ?
          AND status = 5 -- 只统计已完成的订单
          AND yong_shi > 0
        GROUP BY 
          time_period
        ORDER BY 
          time_period ASC`,
        [timeFormat, startTime, endTime]
      );
      
      // 转换秒到分钟
      result.delivery_duration_trend = durationTrend.map(item => ({
        ...item,
        avg_delivery_duration: Math.round(item.avg_delivery_duration / 60 * 10) / 10,
        min_delivery_duration: Math.round(item.min_delivery_duration / 60 * 10) / 10,
        max_delivery_duration: Math.round(item.max_delivery_duration / 60 * 10) / 10,
        avg_expected_duration: Math.round(item.avg_expected_duration / 60 * 10) / 10,
        avg_duration_diff: Math.round(item.avg_duration_diff / 60 * 10) / 10
      }));
    }
    
    return result;
  } catch (error) {
    console.error('订单趋势分析失败:', error);
    throw error;
  }
}

/**
 * 骑手绩效趋势分析
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} - 骑手绩效趋势分析结果
 */
async function analyzeCourierPerformanceTrends(options = {}) {
  const {
    startTime,
    endTime,
    timeUnit = 'day', // day, week, month
    courierId
  } = options;

  if (!startTime || !endTime) {
    throw new Error('开始时间和结束时间是必需的');
  }

  // 时间格式化表达式
  let timeFormat;
  
  switch (timeUnit) {
    case 'week':
      timeFormat = '%Y-%u'; // ISO周格式 (年-周)
      break;
    case 'month':
      timeFormat = '%Y-%m'; // 年-月
      break;
    case 'day':
    default:
      timeFormat = '%Y-%m-%d'; // 年-月-日
      break;
  }
  
  try {
    let whereClause = 'o.add_time BETWEEN ? AND ?';
    const params = [timeFormat, startTime, endTime];
    
    if (courierId) {
      whereClause += ' AND o.qishouid = ?';
      params.push(courierId);
    }
    
    // 骑手绩效趋势
    const [performanceTrend] = await pool.execute(
      `SELECT 
        DATE_FORMAT(FROM_UNIXTIME(o.add_time), ?) as time_period,
        COUNT(o.id) as order_count,
        COUNT(CASE WHEN o.status = 5 THEN 1 END) as completed_count,
        COUNT(CASE WHEN o.status = -2 THEN 1 END) as cancelled_count,
        ROUND(COUNT(CASE WHEN o.status = 5 THEN 1 END) / COUNT(o.id) * 100, 2) as completion_rate,
        SUM(o.qishou_shouyi) as total_earnings,
        AVG(o.qishou_shouyi) as avg_earnings_per_order,
        AVG(o.shiji_shichang) as avg_delivery_duration,
        COUNT(DISTINCT o.qishouid) as active_couriers
      FROM 
        lzb_peisong_order o
      WHERE 
        ${whereClause}
      GROUP BY 
        time_period
      ORDER BY 
        time_period ASC`,
      params
    );
    
    // 转换配送时长从秒到分钟
    const formattedTrend = performanceTrend.map(item => ({
      ...item,
      avg_delivery_duration: item.avg_delivery_duration ? Math.round(item.avg_delivery_duration / 60 * 10) / 10 : 0
    }));
    
    return {
      performance_trend: formattedTrend
    };
  } catch (error) {
    console.error('骑手绩效趋势分析失败:', error);
    throw error;
  }
}

/**
 * 分析订单配送时长
 * @param {Object} options - 查询选项
 * @param {number} options.startTime - 开始时间戳（秒）
 * @param {number} options.endTime - 结束时间戳（秒）
 * @param {number} [options.orderType] - 订单类型
 * @param {number} [options.courierId] - 骑手ID
 * @param {number} [options.isDel] - 是否删除
 * @param {number} [options.limit] - 每页记录数，默认50
 * @param {number} [options.page] - 页码，默认1
 * @returns {Promise<Object>} - 订单配送时长分析结果
 */
async function analyzeDeliveryDuration(options = {}) {
  const {
    startTime,
    endTime,
    orderType,
    courierId,
    isDel = 0,
    limit = 50,
    page = 1
  } = options;

  if (!startTime || !endTime) {
    throw new Error('开始时间和结束时间是必需的');
  }

  const offset = (page - 1) * limit;
  
  try {
    // 构建查询条件
    let whereClause = 'o.add_time BETWEEN ? AND ? AND o.status = 5 AND o.is_del = ?';
    const params = [startTime, endTime, isDel];
    
    if (orderType !== undefined) {
      whereClause += ' AND o.order_type = ?';
      params.push(orderType);
    }
    
    if (courierId !== undefined) {
      whereClause += ' AND o.qishouid = ?';
      params.push(courierId);
    }
    
    // 查询符合条件的订单总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM lzb_peisong_order o
       WHERE ${whereClause}`,
      params
    );
    
    const total = countResult[0].total;
    
    // 查询订单配送时长分析数据
    const queryParams = [...params, offset, parseInt(limit)];
    const [rows] = await pool.execute(
      `SELECT 
        o.id as order_id,
        o.ordersn as order_sn,
        o.add_time,
        o.pay_time,
        o.jiedan_time,
        o.qu_time,
        o.songda_time,
        o.complete_time,
        o.yong_shi as delivery_duration,
        o.set_shichang as expected_duration,
        o.yong_shi - o.set_shichang as duration_diff,
        o.qishouid as courier_id,
        q.card_name as courier_name,
        m.nickname as courier_nickname,
        o.order_type,
        CASE 
          WHEN o.order_type = 1 THEN '帮我送'
          WHEN o.order_type = 2 THEN '帮我取'
          WHEN o.order_type = 3 THEN '代买'
          WHEN o.order_type = 4 THEN '语音订单'
          WHEN o.order_type = 5 THEN '外卖'
          WHEN o.order_type = 6 THEN '文字订单'
          WHEN o.order_type = 7 THEN '团购订单'
          ELSE '其他'
        END as order_type_name,
        o.juli as distance,
        o.peisongfei as delivery_fee
      FROM 
        lzb_peisong_order o
      LEFT JOIN 
        lzb_qishou_info q ON o.qishouid = q.memberid
      LEFT JOIN 
        lzb_member m ON q.memberid = m.id
      WHERE 
        ${whereClause}
      ORDER BY 
        o.delivery_duration DESC
      LIMIT ?, ?`,
      queryParams
    );
    
    // 格式化结果
    const formattedResults = rows.map(row => ({
      order_info: {
        id: row.order_id,
        sn: row.order_sn,
        type: row.order_type,
        type_name: row.order_type_name,
        distance: row.distance,
        delivery_fee: row.delivery_fee
      },
      delivery_times: {
        order_time: formatTimestamp(row.add_time),
        accept_time: formatTimestamp(row.jiedan_time),
        pickup_time: formatTimestamp(row.qu_time),
        delivered_time: formatTimestamp(row.songda_time),
        complete_time: formatTimestamp(row.complete_time)
      },
      delivery_stats: {
        actual_duration: Math.round(row.delivery_duration / 60 * 10) / 10, // 转换为分钟，保留一位小数
        expected_duration: Math.round(row.expected_duration / 60 * 10) / 10,
        duration_diff: Math.round(row.duration_diff / 60 * 10) / 10,
        is_on_time: row.duration_diff <= 0
      },
      courier_info: {
        id: row.courier_id,
        name: row.courier_name || row.courier_nickname || '未知骑手'
      }
    }));
    
    return {
      data: formattedResults,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    };
  } catch (error) {
    console.error('分析订单配送时长失败:', error);
    throw error;
  }
}

/**
 * 分析订单各阶段时间
 * @param {Object} options - 查询选项
 * @param {number} options.startTime - 开始时间戳（秒）
 * @param {number} options.endTime - 结束时间戳（秒）
 * @param {number} [options.orderType] - 订单类型
 * @param {number} [options.courierId] - 骑手ID
 * @param {number} [options.isDel] - 是否删除
 * @param {number} [options.limit] - 每页记录数，默认50
 * @param {number} [options.page] - 页码，默认1
 * @returns {Promise<Object>} - 订单各阶段时间分析结果
 */
async function analyzeOrderStagesDuration(options = {}) {
  const {
    startTime,
    endTime,
    orderType,
    courierId,
    isDel = 0,
    limit = 50,
    page = 1
  } = options;

  if (!startTime || !endTime) {
    throw new Error('开始时间和结束时间是必需的');
  }

  const offset = (page - 1) * limit;
  
  try {
    // 构建查询条件
    let whereClause = 'o.add_time BETWEEN ? AND ? AND o.status = 5 AND o.is_del = ?';
    const params = [startTime, endTime, isDel];
    
    if (orderType !== undefined) {
      whereClause += ' AND o.order_type = ?';
      params.push(orderType);
    }
    
    if (courierId !== undefined) {
      whereClause += ' AND o.qishouid = ?';
      params.push(courierId);
    }
    
    // 查询符合条件的订单总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM lzb_peisong_order o
       WHERE ${whereClause}`,
      params
    );
    
    const total = countResult[0].total;
    
    // 查询订单各阶段时间数据
    const queryParams = [...params, offset, parseInt(limit)];
    const [rows] = await pool.execute(
      `SELECT 
        o.id as order_id,
        o.ordersn as order_sn,
        o.add_time,
        o.pay_time,
        o.jiedan_time,
        o.qu_time,
        o.songda_time,
        o.complete_time,
        
        -- 各阶段时长（秒）
        o.pay_time - o.add_time as payment_stage,
        o.jiedan_time - o.pay_time as accept_stage,
        o.qu_time - o.jiedan_time as pickup_stage,
        o.songda_time - o.qu_time as delivery_stage,
        o.complete_time - o.songda_time as completion_stage,
        o.yong_shi as total_duration,
        
        o.qishouid as courier_id,
        q.card_name as courier_name,
        m.nickname as courier_nickname,
        o.order_type,
        CASE 
          WHEN o.order_type = 1 THEN '帮我送'
          WHEN o.order_type = 2 THEN '帮我取'
          WHEN o.order_type = 3 THEN '代买'
          WHEN o.order_type = 4 THEN '语音订单'
          WHEN o.order_type = 5 THEN '外卖'
          WHEN o.order_type = 6 THEN '文字订单'
          WHEN o.order_type = 7 THEN '团购订单'
          ELSE '其他'
        END as order_type_name,
        o.juli as distance,
        o.peisongfei as delivery_fee
      FROM 
        lzb_peisong_order o
      LEFT JOIN 
        lzb_qishou_info q ON o.qishouid = q.memberid
      LEFT JOIN 
        lzb_member m ON q.memberid = m.id
      WHERE 
        ${whereClause}
      ORDER BY 
        o.add_time DESC
      LIMIT ?, ?`,
      queryParams
    );
    
    // 格式化结果，转换秒到分钟，处理可能为null的情况
    const formattedResults = rows.map(row => ({
      order_info: {
        id: row.order_id,
        sn: row.order_sn,
        type: row.order_type,
        type_name: row.order_type_name,
        distance: row.distance,
        delivery_fee: row.delivery_fee
      },
      timeline: {
        order_time: formatTimestamp(row.add_time),
        payment_time: formatTimestamp(row.pay_time),
        accept_time: formatTimestamp(row.jiedan_time),
        pickup_time: formatTimestamp(row.qu_time),
        delivered_time: formatTimestamp(row.songda_time),
        complete_time: formatTimestamp(row.complete_time)
      },
      stage_durations: {
        payment_stage: row.payment_stage > 0 ? Math.round(row.payment_stage / 60 * 10) / 10 : null,
        accept_stage: row.accept_stage > 0 ? Math.round(row.accept_stage / 60 * 10) / 10 : null,
        pickup_stage: row.pickup_stage > 0 ? Math.round(row.pickup_stage / 60 * 10) / 10 : null,
        delivery_stage: row.delivery_stage > 0 ? Math.round(row.delivery_stage / 60 * 10) / 10 : null,
        completion_stage: row.completion_stage > 0 ? Math.round(row.completion_stage / 60 * 10) / 10 : null,
        total_duration: row.total_duration > 0 ? Math.round(row.total_duration / 60 * 10) / 10 : null
      },
      courier_info: {
        id: row.courier_id,
        name: row.courier_name || row.courier_nickname || '未知骑手'
      }
    }));
    
    return {
      data: formattedResults,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    };
  } catch (error) {
    console.error('分析订单各阶段时间失败:', error);
    throw error;
  }
}

// 新增函数获取订单按配送费范围
async function getOrdersByFeeRange(options = {}) {
  const {
    minFee,
    maxFee,
    limit = 50,
    page = 1,
    useEnglishFields = true
  } = options;
  
  if (minFee === undefined || maxFee === undefined) {
    throw new Error('最小配送费和最大配送费是必需的');
  }
  
  const offset = (page - 1) * limit;
  
  try {
    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM lzb_peisong_order
      WHERE peisongfei BETWEEN ? AND ?`,
      [minFee, maxFee]
    );
    
    const total = countResult[0].total;
    
    // 查询订单列表
    const [rows] = await pool.execute(
      `SELECT o.*, 
        m.nickname as customer_nickname, m.mobile as customer_mobile, m.avatar as customer_avatar,
        q.card_name as courier_name, m2.mobile as courier_mobile, q.line_status as courier_status
      FROM lzb_peisong_order o
      LEFT JOIN lzb_member m ON o.memberid = m.id
      LEFT JOIN lzb_qishou_info q ON o.qishouid = q.memberid
      LEFT JOIN lzb_member m2 ON q.memberid = m2.id
      WHERE peisongfei BETWEEN ? AND ?
      ORDER BY o.add_time DESC
      LIMIT ?, ?`,
      [minFee, maxFee, offset, parseInt(limit)]
    );
    
    // 转换字段名称
    const orders = useEnglishFields 
      ? rows.map(order => mapDatabaseToApi(order, 'order', useEnglishFields))
      : rows;
    
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      orders
    };
  } catch (error) {
    console.error('按配送费范围获取订单失败:', error);
    throw error;
  }
}

// 新增函数获取订单按配送距离标志
async function getOrdersByDistanceFlag(options = {}) {
  const {
    isLongDistance,
    limit = 50,
    page = 1,
    useEnglishFields = true
  } = options;
  
  const offset = (page - 1) * limit;
  
  try {
    // 定义远距离标准（例如5公里）
    const distanceThreshold = 5000;
    
    // 构建查询条件
    let whereClause = isLongDistance ? `juli > ${distanceThreshold}` : `juli <= ${distanceThreshold}`;
    
    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM lzb_peisong_order
      WHERE ${whereClause}`
    );
    
    const total = countResult[0].total;
    
    // 查询订单列表
    const [rows] = await pool.execute(
      `SELECT o.*, 
        m.nickname as customer_nickname, m.mobile as customer_mobile, m.avatar as customer_avatar,
        q.card_name as courier_name, m2.mobile as courier_mobile, q.line_status as courier_status
      FROM lzb_peisong_order o
      LEFT JOIN lzb_member m ON o.memberid = m.id
      LEFT JOIN lzb_qishou_info q ON o.qishouid = q.memberid
      LEFT JOIN lzb_member m2 ON q.memberid = m2.id
      WHERE ${whereClause}
      ORDER BY o.add_time DESC
      LIMIT ?, ?`,
      [offset, parseInt(limit)]
    );
    
    // 转换字段名称
    const orders = useEnglishFields 
      ? rows.map(order => mapDatabaseToApi(order, 'order', useEnglishFields))
      : rows;
    
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      orders
    };
  } catch (error) {
    console.error('按配送距离标志获取订单失败:', error);
    throw error;
  }
}

// 新增函数获取订单按预约标志
async function getOrdersByReservationFlag(options = {}) {
  const {
    isReserved,
    limit = 50,
    page = 1,
    useEnglishFields = true
  } = options;
  
  const offset = (page - 1) * limit;
  
  try {
    // 构建查询条件
    let whereClause = isReserved ? `has_expected_time = 1` : `has_expected_time = 0`;
    
    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM lzb_peisong_order
      WHERE ${whereClause}`
    );
    
    const total = countResult[0].total;
    
    // 查询订单列表
    const [rows] = await pool.execute(
      `SELECT o.*, 
        m.nickname as customer_nickname, m.mobile as customer_mobile, m.avatar as customer_avatar,
        q.card_name as courier_name, m2.mobile as courier_mobile, q.line_status as courier_status
      FROM lzb_peisong_order o
      LEFT JOIN lzb_member m ON o.memberid = m.id
      LEFT JOIN lzb_qishou_info q ON o.qishouid = q.memberid
      LEFT JOIN lzb_member m2 ON q.memberid = m2.id
      WHERE ${whereClause}
      ORDER BY o.add_time DESC
      LIMIT ?, ?`,
      [offset, parseInt(limit)]
    );
    
    // 转换字段名称
    const orders = useEnglishFields 
      ? rows.map(order => mapDatabaseToApi(order, 'order', useEnglishFields))
      : rows;
    
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      orders
    };
  } catch (error) {
    console.error('按预约标志获取订单失败:', error);
    throw error;
  }
}

module.exports = {
  analyzeOrdersByMultipleDimensions,
  analyzeOrderTrends,
  analyzeCourierPerformanceTrends,
  analyzeDeliveryDuration,
  analyzeOrderStagesDuration,
  getOrdersByFeeRange,
  getOrdersByDistanceFlag,
  getOrdersByReservationFlag
}; 