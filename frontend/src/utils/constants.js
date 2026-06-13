/**
 * Application constants - status labels, colors, and configuration.
 */

/** Bike status labels and colors */
export const BIKE_STATUS = {
  available: { label: '可用', color: 'green' },
  in_use: { label: '骑行中', color: 'blue' },
  repairing: { label: '维修中', color: 'orange' },
  scrapped: { label: '已报废', color: 'default' },
  deployed: { label: '已投放', color: 'cyan' },
};

/** Ride order status labels */
export const ORDER_STATUS = {
  active: { label: '进行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'default' },
  abnormal: { label: '异常', color: 'error' },
};

/** Work order status labels */
export const WORK_ORDER_STATUS = {
  pending: { label: '待处理', color: 'default' },
  assigned: { label: '已指派', color: 'processing' },
  in_progress: { label: '处理中', color: 'blue' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'default' },
};

/** Work order fault types */
export const FAULT_TYPES = [
  'tire_puncture', 'brake_failure', 'lock_malfunction',
  'battery_dead', 'chain_loose', 'handlebar_bent',
  'gps_failure', 'seat_damage', 'manual_report', 'status_change',
];

export const FAULT_TYPE_LABELS = {
  tire_puncture: '轮胎漏气',
  brake_failure: '刹车故障',
  lock_malfunction: '车锁故障',
  battery_dead: '电池失效',
  chain_loose: '链条松动',
  handlebar_bent: '车把偏向',
  gps_failure: 'GPS故障',
  seat_damage: '座垫损坏',
  manual_report: '手动报修',
  status_change: '状态变更',
};

/** Report types */
export const REPORT_TYPES = {
  fault: { label: '故障报修', color: 'red' },
  violation: { label: '违规举报', color: 'orange' },
  suggestion: { label: '建议反馈', color: 'blue' },
  other: { label: '其他', color: 'default' },
};

/** Notification types */
export const NOTIFICATION_TYPES = {
  system: '系统通知',
  order: '订单消息',
  promotion: '优惠活动',
  alert: '安全提醒',
};

/** Bike marker colors for map */
export const BIKE_MARKER_COLORS = {
  available: '#52c41a',
  in_use: '#1677ff',
  repairing: '#fa8c16',
  scrapped: '#d9d9d9',
  deployed: '#13c2c2',
};
