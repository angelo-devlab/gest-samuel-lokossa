import type { Formateur } from '../types/formateur';
import type { Samuel } from '../types/samuel';

/**
 * Stockage local.
 *
 * Tient le registre dans le navigateur tant que Supabase n'est pas configuré.
 * Le registre démarre **vide** : aucune fiche n'est fabriquée, seules celles
 * que les responsables saisissent existent. Les écritures survivent au
 * rechargement mais ne quittent jamais le poste.
 */

const CLE = 'pass-samuel:registre';
/** À incrémenter quand la forme stockée change, pour repartir d'un registre sain. */
const VERSION = 5;

interface Contenu {
  version: number;
  membres: Samuel[];
  formateurs: Formateur[];
}

function vide(): Contenu {
  return { version: VERSION, membres: [], formateurs: [] };
}

function lire(): Contenu {
  if (typeof localStorage === 'undefined') return vide();
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) {
      const contenu = JSON.parse(brut) as Contenu;
      if (contenu.version === VERSION && Array.isArray(contenu.membres)) {
        return contenu;
      }
    }
  } catch {
    // Stockage illisible ou désactivé : on repart d'un registre sain.
  }
  const frais = vide();
  ecrire(frais);
  return frais;
}

function ecrire(contenu: Contenu): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CLE, JSON.stringify(contenu));
  } catch {
    // Quota dépassé ou navigation privée : la session reste utilisable en mémoire.
  }
}

let cache: Contenu | null = null;

function etat(): Contenu {
  cache ??= lire();
  return cache;
}

function sauver(): void {
  if (cache) ecrire(cache);
}

export const stockageLocal = {
  membres(): Samuel[] {
    return etat().membres;
  },

  formateurs(): Formateur[] {
    return etat().formateurs;
  },

  ajouterMembre(m: Samuel): Samuel {
    etat().membres.push(m);
    sauver();
    return m;
  },

  modifierMembre(nid: string, modifs: Partial<Samuel>): Samuel | null {
    const liste = etat().membres;
    const i = liste.findIndex((m) => m.id_nid === nid);
    if (i === -1) return null;
    liste[i] = { ...liste[i], ...modifs };
    sauver();
    return liste[i];
  },

  supprimerMembre(nid: string): boolean {
    const liste = etat().membres;
    const i = liste.findIndex((m) => m.id_nid === nid);
    if (i === -1) return false;
    liste.splice(i, 1);
    sauver();
    return true;
  },

  ajouterFormateur(f: Omit<Formateur, 'id_formateur'>): Formateur {
    const liste = etat().formateurs;
    const id = liste.reduce((max, x) => Math.max(max, x.id_formateur), 0) + 1;
    const cree = { ...f, id_formateur: id };
    liste.push(cree);
    sauver();
    return cree;
  },

  modifierFormateur(id: number, modifs: Partial<Formateur>): Formateur | null {
    const liste = etat().formateurs;
    const i = liste.findIndex((f) => f.id_formateur === id);
    if (i === -1) return null;
    liste[i] = { ...liste[i], ...modifs };
    sauver();
    return liste[i];
  },

  supprimerFormateur(id: number): boolean {
    const liste = etat().formateurs;
    const i = liste.findIndex((f) => f.id_formateur === id);
    if (i === -1) return false;
    liste.splice(i, 1);
    sauver();
    return true;
  },

  /** Vide entièrement le registre local. */
  reinitialiser(): void {
    cache = vide();
    sauver();
  },
};
