import type { ReactNode } from 'react';
import type { NumeroGroupe } from '../../config/constants';
import { cn } from '../../lib/utils';
import { nomGroupe } from '../../lib/calculGroupe';
import { PASTILLE_GROUPE } from './rampeGroupes';

type Ton = 'neutre' | 'bleu' | 'vert' | 'orange' | 'rouge';

const TONS: Record<Ton, string> = {
  neutre: 'bg-fond-discret text-texte-doux border-bordure',
  bleu: 'bg-bleu-actif text-bleu-lien border-bleu-bordure',
  vert: 'bg-vert-clair text-vert-action border-vert-bordure',
  orange: 'bg-orange-clair text-texte border-orange-bordure',
  rouge: 'bg-rouge-clair text-rouge border-rouge-bordure',
};

export function Badge({
  ton = 'neutre',
  className,
  children,
}: {
  ton?: Ton;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        // Pastille pleine, comme le prévoit la charte pour les étiquettes.
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-micro font-medium whitespace-nowrap',
        TONS[ton],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function BadgeGroupe({ groupe, bref = false }: { groupe: NumeroGroupe; bref?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-micro font-semibold whitespace-nowrap',
        PASTILLE_GROUPE[groupe],
      )}
    >
      {bref ? `G${groupe}` : `Groupe ${groupe}`}
      {!bref && <span className="font-normal opacity-70">{nomGroupe(groupe)}</span>}
    </span>
  );
}

/**
 * La validation pastorale se lit comme un tampon apposé sur un dossier :
 * vert quand c'est signé, orange tant que l'Aumônier ne s'est pas prononcé.
 */
export function BadgeValidation({ valide }: { valide: boolean }) {
  return (
    <Badge ton={valide ? 'vert' : 'orange'}>
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          valide ? 'bg-vert-action' : 'border border-orange bg-orange',
        )}
      />
      {valide ? 'Validé' : 'En attente'}
    </Badge>
  );
}
