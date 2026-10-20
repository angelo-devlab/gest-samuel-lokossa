import { useId, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface Option {
  valeur: string;
  libelle: string;
  /** Second niveau de lecture : vocable de la paroisse, charge du grade. */
  detail?: string;
  desactivee?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: Option[];
  /** Entrée affichée tant que rien n'est choisi. */
  invite?: string;
  erreur?: string;
  aide?: string;
  obligatoire?: boolean;
  /** Regroupe les options par la valeur de `groupe`. */
  groupes?: { nom: string; options: Option[] }[];
}

/**
 * Liste déroulante native.
 *
 * Choix délibéré : l'application sert à saisir plusieurs centaines de fiches
 * au clavier, souvent sur de petits appareils. Le select du système se navigue
 * à la frappe, reste accessible et ne coûte rien à charger.
 */
export function Select({
  label,
  options,
  groupes,
  invite = '— Choisir —',
  erreur,
  aide,
  obligatoire,
  className,
  id,
  ...props
}: SelectProps) {
  const genere = useId();
  const idChamp = id ?? genere;
  const idAide = `${idChamp}-aide`;

  const rendreOption = (o: Option) => (
    <option key={o.valeur} value={o.valeur} disabled={o.desactivee}>
      {o.detail ? `${o.libelle} — ${o.detail}` : o.libelle}
    </option>
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={idChamp} className="text-petit font-medium text-texte-doux">
        {label}
        {obligatoire && (
          <span className="ml-1 text-rouge" aria-label="obligatoire">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <select
          {...props}
          id={idChamp}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur || aide ? idAide : undefined}
          className={cn(
            'h-10 w-full appearance-none rounded-[var(--radius-panneau)] border bg-fond',
            'pr-9 pl-3 text-base text-texte transition-colors',
            'disabled:cursor-not-allowed disabled:bg-fond-discret disabled:text-texte-faible',
            erreur ? 'border-rouge' : 'border-bordure focus:border-bleu-lien',
            className,
          )}
        >
          <option value="">{invite}</option>
          {groupes
            ? groupes.map((g) => (
                <optgroup key={g.nom} label={g.nom}>
                  {g.options.map(rendreOption)}
                </optgroup>
              ))
            : options.map(rendreOption)}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className="pointer-events-none absolute top-1/2 right-3 w-2.5 -translate-y-1/2 fill-none stroke-texte-faible stroke-[1.5]"
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </div>
      {(erreur || aide) && (
        <p
          id={idAide}
          className={cn('text-micro', erreur ? 'text-rouge' : 'text-texte-faible')}
        >
          {erreur ?? aide}
        </p>
      )}
    </div>
  );
}
