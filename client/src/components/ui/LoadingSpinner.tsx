import React from 'react';
import type { LoadingSpinnerProps } from '../../types';

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const colorClasses = {
    primary: "border-blue-500",
    white: "border-white",
    gray: "border-slate-400"
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          border-2 ${colorClasses[color]}
          border-t-transparent rounded-full animate-spin
        `}
      />
    </div>
  );
};

export default LoadingSpinner;
