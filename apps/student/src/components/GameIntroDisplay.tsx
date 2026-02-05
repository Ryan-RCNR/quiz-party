/**
 * Game Intro Display Component
 *
 * Shows game introduction during intermission
 */

interface GameInfo {
  emoji: string;
  name: string;
  description: string;
}

interface GameIntroDisplayProps {
  gameInfo: GameInfo;
}

export function GameIntroDisplay({ gameInfo }: GameIntroDisplayProps) {
  return (
    <div className="text-center glass rounded-2xl p-8 w-full max-w-md" role="status" aria-live="polite">
      <div className="text-6xl mb-4" aria-hidden="true">{gameInfo.emoji}</div>
      <h2 className="text-2xl font-bold text-white mb-2">{gameInfo.name}</h2>
      <p className="text-white/60">{gameInfo.description}</p>
    </div>
  );
}
