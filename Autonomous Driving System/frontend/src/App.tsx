import { useEffect, useState, useCallback, useRef } from 'react'
import VideoFeed from './components/VideoFeed'
import MetricsPanel from './components/MetricsPanel'
import CriticalAlerts from './components/CriticalAlerts'
import ConfigPanel from './components/ConfigPanel'
import ControlsBar from './components/ControlsBar'
import type { PipelineMetrics, Config, GpuMode } from './types'

const FETCH_INTERVAL = 2000

export default function App() {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [restarting, setRestarting] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [gpuMode, setGpuMode] = useState<GpuMode>('auto')
  const feedRef = useRef<HTMLDivElement>(null)

  const depthOn = metrics?.depth_on ?? true
  const restartingDepth = useRef<boolean | null>(null)
  const restartingGpu = useRef<GpuMode>('auto')
  if (restarting) {
    restartingDepth.current = depthOn
    restartingGpu.current = gpuMode
  }

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics')
      const data = await res.json()
      if (data?.metrics) {
        setMetrics(data.metrics as PipelineMetrics)
      } else {
        setMetrics(data as unknown as PipelineMetrics)
      }
      setConnectionStatus('connected')
    } catch {
      setConnectionStatus('disconnected')
    }
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      setConfig(data as Config)
    } catch { /* ignore */ }
  }, [])

  const restartPipeline = useCallback(async (params: string) => {
    setRestarting(true)
    try {
      await fetch(`/api/restart${params}`, { method: 'POST' })
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000))
        try {
          const res = await fetch('/api/metrics')
          const data = await res.json()
          const m = data?.metrics ?? data
          if (m?.status === 'running' && m?.frame_idx > 5) break
        } catch { /* retry */ }
      }
    } finally {
      setRestarting(false)
    }
  }, [])

  const handleToggleDepth = useCallback(async () => {
    const next = !depthOn
    const gpuParam = gpuMode === 'auto' ? '' : `&use_gpu=${gpuMode === 'gpu'}`
    await restartPipeline(`?no_depth=${!next}${gpuParam}`)
  }, [depthOn, gpuMode, restartPipeline])

  const handleToggleGpu = useCallback(async () => {
    const next: GpuMode = gpuMode === 'auto' ? 'gpu' : gpuMode === 'gpu' ? 'cpu' : 'auto'
    const gpuVal = next === 'auto' ? '' : `&use_gpu=${next === 'gpu'}`
    setGpuMode(next)
    await restartPipeline(`?no_depth=${!depthOn}${gpuVal}`)
  }, [gpuMode, depthOn, restartPipeline])

  const toggleFullscreen = useCallback(() => {
    setFullscreen(f => !f)
  }, [])

  useEffect(() => {
    fetchConfig()
    const id = setInterval(fetchMetrics, FETCH_INTERVAL)
    return () => clearInterval(id)
  }, [fetchConfig, fetchMetrics])

  const statusColor = connectionStatus === 'connected' ? '#3cff64'
    : connectionStatus === 'connecting' ? '#ffdc00' : '#ff2840'
  const statusText = connectionStatus === 'connected' ? 'Live'
    : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(ellipse at 50% 0%, #0e1620 0%, #07090e 70%)',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 48,
        background: 'rgba(14,17,23,0.9)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
        flexShrink: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 17a4 4 0 0 1 0-8 7 7 0 0 1 14 0 4 4 0 0 1 0 8" />
            <path d="m9 17 3 3 3-3" />
          </svg>
          <h1 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.3px' }}>
            ADAS <span style={{ color: '#00d4ff' }}>Perception</span>
          </h1>
          <span style={{
            fontSize: 10,
            color: 'var(--text-secondary)',
            background: 'rgba(42,46,58,0.5)',
            padding: '2px 8px',
            borderRadius: 4,
            letterSpacing: '0.5px',
          }}>
            REAL-TIME
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ControlsBar
            depthOn={depthOn}
            onToggleDepth={handleToggleDepth}
            gpuMode={gpuMode}
            onToggleGpu={handleToggleGpu}
            disabled={restarting}
          />

          <button onClick={toggleFullscreen} style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '5px 8px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            transition: 'all 0.15s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {fullscreen
                ? <><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></>
                : <><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>
              }
            </svg>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            color: statusColor,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            <span style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
              animation: connectionStatus === 'connected' ? 'pulse 2s infinite' : 'none',
            }} />
            {statusText}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 0,
        overflow: 'hidden',
      }}>
        {/* Video Area */}
        <div ref={feedRef} style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: fullscreen ? 0 : 12,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            borderRadius: fullscreen ? 0 : 10,
            overflow: 'hidden',
            border: fullscreen ? 'none' : '1px solid var(--border)',
          }}>
            <VideoFeed />

            {/* Loading overlay */}
            {restarting && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(7,9,14,0.88)',
                backdropFilter: 'blur(4px)',
                zIndex: 10,
                gap: 16,
              }}>
                <div style={{
                  width: 36, height: 36,
                  border: '2px solid rgba(42,46,58,0.5)',
                  borderTopColor: '#00d4ff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#00d4ff', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    {restartingGpu.current !== 'auto'
                      ? `Switching to ${restartingGpu.current === 'gpu' ? 'GPU' : 'CPU'}...`
                      : `${restartingDepth.current ? 'Disabling' : 'Enabling'} Depth...`}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                    Reloading pipeline (may take ~30s)
                  </div>
                </div>
              </div>
            )}

            {/* Scanline overlay */}
            {!fullscreen && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
                pointerEvents: 'none',
                zIndex: 2,
              }} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        {!fullscreen && (
          <div style={{
            width: 300,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '12px 12px 12px 0',
            overflow: 'hidden',
          }}>
            <div style={{ overflow: 'hidden', borderRadius: 10, border: '1px solid var(--border)' }}>
              <MetricsPanel metrics={metrics} />
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              overflow: 'hidden',
              flex: 1,
            }}>
              <div style={{
                overflow: 'hidden',
                borderRadius: 10,
                border: '1px solid var(--border)',
                flex: 1,
                minHeight: 0,
              }}>
                <CriticalAlerts alerts={metrics?.critical_alerts || []} />
              </div>
              <div style={{ overflow: 'hidden', borderRadius: 10, border: '1px solid var(--border)' }}>
                <ConfigPanel config={config} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
