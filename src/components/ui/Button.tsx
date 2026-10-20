import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Variante = 'principal' | 'secondaire' | 'discret' | 'danger' | 'accent';
type Taille = 'petit' | 'normal' | 'grand';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  taille?: Taille;
  icone?: ReactNode;
  /** Remplace le libellé par un indicateur pendant une opération réseau. */
  enCours?: boolean;
}

/**
 * Le vert porte l'action principale, conformément à la charte. Le fond utilise
 * la teinte « action » (#2E7D32) et non le vert de marque : la charte limite
 * elle-même le blanc sur #4CAF50 aux gros caractères gras.
 * Le bouton accent suit la charte au pied de la lettre : texte #212121 sur
 * orange, la seule association vive qui atteigne un contraste confortable.
 */
const VARIANTES: Record<Variante, string> = {
  principal:
    'bg-vert-action text-white border-vert-action hover:bg-vert-sombre hover:border-vert-sombre disabled:bg-texte-faible disabled:border-texte-faible',
  secondaire:
    'bg-fond text-texte border-bordure hover:border-bleu-lien hover:text-bleu-lien',
  discret:
    'bg-transparent text-texte-doux border-transparent hover:bg-fond-discret hover:text-texte',
  accent: 'bg-orange text-texte border-orange hover:brightness-95',
  danger:
    'bg-fond text-rouge border-rouge-bordure hover:bg-rouge hover:text-white hover:border-rouge',
};

/** Échelle d'espacement de la charte : 4 · 8 · 12 · 16 · 24 px. */
const TAILLES: Record<Taille, string> = {
  petit: 'h-8 px-3 text-petit gap-1.5',
  normal: 'h-10 px-4 text-base gap-2',
  grand: 'h-12 px-6 text-base gap-2',
};

export function Button({
  variante = 'secondaire',
  taille = 'normal',
  icone,
  enCours = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || enCours}
      aria-busy={enCours || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-petit)] border font-medium',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTES[variante],
        TAILLES[taille],
        className,
      )}
    >
      {enCours ? (
        <span
          aria-hidden
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        icone
      )}
      {children}
    </button>
  );
}
