import type { GpuMode } from '../types'

interface Props {
  depthOn: boolean
  onToggleDepth: () => void
  gpuMode: GpuMode
  onToggleGpu: () => void
  disabled: boolean
}

const btn = (active: boolean, accent: string) => ({
  display: 'flex' as const, alignItems: 'center' as const, gap: 6,
  padding: '5px 10px', borderRadius: 6,
  border: `1px solid ${active ? `${accent}4d` : 'rgba(136,145,165,0.25)'}`,
  background: active ? `rgba(${hexToRgb(accent)},0.08)` : 'transparent',
  color: active ? accent : 'var(--text-secondary)',
  fontSize: 11, fontWeight: 600, cursor: 'pointer' as const,
  opacity: 1,
  transition: 'all 0.2s',
  letterSpacing: '0.3px',
})

const dot = (active: boolean, accent: string) => ({
  width: 6, height: 6, borderRadius: '50%',
  background: active ? accent : 'var(--text-secondary)',
  boxShadow: active ? `0 0 6px ${accent}` : 'none',
})

function hexToRgb(hex: string) {
  const v = parseInt(hex.slice(1), 16)
  return `${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}`
}

export default function ControlsBar({ depthOn, onToggleDepth, gpuMode, onToggleGpu, disabled }: Props) {
  const gpuActive = gpuMode === 'gpu'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={onToggleDepth} disabled={disabled} style={btn(depthOn, '#00d4ff')}>
        <span style={dot(depthOn, '#00d4ff')} />
        Depth: {depthOn ? 'ON' : 'OFF'}
      </button>
      <button onClick={onToggleGpu} disabled={disabled} style={btn(gpuActive, '#b388ff')}>
        <span style={dot(gpuActive, '#b388ff')} />
        GPU: {gpuMode === 'gpu' ? 'ON' : gpuMode === 'cpu' ? 'OFF' : 'AUTO'}
      </button>
    </div>
  )
}
