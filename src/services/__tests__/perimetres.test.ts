import { describe, expect, it } from 'vitest';
import {
  droits,
  paroisseDansPerimetre,
  paroissesVisibles,
  type Compte,
} from '../authService';
import { affectationRecevable } from '../formateurService';
import { ROLES } from '../../config/constants';

const admin: Compte = {
  id: 'a', nomComplet: 'Admin', role: ROLES.ADMIN, doyenneSlug: null, paroisseCode: null,
};
const aumonier: Compte = {
  id: 'b', nomComplet: 'Aumônier', role: ROLES.AUMONIER, doyenneSlug: 'lokossa', paroisseCode: null,
};
const cure: Compte = {
  id: 'c', nomComplet: 'Curé', role: ROLES.PAROISSIAL, doyenneSlug: 'lokossa', paroisseCode: 'CAN',
};
const controleur: Compte = {
  id: 'd', nomComplet: 'Contrôleur', role: ROLES.CONTROLEUR, doyenneSlug: null, paroisseCode: null,
};

describe('périmètres d’accès', () => {
  it('ouvre tout le diocèse à l’administrateur', () => {
    expect(paroisseDansPerimetre(admin, 'CAN')).toBe(true);
    expect(paroisseDansPerimetre(admin, 'ADJ')).toBe(true);
    expect(paroissesVisibles(admin)).toBeNull();
  });

  it('limite l’aumônier aux 9 paroisses de son doyenné', () => {
    expect(paroisseDansPerimetre(aumonier, 'CAN')).toBe(true);
    expect(paroisseDansPerimetre(aumonier, 'ADJ')).toBe(false);
    expect(paroissesVisibles(aumonier)).toHaveLength(9);
  });

  it('limite le responsable à sa seule paroisse', () => {
    expect(paroisseDansPerimetre(cure, 'CAN')).toBe(true);
    expect(paroisseDansPerimetre(cure, 'AGA')).toBe(false);
    expect(paroissesVisibles(cure)).toEqual(['CAN']);
  });

  it('n’ouvre aucun annuaire au contrôleur de rassemblement', () => {
    expect(paroisseDansPerimetre(controleur, 'CAN')).toBe(false);
    expect(paroissesVisibles(controleur)).toEqual([]);
    expect(droits.peutConsulterAnnuaire(controleur)).toBe(false);
  });

  it('refuse tout à une session absente', () => {
    expect(paroisseDansPerimetre(null, 'CAN')).toBe(false);
    expect(droits.peutScanner(null)).toBe(false);
  });
});

describe('droits par rôle', () => {
  it('réserve la saisie à l’administrateur et au responsable paroissial', () => {
    expect(droits.peutSaisir(admin)).toBe(true);
    expect(droits.peutSaisir(cure)).toBe(true);
    expect(droits.peutSaisir(aumonier)).toBe(false);
  });

  it('réserve la validation pastorale à l’administrateur et à l’aumônier', () => {
    expect(droits.peutValider(admin)).toBe(true);
    expect(droits.peutValider(aumonier)).toBe(true);
    expect(droits.peutValider(cure)).toBe(false);
  });

  it('réserve la suppression à l’administrateur diocésain', () => {
    expect(droits.peutSupprimer(admin)).toBe(true);
    expect(droits.peutSupprimer(aumonier)).toBe(false);
    expect(droits.peutSupprimer(cure)).toBe(false);
  });

  it('ouvre le scanner à tous les rôles connectés', () => {
    for (const c of [admin, aumonier, cure, controleur]) {
      expect(droits.peutScanner(c)).toBe(true);
    }
  });
});

describe('affectation des formateurs', () => {
  it('accepte une affectation dans la paroisse de rattachement', () => {
    expect(
      affectationRecevable({ paroisse_code: 'CAN', est_decanal_secteur: false, paroisse_affectation_code: 'CAN' }),
    ).toEqual({ ok: true });
  });

  it('refuse un formateur ordinaire hors de sa paroisse', () => {
    const r = affectationRecevable({
      paroisse_code: 'CAN', est_decanal_secteur: false, paroisse_affectation_code: 'AGA',
    });
    expect(r.ok).toBe(false);
  });

  it('accepte un décanal de secteur dans son doyenné', () => {
    expect(
      affectationRecevable({ paroisse_code: 'CAN', est_decanal_secteur: true, paroisse_affectation_code: 'AGA' }),
    ).toEqual({ ok: true });
  });

  it('refuse un décanal de secteur hors de son doyenné', () => {
    const r = affectationRecevable({
      paroisse_code: 'CAN', est_decanal_secteur: true, paroisse_affectation_code: 'ADJ',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motif).toMatch(/Agoué/);
  });
});
