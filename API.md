# 火速帮分析系统 API 文档 v1.0

## 目录
1. [基础信息](#基础信息)
2. [API分类说明](#api分类说明)
3. [通用规范](#通用规范)
4. [认证与授权](#认证与授权)
5. [错误处理](#错误处理)
6. [订单分析API](#订单分析-api)
7. [骑手分析API](#骑手分析-api)
8. [客户分析API](#客户分析-api)
9. [状态码映射](#状态码映射)
10. [版本控制](#版本控制)

## 基础信息

- **基础URL**: `http://localhost:3004`
- **API版本**: v1
- **数据格式**: JSON
- **字符编码**: UTF-8
- **时区**: Asia/Shanghai

## API分类说明

系统API按照功能和权限要求分为以下几类：

1. **基础API** (`/api/v1/`)
   - 基础的CRUD操作
   - 不需要特殊权限
   - 适用于常规业务操作

2. **高级分析API** (`/api/v1/advanced/`)
   - 数据分析相关接口
   - 需要管理员权限
   - 包含复杂的统计和分析功能
   - 可能需要较长处理时间

3. **关联查询API** (`/api/v1/join/`)
   - 涉及多表关联的查询
   - 性能消耗较大的操作
   - 包含完整的关联数据

## 通用规范

### 版本控制
- 当前版本: v1.0
- 版本格式: 主版本号.次版本号
- 版本声明方式: 
  1. URL路径: `/api/v1/...`
  2. Header方式: `Accept: application/vnd.huosubang.v1+json`

### 速率限制
- 普通用户: 100次/分钟
- 高级用户: 1000次/分钟
- 超出限制响应码: 429
- 剩余请求次数: 通过响应头 `X-RateLimit-Remaining` 返回

### 请求格式
- 所有请求都应该包含 `Content-Type: application/json` 头
- GET 请求的参数通过 URL query string 传递
- POST 请求的数据通过 request body 以 JSON 格式传递

### 时间格式规范
系统支持以下三种时间格式：

1. **Unix时间戳（秒）**
   - 用于配送时长分析等高性能要求的API
   - 示例：1740787200
   - 适用API：delivery-duration-analysis等

2. **ISO 8601格式**
   - 用于需要精确时间的查询
   - 格式：YYYY-MM-DD HH:mm:ss
   - 示例：2024-03-14 15:30:00
   - 适用API：订单详情查询等

3. **日期格式**
   - 用于日期统计类API
   - 格式：YYYY-MM-DD
   - 示例：2024-03-14
   - 适用API：日报表、周报表等

### 通用参数
1. **分页参数**（适用于列表类API）
   - `limit`: 每页记录数，默认50，最小1，最大100
   - `page`: 页码，从1开始，默认1

2. **排序参数**（适用于列表类API）
   - `sort_by`: 排序字段，具体字段见各API说明
   - `sort_order`: 排序方式，可选值：asc（升序）/desc（降序），默认desc

3. **语言参数**（适用于所有API）
   - `use_chinese`: 是否使用中文字段名，默认false

### 统一响应格式
```json
{
    "success": true,
    "data": {
        // API特定的响应数据
    },
    "metadata": {
        "total": 100,        // 总记录数（列表类API）
        "page": 1,          // 当前页码（列表类API）
        "limit": 50,        // 每页记录数（列表类API）
        "time_range": {     // 查询时间范围（分析类API）
            "start": "2024-01-01 00:00:00",
            "end": "2024-01-07 23:59:59"
        }
    },
    "timestamp": "2024-03-14T03:30:00.000Z"
}
```

### 错误响应格式
```json
{
    "success": false,
    "error": {
        "code": "错误代码",
        "message": "错误描述",
        "details": "详细错误信息"
    },
    "timestamp": "2024-03-14T03:30:00.000Z"
}
```

## 订单分析 API

### 1. 订单配送时长分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/orders/delivery-duration-analysis`
- **描述**: 分析指定时间范围内的订单配送时长统计数据
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `start_time` | number | 是 | 开始时间戳(秒) | 1709251200 | >0 |
| `end_time` | number | 是 | 结束时间戳(秒) | 1709337600 | >start_time |
| `status` | number | 否 | 订单状态 | 5 | -2~5 |
| `order_type` | number | 否 | 订单类型 | 1 | 1~5 |
| `courier_id` | string | 否 | 骑手ID | "C789" | - |
| `is_del` | number | 否 | 是否删除 | 0 | 0,1 |

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "statistics": {
            "total_orders": "总订单数(number)",
            "status_distribution": {
                "completed": "已完成订单数(number)",
                "cancelled": "已取消订单数(number)"
            },
            "avg_duration": "平均配送时长(分钟,number)",
            "min_duration": "最短配送时长(分钟,number)",
            "max_duration": "最长配送时长(分钟,number)",
            "avg_expected": "平均预期时长(分钟,number)"
        },
        "process_times": {
            "avg_processing": "平均处理时长(分钟,number)",
            "avg_pickup": "平均取货时长(分钟,number)",
            "avg_delivery": "平均配送时长(分钟,number)"
        },
        "duration_ranges": {
            "0-10": "0-10分钟订单数(number)",
            "10-20": "10-20分钟订单数(number)",
            "20-30": "20-30分钟订单数(number)",
            "30-40": "30-40分钟订单数(number)",
            "40-50": "40-50分钟订单数(number)",
            "50-60": "50-60分钟订单数(number)",
            "60+": "60分钟以上订单数(number)"
        },
        "anomalies": {
            "quick_deliveries": "异常快速配送数(number)",
            "slow_deliveries": "异常慢速配送数(number)",
            "abnormal_sequence": "异常配送顺序数(number)"
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始时间戳(number)",
            "end": "结束时间戳(number)"
        }
    }
}
```

#### 特定错误码
| 错误码 | HTTP状态码 | 描述 | 处理建议 |
|--------|------------|------|----------|
| `INVALID_TIME_RANGE` | 400 | 无效的时间范围 | 确保end_time大于start_time |
| `TIME_RANGE_TOO_LARGE` | 400 | 时间范围过大 | 时间范围不超过30天 |
| `INSUFFICIENT_DATA` | 400 | 数据量不足 | 扩大时间范围 |

#### 请求示例
```bash
curl -X GET 'http://localhost:3004/api/v1/advanced/orders/delivery-duration-analysis' \
-H 'Authorization: Bearer your_token_here' \
-H 'Content-Type: application/json' \
-d '{
    "start_time": 1709251200,
    "end_time": 1709337600,
    "status": 5,
    "order_type": 1,
    "courier_id": "C789",
    "is_del": 0
}'
```

### 2. 骑手配送时长分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/couriers/delivery-duration-analysis`
- **描述**: 分析骑手在指定时间范围内的配送时长和效率数据
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `start_time` | number | 是 | 开始时间戳(秒) | 1709251200 | >0 |
| `end_time` | number | 是 | 结束时间戳(秒) | 1709337600 | >start_time |
| `courier_id` | string | 否 | 骑手ID | "C789" | - |
| `min_orders` | number | 否 | 最小订单数 | 10 | 1-1000 |

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "courier_info": {
            "id": "骑手ID(string)",
            "name": "骑手姓名(string)",
            "total_orders": "总订单数(number)"
        },
        "delivery_stats": {
            "avg_duration": "平均配送时长(分钟,number)",
            "min_duration": "最短配送时长(分钟,number)",
            "max_duration": "最长配送时长(分钟,number)",
            "std_deviation": "标准差(分钟,number)"
        },
        "time_distribution": {
            "morning": {
                "avg_duration": "早上平均配送时长(分钟,number)",
                "order_count": "早上订单数(number)"
            },
            "afternoon": {
                "avg_duration": "下午平均配送时长(分钟,number)",
                "order_count": "下午订单数(number)"
            },
            "evening": {
                "avg_duration": "晚上平均配送时长(分钟,number)",
                "order_count": "晚上订单数(number)"
            }
        },
        "duration_ranges": {
            "0-10": "0-10分钟订单数(number)",
            "10-20": "10-20分钟订单数(number)",
            "20-30": "20-30分钟订单数(number)",
            "30-40": "30-40分钟订单数(number)",
            "40-50": "40-50分钟订单数(number)",
            "50-60": "50-60分钟订单数(number)",
            "60+": "60分钟以上订单数(number)"
        },
        "performance": {
            "on_time_rate": "准时率(0-1,number)",
            "efficiency_score": "效率得分(0-100,number)"
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始时间戳(number)",
            "end": "结束时间戳(number)"
        }
    }
}
```

### 3. 骑手在线时长分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/couriers/online-duration-analysis`
- **描述**: 分析骑手在线时长和工作状态数据
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `start_time` | number | 是 | 开始时间戳(秒) | 1709251200 | >0 |
| `end_time` | number | 是 | 结束时间戳(秒) | 1709337600 | >start_time |
| `courier_id` | string | 否 | 骑手ID | "C789" | - |
| `min_hours` | number | 否 | 最小在线小时数 | 4 | 0-24 |

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "courier_info": {
            "id": "骑手ID(string)",
            "name": "骑手姓名(string)",
            "status": "当前状态(number)",
            "join_date": "入职日期(string)"
        },
        "online_stats": {
            "total_online_hours": "总在线时长(小时,number)",
            "avg_daily_hours": "日均在线时长(小时,number)",
            "max_daily_hours": "最长单日在线时长(小时,number)",
            "min_daily_hours": "最短单日在线时长(小时,number)"
        },
        "status_distribution": {
            "online": "在线时长(小时,number)",
            "delivering": "配送中时长(小时,number)",
            "resting": "休息时长(小时,number)",
            "offline": "离线时长(小时,number)"
        },
        "time_slots": {
            "morning": {
                "avg_online_hours": "早上平均在线时长(小时,number)",
                "order_count": "早上订单数(number)"
            },
            "afternoon": {
                "avg_online_hours": "下午平均在线时长(小时,number)",
                "order_count": "下午订单数(number)"
            },
            "evening": {
                "avg_online_hours": "晚上平均在线时长(小时,number)",
                "order_count": "晚上订单数(number)"
            }
        },
        "efficiency": {
            "orders_per_hour": "每小时订单数(number)",
            "active_rate": "活跃率(0-1,number)",
            "utilization_rate": "利用率(0-1,number)"
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始时间戳(number)",
            "end": "结束时间戳(number)"
        }
    }
}
```

### 4. 骑手收入分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/couriers/income-analysis`
- **描述**: 分析骑手收入和奖励数据
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `start_time` | number | 是 | 开始时间戳(秒) | 1709251200 | >0 |
| `end_time` | number | 是 | 结束时间戳(秒) | 1709337600 | >start_time |
| `courier_id` | string | 否 | 骑手ID | "C789" | - |
| `include_bonus` | boolean | 否 | 是否包含奖励 | true | true/false |

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "courier_info": {
            "id": "骑手ID(string)",
            "name": "骑手姓名(string)",
            "level": "骑手等级(number)",
            "join_date": "入职日期(string)"
        },
        "income_summary": {
            "total_income": "总收入(元,number)",
            "delivery_fee": "配送费(元,number)",
            "bonus": "奖励金(元,number)",
            "penalties": "罚款(元,number)"
        },
        "daily_stats": {
            "avg_daily_income": "日均收入(元,number)",
            "max_daily_income": "最高日收入(元,number)",
            "min_daily_income": "最低日收入(元,number)",
            "income_trend": [
                {
                    "date": "日期(string)",
                    "income": "收入(元,number)",
                    "orders": "订单数(number)"
                }
            ]
        },
        "order_income": {
            "avg_per_order": "单均收入(元,number)",
            "max_per_order": "单笔最高(元,number)",
            "min_per_order": "单笔最低(元,number)"
        },
        "bonus_details": {
            "on_time_bonus": "准时奖励(元,number)",
            "peak_hour_bonus": "高峰奖励(元,number)",
            "special_event_bonus": "活动奖励(元,number)",
            "customer_rating_bonus": "好评奖励(元,number)"
        },
        "performance_metrics": {
            "income_rank": "收入排名(number)",
            "efficiency_score": "效率得分(0-100,number)",
            "customer_satisfaction": "客户满意度(0-5,number)"
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始时间戳(number)",
            "end": "结束时间戳(number)"
        }
    }
}
```

### 5. 订单每日数据环比分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/orders/daily-comparison`
- **描述**: 分析最近三周的每日订单数据，进行环比和同比分析
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `base_date` | string | 是 | 基准日期 | "2024-03-20" | 有效的日期字符串 |
| `metrics` | array | 是 | 分析指标数组 | ["order_count", "total_amount"] | 见下方说明 |

##### 支持的指标（metrics）
- `order_count`: 订单数量
- `total_amount`: 订单总金额
- `avg_amount`: 平均订单金额
- `avg_delivery_time`: 平均配送时长

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "daily_comparison": {
            "order_count": {  // 每个请求的指标都有类似结构
                "current_week": [
                    {
                        "date": "日期(string)",
                        "value": "数值(number)",
                        "yoy_rate": "同比增长率(number)",
                        "wow_rate": "环比增长率(number)"
                    }
                ],
                "last_week": [
                    // 上周同样结构的数据
                ],
                "two_weeks_ago": [
                    // 两周前同样结构的数据
                ]
            }
        },
        "trend_analysis": {
            "order_count": {  // 每个指标的趋势分析
                "trend_direction": "趋势方向(string: up/down/stable)",
                "growth_rate": "整体增长率(number)",
                "stability_score": "稳定性得分(number)",
                "seasonal_pattern": "季节性模式(string)"
            }
        },
        "variance_analysis": {
            "order_count": {  // 每个指标的方差分析
                "week_variance": "周间方差(number)",
                "day_variance": "日间方差(number)",
                "significance_test": {
                    "p_value": "显著性检验p值(number)",
                    "is_significant": "是否显著(boolean)",
                    "confidence_interval": "置信区间(array)"
                }
            }
        },
        "statistical_metrics": {
            "order_count": {  // 每个指标的统计指标
                "mean": "平均值(number)",
                "median": "中位数(number)",
                "std_dev": "标准差(number)",
                "max": "最大值(number)",
                "min": "最小值(number)",
                "quartiles": "四分位数(array)"
            }
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始日期(string)",
            "end": "结束日期(string)"
        }
    }
}
```

#### 特定错误码
| 错误码 | HTTP状态码 | 描述 | 处理建议 |
|--------|------------|------|----------|
| `INVALID_DATE_FORMAT` | 400 | 无效的日期格式 | 确保日期格式为YYYY-MM-DD |
| `INVALID_METRIC` | 400 | 无效的指标名称 | 使用支持的指标名称 |
| `INSUFFICIENT_DATA` | 400 | 数据量不足 | 选择有足够历史数据的日期 |

#### 请求示例
```bash
curl -X GET 'http://localhost:3004/api/v1/advanced/orders/daily-comparison' \
-H 'Authorization: Bearer your_token_here' \
-H 'Content-Type: application/json' \
-d '{
    "base_date": "2024-03-20",
    "metrics": ["order_count", "total_amount", "avg_delivery_time"]
}'
```

### 6. 订单时段分布分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/orders/time-distribution`
- **描述**: 分析订单在不同时间段的分布情况
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `start_time` | number | 是 | 开始时间戳(秒) | 1709251200 | >0 |
| `end_time` | number | 是 | 结束时间戳(秒) | 1709337600 | >start_time |
| `interval` | string | 否 | 统计间隔 | "hour" | hour/day/week/month |
| `order_type` | number | 否 | 订单类型 | 1 | 1~5 |

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "total_orders": "总订单数(number)",
        "hourly_distribution": {
            "00": "0点订单数(number)",
            "01": "1点订单数(number)",
            // ... 24小时分布
            "23": "23点订单数(number)"
        },
        "peak_hours": {
            "morning_peak": {
                "start": "早高峰开始时间(string)",
                "end": "早高峰结束时间(string)",
                "order_count": "订单数(number)"
            },
            "evening_peak": {
                "start": "晚高峰开始时间(string)",
                "end": "晚高峰结束时间(string)",
                "order_count": "订单数(number)"
            }
        },
        "daily_stats": {
            "avg_orders": "日均订单数(number)",
            "max_orders": "单日最高订单数(number)",
            "min_orders": "单日最低订单数(number)"
        },
        "weekly_pattern": {
            "monday": "周一订单数(number)",
            "tuesday": "周二订单数(number)",
            "wednesday": "周三订单数(number)",
            "thursday": "周四订单数(number)",
            "friday": "周五订单数(number)",
            "saturday": "周六订单数(number)",
            "sunday": "周日订单数(number)"
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始时间戳(number)",
            "end": "结束时间戳(number)"
        },
        "interval": "统计间隔(string)"
    }
}
```

### 7. 订单区域分布分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/orders/area-distribution`
- **描述**: 分析订单在不同区域的分布情况
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `start_time` | number | 是 | 开始时间戳(秒) | 1709251200 | >0 |
| `end_time` | number | 是 | 结束时间戳(秒) | 1709337600 | >start_time |
| `area_level` | string | 否 | 区域级别 | "district" | district/business |
| `order_type` | number | 否 | 订单类型 | 1 | 1~5 |

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "total_orders": "总订单数(number)",
        "area_statistics": {
            "district_distribution": {
                "district_1": {
                    "name": "区域名称(string)",
                    "order_count": "订单数(number)",
                    "percentage": "占比(number)",
                    "avg_delivery_time": "平均配送时长(number)"
                }
                // ... 其他区域
            },
            "business_circles": {
                "circle_1": {
                    "name": "商圈名称(string)",
                    "order_count": "订单数(number)",
                    "percentage": "占比(number)",
                    "peak_hours": ["高峰时段(string)"]
                }
                // ... 其他商圈
            }
        },
        "hot_spots": [
            {
                "location": {
                    "latitude": "纬度(number)",
                    "longitude": "经度(number)"
                },
                "order_count": "订单数(number)",
                "radius": "辐射范围(米,number)"
            }
        ],
        "cross_district": {
            "total_count": "跨区订单数(number)",
            "avg_distance": "平均配送距离(千米,number)",
            "avg_duration": "平均配送时长(分钟,number)"
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始时间戳(number)",
            "end": "结束时间戳(number)"
        },
        "area_level": "区域级别(string)"
    }
}
```

### 8. 订单金额统计分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/orders/amount-statistics`
- **描述**: 分析订单金额的统计数据
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `start_time` | number | 是 | 开始时间戳(秒) | 1709251200 | >0 |
| `end_time` | number | 是 | 结束时间戳(秒) | 1709337600 | >start_time |
| `order_type` | number | 否 | 订单类型 | 1 | 1~5 |
| `min_amount` | number | 否 | 最小金额 | 10 | >0 |

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "total_statistics": {
            "total_amount": "总金额(元,number)",
            "order_count": "订单数(number)",
            "avg_amount": "平均金额(元,number)",
            "max_amount": "最大金额(元,number)",
            "min_amount": "最小金额(元,number)"
        },
        "amount_ranges": {
            "0-20": "0-20元订单数(number)",
            "20-50": "20-50元订单数(number)",
            "50-100": "50-100元订单数(number)",
            "100-200": "100-200元订单数(number)",
            "200+": "200元以上订单数(number)"
        },
        "payment_methods": {
            "wechat": "微信支付订单数(number)",
            "alipay": "支付宝订单数(number)",
            "balance": "余额支付订单数(number)",
            "other": "其他支付方式订单数(number)"
        },
        "time_distribution": {
            "hourly": {
                "00": "0点订单金额(元,number)",
                // ... 24小时分布
                "23": "23点订单金额(元,number)"
            },
            "daily": {
                "avg_amount": "日均金额(元,number)",
                "peak_day": "高峰日期(string)",
                "peak_amount": "高峰金额(元,number)"
            }
        },
        "delivery_fee_stats": {
            "total_fee": "总配送费(元,number)",
            "avg_fee": "平均配送费(元,number)",
            "fee_ranges": {
                "0-5": "0-5元配送费订单数(number)",
                "5-10": "5-10元配送费订单数(number)",
                "10+": "10元以上配送费订单数(number)"
            }
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始时间戳(number)",
            "end": "结束时间戳(number)"
        }
    }
}
```

## 客户分析 API

### 1. 客户订单统计分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/customers/order-statistics`
- **描述**: 分析客户的订单统计数据
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `start_time` | number | 是 | 开始时间戳(秒) | 1709251200 | >0 |
| `end_time` | number | 是 | 结束时间戳(秒) | 1709337600 | >start_time |
| `customer_id` | string | 否 | 客户ID | "U123" | - |
| `min_orders` | number | 否 | 最小订单数 | 5 | >0 |

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "customer_info": {
            "id": "客户ID(string)",
            "name": "客户姓名(string)",
            "register_date": "注册日期(string)",
            "member_level": "会员等级(number)"
        },
        "order_statistics": {
            "total_orders": "总订单数(number)",
            "completed_orders": "已完成订单数(number)",
            "cancelled_orders": "已取消订单数(number)",
            "avg_orders_per_month": "月均订单数(number)"
        },
        "consumption_stats": {
            "total_amount": "总消费金额(元,number)",
            "avg_amount_per_order": "单均消费金额(元,number)",
            "max_amount": "最大单笔消费(元,number)",
            "min_amount": "最小单笔消费(元,number)"
        },
        "time_preferences": {
            "preferred_hours": ["偏好时段(string)"],
            "preferred_days": ["偏好星期(string)"]
        },
        "delivery_preferences": {
            "avg_delivery_time": "平均配送时长(分钟,number)",
            "preferred_couriers": ["偏好骑手ID(string)"],
            "common_addresses": [
                {
                    "address": "地址(string)",
                    "order_count": "订单数(number)",
                    "last_used": "最后使用时间(string)"
                }
            ]
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始时间戳(number)",
            "end": "结束时间戳(number)"
        }
    }
}
```

### 2. 客户消费行为分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/customers/consumption-analysis`
- **描述**: 分析客户的消费行为数据
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `start_time` | number | 是 | 开始时间戳(秒) | 1709251200 | >0 |
| `end_time` | number | 是 | 结束时间戳(秒) | 1709337600 | >start_time |
| `customer_id` | string | 否 | 客户ID | "U123" | - |
| `include_details` | boolean | 否 | 是否包含详细数据 | true | true/false |

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "consumption_pattern": {
            "frequency": {
                "daily": "日均订单数(number)",
                "weekly": "周均订单数(number)",
                "monthly": "月均订单数(number)"
            },
            "amount_distribution": {
                "0-50": "0-50元订单数(number)",
                "50-100": "50-100元订单数(number)",
                "100-200": "100-200元订单数(number)",
                "200+": "200元以上订单数(number)"
            },
            "payment_preferences": {
                "wechat": "微信支付比例(number)",
                "alipay": "支付宝比例(number)",
                "balance": "余额支付比例(number)"
            }
        },
        "order_preferences": {
            "categories": [
                {
                    "name": "品类名称(string)",
                    "order_count": "订单数(number)",
                    "amount": "消费金额(元,number)"
                }
            ],
            "time_slots": {
                "morning": "早上订单数(number)",
                "noon": "中午订单数(number)",
                "evening": "晚上订单数(number)"
            },
            "delivery_preferences": {
                "avg_distance": "平均配送距离(千米,number)",
                "preferred_areas": ["偏好区域(string)"]
            }
        },
        "customer_value": {
            "lifetime_value": "客户终身价值(元,number)",
            "avg_monthly_value": "月均价值(元,number)",
            "value_trend": [
                {
                    "month": "月份(string)",
                    "value": "价值(元,number)"
                }
            ]
        },
        "loyalty_metrics": {
            "membership_days": "会员天数(number)",
            "points": "积分(number)",
            "tier": "会员等级(string)",
            "benefits_used": [
                {
                    "type": "权益类型(string)",
                    "usage_count": "使用次数(number)"
                }
            ]
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始时间戳(number)",
            "end": "结束时间戳(number)"
        }
    }
}
```

### 3. 客户区域分布分析

#### 基本信息
- **接口**: `GET /api/v1/advanced/customers/area-distribution`
- **描述**: 分析客户的区域分布数据
- **权限要求**: 管理员权限
- **速率限制**: 20次/分钟

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 | 取值范围 |
|--------|------|------|------|------|----------|
| `start_time` | number | 是 | 开始时间戳(秒) | 1709251200 | >0 |
| `end_time` | number | 是 | 结束时间戳(秒) | 1709337600 | >start_time |
| `area_level` | string | 否 | 区域级别 | "district" | district/business |
| `min_customers` | number | 否 | 最小客户数 | 10 | >0 |

#### 响应字段说明
```json
{
    "success": true,
    "data": {
        "total_customers": "总客户数(number)",
        "area_statistics": {
            "district_distribution": {
                "district_1": {
                    "name": "区域名称(string)",
                    "customer_count": "客户数(number)",
                    "order_count": "订单数(number)",
                    "total_amount": "消费总额(元,number)"
                }
                // ... 其他区域
            },
            "business_circles": {
                "circle_1": {
                    "name": "商圈名称(string)",
                    "customer_count": "客户数(number)",
                    "avg_consumption": "平均消费(元,number)",
                    "peak_hours": ["高峰时段(string)"]
                }
                // ... 其他商圈
            }
        },
        "customer_density": {
            "high_density_areas": [
                {
                    "location": {
                        "latitude": "纬度(number)",
                        "longitude": "经度(number)"
                    },
                    "customer_count": "客户数(number)",
                    "radius": "辐射范围(米,number)"
                }
            ],
            "coverage_stats": {
                "total_coverage": "覆盖面积(平方公里,number)",
                "customer_density": "客户密度(人/平方公里,number)"
            }
        },
        "movement_patterns": {
            "cross_district": "跨区活动客户数(number)",
            "avg_activity_radius": "平均活动半径(千米,number)",
            "common_routes": [
                {
                    "from": "起始区域(string)",
                    "to": "目标区域(string)",
                    "customer_count": "客户数(number)"
                }
            ]
        }
    },
    "metadata": {
        "time_range": {
            "start": "开始时间戳(number)",
            "end": "结束时间戳(number)"
        },
        "area_level": "区域级别(string)"
  }
}
```

## 错误处理

所有API在发生错误时都会返回统一格式的错误响应：

```json
{
    "success": false,
    "error": {
        "code": "错误代码",
        "message": "错误描述",
        "details": "详细错误信息"
    },
    "timestamp": "2024-03-14T03:30:00.000Z"
}
```

### 通用错误码

| 错误码 | HTTP状态码 | 描述 | 处理建议 |
|--------|------------|------|----------|
| `INVALID_PARAMS` | 400 | 请求参数无效 | 检查请求参数是否符合API要求 |
| `UNAUTHORIZED` | 401 | 未授权访问 | 检查认证信息是否正确 |
| `FORBIDDEN` | 403 | 权限不足 | 确认是否有访问该API的权限 |
| `NOT_FOUND` | 404 | 资源不存在 | 检查请求的资源ID是否正确 |
| `RATE_LIMIT` | 429 | 请求频率超限 | 降低API调用频率 |
| `SERVER_ERROR` | 500 | 服务器内部错误 | 联系技术支持 |

### 业务错误码

| 错误码 | HTTP状态码 | 描述 | 处理建议 |
|--------|------------|------|----------|
| `ORDER_NOT_FOUND` | 404 | 订单不存在 | 检查订单ID是否正确 |
| `COURIER_NOT_FOUND` | 404 | 骑手不存在 | 检查骑手ID是否正确 |
| `INVALID_TIME_RANGE` | 400 | 时间范围无效 | 确保开始时间早于结束时间，且时间范围不超过限制 |
| `INSUFFICIENT_DATA` | 400 | 数据量不足 | 增加查询时间范围或减少最小数据量要求 |
| `INVALID_STATUS` | 400 | 订单状态无效 | 检查订单状态值是否在允许范围内 |

### 错误处理最佳实践

1. **参数验证**
   - 在发送请求前验证所有必填参数
   - 确保参数格式和类型正确
   - 注意时间戳的格式要求

2. **错误重试**
   - 对于5xx错误可以进行重试
   - 建议使用指数退避算法
   - 最多重试3次

3. **错误日志**
   - 记录所有API错误
   - 包含请求参数和响应数据
   - 便于问题定位和分析

## 版本控制

### 版本号规则

API版本号采用语义化版本号（Semantic Versioning）规则：

- **主版本号**：不兼容的API修改（v1 -> v2）
- **次版本号**：向下兼容的功能性新增（v1.1 -> v1.2）
- **修订号**：向下兼容的问题修正（v1.1.1 -> v1.1.2）

### 版本兼容性

1. **向下兼容**
   - 新增可选参数
   - 新增响应字段
   - 扩展枚举值
   - 增加新的端点

2. **不兼容变更**
   - 删除或重命名字段
   - 修改字段类型
   - 修改错误响应结构
   - 修改认证方式

### 版本生命周期

1. **当前版本**
   - v1：当前稳定版本
   - 支持所有功能
   - 持续进行问题修复

2. **历史版本**
   - 每个主版本支持18个月
   - 提前6个月通知版本停用
   - 仅进行安全更新

3. **预览版本**
   - v2-preview：下一主版本预览
   - 不建议用于生产环境
   - 可能发生破坏性变更

### 版本切换

1. **版本指定**
   - URL路径：`/api/v1/...`
   - 请求头：`Accept: application/vnd.huosubang.v1+json`

2. **版本升级**
   - 参考升级指南
   - 测试所有API调用
   - 使用兼容性检查工具

### 最近更新

#### v1.2.0 (2024-03-14)
- 新增订单阶段时长分析API
- 优化配送时长分析性能
- 新增骑手配送时长分析API

#### v1.1.0 (2024-02-01)
- 新增业务概览分析API
- 优化数据聚合算法
- 支持更多时间范围选项

#### v1.0.0 (2024-01-01)
- 首次发布
- 基础订单分析功能
- 骑手绩效分析功能

## 状态码映射

### 订单状态码
| 状态码 | 英文标识 | 中文说明 |
|--------|----------|----------|
| -2 | cancelled | 已取消 |
| -1 | closed | 已关闭 |
| 0 | pending_payment | 待支付 |
| 1 | pending_pickup | 待接单 |
| 2 | accepted | 已接单 |
| 3 | picked_up | 已取货 |
| 4 | delivering | 配送中 |
| 5 | completed | 已完成 |

### 会员状态码
| 状态码 | 英文标识 | 中文说明 |
|--------|----------|----------|
| 0 | disabled | 禁止登录 |
| 1 | normal | 正常登录 |
| 2 | vip | VIP会员 |

### 骑手状态码
| 状态码 | 英文标识 | 中文说明 |
|--------|----------|----------|
| -2 | resigned | 已离职 |
| -1 | unregistered | 未注册 |
| 0 | offline | 已下线 |
| 1 | online | 在线中 |
| 2 | delivering | 配送中 |

### 支付方式
| 状态码 | 英文标识 | 中文说明 |
|--------|----------|----------|
| 0 | unpaid | 未支付 |
| 1 | wechat | 微信支付 |
| 2 | alipay | 支付宝 |
| 3 | balance | 余额支付 |
| 4 | offline | 后台付款 |
| 5 | takeout | 外卖订单付款 |
| 6 | douyin | 抖音付款 |