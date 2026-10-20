-- =============================================================================
-- Pass-Samuel — Périmètres d'accès (CDCF v2.0, § 6)
-- Row Level Security pour Supabase. À exécuter après schema.sql.
--
--   Administrateur diocésain     tout le diocèse, validation et configuration
--   Aumônier / resp. décanal     son doyenné, consultation et validation
--   Responsable paroissial       sa paroisse, saisie et mise à jour des grades
--   Contrôleur de rassemblement  lecture seule des membres validés (scanner)
-- =============================================================================

BEGIN;

ALTER TABLE profils            ENABLE ROW LEVEL SECURITY;
ALTER TABLE membres            ENABLE ROW LEVEL SECURITY;
ALTER TABLE formateurs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE affectations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_grades  ENABLE ROW LEVEL SECURITY;
ALTER TABLE controles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE doyennes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE paroisses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades             ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Fonctions de périmètre
-- SECURITY DEFINER : la lecture du profil ne doit pas repasser par les
-- politiques de `profils`, ce qui provoquerait une récursion infinie.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION mon_role() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT role FROM profils WHERE id = auth.uid() AND actif;
$$;

CREATE OR REPLACE FUNCTION mon_doyenne() RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT doyenne_id FROM profils WHERE id = auth.uid() AND actif;
$$;

CREATE OR REPLACE FUNCTION ma_paroisse() RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT paroisse_id FROM profils WHERE id = auth.uid() AND actif;
$$;

/** Vrai si la paroisse donnée tombe dans le périmètre du compte connecté. */
CREATE OR REPLACE FUNCTION paroisse_dans_mon_perimetre(cible INT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT CASE mon_role()
        WHEN 'admin_diocesain'       THEN TRUE
        WHEN 'aumonier_decanal'      THEN EXISTS (
                SELECT 1 FROM paroisses
                 WHERE id_paroisse = cible AND doyenne_id = mon_doyenne())
        WHEN 'responsable_paroissial' THEN cible = ma_paroisse()
        ELSE FALSE
    END;
$$;

-- -----------------------------------------------------------------------------
-- Référentiels : lisibles par tout compte authentifié, modifiables par l'admin
-- -----------------------------------------------------------------------------

CREATE POLICY ref_doyennes_lecture  ON doyennes  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY ref_paroisses_lecture ON paroisses FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY ref_grades_lecture    ON grades    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY ref_doyennes_admin  ON doyennes  FOR ALL TO authenticated
    USING (mon_role() = 'admin_diocesain') WITH CHECK (mon_role() = 'admin_diocesain');
CREATE POLICY ref_paroisses_admin ON paroisses FOR ALL TO authenticated
    USING (mon_role() = 'admin_diocesain') WITH CHECK (mon_role() = 'admin_diocesain');
CREATE POLICY ref_grades_admin    ON grades    FOR ALL TO authenticated
    USING (mon_role() = 'admin_diocesain') WITH CHECK (mon_role() = 'admin_diocesain');

-- -----------------------------------------------------------------------------
-- Profils
-- -----------------------------------------------------------------------------

CREATE POLICY profil_propre ON profils FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY profil_admin ON profils FOR ALL TO authenticated
    USING (mon_role() = 'admin_diocesain') WITH CHECK (mon_role() = 'admin_diocesain');

-- -----------------------------------------------------------------------------
-- Membres
-- -----------------------------------------------------------------------------

-- Le contrôleur ne voit que les Pass validés : au portail d'un rassemblement,
-- il n'a pas à consulter les dossiers en attente de validation pastorale.
CREATE POLICY membres_lecture ON membres FOR SELECT TO authenticated
    USING (
        paroisse_dans_mon_perimetre(paroisse_id)
        OR (mon_role() = 'controleur_rassemblement' AND statut_validation)
    );

-- Saisie : administrateur et responsable paroissial, dans leur périmètre.
CREATE POLICY membres_creation ON membres FOR INSERT TO authenticated
    WITH CHECK (
        mon_role() IN ('admin_diocesain', 'responsable_paroissial')
        AND paroisse_dans_mon_perimetre(paroisse_id)
    );

-- Mise à jour : l'aumônier décanal est inclus, il valide les dossiers.
CREATE POLICY membres_modification ON membres FOR UPDATE TO authenticated
    USING (
        mon_role() IN ('admin_diocesain', 'aumonier_decanal', 'responsable_paroissial')
        AND paroisse_dans_mon_perimetre(paroisse_id)
    )
    WITH CHECK (paroisse_dans_mon_perimetre(paroisse_id));

-- Suppression : administrateur diocésain seul.
CREATE POLICY membres_suppression ON membres FOR DELETE TO authenticated
    USING (mon_role() = 'admin_diocesain');

-- -----------------------------------------------------------------------------
-- Historique des grades — lecture dans le périmètre, écriture par trigger
-- -----------------------------------------------------------------------------

CREATE POLICY historique_lecture ON historique_grades FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM membres m
         WHERE m.id_nid = membre_nid
           AND paroisse_dans_mon_perimetre(m.paroisse_id)
    ));

-- -----------------------------------------------------------------------------
-- Formateurs et affectations
-- -----------------------------------------------------------------------------

CREATE POLICY formateurs_lecture ON formateurs FOR SELECT TO authenticated
    USING (paroisse_dans_mon_perimetre(paroisse_id));

CREATE POLICY formateurs_ecriture ON formateurs FOR ALL TO authenticated
    USING (
        mon_role() IN ('admin_diocesain', 'aumonier_decanal')
        AND paroisse_dans_mon_perimetre(paroisse_id)
    )
    WITH CHECK (
        mon_role() IN ('admin_diocesain', 'aumonier_decanal')
        AND paroisse_dans_mon_perimetre(paroisse_id)
    );

CREATE POLICY affectations_lecture ON affectations FOR SELECT TO authenticated
    USING (paroisse_dans_mon_perimetre(paroisse_id));

CREATE POLICY affectations_ecriture ON affectations FOR ALL TO authenticated
    USING (
        mon_role() IN ('admin_diocesain', 'aumonier_decanal')
        AND paroisse_dans_mon_perimetre(paroisse_id)
    )
    WITH CHECK (
        mon_role() IN ('admin_diocesain', 'aumonier_decanal')
        AND paroisse_dans_mon_perimetre(paroisse_id)
    );

-- -----------------------------------------------------------------------------
-- Journal des contrôles
-- -----------------------------------------------------------------------------

CREATE POLICY controles_ecriture ON controles FOR INSERT TO authenticated
    WITH CHECK (controle_par = auth.uid());

CREATE POLICY controles_lecture ON controles FOR SELECT TO authenticated
    USING (mon_role() IN ('admin_diocesain', 'aumonier_decanal') OR controle_par = auth.uid());

COMMIT;
