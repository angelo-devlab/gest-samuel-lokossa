import { Select } from '../ui/Select';
import { GRADES_REF, libelleGrade } from '../../config/grades';

/**
 * Liste des 9 grades liturgiques, présentés dans l'ordre de la progression
 * du servant d'autel. Le rang précède l'intitulé : la liste se lit comme
 * l'échelle qu'elle est.
 */
export function GradeSelect({
  valeur,
  onChange,
  label = 'Grade liturgique',
  obligatoire = false,
  desactive = false,
  erreur,
  avecTous = false,
}: {
  valeur: string;
  onChange: (grade: string) => void;
  label?: string;
  obligatoire?: boolean;
  desactive?: boolean;
  erreur?: string;
  avecTous?: boolean;
}) {
  return (
    <Select
      label={label}
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      invite={avecTous ? 'Tous les grades' : '— Choisir un grade —'}
      obligatoire={obligatoire}
      disabled={desactive}
      erreur={erreur}
      options={GRADES_REF.map((g) => ({
        valeur: g.nom,
        libelle: `${g.rang}. ${libelleGrade(g.nom)}`,
        detail: g.charge,
      }))}
    />
  );
}
