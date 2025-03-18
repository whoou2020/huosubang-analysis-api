/**
 * 错误处理中间件
 */

/**
 * 异步处理包装函数，用于简化路由错误处理
 * 此函数将异步路由处理函数包装并自动捕获异常传递给 Express 的错误处理中间件
 * @param {Function} fn 异步路由处理函数
 * @returns {Function} 中间件函数
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 通用错误响应函数
 * 用于生成统一格式的错误响应对象
 * @param {string} code 错误代码
 * @param {string} message 错误消息
 * @param {string|object} details 错误详情 
 * @returns {object} 错误响应对象
 */
const errorResponse = (code, message, details) => {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * 通用成功响应函数
 * 用于生成统一格式的成功响应对象
 * @param {any} data 响应数据
 * @param {object} metadata 元数据对象
 * @returns {object} 成功响应对象
 */
const successResponse = (data, metadata = {}) => {
  return {
    success: true,
    data,
    metadata,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  asyncHandler,
  errorResponse,
  successResponse
}; 