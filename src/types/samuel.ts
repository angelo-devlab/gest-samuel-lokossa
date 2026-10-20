import type { NumeroGroupe } from '../config/constants';
import type { Grade } from '../config/grades';

export type Sexe = 'M' | 'F';

/** Un membre du Registre Matrice Diocésain. */
export interface Samuel {
  /** Matricule diocésain, clé primaire. Format LOK-YYYY-PAR-XXX. */
  id_nid: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: Sexe;
  photo_url: string | null;
  contact_parent: string | null;
  /** Code de la paroisse d'attache (segment PAR du NID). */
  paroisse_code: string;
  /** Entrée chez les Samuels : point de départ du calcul d'ancienneté. */
  date_entree: string;
  grade_actuel: Grade;
  baptise: boolean;
  premiere_communion: boolean;
  confirme: boolean;
  /** Dérivé de l'ancienneté et de `est_responsable`, jamais saisi à la main. */
  groupe_calcule: NumeroGroupe;
  /** Un responsable est versé d'office au Groupe 3. */
  est_responsable: boolean;
  /** Validation pastorale par l'Aumônier ou le Curé. */
  statut_validation: boolean;
  /** Empreinte inscrite dans le QR Code du Pass. */
  qr_code_hash: string;
  created_at: string;
}

/** Champs saisis au formulaire ; le NID, le groupe et le hash sont calculés. */
export type SamuelSaisie = Omit<
  Samuel,
  'id_nid' | 'groupe_calcule' | 'qr_code_hash' | 'created_at' | 'statut_validation'
>;

/** Samuel enrichi des libellés territoriaux, pour les listes et les PDF. */
export interface SamuelEnrichi extends Samuel {
  paroisse_nom: string;
  doyenne_nom: string;
  doyenne_slug: string;
  anciennete_annees: number;
}

export interface FiltresAnnuaire {
  recherche: string;
  doyenneSlug: string | null;
  paroisseCode: string | null;
  groupe: NumeroGroupe | null;
  grade: string | null;
  /** null = tous, true = validés, false = en attente. */
  valide: boolean | null;
}
