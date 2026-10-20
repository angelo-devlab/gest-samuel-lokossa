import { ROLES, type Role } from '../config/constants';
import { getDoyenne, getParoisse } from '../config/doyennesParoisses';
import { supabase, supabaseConfigure } from '../lib/supabaseClient';

/**
 * Authentification et périmètres d'accès (CDCF § 6).
 *
 * Les contrôles rendus ici pilotent l'affichage. Sous Supabase, les mêmes
 * règles sont réappliquées par les politiques RLS (database/policies.sql) :
 * cacher un bouton ne protège rien, c'est le serveur qui tranche.
 */

export interface Compte {
  id: string;
  nomComplet: string;
  role: Role;
  /** Périmètre décanal, pour l'aumônier. */
  doyenneSlug: string | null;
  /** Périmètre paroissial, pour le responsable. */
  paroisseCode: string | null;
}

/**
 * Comptes d'accès locaux, un par rôle du CDCF.
 *
 * Ils servent tant que Supabase n'est pas configuré : le registre est vide,
 * ces comptes ouvrent simplement chacun son périmètre. Dès que les clés du
 * serveur sont fournies, ils cessent d'être proposés et l'authentification
 * passe entièrement par Supabase.
 */
export const COMPTES_LOCAUX: (Compte & { motDePasse: string; description: string })[] = [
  {
    id: 'demo-admin',
    nomComplet: 'Accès Diocèse',
    role: ROLES.ADMIN,
    doyenneSlug: null,
    paroisseCode: null,
    motDePasse: 'demo',
    description: 'Les 62 paroisses, saisie et validation',
  },
  {
    id: 'demo-aumonier',
    nomComplet: 'Accès Doyénné',
    role: ROLES.AUMONIER,
    doyenneSlug: 'lokossa',
    paroisseCode: null,
    motDePasse: 'demo',
    description: 'Doyenné de Lokossa, 9 paroisses',
  },
  {
    id: 'demo-paroissial',
    nomComplet: 'Accès Paroisse',
    role: ROLES.PAROISSIAL,
    doyenneSlug: 'lokossa',
    paroisseCode: 'CAN',
    motDePasse: 'demo',
    description: 'Cathédrale Lokossa, saisie et grades',
  },
  {
    id: 'demo-controleur',
    nomComplet: 'Camp Diocésain',
    role: ROLES.CONTROLEUR,
    doyenneSlug: null,
    paroisseCode: null,
    motDePasse: 'demo',
    description: "Scanner seul, contrôle des Pass à l'entrée",
  },
];

export const authService = {
  async connecter(identifiant: string, motDePasse: string): Promise<Compte> {
    if (supabaseConfigure && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifiant,
        password: motDePasse,
      });
      if (error) throw new Error("Identifiant ou mot de passe incorrect.");

      const { data: profil, error: errProfil } = await supabase
        .from('profils')
        .select('*, doyennes(slug), paroisses(code_paroisse)')
        .eq('id', data.user.id)
        .single();
      if (errProfil || !profil) {
        throw new Error("Aucun profil n'est rattaché à ce compte. Contactez l'administrateur diocésain.");
      }

      return {
        id: profil.id,
        nomComplet: profil.nom_complet,
        role: profil.role,
        doyenneSlug: profil.doyennes?.slug ?? null,
        paroisseCode: profil.paroisses?.code_paroisse ?? null,
      };
    }

    const compte = COMPTES_LOCAUX.find((c) => c.id === identifiant);
    if (!compte || compte.motDePasse !== motDePasse) {
      throw new Error('Identifiant ou mot de passe incorrect.');
    }
    const { motDePasse: _, description: __, ...sansSecret } = compte;
    return sansSecret;
  },

  async deconnecter(): Promise<void> {
    if (supabaseConfigure && supabase) {
      await supabase.auth.signOut();
    }
  },
};

// ---------------------------------------------------------------------------
// Périmètres et droits
// ---------------------------------------------------------------------------

/** Vrai si le compte peut consulter les membres de cette paroisse. */
export function paroisseDansPerimetre(compte: Compte | null, code: string): boolean {
  if (!compte) return false;
  switch (compte.role) {
    case ROLES.ADMIN:
      return true;
    case ROLES.AUMONIER:
      return getParoisse(code)?.doyenneSlug === compte.doyenneSlug;
    case ROLES.PAROISSIAL:
      return code === compte.paroisseCode;
    case ROLES.CONTROLEUR:
      // Le contrôleur lit un Pass présenté, il ne parcourt pas l'annuaire.
      return false;
  }
}

/** Codes de paroisse visibles par le compte, pour restreindre les listes. */
export function paroissesVisibles(compte: Compte | null): string[] | null {
  if (!compte) return [];
  if (compte.role === ROLES.ADMIN) return null; // null = aucune restriction
  if (compte.role === ROLES.AUMONIER && compte.doyenneSlug) {
    return getDoyenne(compte.doyenneSlug)?.paroisses.map((p) => p.code) ?? [];
  }
  if (compte.role === ROLES.PAROISSIAL && compte.paroisseCode) {
    return [compte.paroisseCode];
  }
  return [];
}

export const droits = {
  /** Saisir un nouveau Samuel : administrateur et responsable paroissial. */
  peutSaisir: (c: Compte | null) =>
    c?.role === ROLES.ADMIN || c?.role === ROLES.PAROISSIAL,

  /** Validation pastorale : administrateur et aumônier décanal. */
  peutValider: (c: Compte | null) =>
    c?.role === ROLES.ADMIN || c?.role === ROLES.AUMONIER,

  /** Mise à jour des grades : tous les niveaux de responsabilité. */
  peutPromouvoir: (c: Compte | null) =>
    c?.role === ROLES.ADMIN || c?.role === ROLES.AUMONIER || c?.role === ROLES.PAROISSIAL,

  peutSupprimer: (c: Compte | null) => c?.role === ROLES.ADMIN,

  /** Gestion des formateurs et de leurs affectations. */
  peutGererFormateurs: (c: Compte | null) =>
    c?.role === ROLES.ADMIN || c?.role === ROLES.AUMONIER,

  /** Accès à l'annuaire et aux exports PDF. */
  peutConsulterAnnuaire: (c: Compte | null) =>
    c !== null && c.role !== ROLES.CONTROLEUR,

  /** Le scanner est ouvert à tous les rôles : chacun peut vérifier un Pass. */
  peutScanner: (c: Compte | null) => c !== null,

  peutVoirTableauDeBord: (c: Compte | null) =>
    c !== null && c.role !== ROLES.CONTROLEUR,
};
