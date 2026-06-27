
<p align="center">
  <img src="https://img.shields.io/badge/ADAS-Perception%20Pipeline-00d4ff?style=for-the-badge&logo=autoprefixer&logoColor=00d4ff&labelColor=07090e" alt="ADAS Perception Pipeline"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/PyTorch-2.2%2B-EE4C2C?style=flat-square&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8-Ultralytics-00CCFF?style=flat-square" />
  <img src="https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/MiDaS-Depth-FF6F00?style=flat-square" />
  <img src="https://img.shields.io/badge/ByteTrack-Tracking-00C853?style=flat-square" />
  <img src="https://img.shields.io/badge/OpenCV-4.9-5C3EE8?style=flat-square&logo=opencv&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" />
</p>

<p align="center">
  Real-time autonomous driving perception system with vehicle/pedestrian detection, lane detection, depth estimation, multi-object tracking, collision risk analysis, and a full-stack web dashboard.
</p>

<br/>

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ADAS Perception Pipeline                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────┐    ┌───────────────┐    ┌──────────────────────────┐    │
│  │  Video     │    │   Object      │    │   Collision Risk         │    │
│  │  Source    │───▶│   Detector    │───▶│   Assessor               │    │
│  │  (file/    │    │   (YOLOv8 +   │    │   (TTC + Dist Analysis)  │    │
│  │   webcam/  │    │    ByteTrack) │    │                          │    │
│  │   RTSP)    │    └───────┬───────┘    └────────────┬─────────────┘    │
│  └────────────┘            │                         │                   │
│                            │                         │                   │
│                   ┌────────▼────────┐       ┌────────▼────────────┐     │
│                   │    Depth        │       │   Lane Detector     │     │
│                   │    Estimator    │       │   (Hough + Polyfit) │     │
│                   │    (MiDaS)      │       │                     │     │
│                   └────────┬────────┘       └────────┬────────────┘     │
│                            │                         │                   │
│                   ┌────────▼────────┐       ┌────────▼────────────┐     │
│                   │  Segmentation   │       │  BEV / Point Cloud  │     │
│                   │  Engine (HSV)   │       │  Renderer           │     │
│                   └────────┬────────┘       └────────┬────────────┘     │
│                            │                         │                   │
│                            └──────────┬──────────────┘                   │
│                                       │                                  │
│                              ┌────────▼─────────┐                       │
│                              │   HUD Overlay    │                       │
│                              │   Renderer       │                       │
│                              └────────┬─────────┘                       │
│                                       │                                  │
├───────────────────────────────────────┼──────────────────────────────────┤
│                                       │                                  │
│                    ┌──────────────────▼──────────────────┐               │
│                    │          Web Server (FastAPI)        │               │
│                    │  ┌──────────────────────────────┐   │               │
│                    │  │  /api/metrics  /api/config   │   │               │
│                    │  │  /api/start   /api/stop      │   │               │
│                    │  │  /api/health  /ws/stream     │   │               │
│                    │  └──────────────────────────────┘   │               │
│                    └──────────────────┬──────────────────┘               │
│                                       │                                  │
│                    ┌──────────────────▼──────────────────┐               │
│                    │    Web Dashboard (React + Vite)      │               │
│                    │  ┌──────────────────────────────┐   │               │
│                    │  │  VideoFeed  │  MetricsPanel   │   │               │
│                    │  │  Alerts     │  ConfigPanel    │   │               │
│                    │  │  Controls   │  StatusBar      │   │               │
│                    │  └──────────────────────────────┘   │               │
│                    └─────────────────────────────────────┘               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
 Video ──▶ YOLOv8 ──▶ ByteTrack ──▶ Risk Assessment ──▶ HUD ──▶ JPEG ──▶ WebSocket ──▶ Browser
   │                    │                                   │
   ├────▶ MiDaS ───────┤                                   │
   ├────▶ Lanes ───────┘                                   │
   └────▶ Seg Engine                                       │
                      BEV ◀──── PC ◀──── Depth ────────────┘
```

<br/>

---

## Features ✨

<div align="center">

| 🚗 Detection | 🛣️ Lane | 📏 Depth | ⚡ Tracking | ⚠️ Safety | 📊 Dashboard |
|:---:|:---:|:---:|:---:|:---:|:---:|
| YOLOv8 | Hough + Polyfit | MiDaS | ByteTrack | TTC + Dist | React + TS |
| 6 classes | Curve fitting | Mono depth | ID persistence | 4 risk levels | Live video |
| Corner boxes | Departure alert | False color viz | Motion trails | Collision banner | Telemetry gauges |

</div>

- **Vehicle & Pedestrian Detection** — YOLOv8 nano with corner-style bounding boxes, smooth tracking trails, and class-specific colors
- **Lane Detection** — Hough transform + 2nd-degree polynomial curve fitting with lane departure warnings
- **Depth Estimation** — MiDaS monocular depth with inferno false-color map and metric distance approximation
- **Multi-Object Tracking** — ByteTrack via Ultralytics with exponential smoothing and velocity estimation
- **Collision Risk Analysis** — Time-to-collision + distance-based risk (SAFE / CAUTION / WARNING / CRITICAL)
- **Bird's-Eye View** — Top-down pseudo-LiDAR projection of tracked objects with distance rings
- **Point Cloud Panel** — Sampled depth scatter visualization with plasma colormap
- **GPU Acceleration** — Automatic CUDA detection with FP16 fallback, CPU supported
- **Full-Stack Dashboard** — Live video streaming via WebSocket + real-time telemetry + critical alerts

<br/>

---

## Quick Start 🚀

### Prerequisites

```bash
Python 3.10+  |  Node.js 18+  |  Webcam (or video file / RTSP stream)
```

### Backend

```bash
cd "Autonomous Driving System/backend"
pip install -r requirements.txt
python server.py
```

### Frontend

```bash
cd "Autonomous Driving System/frontend"
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

> **LAN access:** `http://YOUR_IP:5173` (find your IP with `ipconfig`)

<br/>

---

## API Reference 🔌

### REST Endpoints

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/metrics` | Pipeline telemetry (FPS, latency, risk, alerts) |
| `GET` | `/api/config` | System configuration (device, model, GPU) |
| `POST` | `/api/start?source=0&no_depth=false` | Start pipeline |
| `POST` | `/api/restart?no_depth=false` | Restart pipeline |
| `POST` | `/api/stop` | Stop pipeline |

### WebSocket

| Endpoint | Description |
|:---|:---|
| `ws://HOST:8000/ws/stream` | Live JPEG frame stream + JSON metrics |

<br/>

---

## Dashboard 🖥️

| Component | Description |
|:---|:---|
| **Video Feed** | WebSocket-streamed JPEG frames with LIVE indicator |
| **Telemetry Panel** | FPS, latency, object count, frame index, risk breakdown |
| **Critical Alerts** | Real-time collision warnings with distance & TTC |
| **System Config** | Device info, GPU mode, YOLO model, depth model |
| **Depth Toggle** | Enable/disable depth estimation (restarts pipeline) |
| **Fullscreen** | Immersive fullscreen video mode |

<br/>

---

## Tech Stack 🔧

<div align="center">

| Layer | Technology |
|:---|:---|
| **Detection** | YOLOv8 (Ultralytics) + ByteTrack |
| **Depth** | MiDaS (Intel-ISL) |
| **Vision** | OpenCV, NumPy, Scipy |
| **Backend** | FastAPI, Uvicorn, WebSocket |
| **Frontend** | React 18, TypeScript, Vite |
| **Compute** | PyTorch, CUDA (auto-detect), FP16 |

</div>

<br/>

---

## Demo Recording

```bash
python "Autonomous Driving System/record_demo.py" --duration 30
```

<br/>

---

## Project Structure 📁

```
Autonomous Driving System/
├── driving.py              # Core perception pipeline (1210 lines)
├── yolov8n.pt              # YOLOv8 nano weights
├── record_demo.py          # Demo video recorder
├── tunnel.ps1              # Public tunnel (ngrok / localhost.run)
├── backend/
│   ├── server.py           # FastAPI + WebSocket server
│   ├── pipeline.py         # Threaded pipeline wrapper
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main dashboard layout
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── index.css         # Dark theme + animations
│   │   ├── main.tsx          # Entry point
│   │   └── components/
│   │       ├── VideoFeed.tsx    # WebSocket video stream
│   │       ├── MetricsPanel.tsx # Telemetry gauges
│   │       ├── CriticalAlerts.tsx # Collision warnings
│   │       ├── ConfigPanel.tsx  # System info
│   │       └── ControlsBar.tsx  # Depth toggle
│   ├── package.json
│   └── vite.config.ts
└── docs/                    # Demo recordings (run record_demo.py)
```

<br/>

---

## License 📄

MIT — feel free to use, modify, and distribute.

---

<p align="center">
  <sub>Built for education and research — industrial-grade ADAS perception stack replicating real-world autonomous driving systems.</sub>
  <br/>
  <sub>ADAS Perception Pipeline · 2026</sub>
</p>
