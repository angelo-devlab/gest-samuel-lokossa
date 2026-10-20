import { NavLink } from 'react-router-dom';
import { droits } from '../../services/authService';
import { useAuth } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { DIOCESE } from '../../config/constants';

interface Entree {
  vers: string;
  libelle: string;
  /** Ce que l'écran permet de faire, affiché sous l'intitulé. */
  role: string;
  visible: (c: ReturnType<typeof useAuth.getState>['compte']) => boolean;
  icone: string;
}

/** Chemins SVG des pictogrammes, dessinés sur une grille de 20. */
const ICONES: Record<string, string> = {
  tableau: 'M3 3h6v7H3zM11 3h6v4h-6zM11 11h6v6h-6zM3 14h6v3H3z',
  registre: 'M5 2h10v16H5zM8 6h4M8 10h4',
  annuaire: 'M4 4h12v12H4zM4 8h12M8 8v8',
  scanner: 'M3 7V3h4M17 7V3h-4M3 13v4h4M17 13v4h-4M6 10h8',
  formateurs:
    'M7 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM2 17c0-3 2.2-5 5-5s5 2 5 5M14 9.5a2 2 0 100-4 2 2 0 000 4zM13 13c3 0 5 1.6 5 4',
};

const ENTREES: Entree[] = [
  {
    vers: '/',
    libelle: 'Tableau de bord',
    role: 'Effectifs du diocèse',
    visible: droits.peutVoirTableauDeBord,
    icone: 'tableau',
  },
  {
    vers: '/recensement',
    libelle: 'Recensement',
    role: 'Inscrire un Samuel',
    visible: droits.peutSaisir,
    icone: 'registre',
  },
  {
    vers: '/annuaire',
    libelle: 'Annuaire',
    role: 'Rechercher et exporter',
    visible: droits.peutConsulterAnnuaire,
    icone: 'annuaire',
  },
  {
    vers: '/formateurs',
    libelle: 'Formateurs',
    role: 'Encadrement par groupe',
    visible: droits.peutGererFormateurs,
    icone: 'formateurs',
  },
  {
    vers: '/scanner',
    libelle: 'Contrôle des Pass',
    role: 'Scanner un QR Code',
    visible: droits.peutScanner,
    icone: 'scanner',
  },
];

/**
 * Navigation principale.
 *
 * Barre claire, comme le prescrit la charte : fond blanc, bordure fine,
 * item actif sur fond bleu pâle avec son libellé en bleu. Aucune zone sombre,
 * aucune ombre portée.
 */
export function Sidebar({ onNaviguer }: { onNaviguer?: () => void }) {
  const compte = useAuth((s) => s.compte);
  const entrees = ENTREES.filter((e) => e.visible(compte));

  return (
    <nav
      aria-label="Navigation principale"
      className="flex h-full w-64 shrink-0 flex-col border-r border-bordure bg-fond"
    >
      <div className="flex items-center gap-3 border-b border-bordure px-4 py-4">
        <img src="/logo-pass-samuel.png" alt="" aria-hidden className="size-10 shrink-0" />
        <div className="min-w-0">
          <p className="text-moyen leading-tight font-bold">Pass-Samuel</p>
          <p className="truncate text-micro text-texte-faible">{DIOCESE.nom}</p>
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {entrees.map((e) => (
          <li key={e.vers}>
            <NavLink
              to={e.vers}
              end={e.vers === '/'}
              onClick={onNaviguer}
              className={({ isActive }) =>
                cn(
                  'flex items-start gap-3 rounded-[var(--radius-petit)] px-3 py-2.5 transition-colors',
                  isActive
                    ? 'bg-bleu-actif text-bleu-lien'
                    : 'text-texte-doux hover:bg-fond-discret hover:text-texte',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className={cn(
                      'mt-0.5 size-4 shrink-0 fill-none stroke-current stroke-[1.5]',
                      !isActive && 'text-texte-faible',
                    )}
                  >
                    <path d={ICONES[e.icone]} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block text-base leading-tight',
                        isActive ? 'font-semibold' : 'font-medium',
                      )}
                    >
                      {e.libelle}
                    </span>
                    <span className="block text-micro text-texte-faible">{e.role}</span>
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
