-- =============================================================================
-- Pass-Samuel — Registre Matrice Diocésain (RMD)
-- Aumônerie Diocésaine des Samuels — Diocèse de Lokossa
-- Schéma PostgreSQL / Supabase. CDCF v2.0, § 5.
--
-- Ordre d'exécution :
--   1. schema.sql
--   2. seed_doyennes_paroisses.sql
--   3. seed_grades.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Référentiel territorial : 10 doyennés, 62 paroisses
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS doyennes (
    id_doyenne  SERIAL PRIMARY KEY,
    nom_doyenne VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(50)  NOT NULL UNIQUE
);

COMMENT ON TABLE doyennes IS 'Les 10 doyennés du Diocèse de Lokossa.';

CREATE TABLE IF NOT EXISTS paroisses (
    id_paroisse   SERIAL PRIMARY KEY,
    nom_paroisse  VARCHAR(150) NOT NULL,
    -- Segment PAR du matricule diocésain. Immuable une fois des NID émis.
    code_paroisse CHAR(3)      NOT NULL UNIQUE CHECK (code_paroisse ~ '^[A-Z0-9]{3}$'),
    vocable       VARCHAR(150),
    doyenne_id    INT          NOT NULL REFERENCES doyennes (id_doyenne) ON DELETE CASCADE,
    UNIQUE (nom_paroisse, doyenne_id)
);

COMMENT ON COLUMN paroisses.code_paroisse IS
    'Segment PAR du NID (LOK-YYYY-PAR-XXX). Ne jamais modifier après émission.';

CREATE INDEX IF NOT EXISTS idx_paroisses_doyenne ON paroisses (doyenne_id);

-- -----------------------------------------------------------------------------
-- Référentiel des 9 grades liturgiques
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS grades (
    id_grade SERIAL PRIMARY KEY,
    nom      VARCHAR(50) NOT NULL UNIQUE,
    -- Progression du servant d'autel, de 1 (Postulant) à 9 (Cérémoniaire).
    rang     SMALLINT    NOT NULL UNIQUE CHECK (rang BETWEEN 1 AND 9),
    charge   TEXT
);

-- -----------------------------------------------------------------------------
-- Registre des membres (RMD)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS membres (
    -- Matricule diocésain : LOK-YYYY-PAR-XXX, ex. LOK-2026-CAN-042
    id_nid              VARCHAR(50) PRIMARY KEY
                        CHECK (id_nid ~ '^LOK-[0-9]{4}-[A-Z0-9]{3}-[0-9]{3}$'),
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    date_naissance      DATE         NOT NULL CHECK (date_naissance <= CURRENT_DATE),
    sexe                CHAR(1)      NOT NULL CHECK (sexe IN ('M', 'F')),
    photo_url           TEXT,
    contact_parent      VARCHAR(50),
    paroisse_id         INT          NOT NULL REFERENCES paroisses (id_paroisse),
    date_entree         DATE         NOT NULL CHECK (date_entree <= CURRENT_DATE),
    grade_actuel        VARCHAR(50)  NOT NULL REFERENCES grades (nom)
                        ON UPDATE CASCADE DEFAULT 'Postulant',
    baptise             BOOLEAN      NOT NULL DEFAULT FALSE,
    premiere_communion  BOOLEAN      NOT NULL DEFAULT FALSE,
    confirme            BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Dérivé de l'ancienneté par trigger ; jamais saisi à la main.
    groupe_calcule      SMALLINT     NOT NULL DEFAULT 1 CHECK (groupe_calcule IN (1, 2, 3)),
    est_responsable     BOOLEAN      NOT NULL DEFAULT FALSE,
    statut_validation   BOOLEAN      NOT NULL DEFAULT FALSE,
    valide_par          UUID,
    valide_le           TIMESTAMPTZ,
    qr_code_hash        TEXT         NOT NULL UNIQUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Un sacrement ne peut précéder celui dont il dépend.
    CONSTRAINT ordre_des_sacrements CHECK (
        (NOT premiere_communion OR baptise) AND
        (NOT confirme OR (baptise AND premiere_communion))
    ),
    CONSTRAINT entree_apres_naissance CHECK (date_entree >= date_naissance)
);

COMMENT ON TABLE membres IS 'Registre Matrice Diocésain : un enregistrement par Samuel.';
COMMENT ON COLUMN membres.groupe_calcule IS
    'Calculé par trigger : 1 si < 1 an, 2 si 1 à 3 ans, 3 si > 3 ans ou responsable.';

CREATE INDEX IF NOT EXISTS idx_membres_paroisse   ON membres (paroisse_id);
CREATE INDEX IF NOT EXISTS idx_membres_groupe     ON membres (groupe_calcule);
CREATE INDEX IF NOT EXISTS idx_membres_grade      ON membres (grade_actuel);
CREATE INDEX IF NOT EXISTS idx_membres_validation ON membres (statut_validation);
-- Recherche par nom dans l'annuaire, insensible à la casse.
CREATE INDEX IF NOT EXISTS idx_membres_nom        ON membres (lower(nom), lower(prenom));

-- -----------------------------------------------------------------------------
-- Historique des grades
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS historique_grades (
    id_historique  SERIAL PRIMARY KEY,
    membre_nid     VARCHAR(50) NOT NULL REFERENCES membres (id_nid) ON DELETE CASCADE,
    grade_nom      VARCHAR(50) NOT NULL REFERENCES grades (nom) ON UPDATE CASCADE,
    date_obtention DATE        NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (membre_nid, grade_nom, date_obtention)
);

CREATE INDEX IF NOT EXISTS idx_historique_membre ON historique_grades (membre_nid);

-- -----------------------------------------------------------------------------
-- Formateurs et affectations
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS formateurs (
    id_formateur        SERIAL PRIMARY KEY,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    contact             VARCHAR(50),
    paroisse_id         INT          NOT NULL REFERENCES paroisses (id_paroisse),
    -- Un formateur décanal de secteur peut encadrer une autre paroisse
    -- du même doyenné que sa paroisse de rattachement.
    est_decanal_secteur BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_formateurs_paroisse ON formateurs (paroisse_id);

CREATE TABLE IF NOT EXISTS affectations (
    id_affectation INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    formateur_id   INT      NOT NULL REFERENCES formateurs (id_formateur) ON DELETE CASCADE,
    -- Paroisse réellement encadrée ; égale au rattachement sauf décanal de secteur.
    paroisse_id    INT      NOT NULL REFERENCES paroisses (id_paroisse) ON DELETE CASCADE,
    groupe         SMALLINT NOT NULL CHECK (groupe IN (1, 2, 3)),
    UNIQUE (formateur_id, paroisse_id, groupe)
);

CREATE INDEX IF NOT EXISTS idx_affectations_paroisse ON affectations (paroisse_id, groupe);

-- -----------------------------------------------------------------------------
-- Comptes et périmètres d'accès (CDCF § 6)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profils (
    -- Correspond à auth.users.id sous Supabase.
    id          UUID PRIMARY KEY,
    nom_complet VARCHAR(150) NOT NULL,
    role        VARCHAR(40)  NOT NULL CHECK (role IN (
                    'admin_diocesain',
                    'aumonier_decanal',
                    'responsable_paroissial',
                    'controleur_rassemblement'
                )),
    -- Périmètre : renseigné selon le rôle, NULL pour l'administrateur diocésain.
    doyenne_id  INT REFERENCES doyennes (id_doyenne) ON DELETE SET NULL,
    paroisse_id INT REFERENCES paroisses (id_paroisse) ON DELETE SET NULL,
    actif       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT perimetre_coherent CHECK (
        (role = 'admin_diocesain')
        OR (role = 'aumonier_decanal'        AND doyenne_id  IS NOT NULL)
        OR (role = 'responsable_paroissial'  AND paroisse_id IS NOT NULL)
        OR (role = 'controleur_rassemblement')
    )
);

-- Journal des contrôles de Pass lors des rassemblements.
CREATE TABLE IF NOT EXISTS controles (
    id_controle  BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    membre_nid   VARCHAR(50) REFERENCES membres (id_nid) ON DELETE SET NULL,
    nid_presente VARCHAR(50) NOT NULL,
    resultat     VARCHAR(20) NOT NULL CHECK (resultat IN (
                    'accepte', 'inconnu', 'non_valide', 'empreinte_invalide'
                 )),
    controle_par UUID REFERENCES profils (id) ON DELETE SET NULL,
    evenement    VARCHAR(150),
    controle_le  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_controles_date ON controles (controle_le DESC);

-- =============================================================================
-- Triggers
-- =============================================================================

-- Recalcul du groupe. Les bornes suivent le CDCF : < 1 an, 1 à 3 ans, > 3 ans.
-- Le troisième anniversaire reste dans le Groupe 2 (borne incluse).
CREATE OR REPLACE FUNCTION calculer_groupe(date_entree DATE, est_responsable BOOLEAN)
RETURNS SMALLINT
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN est_responsable THEN 3
        WHEN CURRENT_DATE <  date_entree + INTERVAL '1 year' THEN 1
        WHEN CURRENT_DATE <= date_entree + INTERVAL '3 years' THEN 2
        ELSE 3
    END::SMALLINT;
$$;

CREATE OR REPLACE FUNCTION trg_membres_avant_ecriture()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.groupe_calcule := calculer_groupe(NEW.date_entree, NEW.est_responsable);
    NEW.updated_at := CURRENT_TIMESTAMP;

    -- La validation pastorale horodate son auteur.
    IF NEW.statut_validation AND NOT COALESCE(OLD.statut_validation, FALSE) THEN
        NEW.valide_le := CURRENT_TIMESTAMP;
    ELSIF NOT NEW.statut_validation THEN
        NEW.valide_le := NULL;
        NEW.valide_par := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS membres_avant_ecriture ON membres;
CREATE TRIGGER membres_avant_ecriture
    BEFORE INSERT OR UPDATE ON membres
    FOR EACH ROW EXECUTE FUNCTION trg_membres_avant_ecriture();

-- Toute promotion alimente l'historique des grades.
CREATE OR REPLACE FUNCTION trg_historiser_grade()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.grade_actuel IS DISTINCT FROM OLD.grade_actuel THEN
        INSERT INTO historique_grades (membre_nid, grade_nom, date_obtention)
        VALUES (NEW.id_nid, NEW.grade_actuel, CURRENT_DATE)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS membres_historiser_grade ON membres;
CREATE TRIGGER membres_historiser_grade
    AFTER INSERT OR UPDATE OF grade_actuel ON membres
    FOR EACH ROW EXECUTE FUNCTION trg_historiser_grade();

-- Un formateur ne peut être affecté hors de sa paroisse que s'il est
-- décanal de secteur, et seulement dans son propre doyenné (CDCF Module 3).
CREATE OR REPLACE FUNCTION trg_verifier_affectation()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    paroisse_rattachement INT;
    decanal               BOOLEAN;
    doyenne_rattachement  INT;
    doyenne_affectation   INT;
BEGIN
    SELECT f.paroisse_id, f.est_decanal_secteur, p.doyenne_id
      INTO paroisse_rattachement, decanal, doyenne_rattachement
      FROM formateurs f
      JOIN paroisses p ON p.id_paroisse = f.paroisse_id
     WHERE f.id_formateur = NEW.formateur_id;

    IF NEW.paroisse_id = paroisse_rattachement THEN
        RETURN NEW;
    END IF;

    IF NOT decanal THEN
        RAISE EXCEPTION
            'Affectation hors paroisse réservée aux formateurs décanaux de secteur.';
    END IF;

    SELECT doyenne_id INTO doyenne_affectation
      FROM paroisses WHERE id_paroisse = NEW.paroisse_id;

    IF doyenne_affectation IS DISTINCT FROM doyenne_rattachement THEN
        RAISE EXCEPTION
            'Un formateur décanal de secteur n''intervient que dans son doyenné.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS affectations_verifier ON affectations;
CREATE TRIGGER affectations_verifier
    BEFORE INSERT OR UPDATE ON affectations
    FOR EACH ROW EXECUTE FUNCTION trg_verifier_affectation();

-- =============================================================================
-- Vues de consultation
-- =============================================================================

CREATE OR REPLACE VIEW v_membres_complet AS
SELECT
    m.*,
    p.nom_paroisse,
    p.code_paroisse,
    p.vocable,
    d.id_doyenne,
    d.nom_doyenne,
    d.slug AS doyenne_slug,
    g.rang AS rang_grade,
    EXTRACT(YEAR FROM age(CURRENT_DATE, m.date_entree))::INT AS anciennete_annees,
    EXTRACT(YEAR FROM age(CURRENT_DATE, m.date_naissance))::INT AS age
FROM membres m
JOIN paroisses p ON p.id_paroisse = m.paroisse_id
JOIN doyennes  d ON d.id_doyenne  = p.doyenne_id
JOIN grades    g ON g.nom         = m.grade_actuel;

CREATE OR REPLACE VIEW v_statistiques_doyenne AS
SELECT
    d.id_doyenne,
    d.nom_doyenne,
    d.slug,
    COUNT(DISTINCT p.id_paroisse)                              AS nb_paroisses,
    COUNT(m.id_nid)                                            AS nb_membres,
    COUNT(m.id_nid) FILTER (WHERE m.groupe_calcule = 1)        AS groupe_1,
    COUNT(m.id_nid) FILTER (WHERE m.groupe_calcule = 2)        AS groupe_2,
    COUNT(m.id_nid) FILTER (WHERE m.groupe_calcule = 3)        AS groupe_3,
    COUNT(m.id_nid) FILTER (WHERE m.statut_validation)         AS nb_valides,
    COUNT(m.id_nid) FILTER (WHERE NOT m.statut_validation)     AS nb_en_attente
FROM doyennes d
LEFT JOIN paroisses p ON p.doyenne_id = d.id_doyenne
LEFT JOIN membres   m ON m.paroisse_id = p.id_paroisse
GROUP BY d.id_doyenne, d.nom_doyenne, d.slug
ORDER BY d.nom_doyenne;

COMMIT;
