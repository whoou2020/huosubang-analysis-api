// 订单相关API服务

import axios from 'axios';
import { API_BASE_URL } from './config';

// 创建axios实例，统一配置
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 不发送凭证（cookies, HTTP认证）
  withCredentials: false,
});

/**
 * 获取订单详情
 * @param {number|string} orderId 订单ID
 * @returns {Promise<Object>} 订单详情数据
 */
export const getOrderDetail = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('订单ID不能为空');
    }
    
    const response = await apiClient.get(`/api/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('获取订单详情失败:', error);
    
    // 增强错误处理
    if (error.response) {
      // 服务器响应了，但状态码不在2xx范围内
      if (error.response.status === 404) {
        throw new Error('订单不存在，请检查订单号');
      } else {
        throw new Error(`服务器错误: ${error.response.status}`);
      }
    } else if (error.request) {
      // 请求已发送，但没有收到响应
      throw new Error('未收到服务器响应，请检查网络连接');
    } else {
      // 设置请求时发生错误
      throw error;
    }
  }
};

/**
 * 获取订单列表
 * @param {Object} params 查询参数
 * @param {number} [params.page=1] 页码
 * @param {number} [params.limit=50] 每页记录数
 * @param {boolean} [params.use_chinese=false] 是否使用中文字段名
 * @returns {Promise<Object>} 订单列表数据
 */
export const getOrderList = async (params = {}) => {
  try {
    const { page = 1, limit = 50, use_chinese = false, ...otherParams } = params;
    
    const response = await apiClient.get('/api/orders', {
      params: {
        page,
        limit,
        use_chinese,
        ...otherParams
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取订单列表失败:', error);
    throw error;
  }
};

/**
 * 按时间查询订单
 * @param {Object} params 查询参数
 * @param {number} params.start_time 开始时间(时间戳，秒)
 * @param {number} params.end_time 结束时间(时间戳，秒)
 * @param {number} [params.page=1] 页码
 * @param {number} [params.limit=50] 每页记录数
 * @param {boolean} [params.use_chinese=false] 是否使用中文字段名
 * @returns {Promise<Object>} 订单列表数据
 */
export const getOrdersByTime = async (params) => {
  try {
    const { start_time, end_time } = params;
    
    // 验证必填参数
    if (!start_time || !end_time) {
      throw new Error('开始时间和结束时间为必填参数');
    }
    
    const response = await apiClient.get('/api/orders/by-time', {
      params
    });
    
    return response.data;
  } catch (error) {
    console.error('按时间查询订单失败:', error);
    throw error;
  }
}; 