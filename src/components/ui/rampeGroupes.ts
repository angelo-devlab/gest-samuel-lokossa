import type { NumeroGroupe } from '../../config/constants';

/**
 * Rampe des trois groupes.
 *
 * Les groupes forment une progression — nouveaux, confirmés, anciens. Une
 * rampe d'une seule teinte le dit mieux que trois couleurs sans rapport, et
 * respecte la règle de la charte : pas plus de deux couleurs vives par écran.
 *
 * Les trois paliers tiennent le contraste avec leur texte : 5,0:1, 4,9:1
 * et 4,6:1.
 */

/** Pastilles : fond, texte et bordure. */
export const PASTILLE_GROUPE: Record<NumeroGroupe, string> = {
  1: 'bg-bleu-pale text-bleu-lien border-bleu-bordure',
  2: 'bg-bleu-moyen text-bleu-nuit border-bleu-moyen',
  3: 'bg-bleu-franc text-white border-bleu-franc',
};

/** Aplats de la rampe, pour les barres et les jauges. */
export const FOND_GROUPE: Record<NumeroGroupe, string> = {
  1: 'bg-bleu-moyen',
  2: 'bg-bleu-franc',
  3: 'bg-bleu-nuit',
};
