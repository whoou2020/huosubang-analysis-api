// 字段映射工具
const fieldMappings = require('../../field_mappings');

// 检查 fieldMappings 是否正确加载
if (!fieldMappings) {
  console.error('警告: field_mappings.js 未正确加载');
}

/**
 * 将数据库记录转换为API响应格式
 * @param {Object} record - 数据库记录
 * @param {String} type - 记录类型 (order|member|courier)
 * @param {Boolean} useEnglishFields - 是否使用英文字段名
 * @returns {Object} - 格式化后的记录
 */
function mapDatabaseToApi(record, type = 'order', useEnglishFields = true) {
  if (!record) return null;
  
  try {
    // 添加调试日志
    console.log('开始映射记录:', {
      type,
      useEnglishFields,
      allFields: Object.keys(record)
    });
    
    // 创建结果对象
    const result = {};
    
    // 处理特殊字段
    if (record.courier_mobile !== undefined) result.courier_mobile = record.courier_mobile;
    
    // 跳过这些字段的映射
    const skipFields = [
      'courier_name', 'courier_mobile', 'courier_status',
      'courier_sex', 'courier_id_card', 'courier_baodan_img',
      'member_mobile', 'card_mob' // 添加这些字段到跳过列表
    ];
    
    // 根据记录类型选择映射前缀
    let fieldPrefix = '';
    switch(type) {
      case 'member':
        fieldPrefix = 'user_';
        break;
      case 'courier':
        fieldPrefix = 'courier_';
        break;
      default:
        fieldPrefix = 'order_';
    }
    
    // 保留原始ID和关键字段，确保它们始终存在
    if (record.id !== undefined) result.id = record.id;
    if (record.ordersn !== undefined) result.ordersn = record.ordersn;
    if (record.memberid !== undefined) result.memberid = record.memberid;
    if (record.qishouid !== undefined) result.qishouid = record.qishouid;
    if (record.price !== undefined) result.price = record.price;
    if (record.status !== undefined) result.status = record.status;
    if (record.add_time !== undefined) result.add_time = record.add_time;
    
    // 保留关联信息字段
    if (record.customer_nickname !== undefined) result.customer_nickname = record.customer_nickname;
    if (record.customer_mobile !== undefined) result.customer_mobile = record.customer_mobile;
    if (record.customer_avatar !== undefined) result.customer_avatar = record.customer_avatar;
    if (record.courier_name !== undefined) result.courier_name = record.courier_name;
    if (record.courier_mobile !== undefined) result.courier_mobile = record.courier_mobile;
    if (record.courier_status !== undefined) result.courier_status = record.courier_status;
    if (record.courier_sex !== undefined) result.courier_sex = record.courier_sex;
    if (record.courier_id_card !== undefined) result.courier_id_card = record.courier_id_card;
    
    // 遍历记录字段
    for (const dbField in record) {
      // 跳过已处理的关键字段
      if (['id', 'ordersn', 'memberid', 'qishouid', 'price', 'status', 'add_time',
           'customer_nickname', 'customer_mobile', 'customer_avatar',
           'courier_name', 'courier_mobile', 'courier_status', 'courier_sex',
           'courier_id_card'].includes(dbField)) {
        continue;
      }
      
      // 查找对应的API字段
      let apiField = null;
      
      // 直接映射
      if (fieldMappings && fieldMappings[dbField]) {
        apiField = dbField;
        result[apiField] = record[dbField];
        continue;
      } else if (fieldMappings) {
        // 查找英文字段映射
        for (const key in fieldMappings) {
          if (fieldMappings[key] === dbField) {
            if (key.startsWith(fieldPrefix) || !useEnglishFields) {
              apiField = key;
              break;
            }
          }
        }
      }
      
      // 如果找到映射，添加到结果中
      if (apiField) {
        result[apiField] = record[dbField];
      } else {
        // 没有找到映射，使用原始字段名
        result[dbField] = record[dbField];
      }
    }
    
    // 添加状态描述
    if (type === 'order' && record.status !== undefined) {
      const statusMap = {
        '-2': '已取消',
        '-1': '已关闭',
        '0': '待支付',
        '1': '待接单',
        '2': '已接单',
        '3': '已取货',
        '4': '配送中',
        '5': '已完成'
      };
      
      result.status_description = statusMap[record.status] || `状态${record.status}`;
    }
    
    return result;
  } catch (error) {
    console.error('映射数据库记录时出错:', error);
    // 出错时返回原始记录，确保数据不丢失
    return record;
  }
}

/**
 * 格式化时间戳为可读时间
 * @param {Number} timestamp - Unix时间戳
 * @returns {String} - 格式化的时间字符串
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

module.exports = {
  mapDatabaseToApi,
  formatTimestamp
}; 