import { useEffect, useRef } from 'react'

export default function VideoFeed() {
  const imgRef = useRef<HTMLImageElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws/stream`

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.binaryType = 'arraybuffer'

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer && imgRef.current) {
          const blob = new Blob([event.data], { type: 'image/jpeg' })
          const url = URL.createObjectURL(blob)
          if (urlRef.current) URL.revokeObjectURL(urlRef.current)
          urlRef.current = url
          imgRef.current.src = url
        }
      }

      ws.onclose = () => setTimeout(connect, 2000)
      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      wsRef.current?.close()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <img
        ref={imgRef}
        alt="ADAS Video Feed"
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain',
        }}
      />
      <div style={{
        position: 'absolute', bottom: 10, left: 10,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        padding: '4px 10px', borderRadius: 6,
        border: '1px solid rgba(60,255,100,0.3)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#3cff64', boxShadow: '0 0 8px #3cff64',
          animation: 'pulse 2s infinite',
        }} />
        <span style={{ fontSize: 10, color: '#3cff64', fontWeight: 600, letterSpacing: '0.5px' }}>
          LIVE
        </span>
      </div>
    </div>
  )
}
