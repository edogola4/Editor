import * as React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'away' | 'busy' | 'offline';
  showStatus?: boolean;
}

const Avatar = ({
  className,
  src,
  name,
  size = 'md',
  status,
  showStatus = true
}: AvatarProps) => {
    const [imgError, setImgError] = React.useState(false);
    const shouldShowFallback = !src || imgError;

    const sizeClasses = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
    };

    const statusSizeClasses = {
      xs: 'h-1.5 w-1.5',
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
      xl: 'h-4 w-4',
    };

    const getInitials = (nameStr: string) => {
      return nameStr
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const getStatusColor = (statusType?: string) => {
      switch (statusType) {
        case 'online':
          return 'bg-emerald-500 ring-2 ring-background';
        case 'away':
          return 'bg-amber-500 ring-2 ring-background';
        case 'busy':
          return 'bg-rose-500 ring-2 ring-background';
        case 'offline':
          return 'bg-slate-400 ring-2 ring-background';
        default:
          return 'bg-emerald-500 ring-2 ring-background';
      }
    };

    const getRandomColor = (name: string) => {
      const colors = [
        'bg-gradient-to-br from-blue-500 to-purple-600',
        'bg-gradient-to-br from-emerald-500 to-teal-600',
        'bg-gradient-to-br from-pink-500 to-rose-600',
        'bg-gradient-to-br from-amber-500 to-orange-600',
        'bg-gradient-to-br from-indigo-500 to-blue-600',
        'bg-gradient-to-br from-cyan-500 to-blue-600',
        'bg-gradient-to-br from-violet-500 to-purple-600',
        'bg-gradient-to-br from-fuchsia-500 to-pink-600'
      ];

      const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[index % colors.length];
    };

    return (
      <div className={`relative inline-block group ${className || ''}`}>
        <div
          className={`
            ${sizeClasses[size]}
            ${src ? '' : getRandomColor(name || 'User')}
            rounded-full border-2 border-slate-800 flex items-center justify-center text-white font-medium shadow-lg relative overflow-hidden transition-transform duration-200 hover:scale-110 cursor-pointer
          `}
        >
          {shouldShowFallback ? (
            <span className="font-semibold">{getInitials(name || 'User')}</span>
          ) : (
            <img
              src={src}
              alt={name || 'Avatar'}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}

          {/* Status indicator */}
          {showStatus && status && (
            <div
              className={`
                absolute -bottom-0.5 -right-0.5 ${statusSizeClasses[size]} rounded-full border-2 border-slate-800 ${getStatusColor(status)} animate-pulse
              `}
              title={status}
            />
          )}

          {/* Hover effect */}
          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full" />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900/95 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none backdrop-blur-sm border border-slate-700/50 shadow-lg z-50">
          {name || 'User'}
          {status && <div className="text-slate-400 capitalize">({status})</div>}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"></div>
        </div>
      </div>
    );
  }

Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => {
    return (
      <img
        ref={ref}
        className={cn('w-full h-full object-cover', className)}
        {...props}
      />
    );
  }
);

AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center w-full h-full bg-muted text-muted-foreground', className)}
        {...props}
      />
    );
  }
);

AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
export default Avatar;
