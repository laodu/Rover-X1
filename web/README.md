# web — 管控平台前端

Vue 3 + TypeScript + Vite + Tailwind CSS v4 + ECharts，深色赛博指挥舱风格（设计令牌源自 Stitch「CyberHound Operations Cockpit」设计系统）。

> 技术说明：规划阶段曾考虑 Element Plus，实际落地改用 Tailwind CSS v4 —— Stitch 导出的原型 HTML 即 Tailwind 风格，组件（HUD 面板/状态徽章/指标卡）按设计系统自研，视觉还原度更高。

## 命令

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物输出 dist/
```

## 页面（与 Stitch 原型一一对应）

| 路由 | 视图 | 内容 |
| --- | --- | --- |
| `/login` | `LoginView.vue` | 登录页：账号密码认证、演示账号快捷填充 |
| `/dashboard` | `DashboardView.vue` | 总览驾驶舱：统计卡、告警环图、园区态势图（机器狗位置/巡检路线）、告警事件流、集群状态、7 天趋势 |
| `/monitor` | `MonitorView.vue` | 实时监控：视频通道列表、主画面 HUD 叠加、四宫格视频墙、摇杆/姿态/LED/喊话操控、紧急控制区、实时遥测 |
| `/tasks` | `TasksView.vue` | 巡检任务（需 `task:dispatch`）：任务列表与筛选、路线编辑地图、任务配置表单（AI 检测项勾选） |
| `/alarms` | `AlarmsView.vue` | 告警中心：统计条、级别/类型筛选、告警列表、详情（AI 检测框抓图、处置时间线、闭环操作） |
| `/devices` | `DevicesView.vue` | 设备管理：集群卡片、单机详情（健康度仪表盘、传感器/通信链路、OTA 运维操作） |
| `/reports` | `ReportsView.vue` | 巡检报告：筛选导出、4 张分析图表、记录表格与分页 |
| `/system` | `SystemView.vue` | 系统管理（需 `system:manage`）：用户管理（新建/编辑/停用）、角色权限矩阵 |

## 认证与权限（RBAC 脚手架）

- `src/stores/auth.ts` — 用户状态（reactive 单例 + localStorage 持久化）、角色/权限模型、mock 登录；联调后替换为 `POST /api/auth/login` 与 server 下发的权限表
- 三级角色：**系统管理员 admin**（全部权限）/ **巡检调度员 operator**（调度、操控、告警处置、导出）/ **观察员 viewer**（只读）
- 7 个权限点：`control:emergency`、`control:remote`、`task:dispatch`、`alarm:handle`、`device:ota`、`report:export`、`system:manage`
- 三层控制：
  - **路由级**：`router/index.ts` 全局守卫（未登录 → `/login` 并带 redirect 回跳；无权限 → 弹回驾驶舱）
  - **菜单级**：`AppLayout.vue` 按权限过滤导航入口
  - **按钮级**：`v-permission` 指令（`src/directives/permission.ts`）裁剪操作按钮，已接入紧急制动、人工接管、新建任务、保存并下发、告警处置、OTA 升级、报告导出
- 演示账号：`admin/admin123`、`operator/op123456`、`viewer/view1234`

## 目录

```
src/
├── layout/AppLayout.vue    # 顶栏导航（按权限过滤）+ 时钟 + 紧急制动 + 用户菜单
├── components/             # HudPanel / StatCard / StatusBadge / VChart(ECharts 封装)
├── stores/auth.ts          # 认证状态 + RBAC 角色权限模型（mock，联调后换 server 接口）
├── directives/permission.ts # v-permission 按钮级权限指令
├── charts/theme.ts         # ECharts 深色主题基础配置
├── mock/data.ts            # 机器狗/告警/任务/报告 mock 数据（联调后由 server 接口替换）
├── router/index.ts         # 路由 + 登录/权限全局守卫
├── styles/main.css         # Tailwind v4 @theme 设计令牌 + 全局样式
└── views/                  # 登录 + 6 个业务页面 + 系统管理
```

原型设计稿与 Stitch 导出 HTML 见 `docs/prototype/`。
