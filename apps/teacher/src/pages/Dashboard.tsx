import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { sessionAPI, questionBankAPI, type SessionConfig, type QuestionBank } from '@quiz-party/shared'

export function Dashboard() {
  const [sessions, setSessions] = useState<SessionConfig[]>([])
  const [banks, setBanks] = useState<QuestionBank[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      sessionAPI.list().catch(() => []),
      questionBankAPI.list().catch(() => []),
    ]).then(([sessData, bankData]) => {
      setSessions(sessData)
      setBanks(bankData)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="text-white/50 text-center py-20">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Dashboard
        </h2>
        <Link
          to="/create"
          className="px-6 py-3 bg-ice text-[var(--deep-sea)] font-semibold rounded-lg hover:bg-ice-light transition-colors"
        >
          New Session
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sessions */}
        <div>
          <h3 className="text-lg font-semibold text-white/80 mb-4">Recent Sessions</h3>
          {sessions.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-white/50">
              No sessions yet. Create your first one!
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 10).map((s) => (
                <div key={s.id} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-ice text-lg">{s.session_code || '------'}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        s.status === 'completed' ? 'bg-white/10 text-white/50' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 mt-1">{s.name}</p>
                  </div>
                  <div className="flex gap-2">
                    {s.status === 'active' && s.session_code && (
                      <Link
                        to={`/host/${s.session_code}`}
                        className="px-3 py-1.5 bg-ice/15 text-ice text-sm rounded-lg hover:bg-ice/25 transition-colors"
                      >
                        Host
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Question Banks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white/80">Question Banks</h3>
            <Link
              to="/banks"
              className="text-sm text-ice hover:text-ice-light transition-colors"
            >
              View All
            </Link>
          </div>
          {banks.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-white/50">
              No question banks yet. Create one to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {banks.slice(0, 5).map((b) => (
                <Link
                  key={b.id}
                  to={`/banks/${b.id}`}
                  className="glass rounded-xl p-4 flex items-center justify-between block hover:bg-white/5 transition-colors"
                >
                  <div>
                    <p className="font-medium text-white">{b.name}</p>
                    <p className="text-sm text-white/50">
                      {b.question_count} questions
                      {b.subject && ` · ${b.subject}`}
                    </p>
                  </div>
                  <span className="text-white/30">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
