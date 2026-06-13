# 共享单车管理系统 — 更新日志

所有值得注意的变更均记录于此文件。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [0.4.5] — 2026-06-13

### 修复
- 仪表板图表在无数据时显示 Empty 占位，避免空白区域（骑行趋势/收入/状态/故障图表）
- 消除页面横向滚动条右侧发光条：移除 Sider box-shadow + body overflow-x hidden
- 侧边栏菜单项与标题"共享单车管理"居中对齐：统一 justify-content center + 去除外发光

### 优化
- 统计卡片恢复 2 行 × 5 列布局，大屏 xl:5 列 → 中屏 lg/md:4 列 → 小屏 sm/xs:2 列自适应
- 所有表格页面统一布局规范：size="middle" + scroll x 防溢出 + pagination 统一样式（与骑行订单页一致）
- 涉及页面：单车管理、用户管理、骑行订单、运维工单、运营区域、举报处理、消息通知

---

## [0.4.4] — 2026-06-13

### 修复
- mockBikeLocation 脚本：MySQL DECIMAL 列返回字符串导致坐标拼接错误（`'39.9090000-0.000497...'`），用 `Number()` 显式转换
- 新增 `GET /api/v1` 根路径，返回 API 端点列表（之前返回 404）

### 优化
- 左侧导航栏菜单项居中对齐：圆角卡片式样式 + 选中态蓝色发光 + hover 半透明过渡
- 页面布局响应式适配：小屏（<768px）自动折叠侧边栏 + 遮罩层 + 内容区内边距自适应
- 头部工具栏小屏下紧凑间距，用户名文字在小屏隐藏
- 全局表格小屏字体和单元格间距缩小，筛选控件自动换行

---

## [0.4.3] — 2026-06-13

### 修复
- 页面顶部 Header 和左侧 Sider 改为 `position: fixed`，滚动页面时固定不动
- 内容区自适应剩余空间，侧边栏收起/展开时有 0.2s 过渡动画
- WO20240602002 工单状态从 assigned → in_progress
- 删除数据库中乱码的测试工单

### 优化
- 统计看板卡片重新设计：彩色顶部边框 + 大图标 + 粗体数值 + 标签，5 列网格布局
- 卡片 hover 上浮 3px + 阴影，响应式断点：≥1200px 5列 → <1200px 4列 → <768px 3列 → <576px 2列

---

## [0.4.2] — 2026-06-13

### 新增
- 测试数据生成脚本 `backend/src/scripts/generateTestRides.js`：可指定天数和日均量
- 近 8 天共 134 条骑行订单测试数据（含趋势图表所需历史数据）
- 统计看板"最近骑行订单"和"最近运维工单"改为上下堆叠布局，各占全宽

### 优化
- 最近骑行订单表新增「用户手机」「开始时间」列，状态用彩色 Tag
- 最近运维工单表新增「描述」列

---

## [0.4.1] — 2026-06-13

### 优化
- 统计看板骑行趋势、收入趋势图表每 30 秒自动刷新（实时更新）
- 骑行订单列表列宽紧凑化，全部文字单行显示、消除横向滚动
- 运维工单列表移除 `fixed: 'right'` 导致的列间隙，操作按钮紧凑排列

---

## [0.4.0] — 2026-06-13

### 新增
- 角色权限 UI 区分：运维人员仅可见 5 个菜单（统计看板、单车管理、单车地图、骑行订单、运维工单），超级管理员可见全部 9 个
- 运维工单详情页全面改版：双栏布局、处理进度时间线、快捷操作面板、单车位置信息
- 运维工单自动指派：操作员点击"开始处理"时自动认领工单
- 通知发送页面的目标用户选择改为可搜索下拉框（用户名/手机号映射）
- 页面 favicon 更换为单车图标（蓝色圆形 + 🚲 emoji SVG）

### 修复
- 修复 JWT Token 黑名单 Hash 碰撞漏洞（所有 Token 生成相同 key → 一次登出全员失效）
- 修复 `auth.controller.js` 和 `auth.routes.js` 缺失导致登录 API 不存在
- 修复侧边栏"单车地图"点击后高亮错误（误选"单车管理"）
- 修复 5 个 Model 的分页 `total` 始终为 `undefined`（正则未跨行匹配）
- 修复运维工单 `bikeId` 为空字符串时导致 SQL 报错
- 修复 `work_orders` 表 `bike_id` 和 `reporter_id` 列不支持 NULL

### 优化
- Dark/Light 主题切换改为事件驱动，无需整页刷新（丝滑过渡）
- Dark 模式下卡片 hover 使用蓝色发光边框，表格行 hover 更明显
- 统计看板卡片统一样式：4 个主指标 + 6 个副指标，hover 悬浮效果一致
- 单车地图右侧图例面板字体统一
- 运维工单列表页新增角色标签提示

---

## [0.3.0] — 2026-06-12

### 新增
- 管理员注册页面 (`/register`)
- 通知管理页面（发送系统通知/优惠活动/安全提醒/订单消息）
- 用户举报处理页面（故障报修/违规举报/建议反馈）
- 运营区域管理页面（电子围栏 CRUD）
- 统计看板页面：今日骑行/收入/活跃单车/故障率 + ECharts 图表
- 单车地图页面：Leaflet 实时位置 + 点聚合 + 状态颜色标记
- 单车位置模拟脚本（每 10 秒随机更新坐标）

### 后端
- 完整的 RESTful API：认证、单车、用户、订单、工单、区域、看板、举报、通知
- JWT 认证 + bcrypt 密码加密 + Redis Token 黑名单
- 角色权限中间件（super_admin / operator）
- API 限流中间件
- 统一 JSON 响应格式

### 数据库
- 8 张核心表初始化 SQL
- 100 辆测试单车 + 40 个用户 + 30 条骑行记录 + 10 条工单种子数据

### 部署
- Docker Compose 一键启动（MySQL + Redis + Backend + Nginx Frontend）

---

## 系统账号

### 管理员（登录系统后台）

| ID | 用户名 | 姓名 | 角色 | 密码 |
|----|--------|------|------|------|
| 1 | admin | 超级管理员 | 超级管理员 | admin123 |
| 2 | operator01 | 运维人员张三 | 运维人员 | admin123 |
| 3 | operator02 | 运维人员李四 | 运维人员 | admin123 |

### 骑行用户（App 端用户，无后台登录权限）

| ID | 姓名 | 手机号 | 状态 |
|----|------|--------|------|
| 1 | 王小明 | 13900001001 | 正常 |
| 2 | 李小红 | 13900001002 | 正常 |
| 3 | 张大伟 | 13900001003 | 正常 |
| 4 | 赵丽丽 | 13900001004 | 正常 |
| 5 | 陈强 | 13900001005 | 冻结 |
| ... | ... | ... | ... |

> 共 40 个骑行用户，详见 `database/seed.sql`

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Ant Design 5 + Axios + ECharts + Leaflet + Zustand + React Router 6 |
| 后端 | Node.js + Express + mysql2 + jsonwebtoken + bcryptjs + ioredis |
| 数据库 | MySQL 8.0 + Redis 7 |
| 部署 | Docker Compose (Nginx 反向代理) |

---

## 目录结构

```bash
Claude/
├── backend/
│   └── src/
│       ├── config/          # 数据库、Redis、环境变量配置
│       ├── controllers/     # HTTP 请求处理
│       ├── middleware/       # auth、role、errorHandler、validator、rateLimiter
│       ├── models/          # 数据库查询
│       ├── routes/          # 路由定义
│       ├── services/        # 业务逻辑
│       ├── utils/           # jwt、bcrypt、response、geo、logger
│       └── scripts/         # 种子数据、位置模拟
├── frontend/
│   └── src/
│       ├── api/             # Axios 接口封装
│       ├── components/      # 布局组件
│       ├── pages/           # 页面组件（Login/Dashboard/BikeManage/...）
│       ├── store/           # Zustand 状态管理
│       ├── styles/          # 全局样式
│       └── utils/           # 常量配置
├── database/
│   ├── init.sql             # 建表 SQL
│   └── seed.sql             # 测试数据
├── docker-compose.yml
└── CHANGELOG.md
```
