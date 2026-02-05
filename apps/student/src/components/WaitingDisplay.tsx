/**
 * Waiting Display Component
 *
 * Shows waiting state while waiting for next question
 */

interface WaitingDisplayProps {
  isConnected: boolean;
}

export function WaitingDisplay({ isConnected }: WaitingDisplayProps) {
  return (
    <div className="text-center" role="status" aria-live="polite">
      <div className="text-5xl mb-4" aria-hidden="true">⏳</div>
      <p className="text-white/60">Waiting for next question...</p>
      <p className={`text-sm mt-2 ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
        {isConnected ? 'Connected' : 'Reconnecting...'}
      </p>
    </div>
  );
}
