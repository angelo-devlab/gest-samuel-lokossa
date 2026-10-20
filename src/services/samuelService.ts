import type { FiltresAnnuaire, Samuel, SamuelEnrichi, SamuelSaisie } from '../types/samuel';
import type { NumeroGroupe } from '../config/constants';
import { getParoisse } from '../config/doyennesParoisses';
import { calculerAnciennete, calculerGroupe } from '../lib/calculGroupe';
import { genererNID, genererQRHash } from '../lib/generateNID';
import { normaliser } from '../lib/utils';
import { rangDuGrade } from '../config/grades';
import { supabase, supabaseConfigure } from '../lib/supabaseClient';
import { stockageLocal } from './stockageLocal';

/**
 * CRUD du Registre Matrice Diocésain.
 *
 * Deux dépôts derrière la même interface : Supabase quand les clés sont
 * fournies, stockage local sinon. Les appelants ne voient pas la différence.
 */

/** Ajoute les libellés territoriaux et l'ancienneté recalculée. */
import { parseNID } from '../lib/generateNID';

/** Ajoute les libellés territoriaux et l'ancienneté recalculée. */
export function enrichir(m: Samuel, reference: Date = new Date()): SamuelEnrichi {
  // Si paroisse_code n'est pas fourni par la DB, on l'extrait depuis le matricule NID (ex: LOK-2026-TOV-001 -> TOV)
  const codeParoisse = m.paroisse_code || parseNID(m.id_nid)?.paroisseCode || '';
  const p = getParoisse(codeParoisse);

  return {
    ...m,
    paroisse_code: codeParoisse,
    // Le groupe est redérivé à chaque lecture
    groupe_calcule: calculerGroupe(m.date_entree, m.est_responsable, reference),
    paroisse_nom: p?.nom ?? codeParoisse,
    doyenne_nom: p?.doyenneNom ?? '—',
    doyenne_slug: p?.doyenneSlug ?? '',
    anciennete_annees: calculerAnciennete(m.date_entree, reference),
  };
}

function correspond(m: SamuelEnrichi, f: FiltresAnnuaire): boolean {
  if (f.doyenneSlug && m.doyenne_slug !== f.doyenneSlug) return false;
  if (f.paroisseCode && m.paroisse_code !== f.paroisseCode) return false;
  if (f.groupe && m.groupe_calcule !== f.groupe) return false;
  if (f.grade && m.grade_actuel !== f.grade) return false;
  if (f.valide !== null && m.statut_validation !== f.valide) return false;

  if (f.recherche.trim()) {
    const q = normaliser(f.recherche);
    const champs = normaliser(`${m.nom} ${m.prenom} ${m.id_nid} ${m.paroisse_nom}`);
    if (!champs.includes(q)) return false;
  }
  return true;
}

/** Tri par paroisse, puis grade décroissant, puis nom — l'ordre des annuaires. */
function trierPourAnnuaire(a: SamuelEnrichi, b: SamuelEnrichi): number {
  return (
    a.paroisse_nom.localeCompare(b.paroisse_nom, 'fr') ||
    rangDuGrade(b.grade_actuel) - rangDuGrade(a.grade_actuel) ||
    a.nom.localeCompare(b.nom, 'fr') ||
    a.prenom.localeCompare(b.prenom, 'fr')
  );
}

export const FILTRES_VIDES: FiltresAnnuaire = {
  recherche: '',
  doyenneSlug: null,
  paroisseCode: null,
  groupe: null,
  grade: null,
  valide: null,
};

export const samuelService = {
  async tous(): Promise<SamuelEnrichi[]> {
    if (supabaseConfigure && supabase) {
      const { data, error } = await supabase.from('membres').select('*');
      if (error) throw new Error(`Lecture du registre impossible : ${error.message}`);
      return (data as Samuel[]).map((m) => enrichir(m)).sort(trierPourAnnuaire);
    }
    return stockageLocal.membres().map((m) => enrichir(m)).sort(trierPourAnnuaire);
  },

  async rechercher(filtres: FiltresAnnuaire): Promise<SamuelEnrichi[]> {
    const tous = await this.tous();
    return tous.filter((m) => correspond(m, filtres));
  },

  async parNID(nid: string): Promise<SamuelEnrichi | null> {
    if (supabaseConfigure && supabase) {
      const { data, error } = await supabase
        .from('membres')
        .select('*')
        .eq('id_nid', nid)
        .maybeSingle();
      if (error) throw new Error(`Recherche du matricule impossible : ${error.message}`);
      return data ? enrichir(data as Samuel) : null;
    }
    const m = stockageLocal.membres().find((x) => x.id_nid === nid);
    return m ? enrichir(m) : null;
  },

  /** Crée un Samuel : le matricule, le groupe et l'empreinte QR sont calculés ici. */
  async creer(saisie: SamuelSaisie): Promise<SamuelEnrichi> {
    const existants = (await this.tous()).map((m) => m.id_nid);
    const id_nid = genererNID(saisie.paroisse_code, saisie.date_entree, existants);

    const membre: Samuel = {
      ...saisie,
      id_nid,
      groupe_calcule: calculerGroupe(saisie.date_entree, saisie.est_responsable),
      statut_validation: false,
      qr_code_hash: genererQRHash(id_nid, saisie.date_naissance),
      created_at: new Date().toISOString(),
    };

    if (supabaseConfigure && supabase) {
      // 1. Récupérer l'id_paroisse numérique à partir du code (ex: "DOU", "LOB")
      const { data: paroisseData, error: paroisseError } = await supabase
        .from('paroisses')
        .select('id_paroisse')
        .eq('code_paroisse', saisie.paroisse_code)
        .single();

      if (paroisseError || !paroisseData) {
        throw new Error("Paroisse introuvable pour ce code.");
      }

      // 2. Extraire explicitement 'paroisse_code' pour ne PAS l'envoyer à Supabase
      const { paroisse_code, ...donneesAInserer } = membre;

      // 3. Insérer dans la table 'membres' avec 'paroisse_id' (entier)
      const { data, error } = await supabase
        .from('membres')
        .insert({ 
          ...donneesAInserer, 
          paroisse_id: paroisseData.id_paroisse
        })
        .select()
        .single();

      if (error) throw new Error(`Enregistrement refusé : ${error.message}`);
      return enrichir(data as Samuel);
    }

    // Mode fallback local si Supabase n'est pas configuré
    const enregistre = stockageLocal.ajouterMembre(membre);
    return enrichir(enregistre);
  },
  

 async modifier(nid: string, modifs: Partial<Samuel>): Promise<SamuelEnrichi> {
    const complement: Partial<Samuel> = {};
    if (modifs.date_entree || modifs.est_responsable !== undefined) {
      const actuel = await this.parNID(nid);
      if (actuel) {
        complement.groupe_calcule = calculerGroupe(
          modifs.date_entree ?? actuel.date_entree,
          modifs.est_responsable ?? actuel.est_responsable,
        );
      }
    }

    // Gestion propre de la paroisse si elle est modifiée
    let donneesAMettreAJour: any = { ...modifs, ...complement };
    
    if (donneesAMettreAJour.paroisse_code && supabaseConfigure && supabase) {
      const { data: paroisseData } = await supabase
        .from('paroisses')
        .select('id_paroisse')
        .eq('code_paroisse', donneesAMettreAJour.paroisse_code)
        .single();

      if (paroisseData) {
        donneesAMettreAJour.paroisse_id = paroisseData.id_paroisse;
      }
      delete donneesAMettreAJour.paroisse_code; // On supprime pour éviter l'erreur de colonne inexistante
    }

    if (supabaseConfigure && supabase) {
      const { data, error } = await supabase
        .from('membres')
        .update(donneesAMettreAJour)
        .eq('id_nid', nid)
        .select()
        .single();
      if (error) throw new Error(`Mise à jour refusée : ${error.message}`);
      return enrichir(data as Samuel);
    }

    const maj = stockageLocal.modifierMembre(nid, donneesAMettreAJour);
    if (!maj) throw new Error(`Matricule introuvable : ${nid}`);
    return enrichir(maj);
  },

  /** Validation pastorale par l'Aumônier ou le Curé. */
  async valider(nid: string, valide: boolean): Promise<SamuelEnrichi> {
    return this.modifier(nid, { statut_validation: valide });
  },

  async promouvoir(nid: string, grade: Samuel['grade_actuel']): Promise<SamuelEnrichi> {
    return this.modifier(nid, { grade_actuel: grade });
  },

  async supprimer(nid: string): Promise<void> {
    if (supabaseConfigure && supabase) {
      const { error } = await supabase.from('membres').delete().eq('id_nid', nid);
      if (error) throw new Error(`Suppression refusée : ${error.message}`);
      return;
    }
    if (!stockageLocal.supprimerMembre(nid)) {
      throw new Error(`Matricule introuvable : ${nid}`);
    }
  },
};

/** Statistiques du tableau de bord, calculées sur une liste déjà filtrée. */
export interface Statistiques {
  total: number;
  valides: number;
  enAttente: number;
  parGroupe: Record<NumeroGroupe, number>;
  parDoyenne: { slug: string; nom: string; total: number }[];
  parGrade: { nom: string; rang: number; total: number }[];
  paroissesActives: number;
}

export function calculerStatistiques(membres: SamuelEnrichi[]): Statistiques {
  const parGroupe: Record<NumeroGroupe, number> = { 1: 0, 2: 0, 3: 0 };
  const parDoyenne = new Map<string, { slug: string; nom: string; total: number }>();
  const parGrade = new Map<string, number>();
  const paroisses = new Set<string>();
  let valides = 0;

  for (const m of membres) {
    parGroupe[m.groupe_calcule]++;
    if (m.statut_validation) valides++;
    paroisses.add(m.paroisse_code);

    const d = parDoyenne.get(m.doyenne_slug);
    if (d) d.total++;
    else parDoyenne.set(m.doyenne_slug, { slug: m.doyenne_slug, nom: m.doyenne_nom, total: 1 });

    parGrade.set(m.grade_actuel, (parGrade.get(m.grade_actuel) ?? 0) + 1);
  }

  return {
    total: membres.length,
    valides,
    enAttente: membres.length - valides,
    parGroupe,
    parDoyenne: [...parDoyenne.values()].sort((a, b) => b.total - a.total),
    parGrade: [...parGrade.entries()]
      .map(([nom, total]) => ({ nom, rang: rangDuGrade(nom), total }))
      .sort((a, b) => b.rang - a.rang),
    paroissesActives: paroisses.size,
  };
}

export async function uploaderEtObtenirUrlPhoto(file: File): Promise<string | null> {
  if (!file) return null;

  const fileExt = file.name.split('.').pop() || 'jpg';
  // Nom unique directement à la racine du bucket
  const fileName = `samuel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('membres-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error("Erreur d'upload Supabase Storage :", uploadError.message);
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from('membres-photos')
    .getPublicUrl(fileName);

  return data.publicUrl;
}