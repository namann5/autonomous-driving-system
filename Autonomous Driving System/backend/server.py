import asyncio
import json
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from pipeline import ADASPipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("adas-server")

pipeline: ADASPipeline | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline
    logger.info("Server starting. Pipeline will start on first connection.")
    yield
    if pipeline and pipeline.running:
        pipeline.stop()
        logger.info("Pipeline stopped.")


app = FastAPI(title="ADAS Perception API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/metrics")
async def get_metrics():
    if pipeline is None:
        return JSONResponse({"status": "not_started", "metrics": {}})
    return JSONResponse(pipeline.get_metrics())


@app.get("/api/config")
async def get_config():
    from driving import CFG, resolve_device
    if pipeline and pipeline.running:
        dev = str(pipeline._device)
        gpu = pipeline._use_gpu
        fp16 = pipeline._use_fp16
    else:
        dev, gpu, fp16 = resolve_device(None)
        dev = str(dev)
    return {
        "device": dev,
        "use_gpu": gpu,
        "fp16": fp16,
        "yolo_model": CFG["yolo_model"],
        "display": f"{CFG['display_w']}x{CFG['display_h']}",
        "depth_model": CFG["depth_model"],
    }


@app.post("/api/start")
async def start_pipeline(source: str = "0", no_depth: bool = False, use_gpu: bool | None = None):
    global pipeline
    if pipeline and pipeline.running:
        return JSONResponse({"status": "already_running"})
    if pipeline:
        pipeline.stop()
    pipeline = ADASPipeline(source=source, no_depth=no_depth, use_gpu=use_gpu)
    pipeline.start()
    logger.info(f"Pipeline started with source={source}, no_depth={no_depth}, use_gpu={use_gpu}")
    return JSONResponse({"status": "started"})


@app.post("/api/restart")
async def restart_pipeline(no_depth: bool = False, use_gpu: bool | None = None):
    global pipeline
    if pipeline and pipeline.running:
        pipeline.stop()
        pipeline.join(timeout=5)
    pipeline = ADASPipeline(source="0", no_depth=no_depth, use_gpu=use_gpu)
    pipeline.start()
    logger.info(f"Pipeline restarted with no_depth={no_depth}, use_gpu={use_gpu}")
    return JSONResponse({"status": "restarted", "no_depth": no_depth, "use_gpu": use_gpu})


@app.post("/api/stop")
async def stop_pipeline():
    global pipeline
    if pipeline and pipeline.running:
        pipeline.stop()
        logger.info("Pipeline stopped.")
    return JSONResponse({"status": "stopped"})


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    global pipeline
    await websocket.accept()
    logger.info("WebSocket connected")

    if pipeline is None or not pipeline.running:
        pipeline = ADASPipeline(source="0", use_gpu=None)
        pipeline.start()
        logger.info("Pipeline auto-started on WebSocket connection")

    try:
        while True:
            try:
                frame_bytes = await asyncio.get_event_loop().run_in_executor(
                    None, pipeline.frame_queue.get, 0.1
                )
                await websocket.send_bytes(frame_bytes)
            except Exception:
                metrics = pipeline.get_metrics()
                await websocket.send_json({"type": "metrics", "data": metrics})
                await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
