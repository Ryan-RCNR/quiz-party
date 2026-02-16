import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { questionBankAPI, type QuestionBank } from '@quiz-party/shared'

export function QuestionBanks() {
  const [banks, setBanks] = useState<QuestionBank[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSubject, setNewSubject] = useState('')

  useEffect(() => {
    questionBankAPI.list()
      .then(setBanks)
      .catch(() => setBanks([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setCreating(true)
    try {
      const bank = await questionBankAPI.create({
        name: newName.trim(),
        subject: newSubject.trim() || undefined,
      })
      setBanks((prev) => [bank, ...prev])
      setNewName('')
      setNewSubject('')
    } catch {
      // Handle error
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="text-white/50 text-center py-20">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Question Banks
        </h2>
        <Link to="/" className="text-white/50 hover:text-white transition-colors">
          ← Back
        </Link>
      </div>

      {/* Create New Bank */}
      <form onSubmit={handleCreate} className="glass rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Create New Bank</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Bank name *"
            maxLength={50}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-ice"
          />
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Subject (optional)"
            maxLength={30}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-ice"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="btn-amber px-6 py-3 disabled:opacity-40"
          >
            {creating ? 'Creating...' : 'Create Bank'}
          </button>
        </div>
      </form>

      {/* Bank List */}
      {banks.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-white/50">
          No question banks yet. Create your first one above!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((b) => (
            <Link
              key={b.id}
              to={`/banks/${b.id}`}
              className="glass rounded-xl p-6 hover:bg-white/5 transition-colors"
            >
              <h3 className="text-lg font-bold text-white mb-2">{b.name}</h3>
              <p className="text-white/50 text-sm mb-4">
                {b.question_count} questions
                {b.subject && ` · ${b.subject}`}
              </p>
              {b.description && (
                <p className="text-white/40 text-sm line-clamp-2">{b.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
