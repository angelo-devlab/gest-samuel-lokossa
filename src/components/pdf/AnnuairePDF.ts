import type jsPDF from 'jspdf';
import type { SamuelEnrichi } from '../../types/samuel';
import { libelleGrade } from '../../config/grades';
import { nomGroupe } from '../../lib/calculGroupe';
import { formaterDateCourte, formaterNombre } from '../../lib/utils';
import {
  apresTableau,
  dessinerEntete,
  dessinerTableau,
  enregistrer,
  TEXTE,
  GRIS,
  nouveauDocument,
} from '../../lib/pdfExporter';

/**
 * Annuaire officiel (CDCF Module 5).
 *
 * Imprimé en paysage : neuf colonnes de registre ne tiennent pas en portrait
 * sans réduire le corps au point de rendre la lecture pénible.
 * Les membres sont groupés par paroisse, dans l'ordre de l'annuaire.
 */

export interface OptionsAnnuaire {
  membres: SamuelEnrichi[];
  /** Décrit le filtre appliqué : « Doyenné de Lokossa », « Groupe 2 », etc. */
  perimetre: string;
  /** Un sous-titre et une rupture par paroisse, ou une liste continue. */
  grouperParParoisse?: boolean;
}

/**
 * Construit le document sans l'enregistrer.
 * Séparer les deux permet de prévisualiser ou de vérifier un export sans
 * déclencher de téléchargement.
 */
export function construireAnnuaire({
  membres,
  perimetre,
  grouperParParoisse = true,
}: OptionsAnnuaire): jsPDF {
  const doc = nouveauDocument(true);
  let y = dessinerEntete(doc, {
    titre: 'Annuaire du Registre Matrice Diocésain',
    sousTitre: `${perimetre} — ${formaterNombre(membres.length)} Samuel${membres.length > 1 ? 's' : ''}`,
    paysage: true,
  });

  const COLONNES = [
    'Matricule',
    'Nom',
    'Prénoms',
    'Né(e) le',
    'Sexe',
    'Entrée',
    'Grade',
    'Groupe',
    'Validé',
  ];

  const ligne = (m: SamuelEnrichi) => [
    m.id_nid,
    m.nom,
    m.prenom,
    formaterDateCourte(m.date_naissance),
    m.sexe,
    formaterDateCourte(m.date_entree),
    libelleGrade(m.grade_actuel),
    `${m.groupe_calcule} — ${nomGroupe(m.groupe_calcule)}`,
    m.statut_validation ? 'Oui' : 'En attente',
  ];

  const LARGEURS = { 0: 34, 3: 20, 4: 11, 5: 20, 7: 30, 8: 20 };

  if (!grouperParParoisse) {
    dessinerTableau(doc, y, COLONNES, membres.map(ligne), LARGEURS);
    return doc;
  }

  // Rupture par paroisse : chaque communauté retrouve sa page.
  const parParoisse = new Map<string, SamuelEnrichi[]>();
  for (const m of membres) {
    const cle = `${m.doyenne_nom} • ${m.paroisse_nom}`;
    const liste = parParoisse.get(cle);
    if (liste) liste.push(m);
    else parParoisse.set(cle, [m]);
  }

  let premiere = true;
  for (const [intitule, liste] of parParoisse) {
    const hauteurRestante = doc.internal.pageSize.getHeight() - y;
    // Un intitulé de paroisse ne doit pas rester seul en bas de page.
    if (!premiere && hauteurRestante < 40) {
      doc.addPage();
      y = dessinerEntete(doc, {
        titre: 'Annuaire du Registre Matrice Diocésain',
        sousTitre: `${perimetre} (suite)`,
        paysage: true,
      });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...TEXTE);
    doc.text(intitule, 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    doc.text(
      `${liste.length} Samuel${liste.length > 1 ? 's' : ''}`,
      doc.internal.pageSize.getWidth() - 14,
      y,
      { align: 'right' },
    );

    dessinerTableau(doc, y + 2.5, COLONNES, liste.map(ligne), LARGEURS);
    y = apresTableau(doc, y) + 9;
    premiere = false;
  }

  return doc;
}

export function exporterAnnuaire(options: OptionsAnnuaire): void {
  enregistrer(construireAnnuaire(options), 'annuaire', options.perimetre);
}

/** Registre récapitulatif : effectifs par doyenné, paroisse et groupe. */
export function construireRegistreSynthese(
  membres: SamuelEnrichi[],
  perimetre: string,
): jsPDF {
  const doc = nouveauDocument();
  const y = dessinerEntete(doc, {
    titre: 'Registre des effectifs',
    sousTitre: perimetre,
  });

  const parParoisse = new Map<
    string,
    { doyenne: string; paroisse: string; g1: number; g2: number; g3: number; valides: number }
  >();

  for (const m of membres) {
    const cle = m.paroisse_code;
    const e =
      parParoisse.get(cle) ??
      { doyenne: m.doyenne_nom, paroisse: m.paroisse_nom, g1: 0, g2: 0, g3: 0, valides: 0 };
    if (m.groupe_calcule === 1) e.g1++;
    else if (m.groupe_calcule === 2) e.g2++;
    else e.g3++;
    if (m.statut_validation) e.valides++;
    parParoisse.set(cle, e);
  }

  const entrees = [...parParoisse.values()].sort(
    (a, b) =>
      a.doyenne.localeCompare(b.doyenne, 'fr') || a.paroisse.localeCompare(b.paroisse, 'fr'),
  );

  const lignes: (string | number)[][] = entrees.map((e) => [
    e.doyenne,
    e.paroisse,
    e.g1,
    e.g2,
    e.g3,
    e.g1 + e.g2 + e.g3,
    `${e.valides} / ${e.g1 + e.g2 + e.g3}`,
  ]);

  // Ligne de total, calculée sur les effectifs et non sur les cellules déjà
  // mises en forme.
  const totaux = entrees.reduce(
    (t, e) => ({ g1: t.g1 + e.g1, g2: t.g2 + e.g2, g3: t.g3 + e.g3 }),
    { g1: 0, g2: 0, g3: 0 },
  );
  const valides = membres.filter((m) => m.statut_validation).length;

  lignes.push([
    'Total',
    '',
    totaux.g1,
    totaux.g2,
    totaux.g3,
    totaux.g1 + totaux.g2 + totaux.g3,
    `${valides} / ${membres.length}`,
  ]);

  dessinerTableau(
    doc,
    y,
    ['Doyenné', 'Paroisse', 'Gr. 1', 'Gr. 2', 'Gr. 3', 'Total', 'Validés'],
    lignes,
    { 2: 16, 3: 16, 4: 16, 5: 18, 6: 24 },
  );

  return doc;
}

export function exporterRegistreSynthese(membres: SamuelEnrichi[], perimetre: string): void {
  enregistrer(construireRegistreSynthese(membres, perimetre), 'registre-effectifs', perimetre);
}
