// 关联查询服务
const pool = require('../config/database');
const { mapDatabaseToApi, formatTimestamp } = require('../utils/fieldMapper');

/**
 * 获取订单详情（带关联信息）
 * @param {number|string} orderIdentifier - 订单ID或订单号
 * @param {boolean} useEnglishFields - 是否使用英文字段名
 * @param {string} [identifierType='id'] - 标识符类型: 'id' 或 'sn'
 * @returns {Promise<Object>} - 订单详情
 */
async function getOrderDetails(orderIdentifier, useEnglishFields = true, identifierType = 'id') {
  try {
    // 确定查询条件
    const whereClause = identifierType === 'id' ? 'o.id = ?' : 'o.ordersn = ?';
    
    // 1. 获取订单基本信息和简单的关联信息
    const [rows] = await pool.execute(
      `SELECT o.id, o.jms_id, o.memberid, o.agentid, o.ordersn, o.price,
              o.message, o.goods_name, o.goods_weight, o.juli, o.yijia,
              o.peisongfei, o.xiaofei, o.qishouid, o.qu_address, o.qu_menpaihao,
              o.qu_latitude, o.qu_longitude, o.qu_address_id, o.qu_mobile, o.qu_name,
              o.shou_address, o.shou_menpaihao, o.shou_latitude, o.shou_longitude,
              o.shou_address_id, o.shou_mobile, o.shou_name, o.status, o.add_time,
              o.pay_time, o.pay_type, o.order_type, o.songda_time, o.complete_time,
              o.jiedan_time, o.qu_time, o.qishou_shouyi, o.wenzi_txt, o.goods_price,
              o.expect_finish_time,
              m.nickname as customer_nickname, m.mobile as customer_mobile, m.avatar as customer_avatar,
              q.card_name as courier_name, m2.mobile as courier_mobile, q.line_status as courier_status,
              q.card_sex as courier_sex, q.card_no as courier_id_card, q.baodan_img as courier_baodan_img
       FROM lzb_peisong_order o
       LEFT JOIN lzb_member m ON o.memberid = m.id
       LEFT JOIN lzb_qishou_info q ON o.qishouid = q.memberid
       LEFT JOIN lzb_member m2 ON q.memberid = m2.id
       WHERE ${whereClause}`,
      [orderIdentifier]
    );
    
    if (rows.length === 0) {
      throw new Error('订单不存在');
    }
    
    const order = rows[0];
    
    // 2. 获取完整的会员信息
    if (order.memberid) {
      const [memberRows] = await pool.execute(
        'SELECT * FROM lzb_member WHERE id = ?',
        [order.memberid]
      );
      
      if (memberRows.length > 0) {
        const memberInfo = memberRows[0];
        
        // 查询会员的订单数量
        const [orderCountResult] = await pool.execute(
          'SELECT COUNT(*) as order_count FROM lzb_peisong_order WHERE memberid = ?',
          [order.memberid]
        );
        
        memberInfo.order_count = orderCountResult[0].order_count;
        
        // 添加完整的会员信息到订单对象
        order.member_info = useEnglishFields 
          ? mapDatabaseToApi(memberInfo, 'member', useEnglishFields)
          : memberInfo;
      }
    }
    
    // 3. 获取完整的骑手信息
    if (order.qishouid) {
      // 查询骑手基本信息
      const [courierRows] = await pool.execute(
        `SELECT q.id, q.memberid, q.card_name, q.line_status, q.card_sex, q.card_no,
                q.address, q.scale, q.take_scale, q.vip_scale, q.sale_scale,
                q.is_zhengshi, q.is_lizhi, q.lizhi_time, q.paidan_num, q.qiangdan_num,
                q.add_time, q.check_time, q.peixun_time, q.bzj_time, q.updata_time,
                m.nickname, m.mobile as courier_mobile, m.avatar, m.credit
         FROM lzb_qishou_info q 
         LEFT JOIN lzb_member m ON q.memberid = m.id 
         WHERE q.memberid = ?`,
        [order.qishouid]
      );
      
      if (courierRows.length > 0) {
        const courierInfo = courierRows[0];
        
        // 查询骑手的订单数量
        const [orderCountResult] = await pool.execute(
          'SELECT COUNT(*) as order_count FROM lzb_peisong_order WHERE qishouid = ?',
          [order.qishouid]
        );
        
        courierInfo.order_count = orderCountResult[0].order_count;
        
        // 查询骑手的完成订单数量
        const [completedOrderCountResult] = await pool.execute(
          'SELECT COUNT(*) as completed_order_count FROM lzb_peisong_order WHERE qishouid = ? AND status = 5',
          [order.qishouid]
        );
        
        courierInfo.completed_order_count = completedOrderCountResult[0].completed_order_count;
        
        // 更新主订单对象中的骑手手机号
        order.courier_mobile = courierInfo.courier_mobile;
        
        // 添加完整的骑手信息到订单对象
        order.courier_info = useEnglishFields 
          ? mapDatabaseToApi(courierInfo, 'courier', useEnglishFields)
          : courierInfo;
      }
    }
    
    // 转换字段名称
    return useEnglishFields 
      ? mapDatabaseToApi(order, 'order', useEnglishFields)
      : order;
  } catch (error) {
    console.error(`获取订单 ${orderIdentifier} 失败:`, error);
    throw error;
  }
}

/**
 * 根据ID获取订单详情（带关联信息）
 * @param {number} orderId - 订单ID
 * @param {boolean} useEnglishFields - 是否使用英文字段名
 * @returns {Promise<Object>} - 订单详情
 */
async function getOrderById(orderId, useEnglishFields = true) {
  return getOrderDetails(orderId, useEnglishFields, 'id');
}

/**
 * 根据订单号获取订单详情（带关联信息）
 * @param {string} orderSn - 订单号
 * @param {boolean} useEnglishFields - 是否使用英文字段名
 * @returns {Promise<Object>} - 订单详情
 */
async function getOrderBySn(orderSn, useEnglishFields = true) {
  return getOrderDetails(orderSn, useEnglishFields, 'sn');
}

/**
 * 获取订单列表（带关联信息）
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} - 订单列表
 */
async function getOrdersWithRelations(options = {}) {
  const {
    limit = 50,
    page = 1,
    status,
    startTime,
    endTime,
    customerId,
    courierId,
    keyword,
    sortField = 'add_time',
    sortOrder = 'DESC',
    useEnglishFields = true
  } = options;

  const offset = (page - 1) * limit;
  const params = [];
  
  let whereClause = '1=1';
  
  if (status !== undefined && status !== null) {
    whereClause += ' AND o.status = ?';
    params.push(status);
  }
  
  if (startTime && endTime) {
    whereClause += ' AND o.add_time BETWEEN ? AND ?';
    params.push(startTime, endTime);
  }
  
  if (customerId) {
    whereClause += ' AND o.memberid = ?';
    params.push(customerId);
  }
  
  if (courierId) {
    whereClause += ' AND o.qishouid = ?';
    params.push(courierId);
  }
  
  if (keyword) {
    whereClause += ' AND (o.ordersn LIKE ? OR o.shou_name LIKE ? OR o.shou_mobile LIKE ? OR m.nickname LIKE ? OR m.mobile LIKE ? OR q.card_name LIKE ?)';
    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword, likeKeyword, likeKeyword);
  }
  
  try {
    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM lzb_peisong_order o
       LEFT JOIN lzb_member m ON o.memberid = m.id
       LEFT JOIN lzb_qishou_info q ON o.qishouid = q.memberid
       WHERE ${whereClause}`,
      params
    );
    
    const total = countResult[0].total;
    
    // 查询订单列表（带关联信息）
    const orderParams = [...params, offset, parseInt(limit)];
    const [rows] = await pool.execute(
      `SELECT o.*, 
        m.nickname as customer_nickname, m.mobile as customer_mobile, m.avatar as customer_avatar,
        q.card_name as courier_name, m2.mobile as courier_mobile, q.line_status as courier_status,
        q.card_sex as courier_sex, q.card_no as courier_id_card, q.baodan_img as courier_baodan_img
       FROM lzb_peisong_order o
       LEFT JOIN lzb_member m ON o.memberid = m.id
       LEFT JOIN lzb_qishou_info q ON o.qishouid = q.memberid
       LEFT JOIN lzb_member m2 ON q.memberid = m2.id
       WHERE ${whereClause} 
       ORDER BY o.${sortField} ${sortOrder} 
       LIMIT ?, ?`,
      orderParams
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
    console.error('获取订单列表失败:', error);
    throw error;
  }
}

/**
 * 按时间范围获取订单列表（带关联信息）
 * @param {Object} options - 查询选项
 * @returns {Promise<Object>} - 订单列表及元数据
 */
async function getOrdersByTimeRange(options = {}) {
  const {
    startTime,
    endTime,
    limit = 100,
    page = 1,
    useEnglishFields = true
  } = options;
  
  if (!startTime || !endTime) {
    throw new Error('开始时间和结束时间是必需的');
  }
  
  const offset = (page - 1) * limit;
  
  try {
    console.log(`按时间范围获取订单: startTime=${startTime}, endTime=${endTime}, limit=${limit}, page=${page}`);
    
    // 步骤1: 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM lzb_peisong_order 
       WHERE add_time BETWEEN ? AND ?`,
      [startTime, endTime]
    );
    
    const total = countResult[0].total;
    console.log(`找到 ${total} 个订单`);
    
    if (total === 0) {
      return {
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        orders: []
      };
    }
    
    // 步骤2: 查询订单列表（不带关联信息）
    const [orderRows] = await pool.execute(
      `SELECT * 
       FROM lzb_peisong_order 
       WHERE add_time BETWEEN ? AND ? 
       ORDER BY add_time DESC 
       LIMIT ?, ?`,
      [startTime, endTime, offset, parseInt(limit)]
    );
    
    console.log(`查询返回 ${orderRows.length} 个订单`);
    
    if (orderRows.length === 0) {
      return {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        orders: []
      };
    }
    
    // 步骤3: 获取订单关联的会员和骑手信息
    const orders = [];
    
    // 获取所有涉及到的会员和骑手ID
    const memberIds = [...new Set(orderRows.map(order => order.memberid).filter(id => id > 0))];
    const courierIds = [...new Set(orderRows.map(order => order.qishouid).filter(id => id > 0))];
    
    // 如果有会员ID，批量查询会员信息
    let memberMap = {};
    if (memberIds.length > 0) {
      const memberIdPlaceholders = memberIds.map(() => '?').join(',');
      const [memberRows] = await pool.execute(
        `SELECT * FROM lzb_member WHERE id IN (${memberIdPlaceholders})`,
        memberIds
      );
      
      // 创建会员ID到会员信息的映射
      memberMap = memberRows.reduce((map, member) => {
        map[member.id] = member;
        return map;
      }, {});
    }
    
    // 如果有骑手ID，批量查询骑手信息
    let courierMap = {};
    if (courierIds.length > 0) {
      const courierIdPlaceholders = courierIds.map(() => '?').join(',');
      const [courierRows] = await pool.execute(
        `SELECT q.*, m.mobile as courier_mobile, m.nickname
         FROM lzb_qishou_info q 
         LEFT JOIN lzb_member m ON q.memberid = m.id
         WHERE q.memberid IN (${courierIdPlaceholders})`,
        courierIds
      );
      
      // 创建骑手ID到骑手信息的映射
      courierMap = courierRows.reduce((map, courier) => {
        map[courier.memberid] = courier;
        return map;
      }, {});
    }
    
    // 处理每个订单
    for (const order of orderRows) {
      // 添加会员信息
      if (order.memberid && memberMap[order.memberid]) {
        order.member_info = useEnglishFields
          ? mapDatabaseToApi(memberMap[order.memberid], 'member', useEnglishFields)
          : memberMap[order.memberid];
      }
      
      // 添加骑手信息
      if (order.qishouid && courierMap[order.qishouid]) {
        const courierInfo = courierMap[order.qishouid];
        order.courier_name = courierInfo.card_name;
        order.courier_mobile = courierInfo.courier_mobile;
        order.courier_status = courierInfo.line_status;
        
        order.courier_info = useEnglishFields
          ? mapDatabaseToApi(courierInfo, 'courier', useEnglishFields)
          : courierInfo;
      }
      
      // 转换字段
      const transformedOrder = useEnglishFields
        ? mapDatabaseToApi(order, 'order', useEnglishFields)
        : order;
      
      orders.push(transformedOrder);
    }
    
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      orders
    };
  } catch (error) {
    console.error('按时间范围获取订单失败:', error);
    throw error;
  }
}

module.exports = {
  getOrderById,
  getOrderBySn,
  getOrdersWithRelations,
  getOrdersByTimeRange,
  getOrdersByStatus,
  
  // 以下功能已迁移至comprehensiveAnalysisService.js，请使用那里的实现
  // 仅为兼容性保留
  getOrdersByPriceRange: (options) => {
    console.warn('getOrdersByPriceRange已弃用，请使用comprehensiveAnalysisService.getOrdersByFeeRange');
    const comprehensiveAnalysisService = require('./comprehensiveAnalysisService');
    return comprehensiveAnalysisService.getOrdersByFeeRange(options);
  },
  getOrdersByDeliveryTime: (options) => {
    console.warn('getOrdersByDeliveryTime已弃用，请使用comprehensiveAnalysisService的相关函数');
    throw new Error('此功能已迁移，请使用comprehensiveAnalysisService');
  },
  getOrdersByArea: (options) => {
    console.warn('getOrdersByArea已弃用，请使用comprehensiveAnalysisService的相关函数');
    throw new Error('此功能已迁移，请使用comprehensiveAnalysisService');
  },
  getOrdersByOrderType: (options) => {
    console.warn('getOrdersByOrderType已弃用，请使用comprehensiveAnalysisService的相关函数');
    throw new Error('此功能已迁移，请使用comprehensiveAnalysisService');
  },
  analyzeDeliveryDuration: (options) => {
    console.warn('analyzeDeliveryDuration已弃用，请使用comprehensiveAnalysisService.analyzeDeliveryDuration');
    const comprehensiveAnalysisService = require('./comprehensiveAnalysisService');
    return comprehensiveAnalysisService.analyzeDeliveryDuration(options);
  },
  analyzeOrderStagesDuration: (options) => {
    console.warn('analyzeOrderStagesDuration已弃用，请使用comprehensiveAnalysisService.analyzeOrderStagesDuration');
    const comprehensiveAnalysisService = require('./comprehensiveAnalysisService');
    return comprehensiveAnalysisService.analyzeOrderStagesDuration(options);
  }
};