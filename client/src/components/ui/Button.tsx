import React from 'react';
import type { ButtonProps } from '../../types';

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseClasses = "relative inline-flex items-center justify-center rounded-lg transition-all duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 focus:ring-blue-500",
    secondary: "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white border border-slate-600/30 focus:ring-slate-500",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-700/30 focus:ring-slate-500",
    danger: "bg-red-600/50 text-red-300 hover:bg-red-500/50 hover:text-white border border-red-500/30 focus:ring-red-500",
    success: "bg-emerald-600/50 text-emerald-300 hover:bg-emerald-500/50 hover:text-white border border-emerald-500/30 focus:ring-emerald-500"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={loading ? undefined : onClick}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${iconSizes[size]}`} />
        </div>
      )}

      <div className={`flex items-center space-x-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {Icon && <Icon className={iconSizes[size]} />}
        <span>{children}</span>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </button>
  );
};

export default Button;
