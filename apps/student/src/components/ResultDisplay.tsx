/**
 * Result Display Component
 *
 * Shows the result of an answered question
 */

interface ResultDisplayProps {
  correct: boolean;
  pointsEarned: number;
  explanation?: string | null;
}

export function ResultDisplay({ correct, pointsEarned, explanation }: ResultDisplayProps) {
  return (
    <div className="text-center glass rounded-2xl p-8 w-full max-w-md" role="alert" aria-live="assertive">
      <div className="text-6xl mb-4" aria-hidden="true">
        {correct ? '✅' : '❌'}
      </div>
      <h2 className={`text-2xl font-bold mb-2 ${correct ? 'text-green-400' : 'text-red-400'}`}>
        {correct ? 'Correct!' : 'Wrong!'}
      </h2>
      {pointsEarned !== 0 && (
        <p className="text-[var(--ice)] text-xl font-bold">
          {pointsEarned > 0 ? '+' : ''}{pointsEarned} points
        </p>
      )}
      {explanation && (
        <p className="text-white/60 text-sm mt-4">{explanation}</p>
      )}
    </div>
  );
}
