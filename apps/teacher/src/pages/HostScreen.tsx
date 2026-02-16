import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  useWebSocket,
  sessionAPI,
  type SessionConfig,
  type PlayerInfo,
  type TeamScore,
  type HostWSMessage,
  GAME_INFO,
  isLobbyUpdate,
  isPlayerConnected,
  isPlayerDisconnected,
  isGameIntro,
  isRoundResults,
  isSessionEnded,
} from '@quiz-party/shared'
import { QRCodeDisplay } from '../components'

export function HostScreen() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const [session, setSession] = useState<SessionConfig | null>(null)
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [teams, setTeams] = useState<TeamScore[]>([])
  const [gamePhase, setGamePhase] = useState<string>('lobby')
  const [currentGame, setCurrentGame] = useState<string | null>(null)
  const [token, setToken] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Get auth token
  useEffect(() => {
    getToken().then((t) => setToken(t || ''))
  }, [getToken])

  // Fetch initial session data
  useEffect(() => {
    if (!code) return
    sessionAPI.getByCode(code)
      .then(setSession)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [code, navigate])

  // Handle WebSocket messages with type guards
  const handleMessage = useCallback((msg: HostWSMessage) => {
    if (isLobbyUpdate(msg)) {
      setPlayers(msg.players)
      setGamePhase(msg.status)
    } else if (isPlayerConnected(msg)) {
      setPlayers((prev) => {
        if (prev.find((p) => p.player_id === msg.player_id)) return prev
        return [...prev, {
          player_id: msg.player_id,
          display_name: msg.display_name,
          team_id: null,
          score: 0,
          connected: true,
        }]
      })
    } else if (isPlayerDisconnected(msg)) {
      setPlayers((prev) =>
        prev.map((p) =>
          p.player_id === msg.player_id ? { ...p, connected: false } : p
        )
      )
    } else if (isGameIntro(msg)) {
      setGamePhase('game_intro')
      setCurrentGame(msg.game_type)
    } else if (isRoundResults(msg)) {
      setGamePhase('round_results')
      if ('teams' in msg) {
        setTeams(msg.teams)
      }
    } else if (isSessionEnded(msg)) {
      setGamePhase('ended')
    }
  }, [])

  // WebSocket connection
  const { isConnected, send, connectionStatus } = useWebSocket<HostWSMessage>({
    sessionCode: code || '',
    role: 'host',
    token,
    onMessage: handleMessage,
    enabled: !!code && !!token,
  })

  // Memoize sorted teams to prevent unnecessary re-renders
  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.rank - b.rank),
    [teams]
  )

  // Memoize current game info to avoid repeated lookups
  const currentGameInfo = useMemo(
    () => currentGame ? GAME_INFO[currentGame as keyof typeof GAME_INFO] : null,
    [currentGame]
  )

  const sendStartGameSignal = () => {
    send({ type: 'start_game' })
  }

  const handleEndSession = async () => {
    if (!code || !confirm('End this session?')) return
    try {
      await sessionAPI.end(code)
      navigate('/')
    } catch {
      // Ignore
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/50" role="status" aria-live="polite">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/50" role="alert" aria-live="assertive">Session not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-xl p-6 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-sm">Session Code</p>
          <p className="text-4xl font-mono font-bold text-ice tracking-wider">{code}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {connectionStatus}
          </div>
          {gamePhase === 'lobby' && (
            <button
              onClick={sendStartGameSignal}
              disabled={players.length < 2}
              className="btn-amber px-6 py-3 disabled:opacity-40"
            >
              Start Game
            </button>
          )}
          <button
            onClick={handleEndSession}
            className="px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            End
          </button>
        </div>
      </div>

      {/* Current Game Info */}
      {currentGameInfo && (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-4xl mb-2">{currentGameInfo.emoji}</p>
          <h2 className="text-2xl font-bold text-white">{currentGameInfo.name}</h2>
          <p className="text-white/60">{currentGameInfo.description}</p>
        </div>
      )}

      {/* Players / Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Players */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Players ({players.length})
          </h3>
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {players.map((p) => (
              <div
                key={p.player_id}
                className={`p-3 rounded-lg ${
                  p.connected ? 'bg-white/5' : 'bg-white/5 opacity-50'
                }`}
              >
                <p className="font-medium text-white truncate">{p.display_name}</p>
                <p className="text-sm text-white/50">{p.score} pts</p>
              </div>
            ))}
            {players.length === 0 && (
              <p className="col-span-2 text-center text-white/40 py-8">
                Waiting for players to join...
              </p>
            )}
          </div>
        </div>

        {/* Team Scores */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Team Scores</h3>
          <div className="space-y-2">
            {sortedTeams.map((t) => (
              <div
                key={t.team_id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-ice">#{t.rank}</span>
                  <span className="text-white font-medium">{t.name}</span>
                </div>
                <span className="text-white font-mono">{t.total_score}</span>
              </div>
            ))}
            {sortedTeams.length === 0 && (
              <p className="text-center text-white/40 py-8">
                Scores will appear once the game starts
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Join Instructions with QR Code */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-white/60 mb-2">Students join at</p>
            <p className="text-ice font-mono text-xl">quizparty.rcnr.net</p>
            <p className="text-white/40 text-sm mt-2">Code: <span className="font-mono text-ice">{code}</span></p>
          </div>
          {code && <QRCodeDisplay sessionCode={code} />}
        </div>
      </div>
    </div>
  )
}
