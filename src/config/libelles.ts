import { DIOCESE, GROUPES } from './constants';
import { NB_DOYENNES, NB_PAROISSES } from './doyennesParoisses';

export { DIOCESE };

export const NB_DOYENNES_PAROISSES = `${NB_DOYENNES} doyennés, ${NB_PAROISSES} paroisses.`;

/** Phrase de critère affichée à côté de chaque groupe. */
export function critereGroupe(numero: 1 | 2 | 3): string {
  return GROUPES.find((g) => g.numero === numero)?.critere ?? '';
}
