// 骑手绩效分析服务
const pool = require('../config/database');
const { formatMinutes } = require('../utils/timeUtils');

/**
 * 分析骑手配送订单数
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} - 骑手配送订单数分析结果
 */
async function analyzeCourierOrderCount(options = {}) {
  const {
    startTime,
    endTime,
    minOrders = 1,
    limit = 50,
    page = 1
  } = options;

  if (!startTime || !endTime) {
    throw new Error('开始时间和结束时间是必需的');
  }

  const offset = (page - 1) * limit;
  
  try {
    // 查询骑手配送订单数
    const [rows] = await pool.execute(
      `SELECT 
        q.id as courier_id,
        q.memberid as member_id,
        m.nickname,
        m.mobile,
        q.card_name as realname,
        COUNT(o.id) as order_count,
        COUNT(CASE WHEN o.status = 5 THEN 1 END) as completed_order_count,
        COUNT(CASE WHEN o.status = -2 THEN 1 END) as cancelled_order_count,
        ROUND(COUNT(CASE WHEN o.status = 5 THEN 1 END) / COUNT(o.id) * 100, 2) as completion_rate,
        MIN(o.add_time) as first_order_time,
        MAX(o.add_time) as last_order_time
      FROM 
        lzb_qishou_info q
      LEFT JOIN 
        lzb_member m ON q.memberid = m.id
      JOIN 
        lzb_peisong_order o ON q.memberid = o.qishouid
      WHERE 
        o.add_time BETWEEN ? AND ?
      GROUP BY 
        q.id, q.memberid, m.nickname, m.mobile, q.card_name
      HAVING 
        COUNT(o.id) >= ?
      ORDER BY 
        order_count DESC
      LIMIT ?, ?`,
      [startTime, endTime, minOrders, offset, parseInt(limit)]
    );
    
    // 查询符合条件的骑手总数
    const [countResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total
      FROM (
        SELECT 
          q.id
        FROM 
          lzb_qishou_info q
        JOIN 
          lzb_peisong_order o ON q.memberid = o.qishouid
        WHERE 
          o.add_time BETWEEN ? AND ?
        GROUP BY 
          q.id
        HAVING 
          COUNT(o.id) >= ?
      ) as subquery`,
      [startTime, endTime, minOrders]
    );
    
    const total = countResult[0].total;
    
    // 格式化结果
    const formattedResults = rows.map(row => ({
      courier_id: row.courier_id,
      member_id: row.member_id,
      nickname: row.nickname || '',
      mobile: row.mobile || '',
      realname: row.realname || '',
      order_statistics: {
        total_orders: row.order_count,
        completed_orders: row.completed_order_count,
        cancelled_orders: row.cancelled_order_count,
        completion_rate: row.completion_rate,
        first_order_time: row.first_order_time ? new Date(row.first_order_time * 1000).toISOString() : null,
        last_order_time: row.last_order_time ? new Date(row.last_order_time * 1000).toISOString() : null
      }
    }));
    
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      couriers: formattedResults
    };
  } catch (error) {
    console.error('分析骑手配送订单数失败:', error);
    throw error;
  }
}

/**
 * 分析骑手收益
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} - 骑手收益分析结果
 */
async function analyzeCourierEarnings(options = {}) {
  const {
    startTime,
    endTime,
    minEarnings = 0,
    limit = 50,
    page = 1
  } = options;

  if (!startTime || !endTime) {
    throw new Error('开始时间和结束时间是必需的');
  }

  const offset = (page - 1) * limit;
  
  try {
    // 查询骑手收益
    const [rows] = await pool.execute(
      `SELECT 
        q.id as courier_id,
        q.memberid as member_id,
        m.nickname,
        m.mobile,
        q.card_name as realname,
        COUNT(o.id) as order_count,
        SUM(o.qishou_shouyi) as total_earnings,
        AVG(o.qishou_shouyi) as avg_earnings_per_order,
        MAX(o.qishou_shouyi) as max_earnings,
        MIN(o.qishou_shouyi) as min_earnings,
        SUM(o.qishou_shouyi) / DATEDIFF(FROM_UNIXTIME(MAX(o.add_time)), FROM_UNIXTIME(MIN(o.add_time))) as avg_daily_earnings
      FROM 
        lzb_qishou_info q
      LEFT JOIN 
        lzb_member m ON q.memberid = m.id
      JOIN 
        lzb_peisong_order o ON q.memberid = o.qishouid
      WHERE 
        o.add_time BETWEEN ? AND ?
        AND o.status = 5  -- 只统计已完成的订单
      GROUP BY 
        q.id, q.memberid, m.nickname, m.mobile, q.card_name
      HAVING 
        SUM(o.qishou_shouyi) >= ?
      ORDER BY 
        total_earnings DESC
      LIMIT ?, ?`,
      [startTime, endTime, minEarnings, offset, parseInt(limit)]
    );
    
    // 查询符合条件的骑手总数
    const [countResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total
      FROM (
        SELECT 
          q.id
        FROM 
          lzb_qishou_info q
        JOIN 
          lzb_peisong_order o ON q.memberid = o.qishouid
        WHERE 
          o.add_time BETWEEN ? AND ?
          AND o.status = 5
        GROUP BY 
          q.id
        HAVING 
          SUM(o.qishou_shouyi) >= ?
      ) as subquery`,
      [startTime, endTime, minEarnings]
    );
    
    const total = countResult[0].total;
    
    // 格式化结果
    const formattedResults = rows.map(row => {
      // 确保所有数值都是数字类型
      const total_earnings = parseFloat(row.total_earnings) || 0;
      const avg_earnings_per_order = parseFloat(row.avg_earnings_per_order) || 0;
      const max_earnings = parseFloat(row.max_earnings) || 0;
      const min_earnings = parseFloat(row.min_earnings) || 0;
      const avg_daily_earnings = row.avg_daily_earnings ? parseFloat(row.avg_daily_earnings) || 0 : 0;
      
      return {
        courier_id: row.courier_id,
        member_id: row.member_id,
        nickname: row.nickname || '',
        mobile: row.mobile || '',
        realname: row.realname || '',
        order_count: row.order_count,
        earnings: {
          total_earnings: total_earnings,
          avg_earnings_per_order: avg_earnings_per_order,
          max_earnings: max_earnings,
          min_earnings: min_earnings,
          avg_daily_earnings: avg_daily_earnings
        }
      };
    });
    
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      couriers: formattedResults
    };
  } catch (error) {
    console.error('分析骑手收益失败:', error);
    throw error;
  }
}

/**
 * 分析骑手平均配送时长
 * @param {Object} options - 查询选项
 * @param {number} options.startTime - 开始时间戳（秒）
 * @param {number} options.endTime - 结束时间戳（秒）
 * @param {number} [options.minOrders] - 最小订单数，默认5
 * @param {number} [options.limit] - 每页记录数，默认50
 * @param {number} [options.page] - 页码，默认1
 * @returns {Promise<Object>} - 骑手平均配送时长分析结果
 */
async function analyzeCourierDeliveryDuration(options = {}) {
  const {
    startTime,
    endTime,
    minOrders = 5,
    limit = 50,
    page = 1
  } = options;

  if (!startTime || !endTime) {
    throw new Error('开始时间和结束时间是必需的');
  }

  const offset = (page - 1) * limit;
  
  try {
    // 查询骑手平均配送时长
    const [rows] = await pool.execute(
      `SELECT 
        q.id as courier_id,
        q.memberid as member_id,
        m.nickname,
        m.mobile,
        q.card_name as realname,
        COUNT(o.id) as order_count,
        AVG(o.yong_shi) as avg_delivery_duration,
        MIN(o.yong_shi) as min_delivery_duration,
        MAX(o.yong_shi) as max_delivery_duration,
        STDDEV(o.yong_shi) as std_deviation,
        AVG(o.set_shichang) as avg_expected_duration,
        AVG(o.yong_shi - o.set_shichang) as avg_duration_diff,
        
        -- 时段分布
        COUNT(CASE WHEN HOUR(FROM_UNIXTIME(o.add_time)) BETWEEN 6 AND 11 THEN 1 END) as morning_orders,
        AVG(CASE WHEN HOUR(FROM_UNIXTIME(o.add_time)) BETWEEN 6 AND 11 THEN o.yong_shi END) as morning_avg_duration,
        
        COUNT(CASE WHEN HOUR(FROM_UNIXTIME(o.add_time)) BETWEEN 12 AND 17 THEN 1 END) as afternoon_orders,
        AVG(CASE WHEN HOUR(FROM_UNIXTIME(o.add_time)) BETWEEN 12 AND 17 THEN o.yong_shi END) as afternoon_avg_duration,
        
        COUNT(CASE WHEN HOUR(FROM_UNIXTIME(o.add_time)) BETWEEN 18 AND 23 THEN 1 END) as evening_orders,
        AVG(CASE WHEN HOUR(FROM_UNIXTIME(o.add_time)) BETWEEN 18 AND 23 THEN o.yong_shi END) as evening_avg_duration,
        
        -- 配送时长区间分布
        COUNT(CASE WHEN o.yong_shi <= 600 THEN 1 END) as duration_0_10,
        COUNT(CASE WHEN o.yong_shi > 600 AND o.yong_shi <= 1200 THEN 1 END) as duration_10_20,
        COUNT(CASE WHEN o.yong_shi > 1200 AND o.yong_shi <= 1800 THEN 1 END) as duration_20_30,
        COUNT(CASE WHEN o.yong_shi > 1800 AND o.yong_shi <= 2400 THEN 1 END) as duration_30_40,
        COUNT(CASE WHEN o.yong_shi > 2400 AND o.yong_shi <= 3000 THEN 1 END) as duration_40_50,
        COUNT(CASE WHEN o.yong_shi > 3000 AND o.yong_shi <= 3600 THEN 1 END) as duration_50_60,
        COUNT(CASE WHEN o.yong_shi > 3600 THEN 1 END) as duration_60_plus,
        
        -- 绩效指标
        COUNT(CASE WHEN o.yong_shi <= o.set_shichang THEN 1 END) / COUNT(*) as on_time_rate,
        (COUNT(CASE WHEN o.yong_shi <= o.set_shichang THEN 1 END) * 100 + 
         COUNT(CASE WHEN o.yong_shi > o.set_shichang AND o.yong_shi <= o.set_shichang * 1.2 THEN 1 END) * 80 +
         COUNT(CASE WHEN o.yong_shi > o.set_shichang * 1.2 THEN 1 END) * 60) / COUNT(*) as efficiency_score
      FROM 
        lzb_qishou_info q
      LEFT JOIN 
        lzb_member m ON q.memberid = m.id
      JOIN 
        lzb_peisong_order o ON q.memberid = o.qishouid
      WHERE 
        o.add_time BETWEEN ? AND ?
        AND o.status = 5  -- 只统计已完成订单
        AND o.is_del = 0
      GROUP BY 
        q.id, q.memberid, m.nickname, m.mobile, q.card_name
      HAVING 
        COUNT(o.id) >= ?
      ORDER BY 
        avg_delivery_duration ASC
      LIMIT ?, ?`,
      [startTime, endTime, minOrders, offset, parseInt(limit)]
    );
    
    // 查询符合条件的骑手总数
    const [countResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total
      FROM (
        SELECT 
          q.id
        FROM 
          lzb_qishou_info q
        JOIN 
          lzb_peisong_order o ON q.memberid = o.qishouid
        WHERE 
          o.add_time BETWEEN ? AND ?
          AND o.status = 5
          AND o.is_del = 0
        GROUP BY 
          q.id
        HAVING 
          COUNT(o.id) >= ?
      ) as subquery`,
      [startTime, endTime, minOrders]
    );
    
    const total = countResult[0].total;
    
    // 格式化结果
    const formattedResults = rows.map(row => ({
      courier_info: {
        id: row.courier_id,
        name: row.realname || row.nickname || '',
        total_orders: row.order_count
      },
      delivery_stats: {
        avg_duration: formatMinutes(row.avg_delivery_duration),
        min_duration: formatMinutes(row.min_delivery_duration),
        max_duration: formatMinutes(row.max_delivery_duration),
        std_deviation: formatMinutes(row.std_deviation)
      },
      time_distribution: {
        morning: {
          avg_duration: formatMinutes(row.morning_avg_duration),
          order_count: row.morning_orders
        },
        afternoon: {
          avg_duration: formatMinutes(row.afternoon_avg_duration),
          order_count: row.afternoon_orders
        },
        evening: {
          avg_duration: formatMinutes(row.evening_avg_duration),
          order_count: row.evening_orders
        }
      },
      duration_ranges: {
        '0-10': row.duration_0_10,
        '10-20': row.duration_10_20,
        '20-30': row.duration_20_30,
        '30-40': row.duration_30_40,
        '40-50': row.duration_40_50,
        '50-60': row.duration_50_60,
        '60+': row.duration_60_plus
      },
      performance: {
        on_time_rate: Math.round(row.on_time_rate * 100) / 100,
        efficiency_score: Math.round(row.efficiency_score)
      }
    }));
    
    return {
      couriers: formattedResults,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    };
  } catch (error) {
    console.error('分析骑手平均配送时长失败:', error);
    throw error;
  }
}

module.exports = {
  analyzeCourierOrderCount,
  analyzeCourierEarnings,
  analyzeCourierDeliveryDuration
}; 