const { errorResponse } = require('./errorHandlers');

/**
 * 验证时间范围参数
 */
const validateTimeRange = (req, res, next) => {
    const { start_time, end_time } = req.query;

    if (!start_time || !end_time) {
        return res.status(400).json(
            errorResponse(
                'MISSING_PARAMETERS',
                '时间范围参数缺失',
                '请提供start_time和end_time参数'
            )
        );
    }

    // 验证时间戳格式
    const startTime = parseInt(start_time);
    const endTime = parseInt(end_time);
    
    if (isNaN(startTime) || isNaN(endTime)) {
        return res.status(400).json(
            errorResponse(
                'INVALID_TIME_FORMAT',
                '时间格式无效',
                'start_time和end_time应为Unix时间戳(秒)'
            )
        );
    }
    
    if (endTime <= startTime) {
        return res.status(400).json(
            errorResponse(
                'INVALID_TIME_RANGE',
                '无效的时间范围',
                'end_time应大于start_time'
            )
        );
    }

    // 将解析后的时间戳添加到req对象中
    req.validatedTimeRange = {
        startTime,
        endTime
    };

    next();
};

// 验证分页参数中间件
const validatePaginationParams = (req, res, next) => {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    
    if (limit < 1 || limit > 100) {
        return res.status(400).json(
            errorResponse(
                'INVALID_PARAMS',
                '每页记录数必须在1-100之间',
                '请调整limit参数的值'
            )
        );
    }
    
    if (page < 1) {
        return res.status(400).json(
            errorResponse(
                'INVALID_PARAMS',
                '页码必须大于0',
                '请调整page参数的值'
            )
        );
    }
    
    // 将验证后的分页参数添加到req对象
    req.pagination = {
        limit,
        page
    };
    
    next();
};

module.exports = {
    validateTimeRange,
    validatePaginationParams
}; 