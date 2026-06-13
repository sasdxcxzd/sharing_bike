import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Tag, Button, Modal, Form, Input, InputNumber, message, Popconfirm,
  Space, Card, Drawer, Descriptions, Tooltip, Switch, Row, Col, Statistic,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  EnvironmentOutlined, ReloadOutlined, CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { getZones, createZone, updateZone, deleteZone, getBikesInZone } from '../../api/zone';
import useAuthStore from '../../store/useAuthStore';

/** Generate a closed polygon around a center point */
function generatePolygon(centerLat, centerLng, size = 0.01) {
  const pts = [
    { lat: centerLat - size, lng: centerLng - size },
    { lat: centerLat + size, lng: centerLng - size },
    { lat: centerLat + size, lng: centerLng + size },
    { lat: centerLat - size, lng: centerLng + size },
    { lat: centerLat - size, lng: centerLng - size }, // Close ring
  ];
  return pts;
}

export default function ZoneListPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [zoneBikes, setZoneBikes] = useState([]);
  const [form] = Form.useForm();
  const admin = useAuthStore((s) => s.admin);
  const isSuperAdmin = admin?.role === 'super_admin';

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getZones();
      setZones(res?.data || []);
    } catch (err) {
      message.error(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const handleAdd = () => {
    setEditingZone(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingZone(record);
    form.setFieldsValue({
      name: record.name,
      city: record.city,
      district: record.district,
      maxBikes: record.max_bikes,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteZone(id);
      message.success('运营区域已删除');
      fetchZones();
    } catch (err) {
      message.error(err.message || '删除失败');
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      await updateZone(record.id, { status: record.status === 1 ? 0 : 1 });
      message.success(record.status === 1 ? '区域已禁用' : '区域已启用');
      fetchZones();
    } catch (err) {
      message.error(err.message || '操作失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const centerLat = 39.915;
      const centerLng = 116.404;
      // Generate a closed polygon (first=last point)
      const polygon = generatePolygon(centerLat, centerLng, 0.015);

      if (editingZone) {
        await updateZone(editingZone.id, values);
        message.success('运营区域已更新');
      } else {
        await createZone({ ...values, polygon });
        message.success('运营区域已创建');
      }
      setModalOpen(false);
      fetchZones();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleViewZone = async (record) => {
    setSelectedZone(record);
    setDrawerOpen(true);
    try {
      const res = await getBikesInZone(record.id);
      setZoneBikes(res?.data || []);
    } catch {
      setZoneBikes([]);
    }
  };

  const columns = [
    {
      title: '区域名称', dataIndex: 'name', key: 'name',
      render: (v, r) => (
        <Space>
          <EnvironmentOutlined style={{ color: r.status === 1 ? '#52c41a' : '#d9d9d9' }} />
          <strong>{v}</strong>
        </Space>
      ),
    },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '区县', dataIndex: 'district', key: 'district', render: v => v || '-' },
    {
      title: '覆盖半径', dataIndex: 'radius_m', key: 'radius_m',
      render: v => v ? `${v}m` : '-',
    },
    {
      title: '单车容量', dataIndex: 'max_bikes', key: 'max_bikes',
      render: (v) => <span>{v} 辆</span>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v, record) => (
        isSuperAdmin ? (
          <Switch
            checked={v === 1}
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<CloseCircleOutlined />}
            onChange={() => handleToggleStatus(record)}
          />
        ) : (
          <Tag color={v === 1 ? 'green' : 'red'}>{v === 1 ? '启用' : '禁用'}</Tag>
        )
      ),
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at',
      render: v => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: '操作', key: 'actions', width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button size="small" type="link" icon={<EyeOutlined />}
              onClick={() => handleViewZone(record)}>查看</Button>
          </Tooltip>
          {isSuperAdmin && (
            <>
              <Tooltip title="编辑">
                <Button size="small" type="link" icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}>编辑</Button>
              </Tooltip>
              <Popconfirm title="确定删除此区域?" onConfirm={() => handleDelete(record.id)}>
                <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const activeZones = zones.filter(z => z.status === 1).length;

  return (
    <div>
      {/* Stats row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Card size="small">
            <Statistic title="区域总数" value={zones.length} prefix={<EnvironmentOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card size="small">
            <Statistic title="已启用" value={activeZones} valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card size="small">
            <Statistic title="已禁用" value={zones.length - activeZones} valueStyle={{ color: '#d9d9d9' }}
              prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Toolbar */}
      <Space style={{ marginBottom: 16 }}>
        {isSuperAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增区域</Button>
        )}
        <Button icon={<ReloadOutlined />} onClick={fetchZones}>刷新</Button>
      </Space>

      <Table
        rowKey="id" columns={columns} dataSource={zones} loading={loading}
        size="middle"
        pagination={false}
        scroll={{ x: 900 }}
      />

      {/* Zone detail drawer */}
      <Drawer
        title={selectedZone ? `运营区域 - ${selectedZone.name}` : ''}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
      >
        {selectedZone && (
          <>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="名称">{selectedZone.name}</Descriptions.Item>
              <Descriptions.Item label="城市">{selectedZone.city}</Descriptions.Item>
              <Descriptions.Item label="区县">{selectedZone.district || '-'}</Descriptions.Item>
              <Descriptions.Item label="半径">{selectedZone.radius_m}m</Descriptions.Item>
              <Descriptions.Item label="最大容量">{selectedZone.max_bikes} 辆</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedZone.status === 1 ? 'green' : 'red'}>
                  {selectedZone.status === 1 ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Card title={`区域内单车 (${zoneBikes.length})`} size="small" style={{ marginBottom: 16 }}>
              {zoneBikes.slice(0, 10).map(b => (
                <Tag key={b.id} color={b.status === 'available' ? 'green' : 'blue'}>
                  {b.bike_no}
                </Tag>
              ))}
              {zoneBikes.length > 10 && <Tag>+{zoneBikes.length - 10} 更多</Tag>}
              {zoneBikes.length === 0 && <span style={{ color: '#999' }}>暂无单车</span>}
            </Card>

            <div style={{ height: 250, borderRadius: 8, overflow: 'hidden' }}>
              <MapContainer
                center={[Number(selectedZone.center_lat) || 39.915, Number(selectedZone.center_lng) || 116.404]}
                zoom={13}
                style={{ height: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </MapContainer>
            </div>
          </>
        )}
      </Drawer>

      {/* Create/Edit Modal */}
      <Modal
        title={editingZone ? '编辑运营区域' : '新增运营区域'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="区域名称" rules={[{ required: true, message: '请输入区域名称' }]}>
            <Input placeholder="如: 朝阳区核心区" />
          </Form.Item>
          <Form.Item name="city" label="城市" rules={[{ required: true, message: '请输入城市' }]}>
            <Input placeholder="如: 北京" />
          </Form.Item>
          <Form.Item name="district" label="区县">
            <Input placeholder="如: 朝阳区" />
          </Form.Item>
          <Form.Item name="maxBikes" label="最大单车数">
            <InputNumber style={{ width: '100%' }} min={1} max={10000} placeholder="500" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
