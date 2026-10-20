import type { Samuel, Sexe } from '../../types/samuel';
import { getParoisse } from '../../config/doyennesParoisses';
import { aujourdhuiISO } from '../../lib/utils';

/**
 * Forme du formulaire de recensement, séparée du composant.
 *
 * Les valeurs manipulées à l'écran ne sont pas celles du registre : le doyenné
 * n'y est qu'un filtre, les champs facultatifs valent une chaîne vide plutôt
 * que null, et le matricule n'existe pas encore. La conversion dans les deux
 * sens vit donc ici, et non dans le composant.
 */

export interface ValeursRecensement {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: Sexe | '';
  contact_parent: string;
  doyenneSlug: string;
  paroisse_code: string;
  date_entree: string;
  grade_actuel: string;
  baptise: boolean;
  premiere_communion: boolean;
  confirme: boolean;
  est_responsable: boolean;
  photo_url: string;
}

export const VIDE: ValeursRecensement = {
  nom: '', prenom: '', date_naissance: '', sexe: '', contact_parent: '',
  doyenneSlug: '', paroisse_code: '', date_entree: aujourdhuiISO(),
  grade_actuel: 'Postulant', baptise: false, premiere_communion: false,
  confirme: false, est_responsable: false, photo_url: '',
};

export function valeursDepuisMembre(m: Samuel): ValeursRecensement {
  return {
    nom: m.nom,
    prenom: m.prenom,
    date_naissance: m.date_naissance,
    sexe: m.sexe,
    contact_parent: m.contact_parent ?? '',
    doyenneSlug: getParoisse(m.paroisse_code)?.doyenneSlug ?? '',
    paroisse_code: m.paroisse_code,
    date_entree: m.date_entree,
    grade_actuel: m.grade_actuel,
    baptise: m.baptise,
    premiere_communion: m.premiere_communion,
    confirme: m.confirme,
    est_responsable: m.est_responsable,
    photo_url: m.photo_url ?? '',
  };
}

