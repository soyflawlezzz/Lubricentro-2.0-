import React, { useState } from 'react';
import { Fuel } from 'lucide-react';

interface BrandLogoProps {
  logoUrl?: string;
  companyName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl,
  companyName = 'LUBRICENTRO 2.0',
  size = 'md',
  showText = true,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeMap = {
    xs: { img: 'h-6 max-w-[90px]', box: 'w-7 h-7', icon: 'w-3.5 h-3.5', text: 'text-xs' },
    sm: { img: 'h-8 max-w-[120px]', box: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm' },
    md: { img: 'h-10 max-w-[150px]', box: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base' },
    lg: { img: 'h-14 max-w-[200px]', box: 'w-14 h-14', icon: 'w-7 h-7', text: 'text-xl' },
    xl: { img: 'h-20 max-w-[280px]', box: 'w-20 h-20', icon: 'w-10 h-10', text: 'text-2xl' },
  };

  const activeSize = sizeMap[size];
  const effectiveUrl = !imageError && logoUrl ? logoUrl : !imageError ? '/lubricentro-original-logo.png' : null;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {effectiveUrl ? (
        <img
          src={effectiveUrl}
          alt={companyName}
          onError={() => setImageError(true)}
          className={`${activeSize.img} w-auto object-contain shrink-0 drop-shadow-sm select-none transition-all`}
        />
      ) : (
        <div
          className={`${activeSize.box} rounded-xl bg-gradient-to-tr from-red-600 to-red-800 flex items-center justify-center text-white shrink-0 shadow-md border border-red-500/30`}
        >
          <Fuel className={activeSize.icon} />
        </div>
      )}

      {showText && (!effectiveUrl || size === 'sm' || size === 'xs') && (
        <div className="leading-tight">
          <span className={`font-black tracking-wider text-white ${activeSize.text} block`}>
            {companyName === 'LUBRICENTRO 2.0' ? (
              <>
                LUBRICENTRO <span className="text-red-500">2.0</span>
              </>
            ) : (
              companyName
            )}
          </span>
        </div>
      )}
    </div>
  );
};
