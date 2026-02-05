/**
 * Player Header Component
 *
 * Displays player info and score at the top of the play screen
 */

interface PlayerHeaderProps {
  displayName: string;
  teamName?: string | null;
  score: number;
}

export function PlayerHeader({ displayName, teamName, score }: PlayerHeaderProps) {
  return (
    <header className="glass border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium">{displayName}</p>
          {teamName && (
            <p className="text-white/50 text-xs">{teamName}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[var(--ice)] font-bold text-xl">{score}</p>
          <p className="text-white/40 text-xs">points</p>
        </div>
      </div>
    </header>
  );
}
