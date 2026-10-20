import { useMemo } from 'react';
import { Select, type Option } from '../ui/Select';
import { paroisseService } from '../../services/paroisseService';
import { getParoisse } from '../../config/doyennesParoisses';

/**
 * Sélection territoriale en cascade (CDCF Module 1).
 *
 * Le choix d'un doyenné restreint la seconde liste à ses seules paroisses :
 * on ne peut donc pas rattacher un Samuel à une paroisse d'un autre doyenné.
 * Les deux listes couvrent le référentiel figé de 10 doyennés et 62 paroisses.
 */

interface Props {
  doyenneSlug: string;
  paroisseCode: string;
  onChange: (doyenneSlug: string, paroisseCode: string) => void;
  /** Restreint les choix au périmètre du compte connecté. */
  paroissesAutorisees?: string[] | null;
  obligatoire?: boolean;
  desactive?: boolean;
  erreurDoyenne?: string;
  erreurParoisse?: string;
  /** Ajoute une entrée « Tous » : utilisé par les filtres de l'annuaire. */
  avecTous?: boolean;
}

export function DoyenneParoisseSelect({
  doyenneSlug,
  paroisseCode,
  onChange,
  paroissesAutorisees = null,
  obligatoire = false,
  desactive = false,
  erreurDoyenne,
  erreurParoisse,
  avecTous = false,
}: Props) {
  const autorisees = useMemo(
    () => (paroissesAutorisees ? new Set(paroissesAutorisees) : null),
    [paroissesAutorisees],
  );

  // Un doyenné n'est proposé que s'il reste au moins une paroisse accessible.
  const optionsDoyennes: Option[] = useMemo(
    () =>
      paroisseService
        .doyennes()
        .map((d) => {
          const retenues = autorisees
            ? d.paroisses.filter((p) => autorisees.has(p.code))
            : d.paroisses;
          return { d, retenues };
        })
        .filter(({ retenues }) => retenues.length > 0)
        .map(({ d, retenues }) => ({
          valeur: d.slug,
          libelle: d.nom,
          detail: `${retenues.length} paroisse${retenues.length > 1 ? 's' : ''}`,
        })),
    [autorisees],
  );

  const optionsParoisses: Option[] = useMemo(() => {
    if (!doyenneSlug) return [];
    return paroisseService
      .paroissesDuDoyenne(doyenneSlug)
      .filter((p) => !autorisees || autorisees.has(p.code))
      .map((p) => ({ valeur: p.code, libelle: p.nom, detail: p.vocable }));
  }, [doyenneSlug, autorisees]);

  function changerDoyenne(slug: string) {
    // Changer de doyenné invalide la paroisse choisie, sauf si elle en relève.
    const resteValide = slug && getParoisse(paroisseCode)?.doyenneSlug === slug;
    onChange(slug, resteValide ? paroisseCode : '');
  }

  const inviteParoisse = !doyenneSlug
    ? "— Choisir d'abord un doyenné —"
    : avecTous
      ? 'Toutes les paroisses'
      : '— Choisir une paroisse —';

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        label="Doyenné"
        options={optionsDoyennes}
        value={doyenneSlug}
        onChange={(e) => changerDoyenne(e.target.value)}
        invite={avecTous ? 'Tous les doyennés' : '— Choisir un doyenné —'}
        obligatoire={obligatoire}
        disabled={desactive}
        erreur={erreurDoyenne}
      />
      <Select
        label="Paroisse"
        options={optionsParoisses}
        value={paroisseCode}
        onChange={(e) => onChange(doyenneSlug, e.target.value)}
        invite={inviteParoisse}
        obligatoire={obligatoire}
        disabled={desactive || !doyenneSlug}
        erreur={erreurParoisse}
        aide={
          doyenneSlug && !erreurParoisse
            ? `${optionsParoisses.length} paroisse${optionsParoisses.length > 1 ? 's' : ''} dans ce doyenné`
            : undefined
        }
      />
    </div>
  );
}
