import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Spin, message, Table, Tag, Empty } from 'antd';
import {
  ShoppingCartOutlined, CarOutlined, DollarOutlined, WarningOutlined,
  RiseOutlined, TeamOutlined, ToolOutlined, CheckCircleOutlined,
  FireOutlined,
} from '@ant-design/icons';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, TitleComponent, LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import {
  getOverview, getRideTrend, getRevenueTrend,
  getStatusDistribution, getFaultTrend,
} from '../../api/dashboard';
import { getOrders } from '../../api/order';
import { getWorkOrders } from '../../api/workOrder';

echarts.use([
  LineChart, BarChart, PieChart, GridComponent, TooltipComponent,
  TitleComponent, LegendComponent, CanvasRenderer,
]);

const STATUS_COLORS = { available: '#52c41a', in_use: '#1677ff', repairing: '#fa8c16', scrapped: '#d9d9d9', deployed: '#13c2c2' };

const STAT_ITEMS = [
  { title: '今日骑行', key: 'todayRides', icon: <ShoppingCartOutlined />, color: '#1677ff', format: v => v ?? 0 },
  { title: '活跃/总单车', key: 'activeBikes', icon: <CarOutlined />, color: '#52c41a', format: (v, ov) => `${ov?.activeBikes || 0}/${ov?.totalBikes || 0}` },
  { title: '今日收入', key: 'todayRevenue', icon: <DollarOutlined />, color: '#fa8c16', format: v => `¥${Number(v || 0).toFixed(0)}` },
  { title: '故障率', key: 'faultRate', icon: <WarningOutlined />, color: (v, ov) => Number(ov?.faultRate) > 5 ? '#ff4d4f' : '#fa8c16', format: v => `${Number(v || 0).toFixed(1)}%` },
  { title: '进行中骑行', key: 'activeRidesNow', icon: <FireOutlined />, color: '#1677ff', format: v => v ?? 0 },
  { title: '已完成骑行', key: 'completedRides', icon: <CheckCircleOutlined />, color: '#52c41a', format: v => v ?? 0 },
  { title: '注册用户', key: 'totalUsers', icon: <TeamOutlined />, color: '#722ed1', format: v => v ?? '-' },
  { title: '待处理工单', key: 'pendingWorkOrders', icon: <ToolOutlined />, color: '#fa8c16', format: v => v ?? '-' },
  { title: '在线单车', key: 'onlineBikes', icon: <CarOutlined />, color: '#13c2c2', format: v => v ?? '-' },
  { title: '健康度', key: 'faultRate', icon: <RiseOutlined />, color: (v) => Number(v) > 5 ? '#ff4d4f' : '#52c41a', format: (v) => `${Math.max(0, 100 - (Number(v) || 0)).toFixed(0)}%` },
];

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [rideTrend, setRideTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [statusDist, setStatusDist] = useState([]);
  const [faultTrend, setFaultTrend] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentWorkOrders, setRecentWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [ov, rt, rev, sd, ft, ordersRes, woRes] = await Promise.all([
        getOverview(), getRideTrend(7), getRevenueTrend(7),
        getStatusDistribution(), getFaultTrend(30),
        getOrders({ page: 1, pageSize: 5 }),
        getWorkOrders({ page: 1, pageSize: 5 }),
      ]);
      setOverview(ov?.data || {});
      setRideTrend(rt?.data || []);
      setRevenueTrend(rev?.data || []);
      setStatusDist(sd?.data || []);
      setFaultTrend(ft?.data || []);
      setRecentOrders(ordersRes?.data?.list || []);
      setRecentWorkOrders(woRes?.data?.list || []);
    } catch (err) {
      message.error(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, 30000);
    return () => clearInterval(timerRef.current);
  }, [fetchAll]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const rideChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['骑行次数'] },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: rideTrend.map(r => r.date?.slice(5) || '') },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: '骑行次数', data: rideTrend.map(r => r.count || 0),
      type: 'line', smooth: true, areaStyle: { opacity: 0.15 },
      itemStyle: { color: '#1677ff' },
    }],
  };

  const revenueChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: revenueTrend.map(r => r.date?.slice(5) || '') },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [{
      data: revenueTrend.map(r => r.revenue || 0), type: 'bar',
      itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] },
    }],
  };

  const statusPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie', radius: ['45%', '75%'], center: ['40%', '50%'],
      data: statusDist.map(s => ({ name: s.name, value: s.value })),
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
    }],
  };

  const faultChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: faultTrend.filter((_, i) => i % 3 === 0).map(r => r.date?.slice(5) || '') },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      data: faultTrend.filter((_, i) => i % 3 === 0).map(r => r.count || 0),
      type: 'line', itemStyle: { color: '#fa8c16' },
      areaStyle: { opacity: 0.1 },
    }],
  };

  return (
    <div>
      {/* Stat Cards — 2 rows × 5 columns, responsive wrap */}
      <div className="dash-stat-grid" style={{ marginBottom: 24 }}>
        {STAT_ITEMS.map((item, i) => {
          const colorVal = typeof item.color === 'function' ? item.color(overview?.[item.key], overview) : item.color;
          const displayVal = item.format(overview?.[item.key], overview);
          return (
            <div key={i} className="dash-stat-col">
              <Card hoverable className="dash-card"
                style={{ textAlign: 'center', borderRadius: 8, borderTop: `3px solid ${colorVal}`, height: '100%' }}
                bodyStyle={{ padding: '14px 8px' }}>
                <div style={{ fontSize: 22, color: colorVal, marginBottom: 2 }}>{item.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{displayVal}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{item.title}</div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Charts - 2x2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="📈 近7天骑行趋势" bordered={false}>
            {rideTrend.length === 0
              ? <Empty description="暂无骑行数据" style={{ padding: 40 }} />
              : <ReactEChartsCore echarts={echarts} option={rideChartOption} notMerge lazyUpdate style={{ height: 320 }} />
            }
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="💰 近7天收入趋势" bordered={false}>
            {revenueTrend.length === 0
              ? <Empty description="暂无收入数据" style={{ padding: 40 }} />
              : <ReactEChartsCore echarts={echarts} option={revenueChartOption} notMerge lazyUpdate style={{ height: 320 }} />
            }
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="🚲 单车状态分布" bordered={false}>
            {statusDist.length === 0
              ? <Empty description="暂无单车数据" style={{ padding: 40 }} />
              : <ReactEChartsCore echarts={echarts} option={statusPieOption} notMerge lazyUpdate style={{ height: 320 }} />
            }
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="🔧 近30天故障趋势" bordered={false}>
            {faultTrend.length === 0
              ? <Empty description="暂无故障数据" style={{ padding: 40 }} />
              : <ReactEChartsCore echarts={echarts} option={faultChartOption} notMerge lazyUpdate style={{ height: 320 }} />
            }
          </Card>
        </Col>
      </Row>

      {/* Recent activity — stacked vertically, matching OrderListPage layout */}
      <Card title="📋 最近骑行订单" size="small" bordered={false} style={{ marginBottom: 16 }}>
        <Table
          rowKey="id" size="middle" dataSource={recentOrders} pagination={false}
          locale={{ emptyText: '暂无骑行订单' }}
          scroll={{ x: 730 }}
          columns={[
            { title: '订单号', dataIndex: 'order_no', ellipsis: true, width: 170 },
            { title: '用户手机', dataIndex: 'user_phone', width: 130 },
            { title: '单车', dataIndex: 'bike_no', width: 110 },
            { title: '开始时间', dataIndex: 'start_time', width: 155,
              render: v => v ? new Date(v).toLocaleString() : '-' },
            { title: '状态', dataIndex: 'status', width: 85,
              render: v => <Tag color={v === 'completed' ? 'success' : v === 'active' ? 'processing' : 'default'}>{v === 'completed' ? '已完成' : v === 'active' ? '进行中' : v}</Tag> },
            { title: '金额', dataIndex: 'fee', width: 80,
              render: v => `¥${Number(v || 0).toFixed(2)}` },
          ]}
        />
      </Card>

      <Card title="🔧 最近运维工单" size="small" bordered={false}>
        <Table
          rowKey="id" size="middle" dataSource={recentWorkOrders} pagination={false}
          locale={{ emptyText: '暂无运维工单' }}
          scroll={{ x: 710 }}
          columns={[
            { title: '工单号', dataIndex: 'order_no', ellipsis: true, width: 170 },
            { title: '单车', dataIndex: 'bike_no', width: 110 },
            { title: '故障类型', dataIndex: 'fault_type', width: 100, ellipsis: true },
            { title: '描述', dataIndex: 'description', width: 160, ellipsis: true },
            { title: '状态', dataIndex: 'status', width: 85,
              render: v => <Tag>{v === 'pending' ? '待处理' : v === 'completed' ? '已完成' : v === 'in_progress' ? '处理中' : v}</Tag> },
            { title: '维修员', dataIndex: 'assignee_name', width: 100, render: v => v || '未指派' },
          ]}
        />
      </Card>
    </div>
  );
}
