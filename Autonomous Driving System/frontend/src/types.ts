export interface PipelineMetrics {
  fps: number
  latency_ms: number
  frame_idx: number
  obj_count: number
  risk_counts: Record<string, number>
  departure: string
  depth_on: boolean
  mode: string
  status: string
  source: string
  critical_alerts: CriticalAlert[]
}

export interface CriticalAlert {
  track_id: number
  label: string
  dist_m: number
  ttc: number
}

export interface Config {
  device: string
  use_gpu: boolean
  fp16: boolean
  yolo_model: string
  display: string
  depth_model: string
}

export type GpuMode = 'auto' | 'gpu' | 'cpu'
