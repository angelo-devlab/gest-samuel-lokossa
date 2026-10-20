import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { getRoleRef } from '../../config/constants';
import { getDoyenne, getParoisse } from '../../config/doyennesParoisses';
import { supabaseConfigure } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { initiales } from '../../lib/utils';

/** Résume en une ligne ce que le compte connecté a le droit de voir. */
function perimetreLisible(compte: NonNullable<ReturnType<typeof useAuth.getState>['compte']>) {
  if (compte.paroisseCode) {
    const p = getParoisse(compte.paroisseCode);
    return p ? `${p.nom} · doyenné de ${p.doyenneNom}` : compte.paroisseCode;
  }
  if (compte.doyenneSlug) {
    const d = getDoyenne(compte.doyenneSlug);
    return d ? `Doyenné de ${d.nom}, ${d.paroisses.length} paroisses` : compte.doyenneSlug;
  }
  return 'Ensemble du diocèse, 62 paroisses';
}

export function Header({ onOuvrirMenu }: { onOuvrirMenu: () => void }) {
  const compte = useAuth((s) => s.compte);
  const deconnecter = useAuth((s) => s.deconnecter);
  const naviguer = useNavigate();

  if (!compte) return null;
  const role = getRoleRef(compte.role);

  return (
    <header className="sans-impression sticky top-0 z-20 flex items-center gap-3 border-b border-bordure bg-fond-discret/90 px-4 py-2.5 backdrop-blur-sm">
      <button
        type="button"
        onClick={onOuvrirMenu}
        aria-label="Ouvrir la navigation"
        className="rounded p-1.5 text-texte-doux hover:bg-fond-discret lg:hidden"
      >
        <svg viewBox="0 0 20 20" className="size-5 fill-none stroke-current stroke-[1.6]">
          <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
        </svg>
      </button>

      {!supabaseConfigure && (
        <span className="hidden rounded-[var(--radius-petit)] border border-orange-bordure bg-orange-clair px-2 py-1 text-micro text-texte sm:inline">
          Serveur non branché — les données restent sur ce poste
        </span>
      )}

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-petit leading-tight font-medium">{compte.nomComplet}</p>
          <p className="text-micro text-texte-faible">{perimetreLisible(compte)}</p>
        </div>
        <span
          title={role?.nom}
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-bleu-lien text-petit font-semibold text-white"
        >
          {initiales(compte.nomComplet.split(' ').at(-1) ?? '', compte.nomComplet)}
        </span>
        <Button
          taille="petit"
          variante="discret"
          onClick={async () => {
            await deconnecter();
            naviguer('/connexion');
          }}
        >
          Quitter
        </Button>
      </div>
    </header>
  );
}
