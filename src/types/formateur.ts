import type { NumeroGroupe } from '../config/constants';

/** Encadrant rattaché à une paroisse, affecté à un ou plusieurs groupes. */
export interface Formateur {
  id_formateur: number;
  nom: string;
  prenom: string;
  contact: string | null;
  paroisse_code: string;
  /**
   * Formateur décanal de secteur : peut encadrer une autre paroisse
   * du même doyenné que sa paroisse de rattachement.
   */
  est_decanal_secteur: boolean;
  /** Groupes encadrés dans la paroisse d'affectation. */
  groupes: NumeroGroupe[];
  /** Paroisse réellement encadrée si différente du rattachement. */
  paroisse_affectation_code: string | null;
}

export type FormateurSaisie = Omit<Formateur, 'id_formateur'>;
