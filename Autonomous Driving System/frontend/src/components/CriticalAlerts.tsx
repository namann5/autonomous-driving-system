import type { CriticalAlert } from '../types'

interface Props { alerts: CriticalAlert[] }

export default function CriticalAlerts({ alerts }: Props) {
  const hasAlerts = alerts.length > 0

  return (
    <div style={{
      background: 'var(--bg-panel)', padding: 16, display: 'flex', flexDirection: 'column',
      height: '100%', minHeight: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px',
        color: hasAlerts ? '#ff2840' : '#3cff64',
        paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 10,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: hasAlerts ? '#ff2840' : '#3cff64',
          boxShadow: hasAlerts ? '0 0 10px #ff2840' : 'none',
          animation: hasAlerts ? 'pulse 1s infinite' : 'none',
        }} />
        Critical Alerts
        {hasAlerts && <span style={{ fontSize: 10, color: '#ff2840' }}>({alerts.length})</span>}
      </div>

      {!hasAlerts ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.6,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3cff64" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span style={{ color: '#3cff64', fontSize: 12, fontWeight: 500 }}>All Clear</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>No critical risks detected</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              background: 'rgba(255,40,64,0.08)', border: '1px solid rgba(255,40,64,0.25)',
              borderRadius: 8, padding: '10px 12px',
              animation: 'slideUp 0.3s ease-out',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: '#ff2840', fontSize: 13 }}>{a.label} #{a.track_id}</span>
                <span style={{
                  fontSize: 9, color: '#ff2840', fontWeight: 700, letterSpacing: '0.5px',
                  background: 'rgba(255,40,64,0.15)', padding: '2px 6px', borderRadius: 4,
                }}>
                  COLLISION
                </span>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--text-secondary)' }}>
                <span>Dist <strong style={{ color: '#ffa000', fontFamily: "'JetBrains Mono', monospace" }}>{a.dist_m.toFixed(1)}m</strong></span>
                <span>TTC <strong style={{ color: '#ffa000', fontFamily: "'JetBrains Mono', monospace" }}>{a.ttc < 999 ? `${a.ttc.toFixed(1)}s` : '--'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
