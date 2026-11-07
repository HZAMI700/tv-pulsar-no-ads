import React from 'react';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
    lg: 'px-7 py-3 text-base rounded-xl gap-2.5',
  }[size];

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #FF1838 0%, #D80422 100%)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 18px rgba(255, 24, 56, 0.42)',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.08)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(12px)',
    },
    ghost: {
      background: 'transparent',
      color: 'rgba(255, 255, 255, 0.8)',
      border: '1px solid transparent',
    },
    glass: {
      background: 'rgba(14, 16, 24, 0.72)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    },
    icon: {
      background: 'rgba(255, 255, 255, 0.07)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '50%',
      padding: size === 'sm' ? '6px' : size === 'lg' ? '12px' : '9px',
    },
  };

  return (
    <button
      className={`relative inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1838] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080D] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 ${sizeClasses} ${className}`}
      style={variantStyles[variant]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
