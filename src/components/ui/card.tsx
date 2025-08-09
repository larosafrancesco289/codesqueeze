import * as React from 'react';
import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-2xl shadow-[var(--shadow-card)]',
        className
      )}
      {...props}
    />
  );
}


