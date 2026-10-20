import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ModalProps {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  /** Précision affichée sous le titre, par exemple le matricule concerné. */
  sousTitre?: ReactNode;
  largeur?: 'etroite' | 'normale' | 'large';
  children: ReactNode;
  pied?: ReactNode;
}

const LARGEURS = {
  etroite: 'max-w-md',
  normale: 'max-w-2xl',
  large: 'max-w-4xl',
};

/**
 * Boîte de dialogue bâtie sur <dialog> : le navigateur gère le piège à focus,
 * la touche Échap et l'inertie de l'arrière-plan.
 */
export function Modal({
  ouvert,
  onFermer,
  titre,
  sousTitre,
  largeur = 'normale',
  children,
  pied,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (ouvert && !dlg.open) dlg.showModal();
    else if (!ouvert && dlg.open) dlg.close();
  }, [ouvert]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const fermer = () => onFermer();
    dlg.addEventListener('close', fermer);
    return () => dlg.removeEventListener('close', fermer);
  }, [onFermer]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="titre-modale"
      // Un clic en dehors du panneau ferme la boîte, comme on repose un dossier.
      onClick={(e) => {
        if (e.target === ref.current) onFermer();
      }}
      className={cn(
        // `m-auto` est indispensable : le preflight Tailwind remet margin à 0
        // sur <dialog>, ce qui annule le centrage de showModal().
        'm-auto w-[calc(100vw-2rem)] rounded-[var(--radius-carte)] border border-bordure bg-fond p-0',
        'text-texte shadow-[0_8px_24px_rgba(33,33,33,0.14)]',
        'backdrop:bg-texte/45 backdrop:backdrop-blur-[2px]',
        LARGEURS[largeur],
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-bordure px-5 py-4">
        <div className="min-w-0">
          <h2 id="titre-modale" className="text-grand">
            {titre}
          </h2>
          {sousTitre && <div className="mt-0.5 text-petit text-texte-faible">{sousTitre}</div>}
        </div>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="-mt-1 -mr-1 shrink-0 rounded p-1.5 text-texte-faible hover:bg-fond-discret hover:text-texte"
        >
          <svg viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-[1.6]">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </header>

      <div className="max-h-[min(70vh,44rem)] overflow-y-auto px-5 py-5">{children}</div>

      {pied && (
        <footer className="flex flex-wrap justify-end gap-2 border-t border-bordure bg-fond-discret px-5 py-3.5">
          {pied}
        </footer>
      )}
    </dialog>
  );
}
