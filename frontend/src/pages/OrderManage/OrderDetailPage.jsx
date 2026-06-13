import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getOrderById } from '../../api/order';
import { ORDER_STATUS } from '../../utils/constants';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getOrderById(id);
        setOrder(res.data);
      } catch (err) {
        message.error(err.message);
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!order) return null;

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Card title={`订单详情 - ${order.order_no}`}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={ORDER_STATUS[order.status]?.color}>{ORDER_STATUS[order.status]?.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="用户">{order.user_name || order.user_phone}</Descriptions.Item>
          <Descriptions.Item label="单车">{order.bike_no}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{new Date(order.start_time).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{order.end_time ? new Date(order.end_time).toLocaleString() : '-'}</Descriptions.Item>
          <Descriptions.Item label="起始位置">{`${Number(order.start_lat).toFixed(4)}, ${Number(order.start_lng).toFixed(4)}`}</Descriptions.Item>
          <Descriptions.Item label="结束位置">{order.end_lat ? `${Number(order.end_lat).toFixed(4)}, ${Number(order.end_lng).toFixed(4)}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="骑行时长">{order.duration_seconds ? `${Math.round(order.duration_seconds / 60)} 分钟` : '-'}</Descriptions.Item>
          <Descriptions.Item label="费用">¥{Number(order.fee).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="支付状态">
            <Tag color={order.payment_status ? 'success' : 'default'}>{order.payment_status ? '已支付' : '未支付'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(order.created_at).toLocaleString()}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
