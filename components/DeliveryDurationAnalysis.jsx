import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, DatePicker, Select, Button, Spin, Statistic, Table, message } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDeliveryDurationAnalysis } from '../api/orderAnalysis';
import { ORDER_TYPE_OPTIONS } from '../api/config';
import { dateToTimestamp, getDefaultTimeRange } from '../utils/dateUtils';

const { RangePicker } = DatePicker;
const { Option } = Select;

const DeliveryDurationAnalysis = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [durationRanges, setDurationRanges] = useState([]);
  
  // 初始化时加载数据
  useEffect(() => {
    const defaultRange = getDefaultTimeRange();
    form.setFieldsValue({
      dateRange: [
        new Date(defaultRange.start_time * 1000),
        new Date(defaultRange.end_time * 1000)
      ],
      orderType: undefined,
      courierId: undefined
    });
    
    fetchData(defaultRange);
  }, [form]);
  
  // 获取数据
  const fetchData = async (params) => {
    setLoading(true);
    try {
      console.log('请求参数:', params);
      const data = await getDeliveryDurationAnalysis(params);
      console.log('API响应数据:', data);
      setStatistics(data.statistics);
      setDurationRanges(data.duration_ranges);
      message.success('数据加载成功');
    } catch (error) {
      console.error('获取订单配送时长分析数据失败:', error);
      
      // 增强错误处理，特别是CORS错误
      if (error.message && error.message.includes('Network Error')) {
        message.error('网络错误，可能是CORS问题，请检查API服务器的CORS配置');
      } else {
        message.error('获取配送时长分析数据失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 表单提交
  const handleSubmit = (values) => {
    const { dateRange, orderType, courierId } = values;
    
    const params = {
      start_time: dateToTimestamp(dateRange[0]),
      end_time: dateToTimestamp(dateRange[1]),
      ...(orderType && { order_type: orderType }),
      ...(courierId && { courier_id: courierId })
    };
    
    fetchData(params);
  };
  
  // 图表数据处理
  const chartData = durationRanges.map(item => ({
    name: item.duration_range,
    订单数量: item.order_count
  }));
  
  // 表格列定义
  const columns = [
    {
      title: '配送时长范围',
      dataIndex: 'duration_range',
      key: 'duration_range',
    },
    {
      title: '订单数量',
      dataIndex: 'order_count',
      key: 'order_count',
      sorter: (a, b) => a.order_count - b.order_count,
    },
    {
      title: '占比',
      key: 'percentage',
      render: (_, record) => {
        const total = statistics?.total_orders || 0;
        return total > 0 ? `${((record.order_count / total) * 100).toFixed(2)}%` : '0%';
      },
    },
  ];
  
  return (
    <div className="delivery-duration-analysis">
      <Card title="订单配送时长分析" className="mb-4">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSubmit}
          className="mb-4"
        >
          <Form.Item
            name="dateRange"
            label="时间范围"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <RangePicker showTime />
          </Form.Item>
          
          <Form.Item name="orderType" label="订单类型">
            <Select style={{ width: 120 }} allowClear placeholder="全部类型">
              {ORDER_TYPE_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="courierId" label="骑手ID">
            <Select
              style={{ width: 150 }}
              allowClear
              showSearch
              placeholder="请输入骑手ID"
              optionFilterProp="children"
            />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
          </Form.Item>
        </Form>
        
        <Spin spinning={loading}>
          {statistics ? (
            <>
              <Row gutter={16} className="mb-4">
                <Col span={6}>
                  <Statistic
                    title="总订单数"
                    value={statistics.total_orders}
                    suffix="单"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="平均配送时长"
                    value={parseFloat(statistics.avg_duration_minutes).toFixed(1)}
                    suffix="分钟"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="最短配送时长"
                    value={parseFloat(statistics.min_duration_minutes).toFixed(1)}
                    suffix="分钟"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="最长配送时长"
                    value={parseFloat(statistics.max_duration_minutes).toFixed(1)}
                    suffix="分钟"
                  />
                </Col>
              </Row>
              
              <Row gutter={16} className="mb-4">
                <Col span={6}>
                  <Statistic
                    title="预计平均配送时长"
                    value={parseFloat(statistics.avg_expected_duration_minutes || 0).toFixed(1)}
                    suffix="分钟"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="平均时长差异"
                    value={parseFloat(statistics.avg_duration_diff_minutes || 0).toFixed(1)}
                    suffix="分钟"
                    valueStyle={{ 
                      color: (statistics.avg_duration_diff_minutes || 0) < 0 ? '#3f8600' : '#cf1322'
                    }}
                  />
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <h3>配送时长分布</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="订单数量" fill="#1890ff" />
                    </BarChart>
                  </ResponsiveContainer>
                </Col>
                <Col span={12}>
                  <h3>配送时长详情</h3>
                  <Table
                    columns={columns}
                    dataSource={durationRanges}
                    rowKey="duration_range"
                    pagination={false}
                    size="small"
                  />
                </Col>
              </Row>
            </>
          ) : (
            <div className="empty-data">
              <p>暂无数据，请选择时间范围查询</p>
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default DeliveryDurationAnalysis; 