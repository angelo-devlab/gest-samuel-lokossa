import QRCode from 'qrcode';
import { payloadQR } from './generateNID';

/**
 * Fabrication des QR Codes du Pass-Samuel.
 *
 * Niveau de correction M : le Pass est plastifié et manipulé par des enfants,
 * il se raye. M tolère environ 15 % de surface abîmée tout en gardant le code
 * assez dense pour être lu de près par une caméra de téléphone d'entrée de gamme.
 */

const OPTIONS = {
  errorCorrectionLevel: 'M' as const,
  margin: 1,
  color: { dark: '#151a2d', light: '#ffffff' },
};

export async function qrDataURL(nid: string, hash: string, taille = 256): Promise<string> {
  return QRCode.toDataURL(payloadQR(nid, hash), { ...OPTIONS, width: taille });
}

/** Variante SVG, pour l'affichage écran où elle reste nette à toute taille. */
export async function qrSVG(nid: string, hash: string): Promise<string> {
  return QRCode.toString(payloadQR(nid, hash), { ...OPTIONS, type: 'svg' });
}

/**
 * Génère les QR d'une liste en une passe.
 * Les planches d'autocollants en demandent 24 par page, et une génération
 * séquentielle bloquerait l'onglet le temps de les produire.
 */
export async function qrEnLot(
  membres: { id_nid: string; qr_code_hash: string }[],
  taille = 256,
): Promise<Map<string, string>> {
  const entrees = await Promise.all(
    membres.map(async (m) => [m.id_nid, await qrDataURL(m.id_nid, m.qr_code_hash, taille)] as const),
  );
  return new Map(entrees);
}
