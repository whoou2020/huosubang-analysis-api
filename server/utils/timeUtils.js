/**
 * 时间相关工具函数
 */

/**
 * 将秒数转换为分钟数，保留一位小数
 * @param {number} seconds - 秒数
 * @returns {number} - 分钟数
 */
function formatMinutes(seconds) {
  if (!seconds) return 0;
  return Math.round(seconds / 60 * 10) / 10;
}

/**
 * 验证时间范围是否有效
 * @param {number} startTime - 开始时间戳（秒）
 * @param {number} endTime - 结束时间戳（秒）
 * @param {number} maxDays - 最大允许的天数范围，默认为31天
 * @returns {boolean} - 是否有效
 */
function isValidTimeRange(startTime, endTime, maxDays = 31) {
  if (!startTime || !endTime) return false;
  
  // 检查开始时间是否小于结束时间
  if (startTime >= endTime) return false;
  
  // 检查时间范围是否在允许的天数内
  const daysDiff = (endTime - startTime) / (24 * 60 * 60);
  if (daysDiff > maxDays) return false;
  
  return true;
}

/**
 * 格式化时间戳为ISO日期字符串
 * @param {number} timestamp - 时间戳（秒）
 * @returns {string|null} - ISO日期字符串或null
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

/**
 * 计算两个时间戳之间的时间差（分钟）
 * @param {number} startTime - 开始时间戳（秒）
 * @param {number} endTime - 结束时间戳（秒）
 * @returns {number|null} - 时间差（分钟）或null
 */
function calculateDuration(startTime, endTime) {
  if (!startTime || !endTime) return null;
  if (startTime > endTime) return null;
  
  return formatMinutes(endTime - startTime);
}

module.exports = {
  formatMinutes,
  isValidTimeRange,
  formatTimestamp,
  calculateDuration
}; 