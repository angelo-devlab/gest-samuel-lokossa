import { useMemo, useState, type FormEvent } from 'react';
import type { SamuelSaisie, Sexe } from '../../types/samuel';
import { VIDE, type ValeursRecensement } from './valeursRecensement';
import { Button } from '../ui/Button';
import { Checkbox, Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DoyenneParoisseSelect } from './DoyenneParoisseSelect';
import { GradeSelect } from './GradeSelect';
import { Panneau } from '../ui/Panneau';
import { BadgeGroupe } from '../ui/Badge';
import { calculerGroupe } from '../../lib/calculGroupe';
import { calculerAge, aujourdhuiISO } from '../../lib/utils';
import { NID_FORMAT_LISIBLE } from '../../config/constants';
import { critereGroupe } from '../../config/libelles';
import { uploaderEtObtenirUrlPhoto } from '../../services/samuelService';
/**
 * Saisie et mise à jour d'une fiche du Registre Matrice Diocésain
 * (CDCF Module 2).
 *
 * Le matricule et le groupe ne sont pas saisissables : ils découlent de la
 * paroisse et de la date d'entrée. Ils sont montrés en cours de saisie pour
 * que le responsable voie ce que la fiche produira avant de l'enregistrer.
 */

type Erreurs = Partial<Record<keyof ValeursRecensement, string>>;

function valider(v: ValeursRecensement): Erreurs {
  const e: Erreurs = {};
  if (!v.nom.trim()) e.nom = 'Le nom est obligatoire.';
  if (!v.prenom.trim()) e.prenom = 'Le prénom est obligatoire.';
  if (!v.sexe) e.sexe = 'Précisez le sexe.';
  if (!v.paroisse_code) e.paroisse_code = "Rattachez le Samuel à une paroisse.";
  if (!v.grade_actuel) e.grade_actuel = 'Choisissez un grade.';

  if (!v.date_naissance) {
    e.date_naissance = 'La date de naissance est obligatoire.';
  } else if (new Date(v.date_naissance) > new Date()) {
    e.date_naissance = 'Cette date est dans le futur.';
  }

  if (!v.date_entree) {
    e.date_entree = "La date d'entrée est obligatoire.";
  } else if (new Date(v.date_entree) > new Date()) {
    e.date_entree = 'Cette date est dans le futur.';
  } else if (v.date_naissance && new Date(v.date_entree) < new Date(v.date_naissance)) {
    e.date_entree = "L'entrée ne peut précéder la naissance.";
  }

  // Un sacrement suppose celui qui le précède : même règle qu'en base.
  if (v.premiere_communion && !v.baptise) {
    e.premiere_communion = 'La première communion suppose le baptême.';
  }
  if (v.confirme && !v.premiere_communion) {
    e.confirme = 'La confirmation suppose la première communion.';
  }
  return e;
}

interface Props {
  valeursInitiales?: ValeursRecensement;
  paroissesAutorisees?: string[] | null;
  /** Matricule déjà attribué, en modification : il n'est jamais réémis. */
  nidExistant?: string;
  onEnregistrer: (saisie: SamuelSaisie) => Promise<void>;
  onAnnuler?: () => void;
}

export function RecensementForm({
  valeursInitiales,
  paroissesAutorisees = null,
  nidExistant,
  onEnregistrer,
  onAnnuler,
}: Props) {
  const [v, setV] = useState<ValeursRecensement>(valeursInitiales ?? VIDE);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const maj = <K extends keyof ValeursRecensement>(cle: K, valeur: ValeursRecensement[K]) => {
    setV((x) => ({ ...x, [cle]: valeur }));
    setErreurs((e) => ({ ...e, [cle]: undefined }));
  };

  const groupe = useMemo(
    () => (v.date_entree ? calculerGroupe(v.date_entree, v.est_responsable) : null),
    [v.date_entree, v.est_responsable],
  );

  const apercuNID = useMemo(() => {
    if (nidExistant) return nidExistant;
    if (!v.paroisse_code || !v.date_entree) return null;
    const annee = new Date(v.date_entree).getFullYear();
    return `LOK-${annee}-${v.paroisse_code}-•••`;
  }, [nidExistant, v.paroisse_code, v.date_entree]);

  const age = v.date_naissance ? calculerAge(v.date_naissance) : null;

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreurGenerale(null);

    const trouvees = valider(v);
    if (Object.keys(trouvees).length > 0) {
      setErreurs(trouvees);
      // Amène le premier champ fautif sous les yeux plutôt que de laisser
      // chercher où est le problème dans un formulaire long.
      document
        .querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    setEnCours(true);
    try {
      await onEnregistrer({
        nom: v.nom.trim().toUpperCase(),
        prenom: v.prenom.trim(),
        date_naissance: v.date_naissance,
        sexe: v.sexe as Sexe,
        photo_url: v.photo_url.trim() || null,
        contact_parent: v.contact_parent.trim() || null,
        paroisse_code: v.paroisse_code,
        date_entree: v.date_entree,
        grade_actuel: v.grade_actuel as SamuelSaisie['grade_actuel'],
        baptise: v.baptise,
        premiere_communion: v.premiere_communion,
        confirme: v.confirme,
        est_responsable: v.est_responsable,
      });
      if (!valeursInitiales) setV({ ...VIDE, date_entree: aujourdhuiISO() });
    } catch (err) {
      setErreurGenerale(
        err instanceof Error ? err.message : "L'enregistrement n'a pas abouti.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} noValidate className="flex flex-col gap-4">
    <Panneau titre="Identité">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nom"
            value={v.nom}
            onChange={(e) => maj('nom', e.target.value)}
            erreur={erreurs.nom}
            obligatoire
            autoComplete="family-name"
            placeholder="AHOUANSOU"
          />
          <Input
            label="Prénoms"
            value={v.prenom}
            onChange={(e) => maj('prenom', e.target.value)}
            erreur={erreurs.prenom}
            obligatoire
            autoComplete="given-name"
            placeholder="Jean-Marie"
          />
          <Input
            label="Date de naissance"
            type="date"
            max={aujourdhuiISO()}
            value={v.date_naissance}
            onChange={(e) => maj('date_naissance', e.target.value)}
            erreur={erreurs.date_naissance}
            aide={age !== null ? `${age} ans` : undefined}
            obligatoire
          />
          <Select
            label="Sexe"
            value={v.sexe}
            onChange={(e) => maj('sexe', e.target.value as Sexe)}
            erreur={erreurs.sexe}
            obligatoire
            options={[
              { valeur: 'M', libelle: 'Masculin' },
              { valeur: 'F', libelle: 'Féminin' },
            ]}
          />
          <Input
            label="Téléphone des parents"
            type="tel"
            value={v.contact_parent}
            onChange={(e) => maj('contact_parent', e.target.value)}
            placeholder="+229 01 97 00 00 00"
            aide="Joignable en cas d'urgence pendant un camp"
          />

          {/* Champ d'importation de la photo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-petit font-medium text-texte">Photo du Samuel</label>
            <div className="flex items-center gap-3">
              {v.photo_url && (
                <img 
                  src={v.photo_url} 
                  alt="Aperçu" 
                  className="h-12 w-12 rounded-full object-cover border border-bordure" 
                />
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setEnCours(true);
                    const url = await uploaderEtObtenirUrlPhoto(file);
                    if (url) {
                      maj('photo_url', url);
                    }
                  } catch (err) {
                    setErreurGenerale("Impossible d'importer la photo.");
                  } finally {
                    setEnCours(false);
                  }
                }}
                className="text-petit text-texte-doux file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-petit file:font-semibold file:bg-bleu-clair file:text-bleu hover:file:bg-bleu-clair/80"
              />
            </div>
          </div>
        </div>
      </Panneau>
      <Panneau
        titre="Rattachement"
        description="Le doyenné filtre les paroisses proposées."
      >
        <div className="flex flex-col gap-4">
          <DoyenneParoisseSelect
            doyenneSlug={v.doyenneSlug}
            paroisseCode={v.paroisse_code}
            onChange={(d, p) => {
              setV((x) => ({ ...x, doyenneSlug: d, paroisse_code: p }));
              setErreurs((e) => ({ ...e, paroisse_code: undefined }));
            }}
            paroissesAutorisees={paroissesAutorisees}
            erreurParoisse={erreurs.paroisse_code}
            obligatoire
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date d'entrée chez les Samuels"
              type="date"
              max={aujourdhuiISO()}
              value={v.date_entree}
              onChange={(e) => maj('date_entree', e.target.value)}
              erreur={erreurs.date_entree}
              obligatoire
              aide="Détermine l'ancienneté et le groupe"
            />
            <GradeSelect
              valeur={v.grade_actuel}
              onChange={(g) => maj('grade_actuel', g)}
              erreur={erreurs.grade_actuel}
              obligatoire
            />
          </div>
        </div>
      </Panneau>

      <Panneau titre="Sacrements reçus">
        <div className="flex flex-col gap-3">
          <Checkbox
            label="Baptisé"
            checked={v.baptise}
            onChange={(c) =>
              setV((x) => ({
                ...x,
                baptise: c,
                // Retirer le baptême retire ce qui en découle.
                premiere_communion: c && x.premiere_communion,
                confirme: c && x.confirme,
              }))
            }
          />
          <Checkbox
            label="Première communion"
            description={!v.baptise ? 'Suppose le baptême' : undefined}
            disabled={!v.baptise}
            checked={v.premiere_communion}
            onChange={(c) =>
              setV((x) => ({ ...x, premiere_communion: c, confirme: c && x.confirme }))
            }
          />
          <Checkbox
            label="Confirmation"
            description={!v.premiere_communion ? 'Suppose la première communion' : undefined}
            disabled={!v.premiere_communion}
            checked={v.confirme}
            onChange={(c) => maj('confirme', c)}
          />
          {(erreurs.premiere_communion || erreurs.confirme) && (
            <p className="text-micro text-rouge">
              {erreurs.premiere_communion ?? erreurs.confirme}
            </p>
          )}
          <hr className="my-1 border-bordure" />
          <Checkbox
            label="Responsable de groupe"
            description="Un responsable est classé en Groupe 3 quelle que soit son ancienneté"
            checked={v.est_responsable}
            onChange={(c) => maj('est_responsable', c)}
          />
        </div>
      </Panneau>

      <Panneau
        titre="Attribué automatiquement"
        description="Ni le matricule ni le groupe ne se saisissent."
        contenuClassName="grid gap-4 sm:grid-cols-2"
      >
        <div>
          <p className="text-petit text-texte-faible">Matricule diocésain</p>
          <p className="matricule mt-1 text-moyen font-medium">
            {apercuNID ?? <span className="text-texte-faible">{NID_FORMAT_LISIBLE}</span>}
          </p>
          {!nidExistant && apercuNID && (
            <p className="mt-0.5 text-micro text-texte-faible">
              Le numéro de séquence est attribué à l'enregistrement.
            </p>
          )}
        </div>
        <div>
          <p className="text-petit text-texte-faible">Groupe</p>
          <div className="mt-1.5">
            {groupe ? (
              <>
                <BadgeGroupe groupe={groupe} />
                <p className="mt-1 text-micro text-texte-faible">{critereGroupe(groupe)}</p>
              </>
            ) : (
              <p className="text-texte-faible">Renseignez la date d'entrée.</p>
            )}
          </div>
        </div>
      </Panneau>

      {erreurGenerale && (
        <p
          role="alert"
          className="rounded-[var(--radius-panneau)] border border-rouge-bordure bg-rouge-clair px-3 py-2.5 text-petit text-rouge"
        >
          {erreurGenerale}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onAnnuler && (
          <Button type="button" variante="discret" onClick={onAnnuler}>
            Annuler
          </Button>
        )}
        <Button type="submit" variante="principal" enCours={enCours}>
          {nidExistant ? 'Enregistrer les modifications' : 'Inscrire ce Samuel'}
        </Button>
      </div>
    </form>
  );
}
