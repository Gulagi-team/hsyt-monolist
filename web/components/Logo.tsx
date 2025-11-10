import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  variant = 'full' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  // Logo image with modern styling
  const LogoImage = () => (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <img
        src="/logo.png"
        alt="Hồ Sơ Y Tế  Logo"
        className="w-full h-full object-contain rounded-xl shadow-lg"
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
        }}
      />
    </div>
  );

  // Alternative medical plus icon
  const MedicalPlusIcon = () => (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <div className="absolute inset-0 bg-blue-600 rounded-2xl shadow-lg transform rotate-45">
        <div className="absolute inset-0 bg-white/20 rounded-2xl"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1/2 h-1/12 bg-white rounded-full"></div>
        <div className="absolute w-1/12 h-1/2 bg-white rounded-full"></div>
      </div>
    </div>
  );

  // Heart with pulse icon
  const HeartPulseIcon = () => (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <div className="absolute inset-0 bg-blue-600 rounded-full shadow-lg">
        <div className="absolute inset-0 bg-white/10 rounded-full"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="w-3/5 h-3/5 text-white" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>
    </div>
  );

  // DNA helix icon
  const DNAIcon = () => (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <div className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg">
        <div className="absolute inset-0 bg-white/10 rounded-xl"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg 
            className="w-3/5 h-3/5 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );

  const LogoText = () => (
    <span className={`${textSizeClasses[size]} font-bold text-blue-600`}>
      Hồ Sơ Y Tế 
    </span>
  );

  const ShortText = () => (
    <span className={`${textSizeClasses[size]} font-bold text-blue-600`}>
      HSYT
    </span>
  );

  if (variant === 'icon') {
    return <LogoImage />;
  }

  if (variant === 'text') {
    return <LogoText />;
  }

  // Full logo with icon and text
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <LogoImage />
      <div className="flex flex-col">
        <LogoText />
        <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
          Hệ thống Y tế Thông minh
        </span>
      </div>
    </div>
  );
};

// Export different logo variants as separate components for convenience
export const LogoIcon: React.FC<Omit<LogoProps, 'variant'>> = (props) => (
  <Logo {...props} variant="icon" />
);

export const LogoText: React.FC<Omit<LogoProps, 'variant'>> = (props) => (
  <Logo {...props} variant="text" />
);

export const LogoFull: React.FC<Omit<LogoProps, 'variant'>> = (props) => (
  <Logo {...props} variant="full" />
);

export default Logo;
