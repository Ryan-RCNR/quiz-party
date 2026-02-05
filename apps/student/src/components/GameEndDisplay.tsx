/**
 * Game End Display Component
 *
 * Shows the final score and play again button
 */

interface GameEndDisplayProps {
  score: number;
  onPlayAgain: () => void;
}

export function GameEndDisplay({ score, onPlayAgain }: GameEndDisplayProps) {
  return (
    <div className="text-center glass rounded-2xl p-8 w-full max-w-md" role="status" aria-live="polite">
      <div className="text-6xl mb-4" aria-hidden="true">🎉</div>
      <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
      <p className="text-[var(--ice)] text-3xl font-bold mb-4">{score} points</p>
      <button
        onClick={onPlayAgain}
        className="px-6 py-3 bg-[var(--ice)] text-[var(--deep-sea)] font-bold rounded-xl"
      >
        Play Again
      </button>
    </div>
  );
}
