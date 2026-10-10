// 平台模拟数据（联调前使用，后续由 server 接口替换）

export type RobotStatus = 'patrol' | 'charging' | 'standby' | 'maintenance'

export interface Robot {
  id: string
  name: string
  model: string
  status: RobotStatus
  battery: number
  mileageToday: number
  network: string
  signalMs: number
  position: { x: number; y: number }
}

export const robots: Robot[] = [
  { id: 'R01', name: 'Rover-01', model: 'Rover X1 Explorer 轮足版', status: 'patrol', battery: 76, mileageToday: 12.4, network: '5G', signalMs: 12, position: { x: 46, y: 38 } },
  { id: 'R02', name: 'Rover-02', model: 'Rover X1 Explorer 轮足版', status: 'charging', battery: 42, mileageToday: 8.1, network: 'WiFi', signalMs: 8, position: { x: 12, y: 78 } },
  { id: 'R03', name: 'Rover-03', model: 'Rover X1 Explorer 轮足版', status: 'standby', battery: 98, mileageToday: 0, network: 'WiFi', signalMs: 9, position: { x: 15, y: 74 } },
  { id: 'R04', name: 'Rover-04', model: 'Rover X1 Explorer 轮足版', status: 'maintenance', battery: 61, mileageToday: 3.2, network: '离线', signalMs: 0, position: { x: 88, y: 82 } },
]

export const robotStatusText: Record<RobotStatus, string> = {
  patrol: '巡检中',
  charging: '充电中',
  standby: '待机',
  maintenance: '维保中',
}

export type AlarmType = '烟火识别' | '人员越界' | '垃圾满溢' | '设备过温' | '气体异常' | '仪表读数异常'
export type AlarmLevel = '紧急' | '重要' | '一般'
export type AlarmState = '待处理' | '处置中' | '已闭环' | '误报'

export interface Alarm {
  id: string
  level: AlarmLevel
  type: AlarmType
  location: string
  robot: string
  time: string
  confidence: number
  state: AlarmState
}

export const alarms: Alarm[] = [
  { id: 'ALM-2041', level: '紧急', type: '烟火识别', location: 'A区配电房', robot: 'Rover-01', time: '14:31:02', confidence: 94.6, state: '待处理' },
  { id: 'ALM-2040', level: '紧急', type: '气体异常', location: '地下管廊 12 号点', robot: 'Rover-03', time: '14:28:15', confidence: 89.2, state: '处置中' },
  { id: 'ALM-2039', level: '重要', type: '人员越界', location: '园区外周北侧', robot: 'Rover-02', time: '13:58:48', confidence: 92.1, state: '已闭环' },
  { id: 'ALM-2038', level: '一般', type: '垃圾满溢', location: '生活区 B-3 垃圾站', robot: 'Rover-01', time: '13:45:10', confidence: 88.5, state: '已闭环' },
  { id: 'ALM-2037', level: '重要', type: '设备过温', location: '主变压器室 T2', robot: 'Rover-03', time: '13:12:05', confidence: 96.8, state: '已闭环' },
  { id: 'ALM-2036', level: '一般', type: '仪表读数异常', location: '水泵房 P-01', robot: 'Rover-01', time: '12:58:22', confidence: 91.4, state: '已闭环' },
  { id: 'ALM-2035', level: '一般', type: '人员越界', location: '东侧高架桥下', robot: 'Rover-04', time: '11:30:18', confidence: 87.9, state: '误报' },
]

export type TaskState = '进行中' | '待执行' | '已完成' | '异常'

export interface PatrolTask {
  id: string
  name: string
  robot: string
  schedule: string
  progress: number
  state: TaskState
  points: string[]
  aiItems: AlarmType[]
}

export const tasks: PatrolTask[] = [
  { id: 'TSK-101', name: 'A区配电房日常巡检', robot: 'Rover-01', schedule: '每日 08:00 / 14:00', progress: 65, state: '进行中', points: ['配电房东门', '变压器 T1', '变压器 T2', '开关柜组'], aiItems: ['设备过温', '烟火识别', '仪表读数异常'] },
  { id: 'TSK-102', name: '园区周界安防巡逻', robot: 'Rover-02', schedule: '每 2 小时', progress: 0, state: '待执行', points: ['北侧围墙', '东侧高架桥', '南门岗', '西侧绿化带'], aiItems: ['人员越界', '烟火识别'] },
  { id: 'TSK-103', name: '地下管廊气体检测', robot: 'Rover-03', schedule: '每日 06:00', progress: 100, state: '已完成', points: ['管廊入口', '12 号检测点', '24 号检测点', '排风井'], aiItems: ['气体异常', '设备过温'] },
  { id: 'TSK-104', name: '生活区垃圾站巡查', robot: 'Rover-01', schedule: '每日 10:00 / 16:00', progress: 100, state: '已完成', points: ['B-1 垃圾站', 'B-3 垃圾站', 'C-2 垃圾站'], aiItems: ['垃圾满溢'] },
  { id: 'TSK-105', name: '夜间全园综合巡检', robot: 'Rover-04', schedule: '每日 22:00', progress: 32, state: '异常', points: ['主路环线', '配电房', '水泵房', '仓储区'], aiItems: ['烟火识别', '人员越界', '设备过温'] },
]

export interface ReportRecord {
  id: string
  task: string
  robot: string
  route: string
  start: string
  end: string
  points: number
  issues: number
  state: '已归档' | '待审核'
}

export const reports: ReportRecord[] = [
  { id: 'REP-2042-099', task: 'A区配电房日常巡检-v2', robot: 'Rover-01', route: '配电房东线', start: '10-10 08:00', end: '10-10 08:47', points: 24, issues: 2, state: '已归档' },
  { id: 'REP-2042-098', task: '园区周界安防巡逻', robot: 'Rover-02', route: '周界北线', start: '10-10 06:00', end: '10-10 07:12', points: 18, issues: 1, state: '已归档' },
  { id: 'REP-2042-097', task: '地下管廊气体检测', robot: 'Rover-03', route: '管廊主线', start: '10-10 06:00', end: '10-10 07:35', points: 31, issues: 4, state: '待审核' },
  { id: 'REP-2042-096', task: '生活区垃圾站巡查', robot: 'Rover-01', route: '生活区环线', start: '10-09 16:00', end: '10-09 16:38', points: 12, issues: 3, state: '已归档' },
  { id: 'REP-2042-095', task: '夜间全园综合巡检', robot: 'Rover-04', route: '全园大环', start: '10-09 22:00', end: '10-10 01:20', points: 56, issues: 7, state: '已归档' },
]
