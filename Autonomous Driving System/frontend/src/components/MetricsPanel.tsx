import type { PipelineMetrics } from '../types'

interface Props { metrics: PipelineMetrics | null }

const s: Record<string, React.CSSProperties> = {
  panel: { background: 'var(--bg-panel)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 },
  title: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-secondary)', paddingBottom: 10, borderBottom: '1px solid var(--border)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  card: { background: 'var(--bg-card)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' },
  label: { fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' },
  val: { fontSize: 20, fontWeight: 700, marginTop: 3, fontFamily: "'JetBrains Mono', monospace" },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: 12 },
}

const dot = (c: string) => ({
  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
  background: c, marginRight: 6, boxShadow: `0 0 6px ${c}40`,
})

function Gauge({ label, value, color, suffix = '' }: { label: string; value: number | string; color: string; suffix?: string }) {
  return (
    <div style={s.card}>
      <div style={s.label}>{label}</div>
      <div style={{ ...s.val, color }}>{value}<span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>{suffix}</span></div>
    </div>
  )
}

export default function MetricsPanel({ metrics }: Props) {
  if (!metrics) {
    return (
      <div style={s.panel}>
        <div style={s.title}>Telemetry</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, padding: 24, textAlign: 'center' }}>Waiting for pipeline...</div>
      </div>
    )
  }

  const riskColor = (r: string) => ({ CRITICAL: '#ff2840', WARNING: '#ffa000', CAUTION: '#ffdc00', SAFE: '#3cff64' }[r] || '#fff')
  const statusColor = { running: '#3cff64', starting: '#ffdc00', stopped: '#ff2840', idle: '#8891a5' }[metrics.status] || '#8891a5'

  return (
    <div style={s.panel}>
      <div style={s.title}>Telemetry</div>
      <div style={s.grid}>
        <Gauge label="FPS" value={metrics.fps} color="#00d4ff" />
        <Gauge label="Latency" value={metrics.latency_ms} color="#3cff64" suffix="ms" />
        <Gauge label="Objects" value={metrics.obj_count} color="#ffdc00" />
        <Gauge label="Frame" value={metrics.frame_idx.toLocaleString()} color="#8891a5" />
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
        <div style={s.label}>Risk Breakdown</div>
        {['CRITICAL', 'WARNING', 'CAUTION', 'SAFE'].map(level => (
          <div key={level} style={s.row}>
            <span><span style={dot(riskColor(level))} />{level}</span>
            <span style={{ fontWeight: 600, color: riskColor(level), fontFamily: "'JetBrains Mono', monospace" }}>{metrics.risk_counts[level] || 0}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: 12, border: '1px solid var(--border)', marginTop: 'auto' }}>
        {[
          ['Mode', metrics.mode, '#00d4ff'],
          ['Status', metrics.status.toUpperCase(), statusColor],
          ['Lane', metrics.departure, metrics.departure.includes('DEPARTURE') ? '#ff2840' : '#3cff64'],
          ['Depth', metrics.depth_on ? 'ON' : 'OFF', metrics.depth_on ? '#3cff64' : '#ff2840'],
        ].map(([label, value, color]) => (
          <div key={label as string} style={{ ...s.row, fontSize: 11 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 600, color, fontFamily: "'JetBrains Mono', monospace" }}>{value as string}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
