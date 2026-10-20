import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Panneau de contenu : une feuille posée sur le bureau.
 * Pas d'ombre — seule la carte Pass, qui représente un objet physique,
 * se détache du plan.
 */
export function Panneau({
  titre,
  description,
  actions,
  className,
  contenuClassName,
  children,
}: {
  titre?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  contenuClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-panneau)] border border-bordure bg-fond',
        className,
      )}
    >
      {(titre || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-bordure px-4 py-3">
          <div className="min-w-0">
            {titre && <h2 className="text-moyen">{titre}</h2>}
            {description && (
              <p className="mt-0.5 text-petit text-texte-faible">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('px-4 py-4', contenuClassName)}>{children}</div>
    </section>
  );
}

/** Ligne d'une fiche : intitulé à gauche, valeur à droite. */
export function Champ({
  intitule,
  children,
  className,
}: {
  intitule: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-1.5', className)}>
      <dt className="text-petit text-texte-faible">{intitule}</dt>
      <dd className="text-base font-medium">{children}</dd>
    </div>
  );
}

/** Écran vide : dit ce qui manque et ce qu'on peut faire. */
export function Vide({
  titre,
  children,
  action,
}: {
  titre: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <h3 className="text-moyen text-texte-doux">{titre}</h3>
      {children && <p className="max-w-sm text-petit text-texte-faible">{children}</p>}
      {action}
    </div>
  );
}
