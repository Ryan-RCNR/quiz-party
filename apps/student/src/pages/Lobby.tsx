import { useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWebSocket, playerAPI } from '@quiz-party/shared'

export function Lobby() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const session = playerAPI.getStoredSession()

  const handleMessage = useCallback((data: Record<string, unknown>) => {
    if (data.type === 'game_intro' || data.type === 'question') {
      navigate(`/play/${code}`)
    }
    if (data.type === 'session_ended') {
      playerAPI.clearSession()
      navigate('/join')
    }
  }, [code, navigate])

  const { isConnected, connectionStatus } = useWebSocket({
    sessionCode: code || '',
    role: 'player',
    playerId: session?.playerId,
    playerToken: session?.playerToken,
    onMessage: handleMessage,
    enabled: !!code && !!session,
  })

  useEffect(() => {
    if (!session) {
      navigate('/join')
    }
  }, [session, navigate])

  if (!session) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-[var(--ice)] font-bold text-2xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Quiz Party
        </h1>
        <p className="text-white/40 text-sm mb-6">Session: {code}</p>

        <div className="mb-8">
          <p className="text-white text-xl font-bold mb-1">{session.displayName}</p>
          {session.teamName && (
            <p className="text-[var(--ice)] text-sm">Team: {session.teamName}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
          <span className="text-white/60 text-sm">
            {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        <div className="bg-white/5 rounded-xl p-6">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-white font-medium">Waiting for host to start...</p>
          <p className="text-white/40 text-sm mt-2">Get ready to play!</p>
        </div>
      </div>
    </div>
  )
}
