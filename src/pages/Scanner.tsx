import { useCallback, useMemo, useState, type FormEvent } from 'react';
import type { ResultatControle } from '../lib/controle';
import { controlerPass, extraireNID } from '../lib/controle';
import { QRScanner } from '../components/qr/QRScanner';
import { Panneau, Champ, Vide } from '../components/ui/Panneau';
import { Badge, BadgeGroupe } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { samuelService } from '../services/samuelService';
import { libelleGrade, rangDuGrade } from '../config/grades';
import { paroisseService } from '../services/paroisseService';
import { formaterDateCourte } from '../lib/utils';
import { NID_FORMAT_LISIBLE } from '../config/constants';
import { cn } from '../lib/utils';

/**
 * Contrôle des Pass au portail d'un rassemblement (CDCF Module 4).
 *
 * Le verdict occupe tout l'écran et se lit à bout de bras : au portail d'un
 * camp, le contrôleur tient le téléphone d'une main et le Pass de l'autre.
 * Les derniers passages restent affichés pour revenir sur un cas litigieux.
 */

const APPARENCE: Record<
  ResultatControle['verdict'],
  { fond: string; texte: string; libelle: string }
> = {
  accepte: {
    fond: 'border-vert-action bg-vert-clair',
    texte: 'text-vert-action',
    libelle: 'Accès autorisé',
  },
  non_valide: {
    fond: 'border-orange-bordure bg-orange-clair',
    texte: 'text-texte',
    libelle: 'Pass non validé',
  },
  empreinte_invalide: {
    fond: 'border-rouge-bordure bg-rouge-clair',
    texte: 'text-rouge',
    libelle: 'Pass non authentique',
  },
  inconnu: {
    fond: 'border-rouge-bordure bg-rouge-clair',
    texte: 'text-rouge',
    libelle: 'Pass inconnu',
  },
};

interface Passage extends ResultatControle {
  horodatage: Date;
}

export function Scanner() {
  const [resultat, setResultat] = useState<ResultatControle | null>(null);
  const [historique, setHistorique] = useState<Passage[]>([]);
  const [saisieManuelle, setSaisieManuelle] = useState('');
  const [verification, setVerification] = useState(false);

  const traiter = useCallback(async (contenu: string) => {
    setVerification(true);
    try {
      // Le registre est interrogé matricule par matricule : le contrôleur
      // n'a pas à charger tout l'annuaire du diocèse sur son téléphone.
      const extrait = extraireNID(contenu);
      const membre = extrait ? await samuelService.parNID(extrait.nid) : null;

      const verdict = controlerPass(contenu, () => membre);
      setResultat(verdict);
      setHistorique((h) => [{ ...verdict, horodatage: new Date() }, ...h].slice(0, 12));
    } catch {
      const echec: ResultatControle = {
        verdict: 'inconnu',
        membre: null,
        nidPresente: null,
        message: "Le registre n'a pas répondu. Réessayez le contrôle.",
      };
      setResultat(echec);
    } finally {
      setVerification(false);
    }
  }, []);

  function soumettreManuel(e: FormEvent) {
    e.preventDefault();
    if (!saisieManuelle.trim()) return;
    void traiter(saisieManuelle);
    setSaisieManuelle('');
  }

  const apparence = resultat ? APPARENCE[resultat.verdict] : null;

  const compteurs = useMemo(() => {
    const acceptes = historique.filter((p) => p.verdict === 'accepte').length;
    return { total: historique.length, acceptes, refuses: historique.length - acceptes };
  }, [historique]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-bordure pb-4">
        <div>
          <h1 className="text-titre">Contrôle des Pass</h1>
          <p className="mt-1 text-petit text-texte-doux">
            Présentez le QR Code du Pass-Samuel devant la caméra.
          </p>
        </div>
        {historique.length > 0 && (
          <p className="chiffres text-petit text-texte-doux">
            {compteurs.total} contrôle{compteurs.total > 1 ? 's' : ''} —{' '}
            <span className="text-vert-action">{compteurs.acceptes} accepté{compteurs.acceptes > 1 ? 's' : ''}</span>
            {compteurs.refuses > 0 && (
              <>
                {', '}
                <span className="text-rouge">{compteurs.refuses} refusé{compteurs.refuses > 1 ? 's' : ''}</span>
              </>
            )}
          </p>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <QRScanner onLecture={(c) => void traiter(c)} />

          <Panneau titre="Saisie manuelle" description="Si le code est illisible ou abîmé.">
            <form onSubmit={soumettreManuel} className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Matricule diocésain"
                  value={saisieManuelle}
                  onChange={(e) => setSaisieManuelle(e.target.value)}
                  placeholder={NID_FORMAT_LISIBLE}
                  className="matricule"
                  autoCapitalize="characters"
                />
              </div>
              <Button type="submit" variante="principal" enCours={verification}>
                Vérifier
              </Button>
            </form>
          </Panneau>
        </div>

        <div className="flex flex-col gap-4">
          {/* Verdict. */}
          {resultat && apparence ? (
            <section
              aria-live="polite"
              className={cn(
                'rounded-[var(--radius-panneau)] border-2 px-4 py-4',
                apparence.fond,
              )}
            >
              <p className={cn('text-moyen font-bold', apparence.texte)}>
                {apparence.libelle}
              </p>
              <p className="mt-1 text-petit text-texte-doux">{resultat.message}</p>

              {resultat.membre ? (
                <div className="mt-4 border-t border-current/15 pt-3">
                  <p className="text-base font-bold">
                    {resultat.membre.prenom} {resultat.membre.nom}
                  </p>
                  <p className="matricule mt-0.5 text-petit text-texte-doux">
                    {resultat.membre.id_nid}
                  </p>
                  <dl className="mt-3 divide-y divide-current/10">
                    <Champ intitule="Paroisse">
                      {paroisseService.libelleComplet(resultat.membre.paroisse_code)}
                    </Champ>
                    <Champ intitule="Doyenné">{resultat.membre.doyenne_nom}</Champ>
                    <Champ intitule="Grade liturgique">
                      <span className="chiffres text-bleu-lien">
                        {rangDuGrade(resultat.membre.grade_actuel)}
                      </span>{' '}
                      {libelleGrade(resultat.membre.grade_actuel)}
                    </Champ>
                    <Champ intitule="Groupe">
                      <BadgeGroupe groupe={resultat.membre.groupe_calcule} />
                    </Champ>
                    <Champ intitule="Né(e) le">
                      {formaterDateCourte(resultat.membre.date_naissance)}
                    </Champ>
                    <Champ intitule="Téléphone des parents">
                      {resultat.membre.contact_parent ?? '—'}
                    </Champ>
                  </dl>
                </div>
              ) : (
                resultat.nidPresente && (
                  <p className="matricule mt-3 text-petit text-texte-doux">
                    Matricule présenté : {resultat.nidPresente}
                  </p>
                )
              )}
            </section>
          ) : (
            <Panneau>
              <Vide titre="Aucun Pass contrôlé">
                Le résultat du contrôle s'affichera ici dès le premier scan.
              </Vide>
            </Panneau>
          )}

          {historique.length > 1 && (
            <Panneau titre="Derniers passages" contenuClassName="px-0 py-0">
              <ul className="divide-y divide-[var(--color-bordure)]">
                {historique.slice(1).map((p, i) => (
                  <li
                    key={`${p.nidPresente}-${p.horodatage.getTime()}-${i}`}
                    className="flex items-center justify-between gap-3 px-4 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-petit">
                        {p.membre ? `${p.membre.prenom} ${p.membre.nom}` : 'Pass non reconnu'}
                      </span>
                      <span className="matricule block text-micro text-texte-faible">
                        {p.nidPresente ?? '—'}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge ton={p.verdict === 'accepte' ? 'vert' : 'rouge'}>
                        {p.verdict === 'accepte' ? 'Accepté' : 'Refusé'}
                      </Badge>
                      <span className="chiffres text-micro text-texte-faible">
                        {p.horodatage.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panneau>
          )}
        </div>
      </div>
    </div>
  );
}
