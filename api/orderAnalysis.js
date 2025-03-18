// 订单分析相关API

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
 * 获取订单配送时长分析数据
 * @param {Object} params 请求参数
 * @param {number} params.start_time 开始时间(时间戳，秒)
 * @param {number} params.end_time 结束时间(时间戳，秒)
 * @param {number} [params.order_type] 订单类型
 * @param {number} [params.courier_id] 骑手ID
 * @returns {Promise<Object>} 配送时长分析数据
 */
export const getDeliveryDurationAnalysis = async (params) => {
  try {
    const { start_time, end_time, order_type, courier_id } = params;
    
    // 验证必填参数
    if (!start_time || !end_time) {
      throw new Error('开始时间和结束时间为必填参数');
    }
    
    const response = await apiClient.get('/api/advanced/orders/delivery-duration-analysis', {
      params: {
        start_time,
        end_time,
        ...(order_type && { order_type }),
        ...(courier_id && { courier_id })
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取订单配送时长分析数据失败:', error);
    
    // 增强错误处理，特别是CORS错误
    if (error.message && error.message.includes('Network Error')) {
      console.error('可能是CORS错误，请检查API服务器的CORS配置');
    }
    
    throw error;
  }
};

/**
 * 获取订单各阶段时间分析数据
 * @param {Object} params 请求参数
 * @param {number} params.start_time 开始时间(时间戳，秒)
 * @param {number} params.end_time 结束时间(时间戳，秒)
 * @param {number} [params.order_type] 订单类型
 * @param {number} [params.courier_id] 骑手ID
 * @returns {Promise<Object>} 各阶段时间分析数据
 */
export const getStagesDurationAnalysis = async (params) => {
  try {
    const { start_time, end_time, order_type, courier_id } = params;
    
    // 验证必填参数
    if (!start_time || !end_time) {
      throw new Error('开始时间和结束时间为必填参数');
    }
    
    const response = await apiClient.get('/api/advanced/orders/stages-duration-analysis', {
      params: {
        start_time,
        end_time,
        ...(order_type && { order_type }),
        ...(courier_id && { courier_id })
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('获取订单各阶段时间分析数据失败:', error);
    
    // 增强错误处理，特别是CORS错误
    if (error.message && error.message.includes('Network Error')) {
      console.error('可能是CORS错误，请检查API服务器的CORS配置');
    }
    
    throw error;
  }
}; 