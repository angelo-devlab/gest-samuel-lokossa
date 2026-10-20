import type jsPDF from 'jspdf';
import type { SamuelEnrichi } from '../../types/samuel';
import { qrDataURL } from '../../lib/qr';
import { libelleGrade, rangDuGrade, GRADES_REF } from '../../config/grades';
import { nomGroupe } from '../../lib/calculGroupe';
import { calculerAge, formaterDate } from '../../lib/utils';
import { paroisseService } from '../../services/paroisseService';
import {
  TEXTE,
  BLEU,
  VERT_ACTION,
  FOND_DISCRET,
  GRIS,
  ORANGE,
  BORDURE,
  dessinerEntete,
  enregistrer,
  nouveauDocument,
} from '../../lib/pdfExporter';

/**
 * Fiche individuelle du Samuel, format A4 (CDCF Module 5).
 *
 * C'est la pièce qui part au dossier de la paroisse : état civil, rattachement,
 * sacrements reçus, progression liturgique et QR Code du Pass.
 */

/**
 * Abréviations de l'échelle des grades. Couper les noms au caractère près
 * produisait des libellés illisibles (« Porte-béniti. ») ; ces formes courtes
 * sont choisies une à une.
 */
const ABREGE: Record<string, string> = {
  'Porte-bénitier': 'Porte-bén.',
  'Céroféraire': 'Cérofér.',
  'Naviculaire': 'Navicul.',
  'Thuriféraire': 'Thurifér.',
  'Cérémoniaire': 'Cérémon.',
};

function titreSection(doc: ReturnType<typeof nouveauDocument>, texte: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXTE);
  doc.text(texte, 14, y);
  doc.setDrawColor(...BORDURE);
  doc.setLineWidth(0.2);
  doc.line(14, y + 1.8, 196, y + 1.8);
  return y + 8;
}

function ligne(
  doc: ReturnType<typeof nouveauDocument>,
  intitule: string,
  valeur: string,
  y: number,
  colonne: 0 | 1 = 0,
): void {
  const x = colonne === 0 ? 14 : 108;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRIS);
  doc.text(intitule, x, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXTE);
  doc.text(valeur || '—', x, y + 4.6);
}

/** Construit la fiche sans l'enregistrer. */
export async function construireFicheSamuel(membre: SamuelEnrichi): Promise<jsPDF> {
  const doc = nouveauDocument();
  let y = dessinerEntete(doc, {
    titre: 'Fiche individuelle du Samuel',
    sousTitre: paroisseService.libelleComplet(membre.paroisse_code),
  });

  // Bandeau d'identité : nom en belle taille, matricule et QR à droite.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...TEXTE);
  doc.text(`${membre.prenom} ${membre.nom}`, 14, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...BLEU);
  doc.text(membre.id_nid, 14, y + 13);

  const qr = await qrDataURL(membre.id_nid, membre.qr_code_hash, 360);
  doc.addImage(qr, 'PNG', 166, y - 2, 30, 30, undefined, 'SLOW');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRIS);
  doc.text('Pass-Samuel', 181, y + 31, { align: 'center' });

  // Tampon de validation pastorale.
  const valide = membre.statut_validation;
  doc.setDrawColor(...(valide ? VERT_ACTION : ORANGE));
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y + 17, 46, 8, 1, 1, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...(valide ? VERT_ACTION : TEXTE));
  doc.text(valide ? 'VALIDÉ PAR L’AUMÔNERIE' : 'EN ATTENTE DE VALIDATION', 17, y + 22.3);

  y += 36;

  y = titreSection(doc, 'État civil', y);
  ligne(doc, 'Nom', membre.nom, y, 0);
  ligne(doc, 'Prénoms', membre.prenom, y, 1);
  y += 12;
  ligne(doc, 'Date de naissance', `${formaterDate(membre.date_naissance)} (${calculerAge(membre.date_naissance)} ans)`, y, 0);
  ligne(doc, 'Sexe', membre.sexe === 'M' ? 'Masculin' : 'Féminin', y, 1);
  y += 12;
  ligne(doc, 'Téléphone des parents', membre.contact_parent ?? '—', y, 0);
  y += 14;

  y = titreSection(doc, 'Rattachement pastoral', y);
  ligne(doc, 'Doyenné', membre.doyenne_nom, y, 0);
  ligne(doc, 'Paroisse', paroisseService.libelleComplet(membre.paroisse_code), y, 1);
  y += 12;
  ligne(doc, 'Entrée chez les Samuels', formaterDate(membre.date_entree), y, 0);
  ligne(
    doc,
    'Ancienneté',
    `${membre.anciennete_annees} an${membre.anciennete_annees > 1 ? 's' : ''}`,
    y,
    1,
  );
  y += 12;
  ligne(
    doc,
    'Groupe',
    `Groupe ${membre.groupe_calcule} — ${nomGroupe(membre.groupe_calcule)}`,
    y,
    0,
  );
  ligne(doc, 'Responsable de groupe', membre.est_responsable ? 'Oui' : 'Non', y, 1);
  y += 14;

  y = titreSection(doc, 'Sacrements reçus', y);
  const sacrements: [string, boolean][] = [
    ['Baptême', membre.baptise],
    ['Première communion', membre.premiere_communion],
    ['Confirmation', membre.confirme],
  ];
  sacrements.forEach(([nom, recu], i) => {
    const x = 14 + i * 62;
    doc.setDrawColor(...(recu ? VERT_ACTION : BORDURE));
    doc.setLineWidth(0.3);
    doc.circle(x + 2, y + 1, 2, 'S');
    if (recu) {
      doc.setFillColor(...VERT_ACTION);
      doc.circle(x + 2, y + 1, 1.1, 'F');
    }
    doc.setFont('helvetica', recu ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...(recu ? TEXTE : GRIS));
    doc.text(recu ? nom : `${nom} (non reçu)`, x + 6, y + 2);
  });
  y += 14;

  // Échelle des grades : la position du Samuel dans la progression.
  y = titreSection(doc, 'Progression liturgique', y);
  const rang = rangDuGrade(membre.grade_actuel);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXTE);
  doc.text(`Grade actuel : ${libelleGrade(membre.grade_actuel)} (${rang} sur 9)`, 14, y);
  y += 6;

  const largeurEchelle = 182;
  const pas = largeurEchelle / GRADES_REF.length;
  GRADES_REF.forEach((g, i) => {
    const x = 14 + i * pas;
    const atteint = g.rang <= rang;
    doc.setFillColor(...(atteint ? BLEU : FOND_DISCRET));
    doc.rect(x, y, pas - 1.5, 4, 'F');

    doc.setFont('helvetica', atteint ? 'bold' : 'normal');
    doc.setFontSize(5.6);
    doc.setTextColor(...(atteint ? TEXTE : GRIS));
    doc.text(`${g.rang}. ${ABREGE[g.nom] ?? g.nom}`, x, y + 8);
  });
  // Bande de signature, ancrée en bas de page comme sur un acte : elle ne
  // flotte pas au milieu de la feuille selon la longueur du dossier.
  const ySignature = doc.internal.pageSize.getHeight() - 28;
  doc.setDrawColor(...BORDURE);
  doc.setLineWidth(0.2);
  doc.line(14, ySignature, 92, ySignature);
  doc.line(118, ySignature, 196, ySignature);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS);
  doc.text('Le responsable paroissial', 14, ySignature + 4);
  doc.text("L'Aumônier diocésain", 118, ySignature + 4);

  return doc;
}

export async function exporterFicheSamuel(membre: SamuelEnrichi): Promise<void> {
  const doc = await construireFicheSamuel(membre);
  enregistrer(doc, 'fiche', `${membre.nom}-${membre.id_nid}`);
}
