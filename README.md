# Rover X1 智能巡检管控平台

基于 Rover X1 Explorer 轮足四足机器狗（INFFNI / Powered by DOBOT）的后台管控与 AI 巡检平台。
参考轮式四足机器狗园区巡检平台的三层架构：机器人端（感知执行）→ 网络传输层（视频/指令/状态回传）→ 控制中心（预览、地图、任务、设备、录像、人工接管）。

## 项目目录

```
Rover/
├── docs/                    # 设计文档与参考资料
│   ├── architecture.md      # 平台总体架构与分期规划
│   ├── sdk-compatibility.md # 前端功能 × dobot_quad_sdk 兼容清单
│   ├── prototype/           # 原型设计导出
│   └── references/          # 参考资料（产品彩页 PDF 等）
│
├── robot-agent/             # 机器狗端代理（运行于机器狗上位机）
│   ├── app/                 # 基于 dobot_quad_sdk 的采集与执行代理
│   │                        #   - 高层 gRPC：状态机、运动控制、任务执行
│   │                        #   - 低层 DDS：相机/IMU/电池等原始数据
│   │                        #   - 视频：RTSP 拉流 → 推流上云
│   └── configs/             # 端侧配置（机器人 IP、推流地址、采集频率）
│
├── server/                  # 云端后台服务（Python / FastAPI）
│   └── app/
│       ├── api/             # REST + WebSocket 接口（控制台、大屏）
│       ├── core/            # 配置、鉴权（JWT）、日志、异常
│       ├── models/          # 数据模型（设备、任务、点位、告警、录像、用户）
│       ├── services/        # 业务服务：设备管理 / 任务调度 / 告警中心 / 录像存档 / 报表
│       └── gateway/         # 设备接入网关：MQTT(遥测/指令)、RTSP/WebRTC(视频)、心跳
│
├── ai/                      # AI 巡检算法
│   ├── inference/           # 推理服务（视频流实时分析，输出结构化告警）
│   ├── pipelines/           # 检测流水线：烟火识别 / 人员越界 / 垃圾满溢 /
│   │                        #   表计读数 / 红外过温 / 气体异常 / 道路占用积水
│   ├── training/            # 模型训练与数据标注脚本
│   └── models/              # 模型权重与版本管理
│
├── web/                     # 管控平台前端（Vue3 + TS 管理控制台）
│   └── src/                 # 总览大屏 / 实时监控 / 任务管理 / 告警中心 /
│                            #   设备管理 / 巡检报告 / 系统设置
│
├── deploy/                  # 部署：docker-compose、Nginx、数据库初始化
└── scripts/                 # 运维脚本（数据备份、日志清理、模拟设备数据）
```

## 技术选型（建议）

| 模块 | 技术 |
| --- | --- |
| 机器狗接入 | dobot_quad_sdk（gRPC 高层 / DDS 低层）、RTSP 视频 |
| 端云通信 | MQTT（遥测/指令/告警）、RTSP/WebRTC（视频）、HTTPS |
| 后台服务 | Python 3.10+ / FastAPI / PostgreSQL / Redis / MinIO(录像与图片) |
| AI 推理 | YOLO 系目标检测 + 红外/气体阈值规则，ONNX/TensorRT 部署 |
| 前端 | Vue3 + TypeScript + Element Plus + ECharts + 地图(天地图/高德) |
| 部署 | Docker Compose（单机起步），后续可演进 K8s |

## 核心功能域

1. **总览驾驶舱**：园区地图、机器狗实时位置/状态、在线率、当日任务与告警统计
2. **实时监控**：多路视频（可见光/红外）、远程操控与人工接管、语音喊话
3. **巡检任务**：巡检路线与点位配置、定时/周期任务、任务进度与执行回放
4. **AI 告警中心**：烟火、人员越界、垃圾满溢、设备过温、气体异常等告警的审核与处置闭环
5. **设备管理**：机器狗台账、电量/健康度、固件 OTA、传感器标定
6. **巡检报告**：可追溯巡检记录、趋势分析、报表导出
