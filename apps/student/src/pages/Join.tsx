import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { playerAPI, type PlayerSession } from '@quiz-party/shared'

export function Join() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewGameForm, setShowNewGameForm] = useState(false)

  // Check for existing session
  const existing = !showNewGameForm ? playerAPI.getStoredSession() : null
  if (existing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="glass rounded-2xl p-6 w-full max-w-sm text-center">
          <p className="text-white/60 text-sm mb-2">Previous session found</p>
          <p className="text-white font-bold text-lg mb-4">
            {existing.displayName} in {existing.sessionCode}
          </p>
          <button
            onClick={async () => {
              setLoading(true)
              setError('')
              try {
                const res = await playerAPI.reconnect(existing.sessionCode, existing.playerToken)
                const updated: PlayerSession = {
                  ...existing,
                  teamId: res.team_id,
                  teamName: res.team_name,
                }
                playerAPI.storeSession(updated)
                if (res.status === 'lobby') {
                  navigate(`/lobby/${existing.sessionCode}`)
                } else {
                  navigate(`/play/${existing.sessionCode}`)
                }
              } catch {
                playerAPI.clearSession()
                setError('Session expired. Join a new game.')
                setLoading(false)
              }
            }}
            disabled={loading}
            className="w-full py-3 bg-[var(--ice)] text-[var(--deep-sea)] font-bold rounded-xl mb-3 disabled:opacity-50"
          >
            {loading ? 'Reconnecting...' : 'Rejoin Game'}
          </button>
          <button
            onClick={() => {
              playerAPI.clearSession()
              setShowNewGameForm(true)
            }}
            className="text-white/40 text-sm underline"
          >
            Join a different game
          </button>
          {error && <p role="alert" aria-live="polite" className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      </div>
    )
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = name.trim()

    // Validate game code format (alphanumeric, 4-6 characters)
    const codePattern = /^[A-Z0-9]{4,6}$/
    if (!codePattern.test(trimmedCode)) {
      setError('Enter a valid game code (4-6 alphanumeric characters)')
      return
    }
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    if (trimmedName.length > 20) {
      setError('Name must be 20 characters or less')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await playerAPI.join(trimmedCode, trimmedName)
      const session: PlayerSession = {
        playerId: res.player_id,
        playerToken: res.player_token,
        displayName: res.display_name,
        sessionCode: res.session_code,
        teamId: res.team_id,
        teamName: res.team_name,
      }
      playerAPI.storeSession(session)
      navigate(`/lobby/${trimmedCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join game. Check the code and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-[var(--ice)] font-bold text-3xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        Quiz Party
      </h1>
      <p className="text-white/40 mb-8">Enter the code from the screen</p>

      <form onSubmit={handleJoin} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="GAME CODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          maxLength={6}
          autoFocus
          className="w-full text-center font-mono text-3xl tracking-[0.3em] py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--ice)]"
        />
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          className="w-full text-center text-lg py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--ice)]"
        />
        <button
          type="submit"
          disabled={loading || !code.trim() || !name.trim()}
          className="w-full py-4 bg-[var(--ice)] text-[var(--deep-sea)] font-bold text-lg rounded-xl disabled:opacity-40 active:scale-[0.97] transition-transform"
        >
          {loading ? 'Joining...' : 'JOIN'}
        </button>
        {error && <p role="alert" aria-live="polite" className="text-red-400 text-sm text-center">{error}</p>}
      </form>
    </div>
  )
}
