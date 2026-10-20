/**
 * Référentiel des 9 grades liturgiques officiels de l'Aumônerie des Samuels.
 * Source : CDCF Pass-Samuel v2.0, § 2.2.
 *
 * L'ordre est significatif : il reproduit la progression du servant d'autel,
 * du Postulant au Cérémoniaire. `rang` sert au tri et à l'affichage de l'échelle.
 */

export const GRADES = [
  'Postulant',
  'Stagiaire',
  'Acolyte',
  'Porte-bénitier',
  'Céroféraire',
  'Porte-croix',
  'Naviculaire',
  'Thuriféraire',
  'Cérémoniaire',
] as const;

export type Grade = (typeof GRADES)[number];

export interface GradeRef {
  nom: Grade;
  /** Position dans la progression, de 1 (Postulant) à 9 (Cérémoniaire). */
  rang: number;
  /** Ce que le Samuel porte ou fait pendant la célébration. */
  charge: string;
}

export const GRADES_REF: GradeRef[] = [
  { nom: 'Postulant', rang: 1, charge: "Demande son admission, suit la formation initiale" },
  { nom: 'Stagiaire', rang: 2, charge: "Sert à l'essai sous la conduite d'un ancien" },
  { nom: 'Acolyte', rang: 3, charge: "Sert l'autel et présente les burettes" },
  { nom: 'Porte-bénitier', rang: 4, charge: "Porte le bénitier et le goupillon" },
  { nom: 'Céroféraire', rang: 5, charge: 'Porte les cierges de procession' },
  { nom: 'Porte-croix', rang: 6, charge: 'Porte la croix de procession (cruciféraire)' },
  { nom: 'Naviculaire', rang: 7, charge: "Porte la navette d'encens" },
  { nom: 'Thuriféraire', rang: 8, charge: "Porte et balance l'encensoir" },
  { nom: 'Cérémoniaire', rang: 9, charge: 'Dirige le service de toute la célébration' },
];

const GRADE_PAR_NOM = new Map(GRADES_REF.map((g) => [g.nom, g]));

export function getGrade(nom: string): GradeRef | undefined {
  return GRADE_PAR_NOM.get(nom as Grade);
}

export function rangDuGrade(nom: string): number {
  return GRADE_PAR_NOM.get(nom as Grade)?.rang ?? 0;
}

/**
 * Le CDCF nomme ce grade « Porte-croix / Cruciféraire ».
 * La base stocke « Porte-croix » ; l'interface affiche le libellé complet.
 */
export function libelleGrade(nom: string): string {
  return nom === 'Porte-croix' ? 'Porte-croix (Cruciféraire)' : nom;
}
