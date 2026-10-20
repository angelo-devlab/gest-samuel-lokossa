-- =============================================================================
-- Pass-Samuel — Référentiel des 9 grades liturgiques officiels
-- Aumônerie Diocésaine des Samuels — Diocèse de Lokossa
--
-- Fichier généré depuis le référentiel TypeScript (src/config/).
-- Rejouable sans effet de bord : ON CONFLICT DO UPDATE.
-- =============================================================================

BEGIN;

INSERT INTO grades (nom, rang, charge) VALUES
    ('Postulant', 1, 'Demande son admission, suit la formation initiale'),
    ('Stagiaire', 2, 'Sert à l''essai sous la conduite d''un ancien'),
    ('Acolyte', 3, 'Sert l''autel et présente les burettes'),
    ('Porte-bénitier', 4, 'Porte le bénitier et le goupillon'),
    ('Céroféraire', 5, 'Porte les cierges de procession'),
    ('Porte-croix', 6, 'Porte la croix de procession (cruciféraire)'),
    ('Naviculaire', 7, 'Porte la navette d''encens'),
    ('Thuriféraire', 8, 'Porte et balance l''encensoir'),
    ('Cérémoniaire', 9, 'Dirige le service de toute la célébration')
ON CONFLICT (nom) DO UPDATE
    SET rang   = EXCLUDED.rang,
        charge = EXCLUDED.charge;

COMMIT;
