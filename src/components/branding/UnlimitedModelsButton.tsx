import MegsyStar from './MegsyStar';
import { cn } from '@/lib/utils';

// Most popular text-to-image models (per artificialanalysis.ai/text-to-image).
// No provider names — model names only.
const MODELS = [
  'Nano Banana',
  'GPT Image 1',
  'Flux 1.1 Pro',
  'Imagen 4',
  'Ideogram 3',
  'Recraft v3',
  'Seedream 4',
  'Midjourney v7',
];

interface Props {
  className?: string;
  onClick?: () => void;
}

/**
 * Gold pill button used on pricing cards (>= $29 plans). The button is the
 * focal point — text scrolls inside on a marquee so the gold shape stands out.
 */
export function UnlimitedModelsButton({ className, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'umb-pill font-display select-none cursor-default',
        className,
      )}
      aria-label={`Unlimited image generation — ${MODELS.join(', ')}`}
    >
      <MegsyStar className="umb-star w-4 h-4 shrink-0" />
      <span className="umb-label">Unlimited Images</span>
      <span className="umb-marquee" aria-hidden="true">
        <span className="umb-track">
          {[...MODELS, ...MODELS].map((m, i) => (
            <span key={i} className="umb-chip">{m}</span>
          ))}
        </span>
      </span>
    </button>
  );
}

export default UnlimitedModelsButton;
