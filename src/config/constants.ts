/**
 * Métadonnées du diocèse, format du matricule et rôles d'accès.
 * Source : CDCF Pass-Samuel v2.0, § 1, § 4 et § 6.
 */

export const DIOCESE = {
  nom: 'Diocèse de Lokossa',
  organisation: 'Aumônerie Diocésaine des Samuel',
  pays: 'Bénin',
  /** Préfixe du matricule diocésain. */
  codeDiocese: 'LOK',
} as const;

/** Format imposé du Numéro d'Identification Diocésain : LOK-YYYY-PAR-XXX. */
export const NID_PATTERN = /^LOK-\d{4}-[A-Z0-9]{3}-\d{3}$/;
export const NID_FORMAT_LISIBLE = 'LOK-AAAA-PAR-XXX';

/** Les trois groupes d'ancienneté calculés automatiquement. */
export const GROUPES = [
  {
    numero: 1 as const,
    nom: 'Nouveaux',
    critere: "Moins d'un an d'ancienneté",
  },
  {
    numero: 2 as const,
    nom: 'Confirmés',
    critere: "Entre 1 et 3 ans d'ancienneté",
  },
  {
    numero: 3 as const,
    nom: 'Anciens',
    critere: "Plus de 3 ans d'ancienneté, ou responsable",
  },
];

export type NumeroGroupe = 1 | 2 | 3;

export const ROLES = {
  ADMIN: 'admin_diocesain',
  AUMONIER: 'aumonier_decanal',
  PAROISSIAL: 'responsable_paroissial',
  CONTROLEUR: 'controleur_rassemblement',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface RoleRef {
  cle: Role;
  nom: string;
  perimetre: string;
  droits: string;
}

export const ROLES_REF: RoleRef[] = [
  {
    cle: ROLES.ADMIN,
    nom: 'Aumônerie Diocésaine',
    perimetre: 'Ensemble du diocèse (62 paroisses)',
    droits: 'Gestion globale, validation des membres, configuration et exports généraux',
  },
  {
    cle: ROLES.AUMONIER,
    nom: 'Aumônerie décanale',
    perimetre: 'Son doyenné et les paroisses rattachées',
    droits: 'Consultation et validation pour les paroisses de son doyenné',
  },
  {
    cle: ROLES.PAROISSIAL,
    nom: 'Bureau paroissial',
    perimetre: "Sa paroisse d'attache",
    droits: "Saisie des nouveaux membres, mise à jour des grades, consultation de l'annuaire local",
  },
  {
    cle: ROLES.CONTROLEUR,
    nom: 'Contrôleur',
    perimetre: 'Mode scanner',
    droits: 'Lecture et vérification des QR Codes Pass-Samuel lors des événements',
  },
];

export function getRoleRef(cle: string): RoleRef | undefined {
  return ROLES_REF.find((r) => r.cle === cle);
}

/** Planche d'autocollants A4 : 3 colonnes × 8 lignes = 24 étiquettes. */
export const PLANCHE_STICKERS = {
  colonnes: 3,
  lignes: 8,
  parPage: 24,
} as const;
