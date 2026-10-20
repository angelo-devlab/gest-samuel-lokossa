export type { Grade, GradeRef } from '../config/grades';

/** Une étape de la progression liturgique d'un Samuel. */
export interface HistoriqueGrade {
  id_historique: number;
  membre_nid: string;
  grade_nom: string;
  date_obtention: string;
}
