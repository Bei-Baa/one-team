import React from 'react';
import { normalizeImageUrl, getInitials } from '../../utils/imageUrl';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  className?: string;
  title?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  showOnlineStatus = false,
  isOnline = false,
  className = '',
  title,
}) => {
  const [imageError, setImageError] = React.useState(false);

  const normalizedSrc = normalizeImageUrl(src);

  // Reset error when source changes
  React.useEffect(() => {
    setImageError(false);
  }, [normalizedSrc]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0 right-0',
    lg: 'w-3 h-3 bottom-0.5 right-0.5',
    xl: 'w-4 h-4 bottom-1 right-1',
  };

  const initials = getInitials(name);

  return (
    <div
      title={title || name}
      className={`relative inline-block shrink-0 ${className}`}
    >
      {normalizedSrc && !imageError ? (
        <img
          src={normalizedSrc}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className={`${sizeClasses[size]} rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-semibold flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10 select-none`}
        >
          {initials || '?'}
        </div>
      )}

      {showOnlineStatus && (
        <span
          className={`absolute ${dotSizeClasses[size]} rounded-full ring-2 ring-white dark:ring-slate-900 ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
          }`}
          title={isOnline ? 'В сети' : 'Не в сети'}
        />
      )}
    </div>
  );
};
