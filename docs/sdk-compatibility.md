# 前端功能 × Rover X1 SDK 兼容清单

> 核查基准：前端 `web/`（纯 UI 原型 + mock，无真实通信代码）× 官方 SDK `dobot_quad_sdk`（高层 gRPC `:50051` + 低层 CycloneDDS 仅有线 + RTSP `:8554`）。
> 架构与分期规划见 [architecture.md](architecture.md)。

## 一、SDK 直接支撑（可对齐，需经 robot-agent/server 封装）

| 前端功能 | 前端位置 | SDK 对应接口 | 备注 |
| --- | --- | --- | --- |
| 九宫格方向遥控（前后左右/斜向/停止） | `MonitorView.vue:269-285` | `velocity_sequence((vx,vy,vyaw,dur), gait)` | 完全对应 |
| 速度滑块 0–3.0 m/s | `MonitorView.vue:288-299` | `set_speed_ratio(10~100)` + 步态速度 | SDK 是"速度比"而非绝对速度，需换算 |
| 站立 / 趴下 | `MonitorView.vue:303-318` | `balance_stand()` / `stand_down()` | ✅ |
| 轮式 / 足式模式切换 | 同上 | `wheel_loco()` / `walk()`、`change_mode()` | 轮足机型专属能力 |
| LED 灯光 6 色 | `MonitorView.vue:320-332` | `set_all_legs_color()`（预定义 9 色）/ 低层 `rt/leds/cmd` | 前端 6 色 ⊆ SDK 9 色 |
| 语音喊话 | `MonitorView.vue:334-345` | DDS `rt/voice/cmd`（PCM 流式/文件播放） | ⚠️ 仅有线可用，需 agent 部署上位机 |
| 紧急制动（顶栏 + 监控页） | `AppLayout.vue:104`、`MonitorView.vue:356` | `emergency()` / `passive()` | 前端按钮目前无事件绑定，需补 |
| 前置 / 后置摄像头切换 | `MonitorView.vue:120-149` | `video.open(FRONT_RGB/REAR_RGB)` → RTSP 地址 | ✅ |
| 电量显示 | `MonitorView.vue:374-412` | DDS `LowerState.bms_state.battery_level` | ⚠️ 低层接口，Python 版只有百分比 |
| 姿态角 Roll/Pitch/Yaw | 同上 | DDS `LowerState.imu_state` / `get_state().ori_body` | ✅ |
| 当前速度、机体坐标 | 同上 | `get_state().vel / pos` | ⚠️ 机体相对位姿，不是全局定位 |
| 电机温度 | 同上 + `DevicesView.vue` | DDS `LowerState.motor_state[16].temp` | 轮足 16 电机 |
| 关节伺服状态 x/12 | `DevicesView.vue:214-252` | `get_state().jpos/jvel/jtau` | ⚠️ 轮足 16 个电机，前端写死 12 需改 |
| 抓拍存档 | `MonitorView.vue:227-233` | RTSP 流截帧（平台层实现） | SDK 给流，抓帧由 server/AI 层做 |

## 二、SDK 不支撑（需自研或砍功能）

| 前端功能 | 位置 | 缺口说明 |
| --- | --- | --- |
| 一键返航 | `MonitorView.vue:367`（无绑定） | SDK 无全局定位/导航接口，`pos` 只是机体相对量 |
| 巡检路线地图 / 点位导航 / Waypoint 顺序执行 | `TasksView.vue:254-396` | SDK 无 SLAM、无建图、无导航，是任务系统最大缺口 |
| 红外热成像通道 | `MonitorView.vue:16-24` | SDK 只有前后 RGB + 前后深度相机，无热成像 |
| 四宫格视频墙（足底广角/机械臂特写/云台侧视/全景雷达） | `MonitorView.vue:238-262` | 机体无云台、无机械臂、无雷达 |
| 设备页传感器阵列（D435i ×2、BMI088、MID-360 激光雷达） | `DevicesView.vue:254-281` | SDK 文档未列这些型号；激光雷达无接口 |
| 远程重启 / 固件 OTA / 传感器标定 | `DevicesView.vue:289-319` | SDK 无设备管理类接口（`kill_robot` 只是停控制器进程，非重启） |
| 电池 SOH 健康度仪表盘 | `DevicesView.vue:214-252` | Python 版只能拿电量百分比，完整 BMS 字段仅 C++ 示例 |
| 告警处置流 / 报告导出 / 用户权限管理 | `/alarms`、`/reports`、`/system` | 纯平台层业务，与 SDK 无关，server 自建即可 |

## 三、SDK 有、但前端设计未用到（可增补）

| SDK 能力 | 接口 | 可补的前端功能 |
| --- | --- | --- |
| 避障开关 | `set_obstacle_avoidance()` | 监控页加"避障开/关"开关 |
| 特殊动作 | `dance()`、`jump()`、`wave_hand()`、`backflip()`、`recovery()`（跌倒自救） | 演示模式/动作库面板 |
| 原子编排动作 ×8 | `twirl_jump()`、`body_wave()` 等 + `execute(*motions)` 序列 | 动作编排器 |
| 平衡姿态微调 | `balance_pitch/yaw/roll/height` | 姿态微调摇杆 |
| 深度图像 | `rt/camera/camera2/3/image_depth` | 深度图可视化通道 |
| 麦克风上行 | `rt/voice/state` | "监听现场"（配合喊话构成双向语音） |
| 定距行走/旋转 | `line_walk()`、`rotate()`、`circle()` | 精确微动控制 |

## 四、关键风险

1. **WiFi 硬约束**：低层 DDS（语音喊话、麦克风、IMU/电机/电池精细遥测、低层 LED）只有网线连接 `192.168.5.2` 才可用；WiFi 下只有高层 gRPC + RTSP。巡检场景是无线作业，`robot-agent` 必须直接部署在狗载上位机采集 DDS 再经 MQTT 上行，否则喊话、电机温度等功能全废。
2. **导航完全缺失**：任务系统核心（路线、点位、返航）在 SDK 里没有任何支撑，需外接 LiDAR + 自研 SLAM/导航栈，或重新界定任务功能范围。
3. **前端若干按钮无事件绑定**（全局紧急制动、人工接管、一键返航、抓拍、远程查看现场、报告下载），联调时需补；权限点 `control:remote` 已定义但未挂到任何控制按钮上。
4. **设备参数不实**：前端展示的 D435i/BMI088/MID-360 型号、"关节伺服 x/12" 与 SDK 实际（轮足 16 电机、前后 RGB+深度相机）不符，设备档案页需按真机改。

## 总体结论

监控页的"手动遥控"类功能（方向/速度/姿态/LED/视频/基础遥测）与 SDK 对应度很高，约 16 项可直接落地；"自主巡检"类功能（路线导航、返航、雷达、热成像）SDK 完全不支撑，属于设计超前于硬件的部分，规划中标注为自研/外接上装范围（P3）。
