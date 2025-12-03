import React from 'react';
import { cn } from './theme';

export default function GlassCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl',
        className
      )}
    >
      {children}
    </div>
  );
}