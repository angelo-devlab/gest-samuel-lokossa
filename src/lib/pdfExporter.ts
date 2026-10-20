import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DIOCESE } from '../config/constants';
import { LOGO_PDF } from '../assets/logoPdf';
import { formaterDate } from './utils';

/**
 * Socle commun des documents imprimés (CDCF Module 5).
 *
 * Tous les exports sortent avec le même en-tête et le même pied : ces
 * documents circulent dans les paroisses, ils doivent être identifiables
 * et datés sans ambiguïté.
 */

/** Couleurs de la charte, en composantes RVB pour jsPDF. */
export const TEXTE: [number, number, number] = [33, 33, 33];
export const TEXTE_DOUX: [number, number, number] = [66, 66, 66];
export const GRIS: [number, number, number] = [148, 148, 148];
export const BORDURE: [number, number, number] = [224, 224, 224];
export const VERT: [number, number, number] = [76, 175, 80];
export const VERT_ACTION: [number, number, number] = [46, 125, 50];
export const BLEU: [number, number, number] = [21, 101, 192];
export const ORANGE: [number, number, number] = [255, 152, 0];
export const FOND_DISCRET: [number, number, number] = [245, 245, 245];

export const A4 = { largeur: 210, hauteur: 297 };

export interface OptionsDocument {
  titre: string;
  /** Périmètre couvert : doyenné, paroisse, groupe. */
  sousTitre?: string;
  paysage?: boolean;
}

export function nouveauDocument(paysage = false): jsPDF {
  return new jsPDF({
    orientation: paysage ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
}

/** En-tête officiel. Renvoie l'ordonnée à laquelle le contenu peut commencer. */
export function dessinerEntete(doc: jsPDF, options: OptionsDocument): number {
  const largeur = doc.internal.pageSize.getWidth();
  const marge = 14;

  // Bandeau vert : la marque du diocèse, reprise de l'écran.
  doc.setFillColor(...VERT);
  doc.rect(0, 0, largeur, 3, 'F');

  doc.addImage(LOGO_PDF, 'PNG', marge, 8.5, 13, 13, undefined, 'SLOW');
  const colonne = marge + 17;

  doc.setTextColor(...TEXTE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(options.titre, colonne, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRIS);
  doc.text(`${DIOCESE.organisation} — ${DIOCESE.nom}`, colonne, 20);

  if (options.sousTitre) {
    doc.setTextColor(...BLEU);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(options.sousTitre, colonne, 25);
  }

  doc.setDrawColor(...BORDURE);
  doc.setLineWidth(0.2);
  const y = options.sousTitre ? 28.5 : 24;
  doc.line(marge, y, largeur - marge, y);

  return y + 6;
}

/** Pied de page avec la date d'édition et la pagination, sur toutes les pages. */
export function dessinerPieds(doc: jsPDF): void {
  const pages = doc.getNumberOfPages();
  const largeur = doc.internal.pageSize.getWidth();
  const hauteur = doc.internal.pageSize.getHeight();
  const marge = 14;

  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS);
    doc.text(`Édité le ${formaterDate(new Date())}`, marge, hauteur - 8);
    doc.text(`${p} / ${pages}`, largeur - marge, hauteur - 8, { align: 'right' });
  }
}

/** Tableau au style maison, partagé par tous les registres. */
export function dessinerTableau(
  doc: jsPDF,
  debutY: number,
  colonnes: string[],
  lignes: (string | number)[][],
  largeurs?: Record<number, number>,
): void {
  autoTable(doc, {
    startY: debutY,
    head: [colonnes],
    body: lignes,
    theme: 'grid',
    margin: { left: 14, right: 14 },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 1.8,
      lineColor: BORDURE,
      lineWidth: 0.1,
      textColor: TEXTE,
    },
    headStyles: {
      fillColor: FOND_DISCRET,
      textColor: TEXTE,
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: BORDURE,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: largeurs
      ? Object.fromEntries(
          Object.entries(largeurs).map(([i, w]) => [i, { cellWidth: w }]),
        )
      : undefined,
  });
}

/** Position verticale juste après le dernier tableau tracé. */
export function apresTableau(doc: jsPDF, defaut = 40): number {
  const d = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  return d.lastAutoTable ? d.lastAutoTable.finalY : defaut;
}

/**
 * Nom de fichier lisible et classable : le préfixe commun regroupe les
 * exports d'un même type, la date les ordonne.
 */
export function nomFichier(base: string, precision?: string): string {
  const jour = new Date().toISOString().slice(0, 10);
  const morceaux = ['pass-samuel', base, precision, jour]
    .filter(Boolean)
    .map((s) =>
      String(s)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    );
  return `${morceaux.join('_')}.pdf`;
}

export function enregistrer(doc: jsPDF, base: string, precision?: string): void {
  dessinerPieds(doc);
  doc.save(nomFichier(base, precision));
}
