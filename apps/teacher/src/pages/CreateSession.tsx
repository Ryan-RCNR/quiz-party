import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  sessionAPI,
  questionBankAPI,
  type QuestionBank,
  type SessionPreset,
  type ChaosLevel,
} from '@quiz-party/shared'

const PRESETS: Record<SessionPreset, { name: string; rounds: number; description: string }> = {
  quick: { name: 'Quick', rounds: 3, description: '~10 minutes' },
  standard: { name: 'Standard', rounds: 5, description: '~20 minutes' },
  extended: { name: 'Extended', rounds: 7, description: '~30 minutes' },
}

const CHAOS_LEVELS: Record<ChaosLevel, { name: string; description: string }> = {
  chill: { name: 'Chill', description: 'No random events' },
  spicy: { name: 'Spicy', description: 'Occasional surprises' },
  max: { name: 'Max Chaos', description: 'Expect the unexpected!' },
}

export function CreateSession() {
  const navigate = useNavigate()
  const [banks, setBanks] = useState<QuestionBank[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [preset, setPreset] = useState<SessionPreset>('standard')
  const [chaosLevel, setChaosLevel] = useState<ChaosLevel>('spicy')
  const [teamCount, setTeamCount] = useState(4)

  useEffect(() => {
    questionBankAPI.list()
      .then(setBanks)
      .catch((err) => {
        console.error('Failed to load question banks:', err)
        setBanks([])
        setError('Failed to load question banks. Please refresh the page.')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBank) {
      setError('Please select a question bank')
      return
    }

    setCreating(true)
    setError('')

    try {
      const result = await sessionAPI.create({
        name: name || 'Quiz Party Session',
        question_bank_id: selectedBank,
        preset,
        chaos_level: chaosLevel,
        team_count: teamCount,
      })
      // Navigate on success - if this throws, finally will reset state
      navigate(`/host/${result.session_code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="text-white/50 text-center py-20">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          New Session
        </h2>
        <Link to="/" className="text-white/50 hover:text-white transition-colors">
          ← Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Session Name */}
        <div className="glass rounded-xl p-6">
          <label className="block text-white/80 font-medium mb-2">Session Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Chapter 5 Review"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-ice"
          />
        </div>

        {/* Question Bank */}
        <div className="glass rounded-xl p-6">
          <label className="block text-white/80 font-medium mb-2">Question Bank *</label>
          {banks.length === 0 ? (
            <div className="text-white/50 text-center py-4">
              No question banks available.{' '}
              <Link to="/banks" className="text-ice underline">Create one</Link>
            </div>
          ) : (
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-ice"
            >
              <option value="">Select a question bank...</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.question_count} questions)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Preset */}
        <div className="glass rounded-xl p-6">
          <label className="block text-white/80 font-medium mb-3">Session Length</label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(PRESETS).map(([key, info]) => {
              const presetKey = key as SessionPreset
              const isSelected = preset === presetKey
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPreset(presetKey)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    isSelected
                      ? 'border-ice bg-ice/10 text-white'
                      : 'border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  <p className="font-bold">{info.name}</p>
                  <p className="text-xs opacity-60">{info.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chaos Level */}
        <div className="glass rounded-xl p-6">
          <label className="block text-white/80 font-medium mb-3">Chaos Level</label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(CHAOS_LEVELS).map(([key, info]) => {
              const chaosKey = key as ChaosLevel
              const isSelected = chaosLevel === chaosKey
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChaosLevel(chaosKey)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    isSelected
                      ? 'border-ice bg-ice/10 text-white'
                      : 'border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  <p className="font-bold">{info.name}</p>
                  <p className="text-xs opacity-60">{info.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Team Count */}
        <div className="glass rounded-xl p-6">
          <label className="block text-white/80 font-medium mb-2">
            Teams: {teamCount}
          </label>
          <input
            type="range"
            min="2"
            max="8"
            value={teamCount}
            onChange={(e) => setTeamCount(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white/40 mt-1">
            <span>2</span>
            <span>8</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={creating || !selectedBank}
          className="w-full py-4 bg-ice text-[var(--deep-sea)] font-bold text-lg rounded-xl disabled:opacity-40 hover:bg-ice-light transition-colors"
        >
          {creating ? 'Creating...' : 'Create Session'}
        </button>
      </form>
    </div>
  )
}
