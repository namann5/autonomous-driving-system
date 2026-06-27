import type { Config } from '../types'

interface Props { config: Config | null }

export default function ConfigPanel({ config }: Props) {
  if (!config) return null

  const rows: [string, string][] = [
    ['Device', config.device],
    ['GPU', config.use_gpu ? `Yes${config.fp16 ? ' + FP16' : ''}` : 'No'],
    ['YOLO', config.yolo_model],
    ['Depth', config.depth_model],
    ['Display', config.display],
  ]

  return (
    <div style={{ background: 'var(--bg-panel)', padding: '12px 16px' }}>
      <div style={{
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px',
        color: 'var(--text-secondary)', paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 8,
      }}>
        System
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 11, padding: '3px 0',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
