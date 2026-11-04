import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 - 100
  color?: 'blue' | 'emerald' | 'purple' | 'amber';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'blue',
  height = 'md',
  showLabel = false,
  className = '',
}) => {
  const safeProgress = Math.min(100, Math.max(0, progress));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-600',
    amber: 'bg-amber-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
          <span>Прогресс</span>
          <span className="font-mono tabular-nums">{safeProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className={`${heightClasses[height]} rounded-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};
