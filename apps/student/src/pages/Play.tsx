import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useWebSocket,
  playerAPI,
  type WSPlayerQuestion,
  type WSAnswerResult,
  type MiniGameType,
  GAME_INFO,
} from '@quiz-party/shared'

interface GameState {
  phase: 'waiting' | 'question' | 'result' | 'intermission' | 'ended'
  currentQuestion: WSPlayerQuestion | null
  lastResult: WSAnswerResult | null
  selectedAnswer: number | null
  timeRemaining: number
  score: number
  currentGame: MiniGameType | null
}

export function Play() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const session = playerAPI.getStoredSession()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastQuestionIdRef = useRef<string | null>(null)

  const [state, setState] = useState<GameState>({
    phase: 'waiting',
    currentQuestion: null,
    lastResult: null,
    selectedAnswer: null,
    timeRemaining: 0,
    score: 0,
    currentGame: null,
  })

  const handleMessage = useCallback((data: Record<string, unknown>) => {
    const msg = data as { type: string } & Record<string, unknown>

    switch (msg.type) {
      case 'game_intro': {
        setState((prev) => ({
          ...prev,
          phase: 'intermission',
          currentGame: msg.game_type as MiniGameType,
        }))
        break
      }
      case 'question': {
        const q = msg as unknown as WSPlayerQuestion
        setState((prev) => ({
          ...prev,
          phase: 'question',
          currentQuestion: q,
          selectedAnswer: null,
          timeRemaining: q.time_limit,
          currentGame: q.game_type,
        }))
        break
      }
      case 'answer_result': {
        const result = msg as unknown as WSAnswerResult
        setState((prev) => ({
          ...prev,
          phase: 'result',
          lastResult: result,
          score: result.new_total,
        }))
        break
      }
      case 'round_results': {
        const yourScore = typeof msg.your_score === 'number' ? msg.your_score : undefined
        setState((prev) => ({
          ...prev,
          phase: 'intermission',
          score: yourScore ?? prev.score,
        }))
        break
      }
      case 'session_ended':
        setState((prev) => ({ ...prev, phase: 'ended' }))
        break
    }
  }, [])

  const { isConnected, send } = useWebSocket({
    sessionCode: code || '',
    role: 'player',
    playerId: session?.playerId,
    playerToken: session?.playerToken,
    onMessage: handleMessage,
    enabled: !!code && !!session,
  })

  // Timer countdown - only restart when phase changes or question_id changes
  const currentQuestionId = state.currentQuestion?.question_id ?? null
  useEffect(() => {
    // Track question changes to restart timer on new questions
    const isNewQuestion = currentQuestionId !== lastQuestionIdRef.current
    lastQuestionIdRef.current = currentQuestionId

    if (state.phase === 'question' && (isNewQuestion || state.timeRemaining > 0)) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.timeRemaining <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return { ...prev, timeRemaining: 0 }
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 }
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state.phase, currentQuestionId])

  useEffect(() => {
    if (!session) {
      navigate('/join')
    }
  }, [session, navigate])

  const handleAnswer = (index: number) => {
    if (state.selectedAnswer !== null || !state.currentQuestion) return

    setState((prev) => ({ ...prev, selectedAnswer: index }))
    send({
      type: 'answer',
      question_id: state.currentQuestion!.question_id,
      answer_index: index,
      time_ms: (state.currentQuestion!.time_limit - state.timeRemaining) * 1000,
    })
  }

  if (!session) return null

  const gameInfo = state.currentGame ? GAME_INFO[state.currentGame] : null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">{session.displayName}</p>
            {session.teamName && (
              <p className="text-white/50 text-xs">{session.teamName}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[var(--ice)] font-bold text-xl">{state.score}</p>
            <p className="text-white/40 text-xs">points</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Waiting */}
        {state.phase === 'waiting' && (
          <div className="text-center" role="status" aria-live="polite">
            <div className="text-5xl mb-4" aria-hidden="true">⏳</div>
            <p className="text-white/60">Waiting for next question...</p>
            <p className={`text-sm mt-2 ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </p>
          </div>
        )}

        {/* Intermission / Game Intro */}
        {state.phase === 'intermission' && gameInfo && (
          <div className="text-center glass rounded-2xl p-8 w-full max-w-md" role="status" aria-live="polite">
            <div className="text-6xl mb-4" aria-hidden="true">{gameInfo.emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2">{gameInfo.name}</h2>
            <p className="text-white/60">{gameInfo.description}</p>
          </div>
        )}

        {/* Question */}
        {state.phase === 'question' && state.currentQuestion && (
          <div className="w-full max-w-lg">
            {/* Timer */}
            <div className="mb-4 text-center">
              <div className={`text-4xl font-bold ${state.timeRemaining <= 5 ? 'text-red-400' : 'text-white'}`}>
                {state.timeRemaining}
              </div>
            </div>

            {/* Question Text */}
            <div className="glass rounded-xl p-6 mb-4">
              <p className="text-white text-lg text-center">
                {state.currentQuestion.question_text}
              </p>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-3">
              {state.currentQuestion.options.map((option, i) => (
                <button
                  key={`${state.currentQuestion.question_id}-${i}`}
                  onClick={() => handleAnswer(i)}
                  disabled={state.selectedAnswer !== null}
                  className={`p-4 rounded-xl text-white font-medium text-left transition-all ${
                    state.selectedAnswer === i
                      ? 'bg-[var(--ice)] text-[var(--deep-sea)]'
                      : 'glass hover:bg-white/10 disabled:opacity-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {state.phase === 'result' && state.lastResult && (
          <div className="text-center glass rounded-2xl p-8 w-full max-w-md" role="alert" aria-live="assertive">
            <div className="text-6xl mb-4" aria-hidden="true">
              {state.lastResult.correct ? '✅' : '❌'}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${state.lastResult.correct ? 'text-green-400' : 'text-red-400'}`}>
              {state.lastResult.correct ? 'Correct!' : 'Wrong!'}
            </h2>
            {state.lastResult.points_earned !== 0 && (
              <p className="text-[var(--ice)] text-xl font-bold">
                {state.lastResult.points_earned > 0 ? '+' : ''}{state.lastResult.points_earned} points
              </p>
            )}
            {state.lastResult.explanation && (
              <p className="text-white/60 text-sm mt-4">{state.lastResult.explanation}</p>
            )}
          </div>
        )}

        {/* Ended */}
        {state.phase === 'ended' && (
          <div className="text-center glass rounded-2xl p-8 w-full max-w-md" role="status" aria-live="polite">
            <div className="text-6xl mb-4" aria-hidden="true">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
            <p className="text-[var(--ice)] text-3xl font-bold mb-4">{state.score} points</p>
            <button
              onClick={() => {
                playerAPI.clearSession()
                navigate('/join')
              }}
              className="px-6 py-3 bg-[var(--ice)] text-[var(--deep-sea)] font-bold rounded-xl"
            >
              Play Again
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
