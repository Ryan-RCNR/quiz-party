/**
 * Question Display Component
 *
 * Shows the current question with timer and answer options
 */

interface QuestionDisplayProps {
  questionId: string;
  questionText: string;
  options: string[];
  timeRemaining: number;
  selectedAnswer: number | null;
  onAnswer: (index: number) => void;
}

export function QuestionDisplay({
  questionId,
  questionText,
  options,
  timeRemaining,
  selectedAnswer,
  onAnswer,
}: QuestionDisplayProps) {
  return (
    <div className="w-full max-w-lg">
      {/* Timer */}
      <div className="mb-4 text-center">
        <div className={`text-4xl font-bold ${timeRemaining <= 5 ? 'text-red-400' : 'text-white'}`}>
          {timeRemaining}
        </div>
      </div>

      {/* Question Text */}
      <div className="glass rounded-xl p-6 mb-4">
        <p className="text-white text-lg text-center">
          {questionText}
        </p>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option, i) => (
          <button
            key={`${questionId}-${i}`}
            onClick={() => onAnswer(i)}
            disabled={selectedAnswer !== null}
            className={`p-4 rounded-xl text-white font-medium text-left transition-all ${
              selectedAnswer === i
                ? 'bg-[var(--ice)] text-[var(--deep-sea)]'
                : 'glass hover:bg-white/10 disabled:opacity-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
