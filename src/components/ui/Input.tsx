import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const CHAMP =
  'w-full rounded-[var(--radius-panneau)] border bg-fond px-3 text-base text-texte ' +
  'placeholder:text-texte-faible transition-colors ' +
  'disabled:cursor-not-allowed disabled:bg-fond-discret disabled:text-texte-faible';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Message d'erreur ; remplace l'aide le temps de la corriger. */
  erreur?: string;
  aide?: ReactNode;
  /** Affiche la marque d'obligation à côté du label. */
  obligatoire?: boolean;
}

export function Input({
  label,
  erreur,
  aide,
  obligatoire,
  className,
  id,
  ...props
}: InputProps) {
  const genere = useId();
  const idChamp = id ?? genere;
  const idAide = `${idChamp}-aide`;

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
      <input
        {...props}
        id={idChamp}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur || aide ? idAide : undefined}
        className={cn(
          CHAMP,
          'h-10',
          erreur ? 'border-rouge' : 'border-bordure focus:border-bleu-lien',
          className,
        )}
      />
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

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  erreur?: string;
  aide?: ReactNode;
}

export function Textarea({ label, erreur, aide, className, id, ...props }: TextareaProps) {
  const genere = useId();
  const idChamp = id ?? genere;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={idChamp} className="text-petit font-medium text-texte-doux">
        {label}
      </label>
      <textarea
        {...props}
        id={idChamp}
        aria-invalid={erreur ? true : undefined}
        className={cn(
          CHAMP,
          'min-h-20 py-2 leading-relaxed',
          erreur ? 'border-rouge' : 'border-bordure focus:border-bleu-lien',
          className,
        )}
      />
      {(erreur || aide) && (
        <p className={cn('text-micro', erreur ? 'text-rouge' : 'text-texte-faible')}>
          {erreur ?? aide}
        </p>
      )}
    </div>
  );
}

/** Case à cocher des sacrements et des statuts. */
export function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-bleu-lien)] disabled:cursor-not-allowed"
      />
      <label htmlFor={id} className={cn('text-base leading-snug', disabled && 'text-texte-faible')}>
        {label}
        {description && <span className="block text-micro text-texte-faible">{description}</span>}
      </label>
    </div>
  );
}
