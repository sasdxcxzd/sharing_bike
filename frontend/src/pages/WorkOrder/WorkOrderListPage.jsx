import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Tag, Select, Button, Modal, Form, Input, message, Space, Popconfirm,
  Dropdown, Card, Row, Col, Statistic, Tooltip, Badge, Typography,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, ToolOutlined,
  UserSwitchOutlined, CheckCircleOutlined, PlayCircleOutlined,
  EyeOutlined, DownOutlined, FilterOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getWorkOrders, createWorkOrder, assignWorkOrder, updateWorkOrderStatus } from '../../api/workOrder';
import { getOperators } from '../../api/auth';
import { WORK_ORDER_STATUS, FAULT_TYPES, FAULT_TYPE_LABELS } from '../../utils/constants';
import useAuthStore from '../../store/useAuthStore';

const { Text } = Typography;

export default function WorkOrderListPage() {
  const [data, setData] = useState({ list: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [operators, setOperators] = useState([]);
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 });
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const navigate = useNavigate();
  const admin = useAuthStore((s) => s.admin);
  const isSuperAdmin = admin?.role === 'super_admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Operators only see their own work orders
      const queryFilters = { ...filters };
      if (!isSuperAdmin && admin?.id) {
        queryFilters.assigneeId = admin.id;
      }
      const res = await getWorkOrders(queryFilters);
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      message.error(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [filters, isSuperAdmin, admin?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createWorkOrder(values);
      message.success('工单创建成功');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleAssign = async () => {
    try {
      const values = await assignForm.validateFields();
      await assignWorkOrder(selectedWO.id, values.assigneeId);
      message.success('指派成功');
      setAssignModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateWorkOrderStatus(id, newStatus);
      message.success('状态已更新');
      fetchData();
    } catch (err) {
      message.error(err.message || '操作失败');
    }
  };

  const openAssignModal = async (record) => {
    setSelectedWO(record);
    assignForm.resetFields();
    try {
      const res = await getOperators();
      setOperators(res?.data || []);
    } catch { setOperators([]); }
    setAssignModalOpen(true);
  };

  // Status badge counts for summary cards
  const pendingCount = data.list?.filter(w => w.status === 'pending').length || 0;
  const activeCount = data.list?.filter(w => w.status === 'in_progress' || w.status === 'assigned').length || 0;
  const completedCount = data.list?.filter(w => w.status === 'completed').length || 0;

  const severityColors = { critical: 'error', major: 'warning', minor: 'processing' };
  const severityLabels = { critical: '紧急', major: '严重', minor: '轻微' };

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no', width: 155, ellipsis: true,
      render: (v, r) => <a onClick={() => navigate(`/work-orders/${r.id}`)} style={{ whiteSpace: 'nowrap' }}>{v}</a> },
    { title: '单车', dataIndex: 'bike_no', key: 'bike_no', width: 105, ellipsis: true,
      render: v => <span style={{ whiteSpace: 'nowrap' }}>{v || '-'}</span> },
    { title: '故障类型', dataIndex: 'fault_type', key: 'fault_type', width: 110,
      render: v => <Tag style={{ whiteSpace: 'nowrap' }}>{FAULT_TYPE_LABELS[v] || v}</Tag> },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, width: 150 },
    { title: '严重度', dataIndex: 'severity', key: 'severity', width: 75, align: 'center',
      render: v => <Badge status={severityColors[v] || 'default'} text={severityLabels[v] || v} /> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 85, align: 'center',
      render: (v) => <Tag color={WORK_ORDER_STATUS[v]?.color} style={{ whiteSpace: 'nowrap' }}>{WORK_ORDER_STATUS[v]?.label}</Tag> },
    { title: '维修员', dataIndex: 'assignee_name', key: 'assignee', width: 95, ellipsis: true,
      render: v => <span style={{ whiteSpace: 'nowrap' }}>{v || '未指派'}</span> },
    { title: '创建人', dataIndex: 'reporter_name', key: 'reporter', width: 95, ellipsis: true,
      render: v => <span style={{ whiteSpace: 'nowrap' }}>{v || '-'}</span> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 145, ellipsis: true,
      render: v => <span style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{new Date(v).toLocaleString()}</span> },
    { title: '操作', key: 'actions', width: 200,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="详情">
            <Button size="small" type="link" icon={<EyeOutlined />}
              onClick={() => navigate(`/work-orders/${record.id}`)} />
          </Tooltip>
          {isSuperAdmin && record.status === 'pending' && (
            <Button size="small" type="primary" ghost icon={<UserSwitchOutlined />}
              onClick={() => openAssignModal(record)}>指派</Button>
          )}
          {(record.status === 'pending' || record.status === 'assigned') && (
            <Popconfirm title="确认开始？" onConfirm={() => handleStatusChange(record.id, 'in_progress')}>
              <Button size="small" type="primary" ghost icon={<PlayCircleOutlined />}>开始</Button>
            </Popconfirm>
          )}
          {record.status === 'in_progress' && (
            <Popconfirm title="确认完成？" onConfirm={() => handleStatusChange(record.id, 'completed')}>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>完成</Button>
            </Popconfirm>
          )}
          {isSuperAdmin && record.status === 'pending' && (
            <Popconfirm title="取消工单？" onConfirm={() => handleStatusChange(record.id, 'cancelled')}>
              <Button size="small" danger icon={<ExclamationCircleOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const actionDropdownItems = [
    { key: 'create', icon: <PlusOutlined />, label: '手动创建工单', onClick: handleCreate },
  ];

  return (
    <div>
      {/* Summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Card size="small" hoverable>
            <Statistic title="待处理工单" value={pendingCount}
              prefix={<ToolOutlined />}
              valueStyle={{ color: pendingCount > 0 ? '#fa8c16' : undefined }} />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card size="small" hoverable>
            <Statistic title="处理中" value={activeCount}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: activeCount > 0 ? '#1677ff' : undefined }} />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card size="small" hoverable>
            <Statistic title="已完成" value={completedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card size="small" hoverable>
            <Statistic title="总工单" value={data.total || 0}
              prefix={<FilterOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Toolbar */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Dropdown menu={{ items: actionDropdownItems }}>
          <Button type="primary" icon={<PlusOutlined />}>
            操作 <DownOutlined />
          </Button>
        </Dropdown>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
        <Select
          allowClear placeholder="状态筛选" style={{ width: 130 }}
          value={filters.status}
          onChange={(val) => setFilters({ ...filters, status: val, page: 1 })}
        >
          {Object.entries(WORK_ORDER_STATUS).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
        <Select
          allowClear placeholder="严重度" style={{ width: 120 }}
          value={filters.severity}
          onChange={(val) => setFilters({ ...filters, severity: val, page: 1 })}
        >
          <Select.Option value="minor">轻微</Select.Option>
          <Select.Option value="major">严重</Select.Option>
          <Select.Option value="critical">紧急</Select.Option>
        </Select>
        {isSuperAdmin && (
          <Tag color="gold">🔑 超级管理员 — 可管理所有工单</Tag>
        )}
        {!isSuperAdmin && (
          <Tag color="blue">🔧 运维人员 — 显示我的工单</Tag>
        )}
      </Space>

      <Table
        rowKey="id" columns={columns} dataSource={data.list || []} loading={loading}
        pagination={{
          current: data.page || 1,
          pageSize: data.pageSize || 20,
          total: data.total || 0,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条工单`,
          onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize }),
        }}
        scroll={{ x: 1220 }}
        size="middle"
      />

      {/* Create work order modal */}
      <Modal
        title="创建运维工单"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="bikeId" label="关联单车ID" extra={'可选，填写后将自动把单车状态改为「维修中」'}>
            <Input placeholder="输入单车数字ID" type="number" />
          </Form.Item>
          <Form.Item name="faultType" label="故障类型" rules={[{ required: true, message: '请选择故障类型' }]}>
            <Select placeholder="选择故障类型">
              {FAULT_TYPES.map(t => (
                <Select.Option key={t} value={t}>{FAULT_TYPE_LABELS[t]}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="故障描述">
            <Input.TextArea rows={3} placeholder="请描述故障现象..." />
          </Form.Item>
          <Form.Item name="severity" label="严重程度" initialValue="minor">
            <Select>
              <Select.Option value="minor">轻微</Select.Option>
              <Select.Option value="major">严重</Select.Option>
              <Select.Option value="critical">紧急</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign modal — super admin only */}
      <Modal
        title="指派维修人员"
        open={assignModalOpen}
        onOk={handleAssign}
        onCancel={() => setAssignModalOpen(false)}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item name="assigneeId" label="选择维修人员" rules={[{ required: true, message: '请选择维修人员' }]}>
            <Select placeholder="选择维修人员">
              {operators.map(op => (
                <Select.Option key={op.id} value={op.id}>
                  {op.real_name} ({op.username} — {op.phone || '无手机'})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
