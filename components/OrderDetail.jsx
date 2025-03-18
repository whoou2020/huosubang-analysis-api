import React, { useState } from 'react';
import { Card, Form, Input, Button, Spin, Descriptions, Tag, Row, Col, Divider, Timeline, message, Statistic, Image } from 'antd';
import { SearchOutlined, ClockCircleOutlined, EnvironmentOutlined, UserOutlined, DollarOutlined, CarOutlined, ShopOutlined, HomeOutlined } from '@ant-design/icons';
import { getOrderDetail } from '../api/orderService';

// 格式化时间戳为可读时间
const formatTimestamp = (timestamp) => {
  if (!timestamp || timestamp === 0) return '-';
  return new Date(timestamp * 1000).toLocaleString();
};

// 计算时间差（分钟）
const calculateTimeDiff = (endTime, startTime) => {
  if (!endTime || !startTime || endTime === 0 || startTime === 0) return '-';
  return ((endTime - startTime) / 60).toFixed(1);
};

// 获取订单状态标签
const getOrderStatusTag = (status) => {
  const statusMap = {
    '-2': { color: 'red', text: '已取消' },
    '-1': { color: 'orange', text: '已退款' },
    '0': { color: 'blue', text: '待支付' },
    '1': { color: 'purple', text: '待接单' },
    '2': { color: 'cyan', text: '待取货' },
    '3': { color: 'geekblue', text: '配送中' },
    '4': { color: 'lime', text: '已送达' },
    '5': { color: 'green', text: '已完成' }
  };
  const { color, text } = statusMap[status] || { color: 'default', text: `未知状态(${status})` };
  return <Tag color={color}>{text}</Tag>;
};

// 获取订单类型标签
const getOrderTypeTag = (type) => {
  const typeMap = {
    '1': { color: 'blue', text: '快递' },
    '2': { color: 'cyan', text: '跑腿' },
    '3': { color: 'purple', text: '代购' },
    '4': { color: 'orange', text: '专送' },
    '5': { color: 'green', text: '外卖' },
    '6': { color: 'magenta', text: '文字订单' }
  };
  const { color, text } = typeMap[type] || { color: 'default', text: `未知类型(${type})` };
  return <Tag color={color}>{text}</Tag>;
};

const OrderDetail = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  // 查询订单详情
  const fetchOrderDetail = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderDetail(orderId);
      setOrder(data);
      message.success('订单查询成功');
    } catch (error) {
      console.error('查询订单详情失败:', error);
      setError(error.message || '查询订单失败，请稍后重试');
      message.error(error.message || '查询订单失败，请稍后重试');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // 表单提交
  const handleSubmit = (values) => {
    const { orderId } = values;
    if (orderId) {
      fetchOrderDetail(orderId);
    } else {
      message.warning('请输入订单号');
    }
  };

  // 订单时间线
  const renderTimeline = (order) => {
    if (!order) return null;

    const timelineItems = [];

    if (order.add_time && order.add_time !== 0) {
      timelineItems.push({
        time: order.add_time,
        label: '下单',
        description: `用户下单时间: ${formatTimestamp(order.add_time)}`
      });
    }

    if (order.pay_time && order.pay_time !== 0) {
      timelineItems.push({
        time: order.pay_time,
        label: '支付',
        description: `用户支付时间: ${formatTimestamp(order.pay_time)}`
      });
    }

    if (order.jiedan_time && order.jiedan_time !== 0) {
      timelineItems.push({
        time: order.jiedan_time,
        label: '接单',
        description: `骑手接单时间: ${formatTimestamp(order.jiedan_time)}`
      });
    }

    if (order.qu_time && order.qu_time !== 0) {
      timelineItems.push({
        time: order.qu_time,
        label: '取货',
        description: `骑手取货时间: ${formatTimestamp(order.qu_time)}`
      });
    }

    if (order.songda_time && order.songda_time !== 0) {
      timelineItems.push({
        time: order.songda_time,
        label: '送达',
        description: `订单送达时间: ${formatTimestamp(order.songda_time)}`
      });
    }

    if (order.complete_time && order.complete_time !== 0) {
      timelineItems.push({
        time: order.complete_time,
        label: '完成',
        description: `订单完成时间: ${formatTimestamp(order.complete_time)}`
      });
    }

    // 按时间排序
    timelineItems.sort((a, b) => a.time - b.time);

    return (
      <Timeline mode="left">
        {timelineItems.map((item, index) => (
          <Timeline.Item key={index} label={item.description}>
            {item.label}
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  return (
    <div className="order-detail">
      <Card title="订单详情查询" className="mb-4">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSubmit}
          className="mb-4"
        >
          <Form.Item
            name="orderId"
            label="订单号"
            rules={[{ required: true, message: '请输入订单号' }]}
          >
            <Input placeholder="请输入订单号" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
          </Form.Item>
        </Form>

        <Spin spinning={loading}>
          {error && <div className="error-message">{error}</div>}
          {order && (
            <div className="order-detail-content">
              <Card title="订单基本信息" className="mb-4">
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="订单ID">{order.id}</Descriptions.Item>
                  <Descriptions.Item label="订单编号">{order.ordersn}</Descriptions.Item>
                  <Descriptions.Item label="订单状态">{getOrderStatusTag(order.status)}</Descriptions.Item>
                  <Descriptions.Item label="订单类型">{getOrderTypeTag(order.order_type)}</Descriptions.Item>
                  <Descriptions.Item label="支付方式">{order.payment_method_description}</Descriptions.Item>
                  <Descriptions.Item label="下单时间">{formatTimestamp(order.add_time)}</Descriptions.Item>
                  <Descriptions.Item label="会员ID">{order.memberid}</Descriptions.Item>
                  <Descriptions.Item label="骑手ID">{order.qishouid}</Descriptions.Item>
                </Descriptions>
              </Card>

              <Row gutter={16} className="mb-4">
                <Col span={12}>
                  <Card title={<><DollarOutlined /> 价格信息</>}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic title="订单金额" value={order.price} suffix="元" />
                      </Col>
                      <Col span={12}>
                        <Statistic title="配送费" value={order.peisongfei} suffix="元" />
                      </Col>
                    </Row>
                    <Divider />
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic title="商品价格" value={order.goods_price} suffix="元" />
                      </Col>
                      <Col span={12}>
                        <Statistic title="骑手收益" value={order.qishou_shouyi} suffix="元" />
                      </Col>
                    </Row>
                    {order.tidian && order.tidian !== "0.00" && (
                      <>
                        <Divider />
                        <Row gutter={16}>
                          <Col span={12}>
                            <Statistic title="提点" value={order.tidian} suffix="元" />
                          </Col>
                        </Row>
                      </>
                    )}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title={<><ClockCircleOutlined /> 配送时长</>}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic 
                          title="实际配送时长" 
                          value={order.yong_shi ? (order.yong_shi / 60).toFixed(1) : (order.shiji_shichang / 60).toFixed(1)} 
                          suffix="分钟" 
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="预计配送时长" 
                          value={(order.set_shichang / 60).toFixed(1)} 
                          suffix="分钟" 
                        />
                      </Col>
                    </Row>
                    <Divider />
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic 
                          title="配送距离" 
                          value={(order.juli / 1000).toFixed(2)} 
                          suffix="公里" 
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="总耗时" 
                          value={calculateTimeDiff(order.complete_time, order.add_time)} 
                          suffix="分钟" 
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} className="mb-4">
                <Col span={12}>
                  <Card title={<><ShopOutlined /> 取货信息</>}>
                    <Descriptions bordered column={1}>
                      <Descriptions.Item label="取货地址">{order.qu_address || '-'} {order.qu_menpaihao || ''}</Descriptions.Item>
                      <Descriptions.Item label="联系人">{order.qu_name || '-'}</Descriptions.Item>
                      <Descriptions.Item label="联系电话">{order.qu_mobile || '-'}</Descriptions.Item>
                      <Descriptions.Item label="取货时间">{formatTimestamp(order.qu_time)}</Descriptions.Item>
                      <Descriptions.Item label="接单到取货耗时">{calculateTimeDiff(order.qu_time, order.jiedan_time)} 分钟</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title={<><HomeOutlined /> 收货信息</>}>
                    <Descriptions bordered column={1}>
                      <Descriptions.Item label="收货地址">{order.shou_address || '-'} {order.shou_menpaihao || ''}</Descriptions.Item>
                      <Descriptions.Item label="联系人">{order.shou_name || '-'}</Descriptions.Item>
                      <Descriptions.Item label="联系电话">{order.shou_mobile || '-'}</Descriptions.Item>
                      <Descriptions.Item label="送达时间">{formatTimestamp(order.songda_time)}</Descriptions.Item>
                      <Descriptions.Item label="取货到送达耗时">{calculateTimeDiff(order.songda_time, order.qu_time)} 分钟</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} className="mb-4">
                <Col span={12}>
                  <Card title={<><CarOutlined /> 骑手信息</>}>
                    <Descriptions bordered column={1}>
                      <Descriptions.Item label="骑手ID">{order.qishouid || '-'}</Descriptions.Item>
                      <Descriptions.Item label="骑手姓名">{order.qishou_name || order.card_name || '-'}</Descriptions.Item>
                      <Descriptions.Item label="骑手电话">{order.qishou_mobile || order.member_mobile || '-'}</Descriptions.Item>
                      <Descriptions.Item label="接单时间">{formatTimestamp(order.jiedan_time)}</Descriptions.Item>
                      <Descriptions.Item label="等待接单耗时">{calculateTimeDiff(order.jiedan_time, order.add_time)} 分钟</Descriptions.Item>
                      <Descriptions.Item label="骑手备注">{order.qishou_beizhu || '-'}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title={<><UserOutlined /> 会员信息</>}>
                    <Descriptions bordered column={1}>
                      <Descriptions.Item label="会员ID">{order.memberid || '-'}</Descriptions.Item>
                      <Descriptions.Item label="会员姓名">{order.realname || '-'}</Descriptions.Item>
                      <Descriptions.Item label="会员电话">{order.mobile || '-'}</Descriptions.Item>
                      <Descriptions.Item label="会员昵称">{order.nickname || '-'}</Descriptions.Item>
                      <Descriptions.Item label="完成时间">{formatTimestamp(order.complete_time)}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>

              <Card title="订单备注" className="mb-4">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="订单留言">{order.message || '-'}</Descriptions.Item>
                  <Descriptions.Item label="商品名称">{order.goods_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="商品重量">{order.goods_weight || '0'} kg</Descriptions.Item>
                  <Descriptions.Item label="是否预订单">{order.is_yuding === 1 ? '是' : '否'}</Descriptions.Item>
                  <Descriptions.Item label="是否远单">{order.is_yuan === 1 ? '是' : '否'}</Descriptions.Item>
                </Descriptions>
              </Card>

              {order.message_img && (
                <Card title="订单图片" className="mb-4">
                  <div className="order-images">
                    {JSON.parse(order.message_img.replace(/\\/g, '')).map((img, index) => (
                      <Image 
                        key={index}
                        width={200}
                        src={img}
                        alt={`订单图片${index + 1}`}
                        style={{ marginRight: '10px', marginBottom: '10px' }}
                      />
                    ))}
                  </div>
                </Card>
              )}

              <Card title="订单时间线">
                {renderTimeline(order)}
              </Card>
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default OrderDetail; 