# 🚲 共享单车管理系统

一个完整的 Web 端共享单车后台管理系统，对单车、用户、骑行订单、运维工单、运营区域进行统一管理。

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18 + Ant Design 5 + Axios + ECharts 5 + Leaflet |
| **后端** | Node.js + Express 4 |
| **数据库** | MySQL 8.0 + Redis 7 |
| **部署** | Docker Compose |

## 功能模块

### ✅ P0 核心功能
- **管理员登录/登出**: JWT 认证，区分超级管理员和普通运营人员
- **单车管理**: 增删改查单车信息（编号、经纬度、状态）
- **用户管理**: 查看用户列表（手机号、注册时间、账号状态）
- **骑行订单**: 查看所有骑行订单（起止时间/地点、费用、状态）
- **运维工单**: 车辆报修后自动生成工单（指派维修、状态跟踪）

### ✅ P1 扩展功能
- **运营区域管理**: 设定电子围栏（多边形坐标），判断单车是否在运营区内
- **统计看板**: 今日骑行次数、活跃单车数、总收入、故障率（ECharts 图表）
- **单车地图可视化**: Leaflet 地图显示单车实时位置（颜色标注状态 + 聚合显示）

### ✅ P2 增值功能
- **用户举报处理**: 查看和审核用户提交的违停/故障举报
- **消息通知**: 向特定用户发送系统通知

## 快速开始

### 前置要求
- Docker & Docker Compose
- 或 Node.js 18+ + MySQL 8.0 + Redis 7

### Docker 一键启动 (推荐)

```bash
# 克隆项目后，在根目录执行
docker-compose up -d
```

启动后访问：
- **前端页面**: http://localhost
- **后端 API**: http://localhost:3000/api/v1
- **健康检查**: http://localhost:3000/api/v1/health

### 本地开发

#### 1. 初始化数据库

```bash
# 创建 MySQL 数据库
mysql -u root -p < database/init.sql
mysql -u root -p < database/seed.sql
```

#### 2. 启动后端

```bash
cd backend
cp .env.example .env   # 修改数据库连接信息
npm install
npm run dev            # 开发模式 (nodemon 热重载)
```

```bash
cd backend
npm run dev
```

后端运行在 http://localhost:3000

#### 3. 启动前端

```bash
cd frontend
npm install
npm run dev  	# Vite 开发服务器
```

```bash
cd frontend
npm run dev 
```

前端运行在 http://localhost:5173 （自动代理 /api 到后端）

#### 4. （可选）启动位置模拟脚本

```bash
cd backend
npm run mock:location  # 每10秒随机更新单车坐标
```

### 默认管理员账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 超级管理员 | `admin` | `admin123` | 所有操作 |
| 运营人员 | `operator01` | `admin123` | 单车/工单管理 |

> ⚠️ **生产环境请立即修改默认密码！**

## API 接口文档

### 认证模块 `/api/v1/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/login` | 登录获取 JWT | - |
| POST | `/auth/logout` | 退出登录 (黑名单) | Bearer |
| GET | `/auth/profile` | 获取当前用户信息 | Bearer |
| PUT | `/auth/password` | 修改密码 | Bearer |
| GET | `/auth/operators` | 获取运营人员列表 | Bearer |

### 单车管理 `/api/v1/bikes`

| 方法 | 路径 | 说明 | 角色 |
|------|------|------|------|
| GET | `/bikes` | 单车列表 (分页/筛选) | 所有 |
| GET | `/bikes/map/locations` | 地图位置数据 | 所有 |
| GET | `/bikes/:id` | 单车详情 | 所有 |
| POST | `/bikes` | 新增单车 | operator+ |
| PUT | `/bikes/:id` | 编辑单车 | operator+ |
| DELETE | `/bikes/:id` | 删除单车 | super_admin |
| PATCH | `/bikes/:id/status` | 更新状态 | operator+ |
| GET | `/bikes/:id/track` | 位置轨迹 | 所有 |

### 用户管理 `/api/v1/users`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/users` | 用户列表 (手机号搜索) |
| GET | `/users/:id` | 用户详情 (含骑行统计) |
| PUT | `/users/:id/status` | 冻结/解冻 (super_admin) |

### 骑行订单 `/api/v1/orders`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/orders` | 订单列表 (多条件筛选) |
| GET | `/orders/stats/summary` | 今日统计 |
| GET | `/orders/:id` | 订单详情 |

### 运维工单 `/api/v1/work-orders`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/work-orders` | 工单列表 |
| GET | `/work-orders/:id` | 工单详情 |
| POST | `/work-orders` | 创建工单 (operator+) |
| PUT | `/work-orders/:id` | 编辑工单 |
| PATCH | `/work-orders/:id/assign` | 指派维修人员 |
| PATCH | `/work-orders/:id/status` | 更新状态 |

### 运营区域 `/api/v1/zones`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/zones` | 区域列表 |
| GET | `/zones/:id` | 区域详情 |
| POST | `/zones` | 创建区域 (super_admin) |
| PUT | `/zones/:id` | 编辑区域 (super_admin) |
| DELETE | `/zones/:id` | 删除区域 (super_admin) |
| GET | `/zones/:id/bikes` | 区域内单车 |
| POST | `/zones/check-point` | 检查坐标是否在区域内 |

### 统计看板 `/api/v1/dashboard`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/dashboard/overview` | 今日概览 (缓存60s) |
| GET | `/dashboard/ride-trend` | 骑行趋势 (days=7/30) |
| GET | `/dashboard/revenue-trend` | 收入趋势 |
| GET | `/dashboard/status-distribution` | 单车状态分布 |
| GET | `/dashboard/fault-trend` | 故障趋势 |

### 举报处理 `/api/v1/reports`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/reports` | 举报列表 |
| GET | `/reports/:id` | 举报详情 |
| PUT | `/reports/:id/review` | 审核举报 |

### 消息通知 `/api/v1/notifications`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/notifications` | 通知列表 |
| POST | `/notifications` | 发送通知 (super_admin) |

### 统一响应格式

```json
// 成功
{ "code": 200, "data": {...}, "message": "ok" }

// 分页
{ "code": 200, "data": { "list": [...], "total": 150, "page": 1, "pageSize": 20 }, "message": "ok" }

// 错误
{ "code": 401, "message": "Invalid or expired token" }
```

## 项目结构

```bash
├── docker-compose.yml          # Docker 编排
├── README.md                   # 本文档
├── database/
│   ├── init.sql                # 建表 DDL (9 张表)
│   └── seed.sql                # 测试数据 (100辆单车、40个用户...)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js           # 入口
│       ├── app.js              # Express 配置
│       ├── config/             # DB、Redis、环境变量
│       ├── middleware/         # auth、role、errorHandler、validator、rateLimiter
│       ├── routes/             # 路由定义 (9 个模块)
│       ├── controllers/        # 控制器 (解析请求)
│       ├── services/           # 业务逻辑层
│       ├── models/             # 数据访问层 (参数化查询)
│       ├── utils/              # JWT、bcrypt、geo、response、logger
│       └── scripts/            # seedAdmin、mockBikeLocation
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── index.js            # React 入口
        ├── App.jsx             # 路由 + 权限守卫
        ├── api/                # Axios 实例 + API 函数 (9 个模块)
        ├── store/              # Zustand 状态管理
        ├── components/         # 布局、地图、图表、通用组件
        ├── pages/              # 12 个页面
        ├── utils/              # 常量、格式化
        └── styles/             # 全局样式
```

## 架构设计

### 后端分层架构

```
Request → routes → middleware(auth→role→validator) → controller → service → model → MySQL/Redis
                                                                        ↓
                                                                   response.js (统一响应)
                                                                        ↓
                                                                   errorHandler (异常处理)
```

- **Routes**: 定义 HTTP 方法和路径，组合中间件
- **Middleware**: JWT 验证、角色检查、参数校验、错误处理
- **Controllers**: 解析请求参数，调用 service，返回统一响应
- **Services**: 所有业务逻辑，可独立测试
- **Models**: 数据库查询，100% 参数化防 SQL 注入
- **Utils**: 通用工具（JWT、bcrypt、地理算法、日志）

### 安全措施
- **JWT 认证**: 所有 API (除 login) 需要 Bearer Token
- **密码加密**: bcrypt (10 轮加盐)
- **Token 黑名单**: 退出后 Redis 存储已注销 token
- **SQL 注入防护**: 全部使用参数化查询 `?` 占位符
- **角色控制**: 超级管理员 vs 运营人员的细粒度权限

### 性能优化
- 地图位置数据 Redis 缓存 (TTL 5秒)
- 仪表盘概览 Redis 缓存 (TTL 60秒)
- 地图标记聚合 (自定义 Grid 聚合算法)
- 数据库索引 (状态、位置、时间等)

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 后端端口 | 3000 |
| `DB_HOST` | MySQL 地址 | localhost |
| `DB_PORT` | MySQL 端口 | 3306 |
| `DB_USER` | MySQL 用户 | root |
| `DB_PASSWORD` | MySQL 密码 | bike_admin_2024 |
| `DB_NAME` | 数据库名 | shared_bike |
| `REDIS_HOST` | Redis 地址 | localhost |
| `REDIS_PORT` | Redis 端口 | 6379 |
| `JWT_SECRET` | JWT 密钥 | (请修改) |
| `JWT_EXPIRES_IN` | Token 有效期 | 24h |
| `RIDE_FIXED_FEE` | 固定骑行费 | 1.50 |

## 许可证

MIT

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

