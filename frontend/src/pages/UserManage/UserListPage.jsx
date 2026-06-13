import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Input, Button, message, Popconfirm } from 'antd';
import { getUsers, updateUserStatus } from '../../api/user';
import useAuthStore from '../../store/useAuthStore';

export default function UserListPage() {
  const [data, setData] = useState({ list: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 });
  const admin = useAuthStore((s) => s.admin);
  const isSuperAdmin = admin?.role === 'super_admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers(filters);
      setData(res?.data || { list: [], total: 0, page: 1, pageSize: 20 });
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await updateUserStatus(id, newStatus);
      message.success('用户状态已更新');
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name', width: 100, render: v => v || '-' },
    { title: '押金', dataIndex: 'deposit', key: 'deposit', width: 90, render: v => `¥${Number(v).toFixed(2)}` },
    { title: '余额', dataIndex: 'balance', key: 'balance', width: 90, render: v => `¥${Number(v).toFixed(2)}` },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => <Tag color={v === 1 ? 'green' : 'red'}>{v === 1 ? '正常' : '冻结'}</Tag>,
    },
    {
      title: '注册时间', dataIndex: 'registered_at', key: 'registered_at', width: 160,
      render: v => new Date(v).toLocaleString(),
    },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_, record) => (
        isSuperAdmin ? (
          <Popconfirm
            title={`确定${record.status === 1 ? '冻结' : '解冻'}此用户?`}
            onConfirm={() => handleToggleStatus(record.id, record.status)}
          >
            <Button size="small" danger={record.status === 1} type={record.status === 1 ? 'default' : 'primary'}>
              {record.status === 1 ? '冻结' : '解冻'}
            </Button>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  return (
    <div>
      <Input.Search
        placeholder="搜索手机号或姓名" style={{ width: 240, marginBottom: 16 }}
        onSearch={(val) => setFilters({ ...filters, keyword: val, page: 1 })}
      />
      <Table
        rowKey="id" columns={columns} dataSource={data.list} loading={loading}
        size="middle"
        pagination={{
          current: data.page || 1, pageSize: data.pageSize || 20, total: data.total || 0,
          showSizeChanger: true, showTotal: (t) => `共 ${t} 个用户`,
          onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize }),
        }}
        scroll={{ x: 900 }}
      />
    </div>
  );
}
