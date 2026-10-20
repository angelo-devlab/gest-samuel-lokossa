/**
 * Normalisation des dates civiles.
 *
 * Les dates du registre (entrée chez les Samuels, naissance) sont des dates
 * civiles sans heure. Deux pièges les corrompent si on les manipule comme des
 * instants :
 *
 *   1. `new Date('2023-06-15')` est interprété en UTC par la spécification ;
 *      lu depuis un navigateur à l'ouest de Greenwich, il retombe au 14 juin.
 *   2. Comparer une date civile à `new Date()` fait entrer l'heure courante
 *      dans le calcul : un Samuel changeait de groupe à midi le jour de son
 *      anniversaire au lieu de tenir toute la journée.
 *
 * Tout passe donc par `versJour`, qui ramène n'importe quelle entrée à minuit
 * dans le fuseau local.
 */

const DATE_SEULE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Ramène une date, civile ou instantanée, à minuit local. */
export function versJour(valeur: string | Date): Date {
  if (typeof valeur === 'string') {
    const m = DATE_SEULE.exec(valeur.trim());
    if (m) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
  }
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return d;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function estDateValide(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

/** Même jour décalé de `annees` années, à minuit local. */
export function anniversaire(depart: Date, annees: number): Date {
  return new Date(depart.getFullYear() + annees, depart.getMonth(), depart.getDate());
}

/** Aujourd'hui à minuit local. */
export function jourCourant(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
