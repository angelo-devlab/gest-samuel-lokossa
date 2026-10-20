import {
  DOYENNES,
  PAROISSES,
  getDoyenne,
  getParoisse,
  paroissesDuDoyenne,
  type DoyenneRef,
  type ParoisseAvecDoyenne,
  type ParoisseRef,
} from '../config/doyennesParoisses';

/**
 * Accès au référentiel territorial.
 *
 * Les 10 doyennés et 62 paroisses sont figés par le CDCF : ils sont livrés
 * avec l'application plutôt que chargés depuis le serveur. Les listes
 * déroulantes restent ainsi utilisables hors connexion, au presbytère comme
 * sur le terrain, et une coupure réseau ne bloque jamais une inscription.
 */

export const paroisseService = {
  doyennes(): DoyenneRef[] {
    return DOYENNES;
  },

  paroisses(): ParoisseAvecDoyenne[] {
    return PAROISSES;
  },

  /** Second niveau de la liste en cascade. */
  paroissesDuDoyenne(slug: string): ParoisseRef[] {
    return paroissesDuDoyenne(slug);
  },

  doyenne(slug: string): DoyenneRef | undefined {
    return getDoyenne(slug);
  },

  paroisse(code: string): ParoisseAvecDoyenne | undefined {
    return getParoisse(code);
  },

  /** Libellé complet pour les en-têtes de PDF et les fiches. */
  libelleComplet(code: string): string {
    const p = getParoisse(code);
    return p ? `${p.nom} (${p.vocable})` : code;
  },
};
