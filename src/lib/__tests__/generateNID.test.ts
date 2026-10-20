import { describe, expect, it } from 'vitest';
import {
  genererNID,
  genererQRHash,
  isNIDValide,
  lirePayloadQR,
  parseNID,
  payloadQR,
} from '../generateNID';
import { PAROISSES } from '../../config/doyennesParoisses';

const EXISTANTS = [
  'LOK-2026-CAN-001',
  'LOK-2026-CAN-041',
  'LOK-2026-ADJ-007',
  'LOK-2025-CAN-120',
];

describe('référentiel territorial', () => {
  it('compte 62 paroisses aux codes uniques', () => {
    expect(PAROISSES).toHaveLength(62);
    expect(new Set(PAROISSES.map((p) => p.code)).size).toBe(62);
  });

  it('n’utilise que des codes à trois caractères', () => {
    expect(PAROISSES.every((p) => /^[A-Z0-9]{3}$/.test(p.code))).toBe(true);
  });
});

describe('genererNID', () => {
  it('reprend la séquence après le dernier matricule du couple année/paroisse', () => {
    expect(genererNID('CAN', '2026-03-02', EXISTANTS)).toBe('LOK-2026-CAN-042');
    expect(genererNID('ADJ', '2026-09-30', EXISTANTS)).toBe('LOK-2026-ADJ-008');
  });

  it('repart à 001 pour une paroisse ou une année vierge', () => {
    expect(genererNID('SEE', '2027-01-05', EXISTANTS)).toBe('LOK-2027-SEE-001');
    expect(genererNID('CAN', '2027-01-05', EXISTANTS)).toBe('LOK-2027-CAN-001');
  });

  it('ignore une radiation plutôt que de rééditer un matricule libéré', () => {
    const apresRadiation = ['LOK-2026-CAN-001', 'LOK-2026-CAN-003'];
    expect(genererNID('CAN', '2026-05-05', apresRadiation)).toBe('LOK-2026-CAN-004');
  });

  it('refuse une paroisse hors référentiel', () => {
    expect(() => genererNID('ZZZ', '2026-01-01', [])).toThrow(/Paroisse inconnue/);
  });

  it('refuse d’émettre au-delà de 999 par paroisse et par an', () => {
    expect(() => genererNID('CAN', '2026-01-01', ['LOK-2026-CAN-999'])).toThrow(/999/);
  });
});

describe('parseNID et isNIDValide', () => {
  it('décompose un matricule bien formé', () => {
    expect(parseNID('LOK-2026-CAN-042')).toEqual({
      diocese: 'LOK',
      annee: 2026,
      paroisseCode: 'CAN',
      sequence: 42,
    });
  });

  it('rejette un format non conforme', () => {
    expect(parseNID('LOK-26-CAN-42')).toBeNull();
    expect(isNIDValide('LOK-26-CAN-42')).toBe(false);
  });

  it('rejette un matricule dont la paroisse n’existe pas', () => {
    expect(isNIDValide('LOK-2026-ZZZ-042')).toBe(false);
  });
});

describe('QR Code', () => {
  const nid = 'LOK-2026-CAN-042';
  const hash = genererQRHash(nid, '2012-04-18');

  it('produit une empreinte stable', () => {
    expect(genererQRHash(nid, '2012-04-18')).toBe(hash);
  });

  it('distingue deux membres voisins', () => {
    expect(genererQRHash('LOK-2026-CAN-043', '2012-04-18')).not.toBe(hash);
    expect(genererQRHash(nid, '2012-04-19')).not.toBe(hash);
  });

  it('fait l’aller-retour du contenu encodé', () => {
    expect(lirePayloadQR(payloadQR(nid, hash))).toEqual({ nid, hash });
  });

  it('rejette un code étranger au Pass-Samuel', () => {
    expect(lirePayloadQR('https://exemple.org')).toBeNull();
    expect(lirePayloadQR('PASS-SAMUEL:LOK-2026-CAN-042')).toBeNull();
  });
});
