// 会员行为分析服务
const pool = require('../config/database');

/**
 * 分析会员下单频率
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} - 会员下单频率分析结果
 */
async function analyzeMemberOrderFrequency(options = {}) {
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
    // 查询会员下单频率
    const [rows] = await pool.execute(
      `SELECT 
        m.id as member_id,
        m.nickname,
        m.mobile,
        m.realname,
        COUNT(o.id) as order_count,
        MIN(o.add_time) as first_order_time,
        MAX(o.add_time) as last_order_time,
        DATEDIFF(FROM_UNIXTIME(MAX(o.add_time)), FROM_UNIXTIME(MIN(o.add_time))) as days_between_orders,
        COUNT(o.id) / IF(DATEDIFF(FROM_UNIXTIME(MAX(o.add_time)), FROM_UNIXTIME(MIN(o.add_time))) = 0, 1, DATEDIFF(FROM_UNIXTIME(MAX(o.add_time)), FROM_UNIXTIME(MIN(o.add_time)))) as orders_per_day,
        COUNT(o.id) / IF(DATEDIFF(FROM_UNIXTIME(MAX(o.add_time)), FROM_UNIXTIME(MIN(o.add_time))) = 0, 1, DATEDIFF(FROM_UNIXTIME(MAX(o.add_time)), FROM_UNIXTIME(MIN(o.add_time))) / 7) as orders_per_week,
        COUNT(o.id) / IF(DATEDIFF(FROM_UNIXTIME(MAX(o.add_time)), FROM_UNIXTIME(MIN(o.add_time))) = 0, 1, DATEDIFF(FROM_UNIXTIME(MAX(o.add_time)), FROM_UNIXTIME(MIN(o.add_time))) / 30) as orders_per_month
      FROM 
        lzb_member m
      JOIN 
        lzb_peisong_order o ON m.id = o.memberid
      WHERE 
        o.add_time BETWEEN ? AND ?
      GROUP BY 
        m.id
      HAVING 
        COUNT(o.id) >= ?
      ORDER BY 
        order_count DESC
      LIMIT ?, ?`,
      [startTime, endTime, minOrders, offset, parseInt(limit)]
    );
    
    // 查询符合条件的会员总数
    const [countResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total
      FROM (
        SELECT 
          m.id
        FROM 
          lzb_member m
        JOIN 
          lzb_peisong_order o ON m.id = o.memberid
        WHERE 
          o.add_time BETWEEN ? AND ?
        GROUP BY 
          m.id
        HAVING 
          COUNT(o.id) >= ?
      ) as subquery`,
      [startTime, endTime, minOrders]
    );
    
    const total = countResult[0].total;
    
    // 格式化结果
    const formattedResults = rows.map(row => ({
      member_id: row.member_id,
      nickname: row.nickname || '',
      mobile: row.mobile || '',
      realname: row.realname || '',
      order_statistics: {
        order_count: row.order_count,
        first_order_time: row.first_order_time ? new Date(row.first_order_time * 1000).toISOString() : null,
        last_order_time: row.last_order_time ? new Date(row.last_order_time * 1000).toISOString() : null,
        days_between_orders: row.days_between_orders
      },
      frequency: {
        orders_per_day: parseFloat(row.orders_per_day) || 0,
        orders_per_week: parseFloat(row.orders_per_week) || 0,
        orders_per_month: parseFloat(row.orders_per_month) || 0
      }
    }));
    
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      members: formattedResults
    };
  } catch (error) {
    console.error('分析会员下单频率失败:', error);
    throw error;
  }
}

/**
 * 分析会员消费金额
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} - 会员消费金额分析结果
 */
async function analyzeMemberSpending(options = {}) {
  const {
    startTime,
    endTime,
    minSpending = 0,
    limit = 50,
    page = 1
  } = options;

  if (!startTime || !endTime) {
    throw new Error('开始时间和结束时间是必需的');
  }

  const offset = (page - 1) * limit;
  
  try {
    // 查询会员消费金额
    const [rows] = await pool.execute(
      `SELECT 
        m.id as member_id,
        m.nickname,
        m.mobile,
        m.realname,
        COUNT(o.id) as order_count,
        SUM(o.price) as total_spending,
        SUM(o.peisongfei) as total_delivery_fee,
        SUM(o.price + o.peisongfei) as total_amount,
        AVG(o.price) as avg_order_amount,
        MAX(o.price) as max_order_amount,
        MIN(o.price) as min_order_amount
      FROM 
        lzb_member m
      JOIN 
        lzb_peisong_order o ON m.id = o.memberid
      WHERE 
        o.add_time BETWEEN ? AND ?
        AND o.status = 5  -- 只统计已完成的订单
      GROUP BY 
        m.id
      HAVING 
        SUM(o.price) >= ?
      ORDER BY 
        total_spending DESC
      LIMIT ?, ?`,
      [startTime, endTime, minSpending, offset, parseInt(limit)]
    );
    
    // 查询符合条件的会员总数
    const [countResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total
      FROM (
        SELECT 
          m.id
        FROM 
          lzb_member m
        JOIN 
          lzb_peisong_order o ON m.id = o.memberid
        WHERE 
          o.add_time BETWEEN ? AND ?
          AND o.status = 5
        GROUP BY 
          m.id
        HAVING 
          SUM(o.price) >= ?
      ) as subquery`,
      [startTime, endTime, minSpending]
    );
    
    const total = countResult[0].total;
    
    // 格式化结果
    const formattedResults = rows.map(row => {
      // 确保所有数值都是数字类型
      const total_spending = parseFloat(row.total_spending) || 0;
      const total_delivery_fee = parseFloat(row.total_delivery_fee) || 0;
      const total_amount = parseFloat(row.total_amount) || 0;
      const avg_order_amount = parseFloat(row.avg_order_amount) || 0;
      const max_order_amount = parseFloat(row.max_order_amount) || 0;
      const min_order_amount = parseFloat(row.min_order_amount) || 0;
      
      return {
        member_id: row.member_id,
        nickname: row.nickname || '',
        mobile: row.mobile || '',
        realname: row.realname || '',
        order_count: row.order_count,
        spending: {
          total_spending: total_spending,
          total_delivery_fee: total_delivery_fee,
          total_amount: total_amount,
          avg_order_amount: avg_order_amount,
          max_order_amount: max_order_amount,
          min_order_amount: min_order_amount
        }
      };
    });
    
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      members: formattedResults
    };
  } catch (error) {
    console.error('分析会员消费金额失败:', error);
    throw error;
  }
}

module.exports = {
  analyzeMemberOrderFrequency,
  analyzeMemberSpending
}; 