import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Spin, Table, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getBikeById, getBikeTrack } from '../../api/bike';
import { BIKE_STATUS } from '../../utils/constants';

export default function BikeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [track, setTrack] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [bikeRes, trackRes] = await Promise.all([
          getBikeById(id),
          getBikeTrack(id),
        ]);
        setBike(bikeRes.data);
        setTrack(trackRes.data || []);
      } catch (err) {
        message.error(err.message);
        navigate('/bikes');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!bike) return null;

  const trackColumns = [
    { title: '时间', dataIndex: 'recorded_at', key: 'time', render: v => new Date(v).toLocaleString() },
    { title: '纬度', dataIndex: 'latitude', key: 'lat', render: v => Number(v).toFixed(6) },
    { title: '经度', dataIndex: 'longitude', key: 'lng', render: v => Number(v).toFixed(6) },
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bikes')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Card title={`单车详情 - ${bike.bike_no}`} style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="车辆编号">{bike.bike_no}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={BIKE_STATUS[bike.status]?.color}>{BIKE_STATUS[bike.status]?.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="纬度">{Number(bike.latitude).toFixed(6)}</Descriptions.Item>
          <Descriptions.Item label="经度">{Number(bike.longitude).toFixed(6)}</Descriptions.Item>
          <Descriptions.Item label="电量">{bike.battery_level}%</Descriptions.Item>
          <Descriptions.Item label="锁状态">{bike.lock_status === 1 ? '已锁' : '未锁'}</Descriptions.Item>
          <Descriptions.Item label="总骑行次数">{bike.total_rides}</Descriptions.Item>
          <Descriptions.Item label="总里程(km)">{Number(bike.total_mileage).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="所属区域">{bike.zone_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="投放时间">{bike.deployed_at ? new Date(bike.deployed_at).toLocaleString() : '-'}</Descriptions.Item>
          <Descriptions.Item label="最后维护">{bike.last_maintenance_at ? new Date(bike.last_maintenance_at).toLocaleString() : '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(bike.created_at).toLocaleString()}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="位置轨迹">
        <Table
          rowKey="id" columns={trackColumns} dataSource={track}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
          size="small"
        />
      </Card>
    </div>
  );
}
