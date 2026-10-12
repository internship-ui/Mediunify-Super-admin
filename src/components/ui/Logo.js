'use client';

import React, { useState } from 'react';
import { getAssetPath } from '@/lib/assets';
import { cn } from '@/lib/utils';

export function Logo({
  showText = true,
  subtitle = 'Super Admin Hub',
  size = 'md',
  className,
}) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: {
      box: 'w-8 h-8 rounded-lg',
      img: 'w-7 h-7',
      title: 'text-sm',
      sub: 'text-[9px]',
    },
    md: {
      box: 'w-10 h-10 rounded-xl',
      img: 'w-8 h-8',
      title: 'text-base',
      sub: 'text-[10px]',
    },
    lg: {
      box: 'w-14 h-14 rounded-2xl',
      img: 'w-12 h-12',
      title: 'text-xl',
      sub: 'text-xs',
    },
  }[size] || {
    box: 'w-10 h-10 rounded-xl',
    img: 'w-8 h-8',
    title: 'text-base',
    sub: 'text-[10px]',
  };

  return (
    <div className={cn('flex items-center gap-3 overflow-hidden select-none', className)}>
      <div
        className={cn(
          'relative shrink-0 flex items-center justify-center bg-white dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden',
          sizeClasses.box
        )}
      >
        {!imgError ? (
          <img
            src={getAssetPath('/images/mediunify-logo.png')}
            alt="MediUnify"
            className={cn('object-contain', sizeClasses.img)}
            onError={() => setImgError(true)}
            loading="eager"
          />
        ) : (
          /* High-fidelity fallback medical vector mark if raster PNG fails */
          <div className="w-full h-full rounded bg-gradient-to-br from-[#00B894] to-[#1E3A8A] flex items-center justify-center text-white font-black text-sm">
            <span>M</span>
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              'font-extrabold tracking-tight text-[#1E3A8A] dark:text-blue-400 leading-tight',
              sizeClasses.title
            )}
          >
            Medi<span className="text-[#00B894]">Unify</span>
          </span>
          {subtitle && (
            <span
              className={cn(
                'font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 leading-none mt-0.5',
                sizeClasses.sub
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
