import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRegistre } from '../store/useRegistre';
import { useAuth } from '../store/authStore';
import { calculerStatistiques } from '../services/samuelService';
import { Panneau, Vide } from '../components/ui/Panneau';
import { BadgeGroupe } from '../components/ui/Badge';
import { FOND_GROUPE } from '../components/ui/rampeGroupes';
import { Button } from '../components/ui/Button';
import { PassCardPreview } from '../components/qr/PassCardPreview';
import { GRADES_REF, libelleGrade } from '../config/grades';
import { GROUPES, getRoleRef } from '../config/constants';
import { NB_DOYENNES, NB_PAROISSES } from '../config/doyennesParoisses';
import { droits } from '../services/authService';
import { formaterNombre } from '../lib/utils';
import { exporterRegistreSynthese } from '../components/pdf/AnnuairePDF';
import { cn } from '../lib/utils';

/**
 * Tableau de bord.
 *
 * Deux lectures y répondent aux questions que se posent les responsables :
 * « où sont les Samuels » (répartition territoriale) et « où en sont-ils »
 * (échelle des grades, qui est une vraie progression et se lit donc du bas
 * vers le haut, comme on monte en charge).
 */
export function Dashboard() {
  const { membres, chargement, erreur } = useRegistre();
  const compte = useAuth((s) => s.compte);
  const stats = useMemo(() => calculerStatistiques(membres), [membres]);

  const perimetre = compte?.paroisseCode
    ? membres[0]?.paroisse_nom ?? 'Votre paroisse'
    : compte?.doyenneSlug
      ? `Doyenné de ${membres[0]?.doyenne_nom ?? ''}`.trim()
      : 'Ensemble du diocèse';

  // Le dernier Pass validé sert d'aperçu : la carte reste l'objet du système.
  const passEnVitrine = useMemo(
    () => membres.find((m) => m.statut_validation) ?? membres[0] ?? null,
    [membres],
  );

  if (chargement) {
    return <p className="py-20 text-center text-texte-faible">Chargement du registre…</p>;
  }
  if (erreur) {
    return (
      <Panneau>
        <Vide titre="Le registre n’a pas pu être chargé">{erreur}</Vide>
      </Panneau>
    );
  }
  if (membres.length === 0) {
    return (
      <Panneau>
        <Vide
          titre="Aucun Samuel inscrit"
          action={
            droits.peutSaisir(compte) ? (
              <Link to="/recensement">
                <Button variante="principal">Inscrire le premier Samuel</Button>
              </Link>
            ) : undefined
          }
        >
          Le registre de votre périmètre est encore vide. Le référentiel
          territorial, lui, est déjà en place : {NB_DOYENNES} doyennés,{' '}
          {NB_PAROISSES} paroisses et les 9 grades liturgiques vous attendent
          dans les listes déroulantes.
        </Vide>
      </Panneau>
    );
  }

  const maxDoyenne = Math.max(...stats.parDoyenne.map((d) => d.total), 1);
  const maxGrade = Math.max(...stats.parGrade.map((g) => g.total), 1);

  return (
    <div className="flex flex-col gap-5">
      {/* Bandeau d'identification du périmètre. */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-bordure pb-4">
        <div>
          <h1 className="text-titre">Registre Matrice Diocésain</h1>
          <p className="mt-1 text-petit text-texte-doux">
            {perimetre} — {getRoleRef(compte?.role ?? '')?.nom}
          </p>
        </div>
        <Button
          onClick={() => exporterRegistreSynthese(membres, perimetre)}
          icone={
            <svg viewBox="0 0 16 16" aria-hidden className="size-3.5 fill-none stroke-current stroke-[1.5]">
              <path d="M8 2v8M5 7l3 3 3-3M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          Registre des effectifs
        </Button>
      </header>

      {/* Compteurs. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { valeur: stats.total, intitule: 'Samuels inscrits', detail: `${stats.paroissesActives} paroisses` },
          { valeur: stats.valides, intitule: 'Pass validés', detail: `${Math.round((stats.valides / stats.total) * 100)} % du registre`, ton: 'vert' },
          { valeur: stats.enAttente, intitule: 'Dossiers en attente', detail: 'Validation pastorale', ton: 'orange' },
          { valeur: stats.parGroupe[1], intitule: 'Nouveaux cette année', detail: 'Groupe 1' },
        ].map((c) => (
          <div
            key={c.intitule}
            className={cn(
              'rounded-[var(--radius-panneau)] border border-bordure bg-fond px-4 py-3.5',
              // L'orange ne porte jamais de chiffre : trop clair sur blanc.
              // Il passe en liseré, ce qui suffit à désigner la pile à traiter.
              c.ton === 'orange' && 'border-l-4 border-l-orange',
            )}
          >
            <p
              className={cn(
                'chiffres text-titre font-extrabold',
                c.ton === 'vert' && 'text-vert-action',
              )}
            >
              {formaterNombre(c.valeur)}
            </p>
            <p className="mt-0.5 text-base leading-tight">{c.intitule}</p>
            <p className="text-micro text-texte-faible">{c.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Répartition territoriale. */}
        <Panneau
          titre="Effectifs par doyenné"
          description="Classés du plus nombreux au moins nombreux"
        >
          <ul className="flex flex-col gap-2.5">
            {stats.parDoyenne.map((d) => (
              <li key={d.slug} className="grid grid-cols-[8.5rem_1fr_3rem] items-center gap-3">
                <span className="truncate text-base">{d.nom}</span>
                <span className="h-2.5 rounded-full bg-fond-discret" aria-hidden>
                  <span
                    className="block h-full rounded-full bg-vert"
                    style={{ width: `${Math.max(2, (d.total / maxDoyenne) * 100)}%` }}
                  />
                </span>
                <span className="chiffres text-right text-petit font-medium">
                  {formaterNombre(d.total)}
                </span>
              </li>
            ))}
          </ul>
        </Panneau>

        {/* Le Pass : l'objet que tout le reste sert à produire. */}
        <Panneau
          titre="Le Pass-Samuel"
          description={passEnVitrine ? 'Dernier Pass du registre' : undefined}
          contenuClassName="flex flex-col items-center gap-4"
        >
          {passEnVitrine && (
            <>
              <PassCardPreview membre={passEnVitrine} />
              <Link to="/annuaire" className="text-petit text-bleu-lien hover:underline">
                Consulter l'annuaire et imprimer les Pass
              </Link>
            </>
          )}
        </Panneau>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/*
          L'échelle des grades se lit de bas en haut : c'est l'ordre dans
          lequel un Samuel progresse, du Postulant au Cérémoniaire.
        */}
        <Panneau
          titre="Progression liturgique"
          description="Du Postulant au Cérémoniaire"
        >
          <ul className="flex flex-col-reverse gap-1.5">
            {GRADES_REF.map((g) => {
              const total = stats.parGrade.find((x) => x.nom === g.nom)?.total ?? 0;
              return (
                <li key={g.nom} className="grid grid-cols-[1.25rem_10.5rem_1fr_2.75rem] items-center gap-2.5">
                  <span className="chiffres text-right text-micro text-bleu-lien">{g.rang}</span>
                  <span className="truncate text-petit" title={g.charge}>
                    {libelleGrade(g.nom)}
                  </span>
                  <span className="h-2 rounded-full bg-fond-discret" aria-hidden>
                    <span
                      className="block h-full rounded-full bg-bleu-franc"
                      style={{ width: `${total === 0 ? 0 : Math.max(2, (total / maxGrade) * 100)}%` }}
                    />
                  </span>
                  <span className="chiffres text-right text-petit">{formaterNombre(total)}</span>
                </li>
              );
            })}
          </ul>
        </Panneau>

        <Panneau titre="Répartition par groupe" description="Calculée sur l'ancienneté">
          <ul className="flex flex-col gap-4">
            {GROUPES.map((g) => {
              const total = stats.parGroupe[g.numero];
              const part = stats.total ? Math.round((total / stats.total) * 100) : 0;
              return (
                <li key={g.numero}>
                  <div className="flex items-baseline justify-between gap-3">
                    <BadgeGroupe groupe={g.numero} />
                    <span className="chiffres text-base font-medium">
                      {formaterNombre(total)}
                      <span className="ml-1.5 text-petit text-texte-faible">{part} %</span>
                    </span>
                  </div>
                  <p className="mt-1 text-micro text-texte-faible">{g.critere}</p>
                  <span className="mt-1.5 block h-2 rounded-full bg-fond-discret" aria-hidden>
                    <span
                      className={cn('block h-full rounded-full', FOND_GROUPE[g.numero])}
                      style={{ width: `${part}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </Panneau>
      </div>
    </div>
  );
}
