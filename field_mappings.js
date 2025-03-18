/**
 * API字段到数据库字段的映射关系
 * 
 * 本文件定义了API响应中的字段名与数据库表中字段名的映射关系
 * 包括直接映射（字段名相同）和中文字段映射（API使用中文字段名）
 * 
 * 数据库: luanzhoubang
 * 
 * 表关系说明：
 * - lzb_peisong_order: 配送订单表
 * - lzb_member: 会员表
 * - lzb_qishou_info: 骑手信息表
 * 
 * 关键关系：
 * - lzb_peisong_order.memberid 对应 lzb_member.id（会员ID关系）
 * - lzb_peisong_order.qishouid 是骑手ID
 * - lzb_qishou_info.memberid 是骑手ID（对应lzb_member表的id）
 * - lzb_member.id 也可以是骑手ID（骑手也是会员）
 */

const fieldMappings = {
    //===========================================================
    // 直接映射（API字段名与数据库字段名相同）
    //===========================================================
    
    // lzb_peisong_order 表字段（配送订单表）
    'id': 'id',                         // 订单ID
    'memberid': 'memberid',             // 会员ID（对应lzb_member表的id）
    'agentid': 'agentid',               // 代理商ID
    'ordersn': 'ordersn',               // 订单编号
    'price': 'price',                   // 订单金额
    'message': 'message',               // 订单留言
    'goods_name': 'goods_name',         // 商品名称
    'goods_weight': 'goods_weight',     // 商品重量
    'juli': 'juli',                     // 配送距离（单位：米）
    'yijia': 'yijia',                   // 加价金额
    'peisongfei': 'peisongfei',         // 配送费
    'xiaofei': 'xiaofei',               // 小费
    'qishouid': 'qishouid',             // 骑手ID（对应lzb_qishou_info表的memberid或lzb_member表的id）
    'qu_address': 'qu_address',         // 取货地址
    'qu_menpaihao': 'qu_menpaihao',     // 取货门牌号
    'qu_latitude': 'qu_latitude',       // 取货地址纬度
    'qu_longitude': 'qu_longitude',     // 取货地址经度
    'qu_address_id': 'qu_address_id',   // 取货地址ID
    'qu_mobile': 'qu_mobile',           // 取货联系人电话
    'qu_name': 'qu_name',               // 取货联系人姓名
    'shou_address': 'shou_address',     // 收货地址
    'shou_menpaihao': 'shou_menpaihao', // 收货门牌号
    'shou_latitude': 'shou_latitude',   // 收货地址纬度
    'shou_longitude': 'shou_longitude', // 收货地址经度
    'shou_address_id': 'shou_address_id', // 收货地址ID
    'shou_mobile': 'shou_mobile',       // 收货人手机号
    'shou_name': 'shou_name',           // 收货人姓名
    'status': 'status',                 // 订单状态
    'add_time': 'add_time',             // 下单时间
    'pay_time': 'pay_time',             // 支付时间
    'pay_type': 'pay_type',             // 支付类型
    'order_type': 'order_type',         // 订单类型
    'songda_time': 'songda_time',       // 骑手送达时间
    'complete_time': 'complete_time',   // 订单完成时间
    'jiedan_time': 'jiedan_time',       // 骑手接单时间
    'qu_time': 'qu_time',               // 骑手取件时间
    'qishou_shouyi': 'qishou_shouyi',   // 骑手收益
    'wenzi_txt': 'wenzi_txt',           // 文字说明
    'qishou_mobile': 'qishou_mobile',   // 骑手电话
    'goods_price': 'goods_price',       // 预估商品价格
    'expect_finish_time': 'expect_finish_time', // 期望送达时间
    
    // lzb_member 表字段（会员表）
    'member_id': 'id',                  // 会员ID
    'member_nickname': 'nickname',      // 会员昵称
    'member_mobile': 'mobile',          // 会员手机号
    'member_avatar': 'avatar',          // 会员头像
    'member_status': 'status',          // 会员状态
    'member_realname': 'realname',      // 会员真实姓名
    'member_credit': 'credit',          // 会员余额
    'member_createtime': 'createtime',  // 会员注册时间
    
    // lzb_qishou_info 表字段（骑手信息表）
    'courier_name': 'card_name',        // 骑手姓名
    'courier_id_number': 'card_no',     // 骑手身份证号
    'courier_mobile': 'courier_mobile', // 骑手手机号
    'courier_status': 'line_status',    // 骑手状态
    'courier_sex': 'card_sex',          // 骑手性别
    'courier_commission_rate': 'scale', // 骑手佣金比例
    
    //===========================================================
    // API字段映射（API使用的字段名映射到数据库字段）
    //===========================================================
    
    // 订单相关字段
    'order_id': 'id',                   // 订单ID
    'customer_id': 'memberid',          // 客户ID
    'agent_id': 'agentid',              // 代理商ID
    'order_number': 'ordersn',          // 订单编号
    'order_amount': 'price',            // 订单金额
    'order_note': 'message',            // 订单备注
    'item_name': 'goods_name',          // 商品名称
    'item_weight': 'goods_weight',      // 商品重量
    'delivery_distance': 'juli',        // 配送距离
    'extra_fee': 'yijia',               // 额外费用
    'delivery_fee': 'peisongfei',       // 配送费
    'tip_amount': 'xiaofei',            // 小费金额
    'courier_id': 'qishouid',           // 骑手ID
    'pickup_address': 'qu_address',     // 取货地址
    'pickup_door_number': 'qu_menpaihao', // 取货门牌号
    'pickup_latitude': 'qu_latitude',   // 取货纬度
    'pickup_longitude': 'qu_longitude', // 取货经度
    'pickup_address_id': 'qu_address_id', // 取货地址ID
    'pickup_contact_phone': 'qu_mobile', // 取货联系人电话
    'pickup_contact_name': 'qu_name',   // 取货联系人姓名
    'delivery_address': 'shou_address', // 送货地址
    'delivery_door_number': 'shou_menpaihao', // 送货门牌号
    'delivery_latitude': 'shou_latitude', // 送货纬度
    'delivery_longitude': 'shou_longitude', // 送货经度
    'delivery_address_id': 'shou_address_id', // 送货地址ID
    'recipient_phone': 'shou_mobile',   // 收货人电话
    'recipient_name': 'shou_name',      // 收货人姓名
    'order_status': 'status',           // 订单状态
    'created_at': 'add_time',           // 创建时间
    'paid_at': 'pay_time',              // 支付时间
    'payment_method': 'pay_type',       // 支付方式
    'order_type': 'order_type',         // 订单类型
    'delivered_at': 'songda_time',      // 送达时间
    'completed_at': 'complete_time',    // 完成时间
    'accepted_at': 'jiedan_time',       // 接单时间
    'picked_up_at': 'qu_time',          // 取货时间
    'courier_earnings': 'qishou_shouyi', // 骑手收益
    'text_note': 'wenzi_txt',           // 文字备注
    'courier_phone': 'qishou_mobile',   // 骑手电话
    'estimated_item_price': 'goods_price', // 预估商品价格
    'expected_delivery_time': 'expect_finish_time', // 期望送达时间
    
    // 会员相关字段
    'user_id': 'id',                    // 用户ID
    'username': 'nickname',             // 用户名
    'phone': 'mobile',                  // 手机号
    'avatar': 'avatar',                 // 头像
    'user_status': 'status',            // 用户状态
    'real_name': 'realname',            // 真实姓名
    'balance': 'credit',                // 账户余额
    'registration_time': 'createtime',  // 注册时间
    
    // 骑手相关字段
    'courier_info_id': 'id',            // 骑手信息ID
    'courier_user_id': 'memberid',      // 骑手用户ID
    'courier_name': 'card_name',        // 骑手姓名
    'courier_mobile': 'courier_mobile', // 骑手手机号
    'courier_status': 'line_status',    // 骑手状态
    'courier_sex': 'card_sex',          // 骑手性别
    'courier_id_card': 'card_no',       // 骑手身份证号
    'courier_address': 'address',       // 骑手地址
    
    // 骑手字段映射
    'courier': {
        'card_name': 'courier_name',      // 骑手姓名
        'mobile': 'courier_mobile',       // 骑手手机号
        'line_status': 'courier_status',  // 骑手状态
        'card_sex': 'courier_sex',        // 骑手性别
        'card_no': 'courier_id_card',     // 骑手身份证号
        'baodan_img': 'courier_baodan_img' // 骑手保单图片
    },
    
    //===========================================================
    // 状态码映射（将数字状态码映射为有意义的文本）
    //===========================================================
    
    // 订单状态映射
    'status_mapping': {
        '-2': { code: -2, text: 'cancelled', description: '取消订单' },
        '-1': { code: -1, text: 'closed', description: '关闭订单' },
        '0': { code: 0, text: 'pending_payment', description: '待付款' },
        '1': { code: 1, text: 'pending_pickup', description: '待骑手接单' },
        '2': { code: 2, text: 'pending_collection', description: '骑手待取货' },
        '3': { code: 3, text: 'in_delivery', description: '骑手配送中' },
        '4': { code: 4, text: 'delivered', description: '骑手已送达' },
        '5': { code: 5, text: 'completed', description: '订单已完成' }
    },
    
    // 支付类型映射
    'payment_method_mapping': {
        '0': { code: 0, text: 'unpaid', description: '未支付' },
        '1': { code: 1, text: 'wechat', description: '微信支付' },
        '2': { code: 2, text: 'alipay', description: '支付宝' },
        '3': { code: 3, text: 'balance', description: '余额支付' },
        '4': { code: 4, text: 'offline', description: '后台付款' },
        '5': { code: 5, text: 'takeout', description: '外卖订单付款' },
        '6': { code: 6, text: 'douyin', description: '抖音付款' }
    },
    
    // 订单类型映射
    'order_type_mapping': {
        '1': { code: 1, text: 'delivery', description: '帮我送' },
        '2': { code: 2, text: 'pickup', description: '帮我取' },
        '3': { code: 3, text: 'purchase', description: '代买' },
        '4': { code: 4, text: 'voice', description: '语音订单' },
        '5': { code: 5, text: 'takeout', description: '外卖' },
        '6': { code: 6, text: 'text', description: '文字订单' },
        '7': { code: 7, text: 'group', description: '团购订单' }
    },
    
    // 骑手在线状态映射
    'courier_status_mapping': {
        '-2': { code: -2, text: 'resigned', description: '骑手离职' },
        '-1': { code: -1, text: 'unregistered', description: '未注册骑手' },
        '0': { code: 0, text: 'offline', description: '已下线' },
        '1': { code: 1, text: 'online', description: '在线中' }
    },
    
    //===========================================================
    // 跨表关联字段（需要JOIN查询）
    //===========================================================
    
    // 订单-会员关联
    'order_customer_relation': {
        'from_table': 'lzb_peisong_order',
        'to_table': 'lzb_member',
        'from_field': 'memberid',
        'to_field': 'id',
        'fields': [
            { 'api_field': 'customer_name', 'db_field': 'nickname', 'description': '客户昵称' },
            { 'api_field': 'customer_phone', 'db_field': 'mobile', 'description': '客户手机号' },
            { 'api_field': 'customer_avatar', 'db_field': 'avatar', 'description': '客户头像' }
        ]
    },
    
    // 订单-骑手关联
    'order_courier_relation': {
        'from_table': 'lzb_peisong_order',
        'to_table': 'lzb_qishou_info',
        'from_field': 'qishouid',
        'to_field': 'memberid',
        'fields': [
            { 'api_field': 'courier_name', 'db_field': 'card_name', 'description': '骑手姓名' },
            { 'api_field': 'courier_phone', 'db_field': 'courier_mobile', 'description': '骑手手机号' },
            { 'api_field': 'courier_status', 'db_field': 'line_status', 'description': '骑手状态' }
        ]
    },
    
    // 骑手-会员关联
    'courier_member_relation': {
        'from_table': 'lzb_qishou_info',
        'to_table': 'lzb_member',
        'from_field': 'memberid',
        'to_field': 'id',
        'fields': [
            { 'api_field': 'courier_nickname', 'db_field': 'nickname', 'description': '骑手昵称' },
            { 'api_field': 'courier_avatar', 'db_field': 'avatar', 'description': '骑手头像' },
            { 'api_field': 'courier_balance', 'db_field': 'credit', 'description': '骑手余额' }
        ]
    }
};

module.exports = fieldMappings;
