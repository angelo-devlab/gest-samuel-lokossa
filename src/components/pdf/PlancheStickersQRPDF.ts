import type jsPDF from 'jspdf';
import type { SamuelEnrichi } from '../../types/samuel';
import { qrEnLot } from '../../lib/qr';
import { PLANCHE_STICKERS } from '../../config/constants';
import {
  TEXTE,
  GRIS,
  VERT,
  BORDURE,
  dessinerPieds,
  nomFichier,
  nouveauDocument,
} from '../../lib/pdfExporter';

/**
 * Planches d'autocollants QR Code au format A4, 24 étiquettes par page
 * (CDCF Module 5).
 *
 * La grille suit le format d'étiquettes autocollantes A4 le plus répandu
 * (3 colonnes × 8 lignes, 63,5 × 33,9 mm), afin que les planches sortent
 * directement sur des feuilles du commerce sans réglage d'imprimante.
 *
 * Chaque étiquette porte le QR Code, le matricule, le nom et la paroisse :
 * assez pour identifier le porteur même si le code devient illisible.
 */

const GRILLE = {
  margeGauche: 7.2,
  margeHaut: 13.1,
  largeur: 63.5,
  hauteur: 33.9,
  /** Entraxe horizontal : largeur de l'étiquette plus la gouttière. */
  pasX: 66,
  pasY: 33.9,
  colonnes: PLANCHE_STICKERS.colonnes,
  lignes: PLANCHE_STICKERS.lignes,
};

const PAR_PAGE = GRILLE.colonnes * GRILLE.lignes;

export interface OptionsPlanche {
  membres: SamuelEnrichi[];
  /** Trace le contour des étiquettes, utile pour un essai sur papier ordinaire. */
  avecRepereDecoupe?: boolean;
}

/** Construit la planche sans l'enregistrer. */
export async function construirePlancheStickers({
  membres,
  avecRepereDecoupe = true,
}: OptionsPlanche): Promise<jsPDF> {
  if (membres.length === 0) {
    throw new Error('Aucun Samuel à imprimer sur la planche.');
  }

  const doc = nouveauDocument();
  // Les QR sont générés en une passe : 24 générations séquentielles par page
  // figeraient l'onglet le temps de l'export.
  // 320 px pour une étiquette de 24 mm, soit environ 340 points par pouce :
  // le code reste net sur une imprimante de presbytère.
  const codes = await qrEnLot(membres, 320);

  membres.forEach((membre, index) => {
    const position = index % PAR_PAGE;
    if (index > 0 && position === 0) doc.addPage();

    const colonne = position % GRILLE.colonnes;
    const ligne = Math.floor(position / GRILLE.colonnes);
    const x = GRILLE.margeGauche + colonne * GRILLE.pasX;
    const y = GRILLE.margeHaut + ligne * GRILLE.pasY;

    if (avecRepereDecoupe) {
      doc.setDrawColor(...BORDURE);
      doc.setLineWidth(0.1);
      doc.roundedRect(x, y, GRILLE.largeur, GRILLE.hauteur, 1.5, 1.5, 'S');
    }

    // Filet vert à gauche : marque du diocèse, et repère du haut de l'étiquette.
    doc.setFillColor(...VERT);
    doc.rect(x, y, 1, GRILLE.hauteur, 'F');

    const qr = codes.get(membre.id_nid);
    const cote = 24;
    const qrX = x + 3;
    const qrY = y + (GRILLE.hauteur - cote) / 2;
    // La compression est décisive ici : sans elle, jsPDF réencode chaque QR
    // en bitmap brut et une planche de 200 étiquettes dépasse 40 Mo.
    if (qr) doc.addImage(qr, 'PNG', qrX, qrY, cote, cote, undefined, 'SLOW');

    const texteX = qrX + cote + 2.5;
    const largeurTexte = GRILLE.largeur - (texteX - x) - 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.6);
    doc.setTextColor(...TEXTE);
    doc.text(membre.id_nid, texteX, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.6);
    const nomComplet = doc.splitTextToSize(
      `${membre.prenom} ${membre.nom}`,
      largeurTexte,
    ) as string[];
    doc.text(nomComplet.slice(0, 2), texteX, y + 14.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(...GRIS);
    const paroisse = doc.splitTextToSize(membre.paroisse_nom, largeurTexte) as string[];
    doc.text(paroisse.slice(0, 1), texteX, y + 23.5);
    doc.text(`Groupe ${membre.groupe_calcule}`, texteX, y + 27.5);
  });

  dessinerPieds(doc);
  return doc;
}

export async function exporterPlancheStickers(options: OptionsPlanche): Promise<void> {
  const doc = await construirePlancheStickers(options);
  doc.save(nomFichier('planche-qr', `${options.membres.length}-etiquettes`));
}

/** Nombre de pages que produira la planche, affiché avant de lancer l'export. */
export function nbPagesPlanche(nombre: number): number {
  return Math.max(1, Math.ceil(nombre / PAR_PAGE));
}

export { PAR_PAGE as ETIQUETTES_PAR_PAGE };
