import type { NumeroGroupe } from '../config/constants';
import { GROUPES } from '../config/constants';
import { anniversaire, estDateValide, versJour } from './dates';

/**
 * Classement automatique par ancienneté.
 * Source : CDCF Pass-Samuel v2.0, Module 2.
 *
 *   Groupe 1 — Nouveaux   : ancienneté < 1 an
 *   Groupe 2 — Confirmés  : ancienneté entre 1 et 3 ans
 *   Groupe 3 — Anciens    : ancienneté > 3 ans, ou responsable
 *
 * Le groupe n'est jamais saisi : il se recalcule à chaque consultation,
 * de sorte qu'un Samuel change de groupe le jour anniversaire de son entrée.
 *
 * Les bornes sont comparées de jour à jour, pas d'instant à instant : le jour
 * du troisième anniversaire, le Samuel reste « entre 1 et 3 ans » (Groupe 2)
 * du matin au soir, et ne passe Groupe 3 que le lendemain.
 */

/** Ancienneté en années pleines, pour l'affichage. */
export function calculerAnciennete(
  dateEntree: string | Date,
  reference: Date = new Date(),
): number {
  const entree = versJour(dateEntree);
  const ref = versJour(reference);
  if (!estDateValide(entree) || !estDateValide(ref)) return 0;

  let annees = ref.getFullYear() - entree.getFullYear();
  const moisEcoules = ref.getMonth() - entree.getMonth();
  if (moisEcoules < 0 || (moisEcoules === 0 && ref.getDate() < entree.getDate())) {
    annees--;
  }
  return Math.max(0, annees);
}

export function calculerGroupe(
  dateEntree: string | Date,
  estResponsable = false,
  reference: Date = new Date(),
): NumeroGroupe {
  if (estResponsable) return 3;

  const entree = versJour(dateEntree);
  const ref = versJour(reference);
  if (!estDateValide(entree) || !estDateValide(ref)) return 1;

  if (ref < anniversaire(entree, 1)) return 1;
  if (ref <= anniversaire(entree, 3)) return 2;
  return 3;
}

export function nomGroupe(numero: NumeroGroupe): string {
  return GROUPES.find((g) => g.numero === numero)?.nom ?? `Groupe ${numero}`;
}

export function libelleGroupe(numero: NumeroGroupe): string {
  return `Groupe ${numero} — ${nomGroupe(numero)}`;
}

/** Date du passage au groupe suivant, ou null si le Samuel est déjà Groupe 3. */
export function dateProchainGroupe(
  dateEntree: string | Date,
  estResponsable = false,
  reference: Date = new Date(),
): Date | null {
  const groupe = calculerGroupe(dateEntree, estResponsable, reference);
  if (groupe === 3) return null;

  const entree = versJour(dateEntree);
  if (!estDateValide(entree)) return null;
  return anniversaire(entree, groupe === 1 ? 1 : 3);
}

/** Nombre de mois restant avant le passage au groupe suivant, ou null si Groupe 3. */
export function moisAvantGroupeSuivant(
  dateEntree: string | Date,
  estResponsable = false,
  reference: Date = new Date(),
): number | null {
  const seuil = dateProchainGroupe(dateEntree, estResponsable, reference);
  if (!seuil) return null;

  const ref = versJour(reference);
  const mois =
    (seuil.getFullYear() - ref.getFullYear()) * 12 + (seuil.getMonth() - ref.getMonth());
  return Math.max(0, mois);
}
