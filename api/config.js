// API配置

// API基础URL，根据环境变量设置不同的URL
// 注意：如果前端和API在同一域名下，可以使用相对路径，避免CORS问题
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://8.155.46.226:3004';

// API请求超时时间（毫秒）
export const API_TIMEOUT = 30000;

// 默认请求头
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// 时间单位选项
export const TIME_UNIT_OPTIONS = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
];

// 订单类型选项
export const ORDER_TYPE_OPTIONS = [
  { value: 1, label: '快递' },
  { value: 2, label: '跑腿' },
  { value: 3, label: '代购' },
  { value: 4, label: '专送' },
  { value: 5, label: '外卖' },
];

// 订单状态选项
export const ORDER_STATUS_OPTIONS = [
  { value: -2, label: '取消订单' },
  { value: -1, label: '退款订单' },
  { value: 0, label: '待支付' },
  { value: 1, label: '待接单' },
  { value: 2, label: '待取货' },
  { value: 3, label: '配送中' },
  { value: 4, label: '已送达' },
  { value: 5, label: '已完成' },
]; 