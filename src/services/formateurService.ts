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

function enrichir(f: any): FormateurEnrichi {
  // Garantir que affectations est toujours au moins un tableau vide pour éviter les erreurs .forEach() ou .map()
  const affectations = Array.isArray(f?.affectations) ? f.affectations : [];

  // Récupérer le code de paroisse (que ce soit depuis paroisse_code ou via la vue/relation)
  const codeParoisse = f.paroisse_code || f.paroisses?.code_paroisse || '';
  const rattachement = getParoisse(codeParoisse);

  const affectation = f.paroisse_affectation_code
    ? getParoisse(f.paroisse_affectation_code)
    : rattachement;

  return {
    ...f,
    paroisse_code: codeParoisse,
    affectations, // Sécurisé : toujours un tableau !
    paroisse_nom: rattachement?.nom ?? codeParoisse,
    doyenne_nom: rattachement?.doyenneNom ?? '—',
    doyenne_slug: rattachement?.doyenneSlug ?? '',
    affectation_nom: affectation?.nom ?? codeParoisse,
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
      const { data, error } = await supabase.from('formateurs').select('*, affectations(*), paroisses(code_paroisse)');
      if (error) throw new Error(`Lecture des formateurs impossible : ${error.message}`);
      return (data || []).map(enrichir);
    }
    return stockageLocal.formateurs().map(enrichir);
  },

  async creer(saisie: FormateurSaisie): Promise<FormateurEnrichi> {
    const verdict = affectationRecevable(saisie);
    if (!verdict.ok) throw new Error(verdict.motif);

    if (supabaseConfigure && supabase) {
      // 1. Récupérer l'id_paroisse numérique à partir du code de rattachement
      const { data: paroisseData, error: paroisseError } = await supabase
        .from('paroisses')
        .select('id_paroisse')
        .eq('code_paroisse', saisie.paroisse_code)
        .single();

      if (paroisseError || !paroisseData) {
        throw new Error("Paroisse de rattachement introuvable pour ce code.");
      }

      // 2. Extraire les champs non présents dans la table 'formateurs'
      const { paroisse_code, groupes, paroisse_affectation_code, ...donneesFormateur } = saisie as any;

      // 3. Insérer dans la table formateurs
      const { data: formateurData, error: formateurError } = await supabase
        .from('formateurs')
        .insert({
          ...donneesFormateur,
          paroisse_id: paroisseData.id_paroisse,
        })
        .select()
        .single();

      if (formateurError) throw new Error(`Enregistrement refusé : ${formateurError.message}`);

      // 4. Insérer dans 'affectations' si des groupes ont été cochés
      if (groupes && groupes.length > 0) {
        let paroisseAffectationId = paroisseData.id_paroisse;
        
        if (paroisse_affectation_code && paroisse_affectation_code !== paroisse_code) {
          const { data: affData } = await supabase
            .from('paroisses')
            .select('id_paroisse')
            .eq('code_paroisse', paroisse_affectation_code)
            .single();
          if (affData) paroisseAffectationId = affData.id_paroisse;
        }

        const affectationsRows = groupes.map((groupeNum: number) => ({
          formateur_id: formateurData.id_formateur,
          paroisse_id: paroisseAffectationId,
          groupe: groupeNum,
        }));

        const { error: affectError } = await supabase
          .from('affectations')
          .insert(affectationsRows);

        if (affectError) throw new Error(`Erreur lors de l'affectation des groupes : ${affectError.message}`);
      }

      // 5. Récupérer le formateur complet ré-enrichi
      const { data: finalData, error: finalError } = await supabase
        .from('formateurs')
        .select('*, affectations(*), paroisses(code_paroisse)')
        .eq('id_formateur', formateurData.id_formateur)
        .single();

      if (finalError) throw new Error(`Erreur de lecture : ${finalError.message}`);
      return enrichir(finalData);
    }

    return enrichir(stockageLocal.ajouterFormateur(saisie));
  },

  async modifier(id: number, modifs: Partial<FormateurSaisie>): Promise<FormateurEnrichi> {
    if (supabaseConfigure && supabase) {
      const { paroisse_code, groupes, paroisse_affectation_code, ...donneesAMettreAJour } = modifs as any;
      
      const payloadFormateur: any = { ...donneesAMettreAJour };

      if (paroisse_code) {
        const { data: paroisseData } = await supabase
          .from('paroisses')
          .select('id_paroisse')
          .eq('code_paroisse', paroisse_code)
          .single();

        if (paroisseData) {
          payloadFormateur.paroisse_id = paroisseData.id_paroisse;
        }
      }

      // 1. Mise à jour de la table 'formateurs'
      const { error: updateErr } = await supabase
        .from('formateurs')
        .update(payloadFormateur)
        .eq('id_formateur', id);

      if (updateErr) throw new Error(`Mise à jour refusée : ${updateErr.message}`);

      // 2. Mise à jour des affectations si la propriété 'groupes' est fournie
      if (Array.isArray(groupes)) {
        await supabase.from('affectations').delete().eq('formateur_id', id);

        if (groupes.length > 0) {
          let paroisseAffectationId = payloadFormateur.paroisse_id;
          
          if (!paroisseAffectationId) {
            const { data: currentFormateur } = await supabase
              .from('formateurs')
              .select('paroisse_id')
              .eq('id_formateur', id)
              .single();
            paroisseAffectationId = currentFormateur?.paroisse_id;
          }

          if (paroisse_affectation_code && paroisse_affectation_code !== paroisse_code) {
            const { data: affData } = await supabase
              .from('paroisses')
              .select('id_paroisse')
              .eq('code_paroisse', paroisse_affectation_code)
              .single();
            if (affData) paroisseAffectationId = affData.id_paroisse;
          }

          const nouvellesAffectations = groupes.map((groupeNum: number) => ({
            formateur_id: id,
            paroisse_id: paroisseAffectationId,
            groupe: groupeNum,
          }));

          const { error: affectError } = await supabase
            .from('affectations')
            .insert(nouvellesAffectations);

          if (affectError) throw new Error(`Erreur affectations : ${affectError.message}`);
        }
      }

      // 3. Récupérer l'enregistrement mis à jour ré-enrichi
      const { data: finalData, error: finalError } = await supabase
        .from('formateurs')
        .select('*, affectations(*), paroisses(code_paroisse)')
        .eq('id_formateur', id)
        .single();

      if (finalError) throw new Error(`Erreur de lecture : ${finalError.message}`);
      return enrichir(finalData);
    }

    const maj = stockageLocal.modifierFormateur(id, modifs as any);
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