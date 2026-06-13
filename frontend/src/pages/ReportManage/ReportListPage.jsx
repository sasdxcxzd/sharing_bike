import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Select, Button, Modal, Input, message, Space } from 'antd';
import { getReports, reviewReport } from '../../api/report';
import { REPORT_TYPES } from '../../utils/constants';

export default function ReportListPage() {
  const [data, setData] = useState({ list: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReports(filters);
      setData(res?.data || { list: [], total: 0, page: 1, pageSize: 20 });
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReview = async (status) => {
    try {
      await reviewReport(selectedReport.id, { status, reviewComment });
      message.success('审核完成');
      setReviewModalOpen(false);
      setReviewComment('');
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    { title: '举报标题', dataIndex: 'title', key: 'title' },
    { title: '用户', dataIndex: 'user_name', key: 'user', width: 100, render: v => v || '-' },
    { title: '用户手机', dataIndex: 'user_phone', key: 'phone', width: 130 },
    {
      title: '类型', dataIndex: 'report_type', key: 'type', width: 100,
      render: v => <Tag color={REPORT_TYPES[v]?.color}>{REPORT_TYPES[v]?.label}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: v => {
        const colors = { pending: 'default', reviewing: 'processing', resolved: 'success', rejected: 'error' };
        const labels = { pending: '待处理', reviewing: '审核中', resolved: '已解决', rejected: '已驳回' };
        return <Tag color={colors[v]}>{labels[v]}</Tag>;
      },
    },
    { title: '描述', dataIndex: 'description', key: 'desc', ellipsis: true },
    { title: '审核人', dataIndex: 'reviewer_name', key: 'reviewer', width: 100, render: v => v || '-' },
    {
      title: '提交时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: v => new Date(v).toLocaleString(),
    },
    {
      title: '操作', key: 'actions', width: 100,
      render: (_, record) => (
        record.status === 'pending' || record.status === 'reviewing' ? (
          <a onClick={() => { setSelectedReport(record); setReviewModalOpen(true); }}>审核</a>
        ) : <span>-</span>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear placeholder="类型筛选" style={{ width: 120 }}
          value={filters.reportType}
          onChange={(val) => setFilters({ ...filters, reportType: val, page: 1 })}
        >
          {Object.entries(REPORT_TYPES).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
        <Select
          allowClear placeholder="状态筛选" style={{ width: 120 }}
          value={filters.status}
          onChange={(val) => setFilters({ ...filters, status: val, page: 1 })}
        >
          <Select.Option value="pending">待处理</Select.Option>
          <Select.Option value="reviewing">审核中</Select.Option>
          <Select.Option value="resolved">已解决</Select.Option>
          <Select.Option value="rejected">已驳回</Select.Option>
        </Select>
      </Space>

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
        title="审核举报"
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={[
          <Button key="reject" danger onClick={() => handleReview('rejected')}>驳回</Button>,
          <Button key="resolve" type="primary" onClick={() => handleReview('resolved')}>通过</Button>,
        ]}
      >
        {selectedReport && (
          <div>
            <p><strong>标题:</strong> {selectedReport.title}</p>
            <p><strong>类型:</strong> {REPORT_TYPES[selectedReport.report_type]?.label}</p>
            <p><strong>描述:</strong> {selectedReport.description || '-'}</p>
            <p><strong>审核意见:</strong></p>
            <Input.TextArea
              rows={3} value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="请输入审核意见..."
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
