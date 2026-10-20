import type { SamuelEnrichi } from '../types/samuel';
import { genererQRHash, isNIDValide, lirePayloadQR, parseNID } from './generateNID';

/**
 * Vérification d'un Pass présenté au portail d'un rassemblement
 * (CDCF Module 4).
 *
 * Quatre issues possibles, dans cet ordre de contrôle :
 *   inconnu              le code n'est pas un Pass-Samuel, ou le matricule
 *                        n'existe pas au registre
 *   empreinte_invalide   le matricule existe mais l'empreinte ne correspond
 *                        pas : carte recopiée ou falsifiée
 *   non_valide           le Pass est authentique mais le dossier n'a pas reçu
 *                        la validation pastorale
 *   accepte              le porteur peut entrer
 */

export type Verdict = 'accepte' | 'inconnu' | 'empreinte_invalide' | 'non_valide';

export interface ResultatControle {
  verdict: Verdict;
  /** Renseigné dès que le matricule a été reconnu au registre. */
  membre: SamuelEnrichi | null;
  /** Matricule tel que présenté, même quand il est introuvable. */
  nidPresente: string | null;
  /** Phrase affichée au contrôleur. */
  message: string;
}

const MESSAGES: Record<Verdict, string> = {
  accepte: 'Pass valide. Le porteur peut entrer.',
  inconnu: "Ce code ne correspond à aucun Pass-Samuel du registre.",
  empreinte_invalide:
    "L'empreinte de sécurité ne correspond pas au matricule. Dirigez le porteur vers le secrétariat.",
  non_valide:
    "Le dossier n'a pas encore reçu la validation pastorale. Le Pass ne donne pas accès.",
};

/**
 * Extrait le matricule d'un contenu scanné ou tapé, sans interroger le
 * registre. Le contrôleur n'ayant pas l'annuaire entier sur son téléphone,
 * on détermine d'abord quel matricule chercher, puis on ne charge que lui.
 */
export function extraireNID(contenu: string): { nid: string; hash: string | null } | null {
  const brut = contenu.trim();
  const charge = lirePayloadQR(brut);
  if (charge) return { nid: charge.nid, hash: charge.hash };

  const nu = brut.toUpperCase();
  return isNIDValide(nu) ? { nid: nu, hash: null } : null;
}

/**
 * Analyse un contenu scanné ou saisi à la main.
 * `chercher` interroge le registre dans le périmètre du contrôleur.
 */
export function controlerPass(
  contenu: string,
  chercher: (nid: string) => SamuelEnrichi | null | undefined,
): ResultatControle {
  const brut = contenu.trim();

  // Le contrôleur peut aussi taper le matricule quand la carte est illisible ;
  // on accepte alors le NID nu, sans empreinte.
  const charge = lirePayloadQR(brut);
  const nid = charge?.nid ?? (isNIDValide(brut.toUpperCase()) ? brut.toUpperCase() : null);

  if (!nid || !parseNID(nid)) {
    return { verdict: 'inconnu', membre: null, nidPresente: null, message: MESSAGES.inconnu };
  }

  const membre = chercher(nid) ?? null;
  if (!membre) {
    return { verdict: 'inconnu', membre: null, nidPresente: nid, message: MESSAGES.inconnu };
  }

  // L'empreinte n'est vérifiable que si le QR en portait une. Une saisie
  // manuelle du seul matricule passe cette étape : le contrôleur a la carte
  // sous les yeux, c'est lui qui fait foi.
  if (charge) {
    const attendue = genererQRHash(membre.id_nid, membre.date_naissance);
    if (charge.hash !== attendue || charge.hash !== membre.qr_code_hash) {
      return {
        verdict: 'empreinte_invalide',
        membre,
        nidPresente: nid,
        message: MESSAGES.empreinte_invalide,
      };
    }
  }

  if (!membre.statut_validation) {
    return {
      verdict: 'non_valide',
      membre,
      nidPresente: nid,
      message: MESSAGES.non_valide,
    };
  }

  return { verdict: 'accepte', membre, nidPresente: nid, message: MESSAGES.accepte };
}
