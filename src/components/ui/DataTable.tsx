import { useMemo, useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { formaterNombre } from '../../lib/utils';

export interface Colonne<T> {
  cle: string;
  entete: string;
  /** Contenu de la cellule. */
  rendu: (ligne: T) => ReactNode;
  /** Valeur servant au tri ; la colonne n'est triable que si elle est fournie. */
  valeurTri?: (ligne: T) => string | number;
  /** Colonnes de chiffres, alignées à droite. */
  numerique?: boolean;
  /** Masquée sous la largeur indiquée, pour tenir sur un téléphone. */
  masquerSous?: 'sm' | 'md' | 'lg';
  largeur?: string;
}

interface DataTableProps<T> {
  colonnes: Colonne<T>[];
  lignes: T[];
  cle: (ligne: T) => string;
  onLigneClic?: (ligne: T) => void;
  /** Texte affiché quand il n'y a rien à montrer. */
  vide?: ReactNode;
  /** Nombre de lignes par page ; 0 affiche tout. */
  parPage?: number;
  legende?: string;
}

const MASQUAGE = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

/**
 * Tableau de l'annuaire : tri par colonne, pagination et sélection de ligne.
 * Les totaux restent visibles pour que le responsable sache toujours combien
 * de fiches il manipule.
 */
export function DataTable<T>({
  colonnes,
  lignes,
  cle,
  onLigneClic,
  vide = 'Aucune fiche ne correspond.',
  parPage = 25,
  legende,
}: DataTableProps<T>) {
  const [tri, setTri] = useState<{ cle: string; sens: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(0);

  const triees = useMemo(() => {
    if (!tri) return lignes;
    const col = colonnes.find((c) => c.cle === tri.cle);
    if (!col?.valeurTri) return lignes;
    const facteur = tri.sens === 'asc' ? 1 : -1;
    return [...lignes].sort((a, b) => {
      const va = col.valeurTri!(a);
      const vb = col.valeurTri!(b);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * facteur;
      return String(va).localeCompare(String(vb), 'fr') * facteur;
    });
  }, [lignes, tri, colonnes]);

  const nbPages = parPage > 0 ? Math.ceil(triees.length / parPage) : 1;
  const pageSure = Math.min(page, Math.max(0, nbPages - 1));
  const visibles = parPage > 0 ? triees.slice(pageSure * parPage, (pageSure + 1) * parPage) : triees;

  function basculerTri(c: Colonne<T>) {
    if (!c.valeurTri) return;
    setPage(0);
    setTri((t) =>
      t?.cle === c.cle
        ? { cle: c.cle, sens: t.sens === 'asc' ? 'desc' : 'asc' }
        : { cle: c.cle, sens: 'asc' },
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto rounded-[var(--radius-panneau)] border border-bordure bg-fond">
        <table className="w-full border-collapse text-base">
          {legende && <caption className="sr-only">{legende}</caption>}
          <thead>
            <tr className="border-b border-bordure bg-fond-discret">
              {colonnes.map((c) => (
                <th
                  key={c.cle}
                  scope="col"
                  style={c.largeur ? { width: c.largeur } : undefined}
                  aria-sort={
                    tri?.cle === c.cle
                      ? tri.sens === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : c.valeurTri
                        ? 'none'
                        : undefined
                  }
                  className={cn(
                    'px-3 py-2.5 text-petit font-semibold text-texte-doux',
                    c.numerique ? 'text-right' : 'text-left',
                    c.masquerSous && MASQUAGE[c.masquerSous],
                  )}
                >
                  {c.valeurTri ? (
                    <button
                      type="button"
                      onClick={() => basculerTri(c)}
                      className={cn(
                        'inline-flex items-center gap-1 hover:text-bleu-lien',
                        c.numerique && 'flex-row-reverse',
                      )}
                    >
                      {c.entete}
                      <span
                        aria-hidden
                        className={cn(
                          'text-micro',
                          tri?.cle === c.cle ? 'text-bleu-lien' : 'text-texte-faible/50',
                        )}
                      >
                        {tri?.cle === c.cle ? (tri.sens === 'asc' ? '▲' : '▼') : '▲'}
                      </span>
                    </button>
                  ) : (
                    c.entete
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td
                  colSpan={colonnes.length}
                  className="px-3 py-12 text-center text-texte-faible"
                >
                  {vide}
                </td>
              </tr>
            ) : (
              visibles.map((ligne) => (
                <tr
                  key={cle(ligne)}
                  onClick={onLigneClic ? () => onLigneClic(ligne) : undefined}
                  tabIndex={onLigneClic ? 0 : undefined}
                  onKeyDown={
                    onLigneClic
                      ? (e) => {
                          if (e.key === 'Enter') onLigneClic(ligne);
                        }
                      : undefined
                  }
                  className={cn(
                    'border-b border-bordure last:border-0',
                    onLigneClic && 'cursor-pointer hover:bg-bleu-actif',
                  )}
                >
                  {colonnes.map((c) => (
                    <td
                      key={c.cle}
                      className={cn(
                        'px-3 py-2.5 align-middle',
                        c.numerique && 'chiffres text-right',
                        c.masquerSous && MASQUAGE[c.masquerSous],
                      )}
                    >
                      {c.rendu(ligne)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {nbPages > 1 && (
        <div className="sans-impression mt-3 flex items-center justify-between gap-3 text-petit text-texte-doux">
          <span className="chiffres">
            {formaterNombre(pageSure * parPage + 1)}–
            {formaterNombre(Math.min((pageSure + 1) * parPage, triees.length))} sur{' '}
            {formaterNombre(triees.length)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              taille="petit"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={pageSure === 0}
            >
              Précédent
            </Button>
            <span className="chiffres text-texte-faible">
              page {pageSure + 1} / {nbPages}
            </span>
            <Button
              taille="petit"
              onClick={() => setPage((p) => Math.min(nbPages - 1, p + 1))}
              disabled={pageSure >= nbPages - 1}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
