import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, message, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { getNotifications, sendNotification } from '../../api/notification';
import { getUsers } from '../../api/user';
import { NOTIFICATION_TYPES } from '../../utils/constants';
import useAuthStore from '../../store/useAuthStore';

export default function NotificationPage() {
  const [data, setData] = useState({ list: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 });
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();
  const admin = useAuthStore((s) => s.admin);
  const isSuperAdmin = admin?.role === 'super_admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications(filters);
      setData(res?.data || { list: [], total: 0, page: 1, pageSize: 20 });
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      await sendNotification(values);
      message.success('通知发送成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  /** Load users for the target-user dropdown with search */
  const handleOpenModal = async () => {
    setModalOpen(true);
    try {
      const res = await getUsers({ page: 1, pageSize: 200 });
      setUsers(res?.data?.list || []);
    } catch {
      setUsers([]);
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', width: 180 },
    {
      title: '接收用户', dataIndex: 'target_name', key: 'target', width: 110,
      render: (v, r) => v ? <span>{v}<br /><span style={{ fontSize: 11, color: '#999' }}>{r.target_phone}</span></span> : '-',
    },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 100,
      render: v => <Tag>{NOTIFICATION_TYPES[v] || v}</Tag>,
    },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '已读', dataIndex: 'is_read', key: 'is_read', width: 70,
      render: v => v ? <Tag color="success">已读</Tag> : <Tag color="default">未读</Tag>,
    },
    { title: '发送人', dataIndex: 'sender_name', key: 'sender', width: 100 },
    {
      title: '发送时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: v => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div>
      {isSuperAdmin && (
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            发送通知
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
        </Space>
      )}

      <Table
        rowKey="id" columns={columns} dataSource={data.list} loading={loading}
        size="middle"
        pagination={{
          current: data.page || 1, pageSize: data.pageSize || 20, total: data.total || 0,
          showSizeChanger: true, showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize }),
        }}
        scroll={{ x: 900 }}
      />

      <Modal
        title="发送通知"
        open={modalOpen}
        onOk={handleSend}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="targetUserId"
            label="目标用户"
            rules={[{ required: true, message: '请选择目标用户' }]}
            extra="搜索用户名或手机号定位用户"
          >
            <Select
              showSearch
              placeholder="搜索并选择目标用户..."
              filterOption={(input, option) => {
                const text = option.label?.toLowerCase() || '';
                return text.includes(input.toLowerCase());
              }}
              options={users.map(u => ({
                label: `[${u.id}] ${u.real_name || '未实名'} — ${u.phone}`,
                value: u.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="通知标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={4} placeholder="通知内容" />
          </Form.Item>
          <Form.Item name="type" label="类型" initialValue="system">
            <Select>
              {Object.entries(NOTIFICATION_TYPES).map(([k, v]) => (
                <Select.Option key={k} value={k}>{v}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
