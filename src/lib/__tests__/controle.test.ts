import { describe, expect, it } from 'vitest';
import { controlerPass } from '../controle';
import { genererQRHash, payloadQR } from '../generateNID';
import type { SamuelEnrichi } from '../../types/samuel';

function membre(partiel: Partial<SamuelEnrichi> = {}): SamuelEnrichi {
  const id_nid = partiel.id_nid ?? 'LOK-2026-CAN-042';
  const date_naissance = partiel.date_naissance ?? '2012-04-18';
  return {
    id_nid,
    nom: 'AHOUANSOU',
    prenom: 'Jean-Marie',
    date_naissance,
    sexe: 'M',
    photo_url: null,
    contact_parent: null,
    paroisse_code: 'CAN',
    date_entree: '2024-01-15',
    grade_actuel: 'Acolyte',
    baptise: true,
    premiere_communion: true,
    confirme: false,
    groupe_calcule: 2,
    est_responsable: false,
    statut_validation: true,
    qr_code_hash: genererQRHash(id_nid, date_naissance),
    created_at: '2024-01-15T00:00:00.000Z',
    paroisse_nom: 'Lokossa - Cathédrale',
    doyenne_nom: 'Lokossa',
    doyenne_slug: 'lokossa',
    anciennete_annees: 2,
    ...partiel,
  };
}

const registre = (m: SamuelEnrichi) => (nid: string) => (nid === m.id_nid ? m : null);

describe('contrôle d’un Pass', () => {
  it('accepte un Pass authentique et validé', () => {
    const m = membre();
    const r = controlerPass(payloadQR(m.id_nid, m.qr_code_hash), registre(m));
    expect(r.verdict).toBe('accepte');
    expect(r.membre?.id_nid).toBe(m.id_nid);
  });

  it('refuse un dossier sans validation pastorale', () => {
    const m = membre({ statut_validation: false });
    const r = controlerPass(payloadQR(m.id_nid, m.qr_code_hash), registre(m));
    expect(r.verdict).toBe('non_valide');
    // Le contrôleur voit tout de même de qui il s'agit, pour l'orienter.
    expect(r.membre).not.toBeNull();
  });

  it('refuse une empreinte qui ne correspond pas au matricule', () => {
    const m = membre();
    const r = controlerPass(payloadQR(m.id_nid, 'FAUSSEEMPREINTE'), registre(m));
    expect(r.verdict).toBe('empreinte_invalide');
  });

  it('refuse un matricule recopié depuis un autre Pass', () => {
    // Empreinte valide en soi, mais calculée pour un autre membre.
    const victime = membre();
    const autre = genererQRHash('LOK-2026-CAN-043', '2012-04-18');
    const r = controlerPass(payloadQR(victime.id_nid, autre), registre(victime));
    expect(r.verdict).toBe('empreinte_invalide');
  });

  it('refuse un matricule absent du registre', () => {
    const r = controlerPass(payloadQR('LOK-2026-CAN-999', 'XXX'), () => null);
    expect(r.verdict).toBe('inconnu');
    expect(r.nidPresente).toBe('LOK-2026-CAN-999');
  });

  it('refuse un code étranger au Pass-Samuel', () => {
    const r = controlerPass('https://exemple.org', () => null);
    expect(r.verdict).toBe('inconnu');
    expect(r.nidPresente).toBeNull();
  });

  it('accepte la saisie manuelle du seul matricule', () => {
    const m = membre();
    expect(controlerPass(m.id_nid, registre(m)).verdict).toBe('accepte');
    expect(controlerPass(m.id_nid.toLowerCase(), registre(m)).verdict).toBe('accepte');
    expect(controlerPass(`  ${m.id_nid}  `, registre(m)).verdict).toBe('accepte');
  });

  it('applique la validation pastorale aussi à la saisie manuelle', () => {
    const m = membre({ statut_validation: false });
    expect(controlerPass(m.id_nid, registre(m)).verdict).toBe('non_valide');
  });

  it('refuse un matricule dont la paroisse n’existe pas', () => {
    const r = controlerPass('LOK-2026-ZZZ-001', () => null);
    expect(r.verdict).toBe('inconnu');
    expect(r.nidPresente).toBeNull();
  });
});
