import { useEffect, useState } from 'react';
import type { SamuelEnrichi } from '../../types/samuel';
import { qrDataURL } from '../../lib/qr';
import { libelleGrade, rangDuGrade } from '../../config/grades';
import { nomGroupe } from '../../lib/calculGroupe';
import { formaterDateCourte, initiales } from '../../lib/utils';
import { DIOCESE } from '../../config/constants';
import { cn } from '../../lib/utils';

/**
 * Aperçu du Pass-Samuel au format carte bancaire (85,6 × 54 mm).
 *
 * C'est l'objet que l'enfant présentera au portail d'un camp. Fond blanc et
 * bordure fine, comme le reste de l'interface ; seul un bandeau vert en tête
 * signale qu'il s'agit d'un titre délivré par le diocèse. Le statut de
 * validation est la seule autre touche de couleur : vert s'il est signé,
 * orange tant qu'il ne l'est pas.
 */
export function PassCardPreview({
  membre,
  className,
}: {
  membre: SamuelEnrichi;
  className?: string;
}) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let vivant = true;
    qrDataURL(membre.id_nid, membre.qr_code_hash, 220)
      .then((url) => vivant && setQr(url))
      .catch(() => vivant && setQr(null));
    return () => {
      vivant = false;
    };
  }, [membre.id_nid, membre.qr_code_hash]);

  const valide = membre.statut_validation;

  return (
    <article
      aria-label={`Pass-Samuel de ${membre.prenom} ${membre.nom}`}
      className={cn(
        // Proportions d'une carte d'identité, conservées à toute largeur.
        'relative aspect-[85.6/54] w-full max-w-sm overflow-hidden rounded-[var(--radius-carte)]',
        'border border-bordure bg-fond text-texte',
        'shadow-[0_1px_3px_rgba(33,33,33,0.12)]',
        className,
      )}
    >
      {/* Bandeau vert : la marque du titre officiel. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-vert" />

      <div className="flex h-full flex-col justify-between p-[5.5%] pt-[7%]">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo-pass-samuel.png" alt="" aria-hidden className="size-7 shrink-0" />
            <div className="leading-tight">
              <p className="text-[0.8rem] font-bold">Pass-Samuel</p>
              <p className="text-[0.56rem] text-texte-faible">{DIOCESE.nom}</p>
            </div>
          </div>
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-[0.5rem] font-semibold',
              valide
                ? 'border-vert-bordure bg-vert-clair text-vert-action'
                : 'border-orange-bordure bg-orange-clair text-texte',
            )}
          >
            {valide ? 'Validé' : 'En attente'}
          </span>
        </header>

        <div className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 items-end gap-2.5">
            {membre.photo_url ? (
              <img
                src={membre.photo_url}
                alt=""
                className="size-[3.1rem] shrink-0 rounded-[var(--radius-petit)] border border-bordure object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="grid size-[3.1rem] shrink-0 place-items-center rounded-[var(--radius-petit)] border border-bordure bg-fond-discret text-moyen font-semibold text-texte-faible"
              >
                {initiales(membre.nom, membre.prenom)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[0.95rem] leading-tight font-semibold">
                {membre.prenom}
              </p>
              <p className="truncate text-[0.95rem] leading-tight font-bold">{membre.nom}</p>
              <p className="matricule mt-1 text-[0.6rem] text-bleu-lien">{membre.id_nid}</p>
            </div>
          </div>

          {qr ? (
            <img
              src={qr}
              alt={`QR Code du Pass ${membre.id_nid}`}
              className="size-[3.6rem] shrink-0 rounded-[2px]"
            />
          ) : (
            <span
              aria-hidden
              className="size-[3.6rem] shrink-0 animate-pulse rounded-[2px] bg-fond-discret"
            />
          )}
        </div>

        <footer className="flex items-end justify-between gap-2 border-t border-bordure pt-[3%] text-[0.56rem] text-texte-faible">
          <span className="truncate">
            {membre.paroisse_nom}
            <span className="opacity-50"> · </span>
            {membre.doyenne_nom}
          </span>
          <span className="shrink-0 text-right">
            <span className="font-semibold text-texte-doux">
              {rangDuGrade(membre.grade_actuel)}
            </span>{' '}
            {libelleGrade(membre.grade_actuel)}
            <span className="opacity-50"> · </span>
            {nomGroupe(membre.groupe_calcule)}
          </span>
        </footer>
      </div>
    </article>
  );
}

/** Verso du Pass : consignes et contacts, imprimé au dos de la carte. */
export function PassCardVerso({ membre }: { membre: SamuelEnrichi }) {
  return (
    <article className="aspect-[85.6/54] w-full max-w-sm rounded-[var(--radius-carte)] border border-bordure bg-fond p-[5.5%] text-petit">
      <h3 className="text-[0.8rem] font-semibold">Conditions d'usage</h3>
      <p className="mt-1 text-[0.6rem] leading-snug text-texte-doux">
        Ce Pass est personnel. Il est présenté à chaque rassemblement et camp
        diocésain. Toute perte est signalée au responsable paroissial, qui fait
        rééditer la carte.
      </p>
      <dl className="mt-2.5 space-y-0.5 text-[0.6rem]">
        <div className="flex justify-between gap-2">
          <dt className="text-texte-faible">Entré chez les Samuels</dt>
          <dd className="chiffres">{formaterDateCourte(membre.date_entree)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-texte-faible">Contact des parents</dt>
          <dd className="chiffres">{membre.contact_parent ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-texte-faible">Matricule</dt>
          <dd className="matricule">{membre.id_nid}</dd>
        </div>
      </dl>
    </article>
  );
}


