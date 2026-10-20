import { useMemo, useState, type FormEvent } from 'react';
import type { FormateurSaisie } from '../../types/formateur';
import type { NumeroGroupe } from '../../config/constants';
import { GROUPES } from '../../config/constants';
import { Button } from '../ui/Button';
import { Checkbox, Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DoyenneParoisseSelect } from './DoyenneParoisseSelect';
import { affectationRecevable } from '../../services/formateurService';
import { getParoisse, paroissesDuDoyenne } from '../../config/doyennesParoisses';

/**
 * Saisie d'un formateur et de son affectation (CDCF Module 3).
 *
 * Le statut « formateur décanal de secteur » ouvre une seconde paroisse
 * d'intervention, limitée au doyenné de rattachement. La règle est vérifiée
 * ici pour l'afficher tout de suite, et redoublée en base par un trigger.
 */

interface Props {
  valeursInitiales?: FormateurSaisie;
  paroissesAutorisees?: string[] | null;
  onEnregistrer: (saisie: FormateurSaisie) => Promise<void>;
  onAnnuler?: () => void;
}

export function FormateurForm({
  valeursInitiales,
  paroissesAutorisees = null,
  onEnregistrer,
  onAnnuler,
}: Props) {
  const initial = valeursInitiales;
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [prenom, setPrenom] = useState(initial?.prenom ?? '');
  const [contact, setContact] = useState(initial?.contact ?? '');
  const [doyenneSlug, setDoyenneSlug] = useState(
    initial ? (getParoisse(initial.paroisse_code)?.doyenneSlug ?? '') : '',
  );
  const [paroisseCode, setParoisseCode] = useState(initial?.paroisse_code ?? '');
  const [decanal, setDecanal] = useState(initial?.est_decanal_secteur ?? false);
  const [affectation, setAffectation] = useState(initial?.paroisse_affectation_code ?? '');
  const [groupes, setGroupes] = useState<NumeroGroupe[]>(initial?.groupes ?? []);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  /** Autres paroisses du même doyenné, seules cibles possibles d'un secteur. */
  const optionsSecteur = useMemo(() => {
    if (!doyenneSlug || !paroisseCode) return [];
    return paroissesDuDoyenne(doyenneSlug)
      .filter((p) => p.code !== paroisseCode)
      .map((p) => ({ valeur: p.code, libelle: p.nom, detail: p.vocable }));
  }, [doyenneSlug, paroisseCode]);

  function basculerGroupe(n: NumeroGroupe) {
    setGroupes((g) => (g.includes(n) ? g.filter((x) => x !== n) : [...g, n].sort()));
  }

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (!nom.trim() || !prenom.trim()) {
      setErreur('Le nom et le prénom sont obligatoires.');
      return;
    }
    if (!paroisseCode) {
      setErreur('Rattachez le formateur à une paroisse.');
      return;
    }
    if (groupes.length === 0) {
      setErreur('Affectez le formateur à au moins un groupe.');
      return;
    }

    const cible = decanal && affectation ? affectation : null;
    const verdict = affectationRecevable({
      paroisse_code: paroisseCode,
      est_decanal_secteur: decanal,
      paroisse_affectation_code: cible,
    });
    if (!verdict.ok) {
      setErreur(verdict.motif);
      return;
    }

    setEnCours(true);
    try {
      await onEnregistrer({
        nom: nom.trim().toUpperCase(),
        prenom: prenom.trim(),
        contact: contact.trim() || null,
        paroisse_code: paroisseCode,
        est_decanal_secteur: decanal,
        groupes,
        paroisse_affectation_code: cible,
      });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement n'a pas abouti.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} obligatoire />
        <Input
          label="Prénom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          obligatoire
        />
      </div>

      <Input
        label="Contact"
        type="tel"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="+229 01 97 00 00 00"
      />

      <DoyenneParoisseSelect
        doyenneSlug={doyenneSlug}
        paroisseCode={paroisseCode}
        onChange={(d, p) => {
          setDoyenneSlug(d);
          setParoisseCode(p);
          setAffectation('');
        }}
        paroissesAutorisees={paroissesAutorisees}
        obligatoire
      />

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-petit font-medium text-texte-doux">
          Groupes encadrés <span className="text-rouge">*</span>
        </legend>
        {GROUPES.map((g) => (
          <Checkbox
            key={g.numero}
            label={`Groupe ${g.numero} — ${g.nom}`}
            description={g.critere}
            checked={groupes.includes(g.numero)}
            onChange={() => basculerGroupe(g.numero)}
          />
        ))}
      </fieldset>

      <div className="flex flex-col gap-3 rounded-[var(--radius-panneau)] border border-bordure bg-fond-discret px-3.5 py-3">
        <Checkbox
          label="Formateur décanal de secteur"
          description="Peut encadrer une autre paroisse de son doyenné"
          checked={decanal}
          onChange={(c) => {
            setDecanal(c);
            if (!c) setAffectation('');
          }}
        />
        {decanal && (
          <Select
            label="Paroisse encadrée en plus du rattachement"
            options={optionsSecteur}
            value={affectation}
            onChange={(e) => setAffectation(e.target.value)}
            invite="— Aucune pour l'instant —"
            disabled={!paroisseCode}
            aide={
              paroisseCode
                ? `Limité aux paroisses du doyenné de ${getParoisse(paroisseCode)?.doyenneNom}`
                : 'Choisissez d’abord la paroisse de rattachement.'
            }
          />
        )}
      </div>

      {erreur && (
        <p
          role="alert"
          className="rounded-[var(--radius-panneau)] border border-rouge-bordure bg-rouge-clair px-3 py-2.5 text-petit text-rouge"
        >
          {erreur}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {onAnnuler && (
          <Button type="button" variante="discret" onClick={onAnnuler}>
            Annuler
          </Button>
        )}
        <Button type="submit" variante="principal" enCours={enCours}>
          {initial ? 'Enregistrer' : 'Ajouter le formateur'}
        </Button>
      </div>
    </form>
  );
}
