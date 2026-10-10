# server — 云端后台服务

Python 3.10+ / FastAPI，为管控平台前端与机器狗端提供统一服务。

## 目录

- `app/api/` — REST + WebSocket 接口（控制台数据、实时状态推送、大屏数据）
- `app/core/` — 配置、JWT 鉴权、日志、统一异常
- `app/models/` — 设备、巡检路线/点位、任务、告警、录像、用户与角色
- `app/services/` — 设备管理、任务调度、告警中心（审核/处置闭环）、录像存档、巡检报告
- `app/gateway/` — 设备接入：MQTT（遥测/指令/告警）、RTSP/WebRTC（视频）、心跳与在线状态

## 依赖

PostgreSQL（业务数据）、Redis（实时状态/队列）、MinIO（录像与告警抓图）、EMQX/Mosquitto（MQTT）。
