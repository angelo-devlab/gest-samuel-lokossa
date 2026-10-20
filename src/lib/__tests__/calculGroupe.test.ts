import { describe, expect, it } from 'vitest';
import { calculerAnciennete, calculerGroupe, moisAvantGroupeSuivant } from '../calculGroupe';

/** Date de référence fixe : toutes les bornes sont vérifiées par rapport à elle. */
const REF = new Date('2026-06-15T12:00:00');

describe('calculerGroupe', () => {
  it('place un entrant de moins d’un an en Groupe 1', () => {
    expect(calculerGroupe('2026-06-14', false, REF)).toBe(1);
    expect(calculerGroupe('2025-07-20', false, REF)).toBe(1);
  });

  it('bascule en Groupe 2 au premier anniversaire', () => {
    expect(calculerGroupe('2025-06-16', false, REF)).toBe(1);
    expect(calculerGroupe('2025-06-15', false, REF)).toBe(2);
  });

  it('garde en Groupe 2 jusqu’au troisième anniversaire inclus', () => {
    expect(calculerGroupe('2023-12-15', false, REF)).toBe(2);
    expect(calculerGroupe('2023-06-15', false, REF)).toBe(2);
  });

  it('bascule en Groupe 3 au-delà de trois ans', () => {
    expect(calculerGroupe('2023-06-14', false, REF)).toBe(3);
    expect(calculerGroupe('2020-01-10', false, REF)).toBe(3);
  });

  it('verse d’office un responsable en Groupe 3', () => {
    expect(calculerGroupe('2026-05-01', true, REF)).toBe(3);
  });

  it('retombe en Groupe 1 sur une date inexploitable', () => {
    expect(calculerGroupe('', false, REF)).toBe(1);
  });
});

describe('calculerAnciennete', () => {
  it('compte des années pleines', () => {
    expect(calculerAnciennete('2023-06-14', REF)).toBe(3);
    expect(calculerAnciennete('2023-06-16', REF)).toBe(2);
    expect(calculerAnciennete('2026-06-14', REF)).toBe(0);
  });

  it('ne descend jamais sous zéro pour une date future', () => {
    expect(calculerAnciennete('2030-01-01', REF)).toBe(0);
  });
});

describe('moisAvantGroupeSuivant', () => {
  it('annonce l’échéance du Groupe 1 vers le Groupe 2', () => {
    expect(moisAvantGroupeSuivant('2026-01-15', false, REF)).toBe(7);
  });

  it('annonce l’échéance du Groupe 2 vers le Groupe 3', () => {
    expect(moisAvantGroupeSuivant('2024-01-15', false, REF)).toBe(7);
  });

  it('ne renvoie pas d’échéance pour un Groupe 3', () => {
    expect(moisAvantGroupeSuivant('2015-01-01', false, REF)).toBeNull();
    expect(moisAvantGroupeSuivant('2026-06-01', true, REF)).toBeNull();
  });
});

describe('robustesse des dates civiles', () => {
  it('tient toute la journée du troisième anniversaire, quelle que soit l’heure', () => {
    const matin = new Date('2026-06-15T06:00:00');
    const soir = new Date('2026-06-15T23:30:00');
    expect(calculerGroupe('2023-06-15', false, matin)).toBe(2);
    expect(calculerGroupe('2023-06-15', false, soir)).toBe(2);
    expect(calculerGroupe('2023-06-15', false, new Date('2026-06-16T00:30:00'))).toBe(3);
  });

  it('lit une date civile sans la décaler d’un jour', () => {
    expect(calculerAnciennete('2020-01-01', new Date('2025-01-01T08:00:00'))).toBe(5);
  });
});
