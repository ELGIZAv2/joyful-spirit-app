import { cn } from '@/lib/utils';

interface UnlimitedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Static gold "Unlimited" word — no icons, no animation.
 * Used to mark image-generation as truly unlimited on paid plans.
 */
export function UnlimitedBadge({ size = 'md', className }: UnlimitedBadgeProps) {
  const sizeClass =
    size === 'lg' ? 'text-lg'
    : size === 'sm' ? 'text-xs'
    : 'text-sm';

  return (
    <span
      className={cn(
        'inline-block font-display font-bold tracking-wide select-none',
        sizeClass,
        className,
      )}
      style={{
        color: '#D4AF37',
        textShadow: '0 1px 0 rgba(0,0,0,0.18)',
      }}
    >
      Unlimited
    </span>
  );
}

export default UnlimitedBadge;
