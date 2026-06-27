"""
Record a demo MP4 from the ADAS dashboard WebSocket feed.
Usage:
    python record_demo.py              # 30 seconds, output.mp4
    python record_demo.py --duration 15 --output demo.mp4
"""

import argparse
import json
import time
import cv2
import numpy as np
import websocket

def record_demo(duration=30, output="output.mp4", fps=10, backend_url="localhost:8000"):
    ws_url = f"ws://{backend_url}/ws/stream"
    api_url = f"http://{backend_url}"

    import urllib.request
    # Get initial metrics for overlay
    try:
        resp = urllib.request.urlopen(f"{api_url}/api/metrics", timeout=3)
        metrics = json.loads(resp.read())
        depth_on = metrics.get("depth_on", False)
        mode = metrics.get("mode", "CPU")
    except:
        depth_on, mode = False, "CPU"

    print(f"Connecting to {ws_url} ...")
    ws = websocket.create_connection(ws_url, timeout=10)
    print("Connected. Recording for {duration}s ...")

    frames = []
    start = time.time()
    last_overlay_update = 0

    while time.time() - start < duration:
        try:
            ws.settimeout(1.0)
            data = ws.recv()
        except websocket.TimeoutError:
            continue
        except Exception as e:
            print(f"WS error: {e}")
            break

        if isinstance(data, bytes):
            img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
            if img is not None:
                h, w = img.shape[:2]
                # Add overlay text
                elapsed = time.time() - start
                overlay = [
                    f"ADAS Perception Pipeline",
                    f"Depth: {'ON' if depth_on else 'OFF'} | Mode: {mode}",
                    f"Time: {elapsed:.1f}s",
                ]
                for i, text in enumerate(overlay):
                    cv2.putText(img, text, (12, 30 + i * 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                # Update metrics overlay every 2s
                if time.time() - last_overlay_update > 2:
                    try:
                        resp = urllib.request.urlopen(f"{api_url}/api/metrics", timeout=2)
                        metrics = json.loads(resp.read())
                        fps_val = metrics.get("fps", 0)
                        obj_count = metrics.get("obj_count", 0)
                        risk_counts = metrics.get("risk_counts", {})
                        last_overlay_update = time.time()
                    except:
                        pass

                frames.append(img)
                elapsed = time.time() - start
                print(f"\r  {len(frames)} frames captured ({elapsed:.0f}/{duration}s)", end="")

        elif isinstance(data, str):
            try:
                msg = json.loads(data)
                if msg.get("type") == "metrics":
                    metrics = msg.get("data", {})
                    depth_on = metrics.get("depth_on", depth_on)
                    mode = metrics.get("mode", mode)
            except:
                pass

    ws.close()
    print(f"\nCaptured {len(frames)} frames. Writing video...")

    if not frames:
        print("No frames captured!")
        return False

    h, w = frames[0].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output, fourcc, fps, (w, h))

    for frame in frames:
        out.write(frame)
    out.release()

    print(f"✅ Demo video saved: {output} ({len(frames)} frames, {len(frames)/fps:.0f}s, {w}x{h})")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Record ADAS dashboard demo MP4")
    parser.add_argument("--duration", type=int, default=30, help="Recording duration in seconds")
    parser.add_argument("--output", default="output_adas_demo.mp4", help="Output MP4 path")
    parser.add_argument("--fps", type=int, default=10, help="Output video FPS")
    parser.add_argument("--backend", default="localhost:8000", help="Backend URL")
    args = parser.parse_args()

    record_demo(args.duration, args.output, args.fps, args.backend)
