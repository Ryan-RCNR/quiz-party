/**
 * Play Page
 *
 * Main game play screen for students. Handles WebSocket connection,
 * game state, and displays the appropriate UI based on game phase.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useWebSocket,
  playerAPI,
  type WSPlayerQuestion,
  type WSAnswerResult,
  type MiniGameType,
  type PlayerWSMessage,
  GAME_INFO,
  isPlayerQuestion,
  isAnswerResult,
  isGameIntro,
  isRoundResults,
  isSessionEnded,
} from '@quiz-party/shared'
import {
  PlayerHeader,
  WaitingDisplay,
  GameIntroDisplay,
  QuestionDisplay,
  ResultDisplay,
  GameEndDisplay,
} from '../components'

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

  // Handle WebSocket messages with type guards
  const handleMessage = useCallback((msg: PlayerWSMessage) => {
    if (isGameIntro(msg)) {
      setState((prev) => ({
        ...prev,
        phase: 'intermission',
        currentGame: msg.game_type,
      }))
    } else if (isPlayerQuestion(msg)) {
      setState((prev) => ({
        ...prev,
        phase: 'question',
        currentQuestion: msg,
        selectedAnswer: null,
        timeRemaining: msg.time_limit,
        currentGame: msg.game_type,
      }))
    } else if (isAnswerResult(msg)) {
      setState((prev) => ({
        ...prev,
        phase: 'result',
        lastResult: msg,
        score: msg.new_total,
      }))
    } else if (isRoundResults(msg)) {
      const yourScore = 'your_score' in msg && typeof msg.your_score === 'number' ? msg.your_score : undefined
      setState((prev) => ({
        ...prev,
        phase: 'intermission',
        score: yourScore ?? prev.score,
      }))
    } else if (isSessionEnded(msg)) {
      setState((prev) => ({ ...prev, phase: 'ended' }))
    }
  }, [])

  const { isConnected, send } = useWebSocket<PlayerWSMessage>({
    sessionCode: code || '',
    role: 'player',
    playerId: session?.playerId,
    playerToken: session?.playerToken,
    onMessage: handleMessage,
    enabled: !!code && !!session,
  })

  // Timer countdown - starts fresh when entering question phase with a new question
  const currentQuestionId = state.currentQuestion?.question_id ?? null
  useEffect(() => {
    if (state.phase !== 'question') return

    // Track question changes to detect new questions
    const isNewQuestion = currentQuestionId !== lastQuestionIdRef.current
    lastQuestionIdRef.current = currentQuestionId

    if (!isNewQuestion) return

    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeRemaining <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return { ...prev, timeRemaining: 0 }
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 }
      })
    }, 1000)

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
    const { currentQuestion, selectedAnswer, timeRemaining } = state
    if (selectedAnswer !== null || !currentQuestion) return

    setState((prev) => ({ ...prev, selectedAnswer: index }))
    send({
      type: 'answer',
      question_id: currentQuestion.question_id,
      answer_index: index,
      time_ms: (currentQuestion.time_limit - timeRemaining) * 1000,
    })
  }

  const handlePlayAgain = () => {
    playerAPI.clearSession()
    navigate('/join')
  }

  if (!session) return null

  const gameInfo = state.currentGame ? GAME_INFO[state.currentGame] : null

  return (
    <div className="min-h-screen flex flex-col">
      <PlayerHeader
        displayName={session.displayName}
        teamName={session.teamName}
        score={state.score}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {state.phase === 'waiting' && (
          <WaitingDisplay isConnected={isConnected} />
        )}

        {state.phase === 'intermission' && gameInfo && (
          <GameIntroDisplay gameInfo={gameInfo} />
        )}

        {state.phase === 'question' && state.currentQuestion && (
          <QuestionDisplay
            questionId={state.currentQuestion.question_id}
            questionText={state.currentQuestion.question_text}
            options={state.currentQuestion.options}
            timeRemaining={state.timeRemaining}
            selectedAnswer={state.selectedAnswer}
            onAnswer={handleAnswer}
          />
        )}

        {state.phase === 'result' && state.lastResult && (
          <ResultDisplay
            correct={state.lastResult.correct}
            pointsEarned={state.lastResult.points_earned}
            explanation={state.lastResult.explanation}
          />
        )}

        {state.phase === 'ended' && (
          <GameEndDisplay score={state.score} onPlayAgain={handlePlayAgain} />
        )}
      </main>
    </div>
  )
}
