import type { Formateur, FormateurSaisie } from '../types/formateur';
import { getParoisse } from '../config/doyennesParoisses';
import { supabase, supabaseConfigure } from '../lib/supabaseClient';
import { stockageLocal } from './stockageLocal';

/**
 * Fichier des formateurs et affectations par groupe (CDCF Module 3).
 */

export interface FormateurEnrichi extends Formateur {
  paroisse_nom: string;
  doyenne_nom: string;
  doyenne_slug: string;
  /** Paroisse réellement encadrée, libellée. */
  affectation_nom: string;
}

function enrichir(f: Formateur): FormateurEnrichi {
  const rattachement = getParoisse(f.paroisse_code);
  const affectation = f.paroisse_affectation_code
    ? getParoisse(f.paroisse_affectation_code)
    : rattachement;
  return {
    ...f,
    paroisse_nom: rattachement?.nom ?? f.paroisse_code,
    doyenne_nom: rattachement?.doyenneNom ?? '—',
    doyenne_slug: rattachement?.doyenneSlug ?? '',
    affectation_nom: affectation?.nom ?? f.paroisse_code,
  };
}

/**
 * Un formateur n'encadre une autre paroisse que s'il est décanal de secteur,
 * et seulement à l'intérieur de son propre doyenné.
 * Même règle que le trigger `affectations_verifier` côté base.
 */
export function affectationRecevable(
  f: Pick<Formateur, 'paroisse_code' | 'est_decanal_secteur' | 'paroisse_affectation_code'>,
): { ok: true } | { ok: false; motif: string } {
  const cible = f.paroisse_affectation_code;
  if (!cible || cible === f.paroisse_code) return { ok: true };

  if (!f.est_decanal_secteur) {
    return {
      ok: false,
      motif: "Seul un formateur décanal de secteur peut encadrer une autre paroisse.",
    };
  }

  const rattachement = getParoisse(f.paroisse_code);
  const affectation = getParoisse(cible);
  if (!rattachement || !affectation) {
    return { ok: false, motif: 'Paroisse inconnue.' };
  }
  if (rattachement.doyenneSlug !== affectation.doyenneSlug) {
    return {
      ok: false,
      motif: `${affectation.nom} relève du doyenné de ${affectation.doyenneNom}, hors du doyenné de ${rattachement.doyenneNom}.`,
    };
  }
  return { ok: true };
}

export const formateurService = {
  async tous(): Promise<FormateurEnrichi[]> {
    if (supabaseConfigure && supabase) {
      const { data, error } = await supabase.from('formateurs').select('*, affectations(*)');
      if (error) throw new Error(`Lecture des formateurs impossible : ${error.message}`);
      return (data as Formateur[]).map(enrichir);
    }
    return stockageLocal.formateurs().map(enrichir);
  },

  async creer(saisie: FormateurSaisie): Promise<FormateurEnrichi> {
    const verdict = affectationRecevable(saisie);
    if (!verdict.ok) throw new Error(verdict.motif);

    if (supabaseConfigure && supabase) {
      const { data, error } = await supabase.from('formateurs').insert(saisie).select().single();
      if (error) throw new Error(`Enregistrement refusé : ${error.message}`);
      return enrichir(data as Formateur);
    }
    return enrichir(stockageLocal.ajouterFormateur(saisie));
  },

  async modifier(id: number, modifs: Partial<Formateur>): Promise<FormateurEnrichi> {
    if (supabaseConfigure && supabase) {
      const { data, error } = await supabase
        .from('formateurs')
        .update(modifs)
        .eq('id_formateur', id)
        .select()
        .single();
      if (error) throw new Error(`Mise à jour refusée : ${error.message}`);
      return enrichir(data as Formateur);
    }
    const maj = stockageLocal.modifierFormateur(id, modifs);
    if (!maj) throw new Error('Formateur introuvable.');
    return enrichir(maj);
  },

  async supprimer(id: number): Promise<void> {
    if (supabaseConfigure && supabase) {
      const { error } = await supabase.from('formateurs').delete().eq('id_formateur', id);
      if (error) throw new Error(`Suppression refusée : ${error.message}`);
      return;
    }
    if (!stockageLocal.supprimerFormateur(id)) throw new Error('Formateur introuvable.');
  },
};
