import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Select, Input, message, DatePicker, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../../api/order';
import { ORDER_STATUS } from '../../utils/constants';

const { RangePicker } = DatePicker;

export default function OrderListPage() {
  const [data, setData] = useState({ list: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 });
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders(filters);
      setData(res?.data || { list: [], total: 0, page: 1, pageSize: 20 });
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 155, ellipsis: true,
      render: (v, r) => <a onClick={() => navigate(`/orders/${r.id}`)} style={{ whiteSpace: 'nowrap' }}>{v}</a> },
    { title: '用户手机', dataIndex: 'user_phone', key: 'user_phone', width: 125, ellipsis: true,
      render: v => <span style={{ whiteSpace: 'nowrap' }}>{v}</span> },
    { title: '单车编号', dataIndex: 'bike_no', key: 'bike_no', width: 110, ellipsis: true,
      render: v => <span style={{ whiteSpace: 'nowrap' }}>{v || '-'}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => <Tag color={ORDER_STATUS[v]?.color} style={{ whiteSpace: 'nowrap' }}>{ORDER_STATUS[v]?.label}</Tag> },
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time', width: 150, ellipsis: true,
      render: v => <span style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{new Date(v).toLocaleString()}</span> },
    { title: '结束时间', dataIndex: 'end_time', key: 'end_time', width: 150, ellipsis: true,
      render: v => v ? <span style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{new Date(v).toLocaleString()}</span> : '-' },
    { title: '时长', dataIndex: 'duration_seconds', key: 'duration', width: 65, align: 'center',
      render: v => v ? <span style={{ whiteSpace: 'nowrap' }}>{Math.round(v / 60)}分</span> : '-' },
    { title: '费用', dataIndex: 'fee', key: 'fee', width: 72, align: 'right',
      render: v => <span style={{ whiteSpace: 'nowrap' }}>¥{Number(v).toFixed(2)}</span> },
    { title: '支付', dataIndex: 'payment_status', key: 'payment', width: 70, align: 'center',
      render: v => v ? <Tag color="success">已付</Tag> : <Tag color="default">未付</Tag> },
    { title: '操作', key: 'actions', width: 80, align: 'center',
      render: (_, record) => (
        <a onClick={() => navigate(`/orders/${record.id}`)} style={{ whiteSpace: 'nowrap' }}>详情</a>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear placeholder="状态筛选" style={{ width: 120 }}
          value={filters.status}
          onChange={(val) => setFilters({ ...filters, status: val, page: 1 })}
        >
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
        <Input.Search
          placeholder="搜索订单号" style={{ width: 200 }}
          onSearch={(val) => setFilters({ ...filters, keyword: val, page: 1 })}
        />
        <RangePicker
          onChange={(dates) => {
            if (dates) {
              setFilters({ ...filters, startDate: dates[0].format('YYYY-MM-DD'), endDate: dates[1].format('YYYY-MM-DD'), page: 1 });
            } else {
              const { startDate, endDate, ...rest } = filters;
              setFilters({ ...rest, page: 1 });
            }
          }}
        />
      </Space>

      <Table
        rowKey="id" columns={columns} dataSource={data.list} loading={loading}
        pagination={{
          current: data.page || 1, pageSize: data.pageSize || 20, total: data.total || 0,
          showSizeChanger: true, showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize }),
        }}
        size="middle"
        scroll={{ x: 1050 }}
      />
    </div>
  );
}
