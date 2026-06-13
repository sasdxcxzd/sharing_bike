import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, InputNumber, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getBikes, createBike, updateBike, deleteBike, updateBikeStatus } from '../../api/bike';
import { BIKE_STATUS } from '../../utils/constants';
import useAuthStore from '../../store/useAuthStore';

export default function BikeListPage() {
  const [data, setData] = useState({ list: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 });
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const admin = useAuthStore((s) => s.admin);

  const isSuperAdmin = admin?.role === 'super_admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBikes(filters);
      setData(res?.data || { list: [], total: 0, page: 1, pageSize: 20 });
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = () => {
    setEditingBike(null);
    form.resetFields();
    form.setFieldsValue({ status: 'deployed' });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingBike(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteBike(id);
      message.success('单车已删除');
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateBikeStatus(id, status);
      message.success('状态已更新');
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingBike) {
        await updateBike(editingBike.id, values);
        message.success('单车信息已更新');
      } else {
        await createBike(values);
        message.success('单车已创建');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const columns = [
    { title: '车辆编号', dataIndex: 'bike_no', key: 'bike_no', width: 120 },
    { title: '纬度', dataIndex: 'latitude', key: 'latitude', width: 100, render: v => Number(v).toFixed(4) },
    { title: '经度', dataIndex: 'longitude', key: 'longitude', width: 100, render: v => Number(v).toFixed(4) },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status, record) => (
        <Select
          size="small" value={status} style={{ width: 100 }}
          onChange={(val) => handleStatusChange(record.id, val)}
        >
          {Object.entries(BIKE_STATUS).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
      ),
    },
    { title: '电量', dataIndex: 'battery_level', key: 'battery_level', width: 80, render: v => `${v}%` },
    { title: '骑行次数', dataIndex: 'total_rides', key: 'total_rides', width: 90 },
    {
      title: '操作', key: 'actions', width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" icon={<EnvironmentOutlined />} onClick={() => navigate(`/bikes/${record.id}`)}>详情</Button>
          {isSuperAdmin && (
            <Popconfirm title="确定删除此单车?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增单车</Button>
        <Button onClick={() => navigate('/bikes/map')} icon={<EnvironmentOutlined />}>地图视图</Button>
        <Select
          allowClear placeholder="状态筛选" style={{ width: 120 }}
          value={filters.status} onChange={(val) => setFilters({ ...filters, status: val, page: 1 })}
        >
          {Object.entries(BIKE_STATUS).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
        <Input.Search
          placeholder="搜索车辆编号" style={{ width: 200 }}
          onSearch={(val) => setFilters({ ...filters, keyword: val, page: 1 })}
        />
      </Space>

      <Table
        rowKey="id" columns={columns} dataSource={data.list} loading={loading}
        size="middle"
        pagination={{
          current: data.page || 1, pageSize: data.pageSize || 20, total: data.total || 0,
          showSizeChanger: true, showTotal: (t) => `共 ${t} 辆`,
          onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize }),
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingBike ? '编辑单车' : '新增单车'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="bikeNo" label="车辆编号" rules={[{ required: true, message: '请输入车辆编号' }]}>
            <Input placeholder="如 B20240001" />
          </Form.Item>
          <Form.Item name="latitude" label="纬度" rules={[{ required: true, message: '请输入纬度' }]}>
            <InputNumber style={{ width: '100%' }} min={-90} max={90} step={0.000001} placeholder="如 39.915" />
          </Form.Item>
          <Form.Item name="longitude" label="经度" rules={[{ required: true, message: '请输入经度' }]}>
            <InputNumber style={{ width: '100%' }} min={-180} max={180} step={0.000001} placeholder="如 116.404" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              {Object.entries(BIKE_STATUS).map(([k, v]) => (
                <Select.Option key={k} value={k}>{v.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="zoneId" label="所属区域ID">
            <InputNumber style={{ width: '100%' }} min={1} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
