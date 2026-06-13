import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Button, Spin, message, Space, Popconfirm, Timeline, Row, Col, Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined, PlayCircleOutlined, CheckCircleOutlined,
  UserSwitchOutlined, ExclamationCircleOutlined, ClockCircleOutlined,
  EnvironmentOutlined, SyncOutlined,
} from '@ant-design/icons';
import { getWorkOrderById, assignWorkOrder, updateWorkOrderStatus } from '../../api/workOrder';
import { getOperators } from '../../api/auth';
import { WORK_ORDER_STATUS, FAULT_TYPE_LABELS } from '../../utils/constants';
import useAuthStore from '../../store/useAuthStore';

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const admin = useAuthStore((s) => s.admin);
  const isSuperAdmin = admin?.role === 'super_admin';

  const fetchDetail = useCallback(async () => {
    try {
      const res = await getWorkOrderById(id);
      setWO(res.data);
    } catch (err) {
      message.error(err.message || '工单不存在');
      navigate('/work-orders');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      await updateWorkOrderStatus(id, newStatus);
      message.success('状态已更新');
      fetchDetail();
    } catch (err) {
      message.error(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickAssign = async () => {
    setActionLoading(true);
    try {
      // Assign to self if operator, otherwise show operator list
      if (!isSuperAdmin) {
        await assignWorkOrder(id, admin.id);
        message.success('已认领工单');
        fetchDetail();
      } else {
        // Super admin: pick first available operator
        const res = await getOperators();
        const ops = res?.data || [];
        if (ops.length === 0) {
          message.warning('没有可用的运维人员');
          return;
        }
        // Auto-assign to the first operator for quick action
        await assignWorkOrder(id, ops[0].id);
        message.success(`已指派给 ${ops[0].real_name}`);
        fetchDetail();
      }
    } catch (err) {
      message.error(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!wo) return null;

  const severityConfig = {
    critical: { color: 'red', label: '紧急', icon: <ExclamationCircleOutlined /> },
    major: { color: 'orange', label: '严重', icon: <ExclamationCircleOutlined /> },
    minor: { color: 'blue', label: '轻微', icon: <ExclamationCircleOutlined /> },
  };

  const canStart = wo.status === 'pending' || wo.status === 'assigned';
  const canComplete = wo.status === 'in_progress';
  const canCancel = isSuperAdmin && (wo.status === 'pending' || wo.status === 'assigned');

  // Build timeline items from work order status history
  const timelineItems = [
    { color: 'gray', children: <><strong>工单创建</strong><br/>{new Date(wo.created_at).toLocaleString()}<br/>创建人: {wo.reporter_name || '系统'}</> },
  ];
  if (wo.assignee_name) {
    timelineItems.push({ color: 'blue', children: <><strong>已指派</strong><br/>维修人员: {wo.assignee_name}</> });
  }
  if (wo.status === 'in_progress' || wo.status === 'completed') {
    timelineItems.push({ color: 'orange', children: <><strong>处理中</strong></> });
  }
  if (wo.status === 'completed' && wo.completed_at) {
    timelineItems.push({ color: 'green', children: <><strong>已完成</strong><br/>{new Date(wo.completed_at).toLocaleString()}<br/>备注: {wo.notes || '无'}</> });
  } else if (wo.status === 'cancelled') {
    timelineItems.push({ color: 'red', children: <><strong>已取消</strong></> });
  }

  const statusColor = WORK_ORDER_STATUS[wo.status]?.color || 'default';

  return (
    <div>
      {/* Header */}
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/work-orders')}>返回列表</Button>
        <Tag color={statusColor} style={{ fontSize: 14, padding: '4px 12px' }}>
          {WORK_ORDER_STATUS[wo.status]?.label}
        </Tag>
      </Space>

      <Row gutter={[16, 16]}>
        {/* Main info */}
        <Col xs={24} lg={16}>
          <Card
            title={<Space>🚲 工单详情 — {wo.order_no}</Space>}
            extra={
              <Space>
                {canStart && (
                  <Popconfirm title="确认开始处理？" onConfirm={() => handleStatusChange('in_progress')}>
                    <Button type="primary" icon={<PlayCircleOutlined />} loading={actionLoading}>开始处理</Button>
                  </Popconfirm>
                )}
                {canComplete && (
                  <Popconfirm
                    title="确认工单已完成？完成后单车将恢复为可用状态"
                    onConfirm={() => handleStatusChange('completed')}
                  >
                    <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }}
                      icon={<CheckCircleOutlined />} loading={actionLoading}>标记完成</Button>
                  </Popconfirm>
                )}
                {canCancel && (
                  <Popconfirm title="确认取消此工单？" onConfirm={() => handleStatusChange('cancelled')}>
                    <Button danger icon={<ExclamationCircleOutlined />} loading={actionLoading}>取消工单</Button>
                  </Popconfirm>
                )}
              </Space>
            }
          >
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="工单号" span={2}>
                <strong>{wo.order_no}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="故障类型">
                <Tag>{FAULT_TYPE_LABELS[wo.fault_type] || wo.fault_type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag color={severityConfig[wo.severity]?.color}>
                  {severityConfig[wo.severity]?.icon} {severityConfig[wo.severity]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联单车">{wo.bike_no || '未关联'}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={WORK_ORDER_STATUS[wo.status]?.color}>
                  {WORK_ORDER_STATUS[wo.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="故障描述" span={2}>
                {wo.description || '无描述'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{wo.reporter_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="维修人员">
                {wo.assignee_name ? (
                  <Tag icon={<UserSwitchOutlined />}>{wo.assignee_name}</Tag>
                ) : (
                  <Space>
                    <Tag color="default">未指派</Tag>
                    <Button size="small" type="link" icon={<UserSwitchOutlined />}
                      onClick={handleQuickAssign} loading={actionLoading}>
                      {isSuperAdmin ? '快速指派' : '认领工单'}
                    </Button>
                  </Space>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                <ClockCircleOutlined /> {new Date(wo.created_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                <SyncOutlined spin={wo.status === 'in_progress'} /> {new Date(wo.updated_at).toLocaleString()}
              </Descriptions.Item>
              {wo.completed_at && (
                <Descriptions.Item label="完成时间">
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> {new Date(wo.completed_at).toLocaleString()}
                </Descriptions.Item>
              )}
              {wo.notes && (
                <Descriptions.Item label="维修备注" span={2}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{wo.notes}</div>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Side panel: timeline + bike location */}
        <Col xs={24} lg={8}>
          {/* Progress timeline */}
          <Card title="📋 处理进度" size="small" style={{ marginBottom: 16 }}>
            <Timeline items={timelineItems} />
          </Card>

          {/* Quick actions card */}
          <Card title="⚡ 快捷操作" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {canStart && (
                <Button block icon={<PlayCircleOutlined />} type="primary" ghost
                  onClick={() => handleStatusChange('in_progress')} loading={actionLoading}>
                  开始处理工单
                </Button>
              )}
              {canComplete && (
                <Button block icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a', borderColor: '#52c41a' }}
                  onClick={() => handleStatusChange('completed')} loading={actionLoading}>
                  标记为已完成
                </Button>
              )}
              {wo.status === 'pending' && !wo.assignee_name && (
                <Button block icon={<UserSwitchOutlined />}
                  onClick={handleQuickAssign} loading={actionLoading}>
                  {isSuperAdmin ? '快速指派运维人员' : '认领此工单'}
                </Button>
              )}
            </Space>
          </Card>

          {/* Bike location info */}
          {wo.bike_no && wo.latitude && wo.longitude && (
            <Card title={<><EnvironmentOutlined /> 单车位置</>} size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="车辆编号">🔢 {wo.bike_no}</Descriptions.Item>
                <Descriptions.Item label="纬度">📍 {Number(wo.latitude).toFixed(6)}</Descriptions.Item>
                <Descriptions.Item label="经度">📍 {Number(wo.longitude).toFixed(6)}</Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
