import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string | React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'away' | 'busy' | null;
  isBordered?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-xl',
};

const statusClasses = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = 'Avatar',
      fallback,
      size = 'md',
      status = null,
      isBordered = false,
      className,
      ...props
    },
    ref
  ) => {
    const [imgError, setImgError] = React.useState(false);
    const showFallback = !src || imgError;
    const sizeClass = sizeClasses[size] || sizeClasses.md;

    const handleError = () => {
      setImgError(true);
    };

    const renderFallback = () => {
      if (typeof fallback === 'string') {
        return (
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {fallback.slice(0, 2).toUpperCase()}
          </span>
        );
      }
      return fallback;
    };

    return (
      <div className={cn('relative inline-block', className)} ref={ref} {...props}>
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden',
            sizeClass,
            isBordered && 'ring-2 ring-white dark:ring-gray-800',
            !showFallback && 'bg-cover bg-center',
            className
          )}
          style={!showFallback ? { backgroundImage: `url(${src})` } : {}}
        >
          {showFallback && (
            <div className="flex items-center justify-center w-full h-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
              {renderFallback()}
            </div>
          )}
          {!showFallback && src && (
            <img
              src={src}
              alt={alt}
              onError={handleError}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-800',
              statusClasses[status],
              {
                'h-2.5 w-2.5': size === 'sm',
                'h-3 w-3': size === 'md',
                'h-3.5 w-3.5': size === 'lg',
                'h-4 w-4': size === 'xl',
                'h-5 w-5': size === '2xl',
              }
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
