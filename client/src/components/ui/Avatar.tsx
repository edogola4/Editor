import React from 'react';
import type { AvatarProps } from '../../types';

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  showStatus = true,
  className = ''
}) => {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl"
  };

  const statusSizeClasses = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4"
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-400';
      case 'away':
        return 'bg-amber-400';
      case 'busy':
        return 'bg-red-400';
      case 'offline':
        return 'bg-slate-400';
      default:
        return 'bg-emerald-400';
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
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          ${src ? '' : getRandomColor(name)}
          rounded-full border-2 border-slate-800 flex items-center justify-center text-white font-medium shadow-lg relative overflow-hidden transition-transform duration-200 hover:scale-110 cursor-pointer
        `}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-semibold">{getInitials(name)}</span>
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
        {name}
        {status && <div className="text-slate-400 capitalize">({status})</div>}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"></div>
      </div>
    </div>
  );
};

export default Avatar;
