import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import threading
import queue
import time
import json
import cv2
import numpy as np
from dataclasses import dataclass, field, asdict
from typing import Optional

from driving import (
    ObjectDetectorTracker, DepthEstimator, CollisionRiskAssessor,
    BEVRenderer, PointCloudRenderer, LaneDetector, SegmentationEngine,
    HUDRenderer, FPSCounter, open_source, CFG, resolve_device,
)

@dataclass
class PipelineMetrics:
    fps: float = 0.0
    latency_ms: float = 0.0
    frame_idx: int = 0
    obj_count: int = 0
    risk_counts: dict = field(default_factory=lambda: {"SAFE": 0, "CAUTION": 0, "WARNING": 0, "CRITICAL": 0})
    departure: str = "CENTERED"
    depth_on: bool = True
    mode: str = "CPU"
    status: str = "idle"
    source: str = ""
    critical_alerts: list = field(default_factory=list)


class ADASPipeline(threading.Thread):
    def __init__(self, source: str = "0", no_depth: bool = False, use_gpu: bool | None = None):
        super().__init__(daemon=True)
        self.source = source
        self.no_depth = no_depth
        self._device, self._use_gpu, self._use_fp16 = resolve_device(use_gpu)
        self.frame_queue: queue.Queue = queue.Queue(maxsize=4)
        self.metrics = PipelineMetrics()
        self.metrics.mode = "GPU FP16" if self._use_fp16 else ("GPU" if self._use_gpu else "CPU")
        self.metrics.depth_on = not no_depth
        self.metrics.source = source
        self._stop_event = threading.Event()
        self._lock = threading.Lock()

    def stop(self):
        self._stop_event.set()

    @property
    def running(self):
        return not self._stop_event.is_set()

    def get_metrics(self) -> dict:
        with self._lock:
            return asdict(self.metrics)

    def _update_metrics(self, **kwargs):
        with self._lock:
            for k, v in kwargs.items():
                if hasattr(self.metrics, k):
                    setattr(self.metrics, k, v)

    def run(self):
        self._update_metrics(status="starting")
        try:
            detector = ObjectDetectorTracker(device=self._device, use_fp16=self._use_fp16)
            depth_eng = None if self.no_depth else DepthEstimator(device=self._device, use_fp16=self._use_fp16)
            risk_eng = CollisionRiskAssessor()
            bev_render = BEVRenderer()
            pc_render = PointCloudRenderer()
            fps_ctr = FPSCounter()

            cap = open_source(self.source)
            src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            DW = CFG["display_w"]
            DH = CFG["display_h"]

            lane_det = LaneDetector(DH, DW)
            seg_eng = SegmentationEngine(DH, DW)
            hud = HUDRenderer(DW, DH)

            frame_idx = 0
            depth_map = None
            depth_col = None
            seg_map = None
            lp = rp = None
            departure = "CENTERED"
            tracks_r = []

            self._update_metrics(status="running")

            while not self._stop_event.is_set():
                ret, raw_frame = cap.read()
                if not ret:
                    break

                frame_idx += 1
                t_start = time.perf_counter()

                frame = cv2.resize(raw_frame, (DW, DH))
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

                tracks = detector.run(frame)

                if depth_eng is not None and frame_idx % CFG["depth_interval"] == 0:
                    depth_map = depth_eng.run(frame_rgb)
                    depth_col = depth_eng.false_color(depth_map)

                if frame_idx % CFG["seg_interval"] == 0:
                    seg_map = seg_eng.run(frame, depth_map, tracks)

                lp, rp, departure = lane_det.run(frame_gray)

                if depth_map is not None:
                    tracks_r = risk_eng.assess(tracks, depth_map, DH, depth_eng)
                else:
                    tracks_r = [{**t, "dist_m": 99.9, "ttc": 999.0,
                                 "risk": "SAFE", "v_avg": 0.0} for t in tracks]

                bev_img = bev_render.render(tracks_r, DW, DH)
                if depth_map is not None:
                    pc_img = pc_render.render(depth_map, seg_map)
                else:
                    pc_img = np.zeros((CFG["pc_panel_h"], CFG["pc_panel_w"], 3), dtype=np.uint8)

                canvas = frame.copy()
                if seg_map is not None:
                    canvas = seg_eng.colour_overlay(canvas, seg_map)
                hud.draw_lanes(canvas, lp, rp, departure)
                hud.draw_tracks(canvas, tracks_r)
                hud.draw_side_panels(canvas, bev_img, pc_img)
                if depth_col is not None:
                    hud.draw_depth_panel(canvas, depth_col)
                hud.draw_collision_banner(canvas, tracks_r)

                fps_ctr.tick()
                latency = (time.perf_counter() - t_start) * 1000.0

                risk_counts = {"SAFE": 0, "CAUTION": 0, "WARNING": 0, "CRITICAL": 0}
                for t in tracks_r:
                    risk_counts[t["risk"]] = risk_counts.get(t["risk"], 0) + 1

                hud.draw_top_bar(canvas, fps_ctr.fps, latency,
                                 frame_idx, len(tracks_r), self.metrics.mode)
                hud.draw_bottom_bar(canvas, departure, risk_counts,
                                    depth_map is not None, self.metrics.mode)

                _, buffer = cv2.imencode(".jpg", canvas, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_bytes = buffer.tobytes()

                critical = [t for t in tracks_r if t.get("risk") == "CRITICAL"]
                alerts = []
                for c in critical[:3]:
                    from driving import CLASS_LABELS
                    label = CLASS_LABELS.get(c["cls"], "OBJ")
                    alerts.append({
                        "track_id": c["track_id"],
                        "label": label,
                        "dist_m": c.get("dist_m", 0),
                        "ttc": c.get("ttc", 999),
                    })

                self._update_metrics(
                    fps=round(fps_ctr.fps, 1),
                    latency_ms=round(latency, 1),
                    frame_idx=frame_idx,
                    obj_count=len(tracks_r),
                    risk_counts=risk_counts,
                    departure=departure,
                    critical_alerts=alerts,
                )

                try:
                    self.frame_queue.put(frame_bytes, timeout=0.1)
                except queue.Full:
                    pass

            cap.release()

        except Exception as e:
            self._update_metrics(status=f"error: {str(e)}")
            raise
        finally:
            self._update_metrics(status="stopped")
