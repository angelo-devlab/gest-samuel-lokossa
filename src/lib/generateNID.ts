import { DIOCESE, NID_PATTERN } from '../config/constants';
import { getParoisse } from '../config/doyennesParoisses';

/**
 * Génération du Numéro d'Identification Diocésain.
 *
 * Format : LOK-YYYY-PAR-XXX
 *   LOK  préfixe du Diocèse de Lokossa
 *   YYYY année d'entrée chez les Samuels
 *   PAR  code à 3 lettres de la paroisse d'attache
 *   XXX  compteur séquentiel sur 3 chiffres, remis à zéro
 *        pour chaque couple (année, paroisse)
 *
 * Exemple : LOK-2026-CAN-042 — 42ᵉ Samuel inscrit en 2026
 * à la Cathédrale Saint Pierre-Claver de Lokossa.
 */

export interface NIDParts {
  diocese: string;
  annee: number;
  paroisseCode: string;
  sequence: number;
}

export function formatNID(parts: NIDParts): string {
  const seq = String(parts.sequence).padStart(3, '0');
  return `${parts.diocese}-${parts.annee}-${parts.paroisseCode}-${seq}`;
}

export function parseNID(nid: string): NIDParts | null {
  if (!NID_PATTERN.test(nid)) return null;
  const [diocese, annee, paroisseCode, sequence] = nid.split('-');
  return {
    diocese,
    annee: Number(annee),
    paroisseCode,
    sequence: Number(sequence),
  };
}

export function isNIDValide(nid: string): boolean {
  const parts = parseNID(nid);
  return parts !== null && getParoisse(parts.paroisseCode) !== undefined;
}

/**
 * Calcule le prochain matricule libre pour une paroisse et une année donnée.
 *
 * `nidsExistants` doit contenir tous les matricules déjà émis — la séquence
 * reprend après le plus élevé du couple (année, paroisse) et non au nombre
 * d'inscrits, pour qu'une radiation ne provoque jamais de doublon.
 */
export function genererNID(
  paroisseCode: string,
  dateEntree: string | Date,
  nidsExistants: Iterable<string>,
): string {
  const paroisse = getParoisse(paroisseCode);
  if (!paroisse) {
    throw new Error(`Paroisse inconnue : ${paroisseCode}`);
  }

  const annee = new Date(dateEntree).getFullYear();
  if (!Number.isFinite(annee)) {
    throw new Error(`Date d'entrée invalide : ${String(dateEntree)}`);
  }

  let maxSequence = 0;
  for (const nid of nidsExistants) {
    const parts = parseNID(nid);
    if (parts && parts.annee === annee && parts.paroisseCode === paroisseCode) {
      maxSequence = Math.max(maxSequence, parts.sequence);
    }
  }

  const sequence = maxSequence + 1;
  if (sequence > 999) {
    throw new Error(
      `Plus de matricule disponible pour ${paroisse.nom} en ${annee} (999 atteints).`,
    );
  }

  return formatNID({
    diocese: DIOCESE.codeDiocese,
    annee,
    paroisseCode,
    sequence,
  });
}

/**
 * Empreinte inscrite dans le QR Code.
 * Le NID seul suffirait à identifier le porteur, mais une empreinte dérivée
 * évite qu'un matricule deviné au hasard passe le contrôle à l'entrée.
 */
export function genererQRHash(nid: string, dateNaissance: string): string {
  const graine = `${nid}|${dateNaissance}|${DIOCESE.codeDiocese}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < graine.length; i++) {
    const c = graine.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return (
    h1.toString(36).padStart(7, '0') + h2.toString(36).padStart(7, '0')
  ).toUpperCase();
}

/** Contenu encodé dans le QR Code du Pass-Samuel. */
export function payloadQR(nid: string, hash: string): string {
  return `PASS-SAMUEL:${nid}:${hash}`;
}

export function lirePayloadQR(payload: string): { nid: string; hash: string } | null {
  const m = /^PASS-SAMUEL:(LOK-\d{4}-[A-Z0-9]{3}-\d{3}):([A-Z0-9]+)$/.exec(payload.trim());
  return m ? { nid: m[1], hash: m[2] } : null;
}
