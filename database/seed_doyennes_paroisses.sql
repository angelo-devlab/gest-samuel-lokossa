-- =============================================================================
-- Pass-Samuel — Référentiel territorial : 10 doyennés, 62 paroisses
-- Aumônerie Diocésaine des Samuels — Diocèse de Lokossa
--
-- Fichier généré depuis le référentiel TypeScript (src/config/).
-- Rejouable sans effet de bord : ON CONFLICT DO UPDATE.
-- =============================================================================

BEGIN;

INSERT INTO doyennes (nom_doyenne, slug) VALUES
    ('Agoué', 'agoue'),
    ('Azové', 'azove'),
    ('Bopa', 'bopa'),
    ('Comè', 'come'),
    ('Dogbo', 'dogbo'),
    ('Klouékanmey', 'klouekanmey'),
    ('Lalo', 'lalo'),
    ('Lokossa', 'lokossa'),
    ('Athiémé', 'athieme'),
    ('Sè', 'se')
ON CONFLICT (slug) DO UPDATE SET nom_doyenne = EXCLUDED.nom_doyenne;

-- Doyenné de Agoué — 6 paroisses
INSERT INTO paroisses (nom_paroisse, code_paroisse, vocable, doyenne_id) VALUES
    ('Adjaha', 'ADJ', 'Saint Augustin', (SELECT id_doyenne FROM doyennes WHERE slug = 'agoue')),
    ('Agoué', 'AGO', 'Sacré-Cœur', (SELECT id_doyenne FROM doyennes WHERE slug = 'agoue')),
    ('Grand-Popo', 'GPP', 'Saint Joseph', (SELECT id_doyenne FROM doyennes WHERE slug = 'agoue')),
    ('Hillacondji', 'HIL', 'Notre-Dame de l''Assomption', (SELECT id_doyenne FROM doyennes WHERE slug = 'agoue')),
    ('Sohonmé', 'SOH', 'Saint Enfant-Jésus', (SELECT id_doyenne FROM doyennes WHERE slug = 'agoue')),
    ('Djanglanmey', 'DJG', 'Sainte Thérèse de l''Enfant-Jésus', (SELECT id_doyenne FROM doyennes WHERE slug = 'agoue'))
ON CONFLICT (code_paroisse) DO UPDATE
    SET nom_paroisse = EXCLUDED.nom_paroisse,
        vocable      = EXCLUDED.vocable,
        doyenne_id   = EXCLUDED.doyenne_id;

-- Doyenné de Azové — 6 paroisses
INSERT INTO paroisses (nom_paroisse, code_paroisse, vocable, doyenne_id) VALUES
    ('Aplahoué', 'APL', 'Saint Michel', (SELECT id_doyenne FROM doyennes WHERE slug = 'azove')),
    ('Azové', 'AZV', 'Immaculée Conception', (SELECT id_doyenne FROM doyennes WHERE slug = 'azove')),
    ('Djakotomey', 'DJK', 'Sainte Thérèse de l''Enfant Jésus', (SELECT id_doyenne FROM doyennes WHERE slug = 'azove')),
    ('Kissamey', 'KIS', 'Sainte Claire', (SELECT id_doyenne FROM doyennes WHERE slug = 'azove')),
    ('Hoky', 'HOK', 'Sainte Famille', (SELECT id_doyenne FROM doyennes WHERE slug = 'azove')),
    ('Sahou', 'SAH', 'Saint Esprit', (SELECT id_doyenne FROM doyennes WHERE slug = 'azove'))
ON CONFLICT (code_paroisse) DO UPDATE
    SET nom_paroisse = EXCLUDED.nom_paroisse,
        vocable      = EXCLUDED.vocable,
        doyenne_id   = EXCLUDED.doyenne_id;

-- Doyenné de Bopa — 7 paroisses
INSERT INTO paroisses (nom_paroisse, code_paroisse, vocable, doyenne_id) VALUES
    ('Bopa', 'BOP', 'Sainte Anne', (SELECT id_doyenne FROM doyennes WHERE slug = 'bopa')),
    ('Djibio', 'DJB', 'Saint Jean-Marie Vianney', (SELECT id_doyenne FROM doyennes WHERE slug = 'bopa')),
    ('Doutou', 'DOU', 'Sacré-Cœur', (SELECT id_doyenne FROM doyennes WHERE slug = 'bopa')),
    ('Lobogo', 'LOB', 'Sacré-Cœur', (SELECT id_doyenne FROM doyennes WHERE slug = 'bopa')),
    ('Ouèdèmè-Pédah', 'OPE', 'Notre-Dame des Pêcheurs', (SELECT id_doyenne FROM doyennes WHERE slug = 'bopa')),
    ('Possotomè', 'POS', 'Sainte Famille', (SELECT id_doyenne FROM doyennes WHERE slug = 'bopa')),
    ('Zoungbo', 'ZGB', 'Saint Esprit', (SELECT id_doyenne FROM doyennes WHERE slug = 'bopa'))
ON CONFLICT (code_paroisse) DO UPDATE
    SET nom_paroisse = EXCLUDED.nom_paroisse,
        vocable      = EXCLUDED.vocable,
        doyenne_id   = EXCLUDED.doyenne_id;

-- Doyenné de Comè — 7 paroisses
INSERT INTO paroisses (nom_paroisse, code_paroisse, vocable, doyenne_id) VALUES
    ('Akodéha', 'AKO', 'Saint Ambroise', (SELECT id_doyenne FROM doyennes WHERE slug = 'come')),
    ('Comè I', 'CM1', 'Saint Michel', (SELECT id_doyenne FROM doyennes WHERE slug = 'come')),
    ('Comè II - Ségbé', 'CM2', 'Notre-Dame de la Divine Miséricorde', (SELECT id_doyenne FROM doyennes WHERE slug = 'come')),
    ('Gadomè', 'GAD', 'Sainte Lucie', (SELECT id_doyenne FROM doyennes WHERE slug = 'come')),
    ('Guézin', 'GUE', 'Sainte Anne', (SELECT id_doyenne FROM doyennes WHERE slug = 'come')),
    ('Kpétou', 'KPE', 'Sainte Rita', (SELECT id_doyenne FROM doyennes WHERE slug = 'come')),
    ('Oumako', 'OUM', 'Notre-Dame de Lourdes', (SELECT id_doyenne FROM doyennes WHERE slug = 'come'))
ON CONFLICT (code_paroisse) DO UPDATE
    SET nom_paroisse = EXCLUDED.nom_paroisse,
        vocable      = EXCLUDED.vocable,
        doyenne_id   = EXCLUDED.doyenne_id;

-- Doyenné de Dogbo — 6 paroisses
INSERT INTO paroisses (nom_paroisse, code_paroisse, vocable, doyenne_id) VALUES
    ('Dévé', 'DEV', 'Sainte Thérèse de l''Enfant-Jésus', (SELECT id_doyenne FROM doyennes WHERE slug = 'dogbo')),
    ('Dogbo', 'DOG', 'Saint Jean Baptiste', (SELECT id_doyenne FROM doyennes WHERE slug = 'dogbo')),
    ('Honton Dégbéhoué', 'HDG', 'Saint Paul', (SELECT id_doyenne FROM doyennes WHERE slug = 'dogbo')),
    ('Midangbé', 'MID', 'Saint Pierre', (SELECT id_doyenne FROM doyennes WHERE slug = 'dogbo')),
    ('Toviklin', 'TOV', 'Sainte Famille', (SELECT id_doyenne FROM doyennes WHERE slug = 'dogbo')),
    ('Kpohoudjou', 'KPO', 'Sainte Véronique', (SELECT id_doyenne FROM doyennes WHERE slug = 'dogbo'))
ON CONFLICT (code_paroisse) DO UPDATE
    SET nom_paroisse = EXCLUDED.nom_paroisse,
        vocable      = EXCLUDED.vocable,
        doyenne_id   = EXCLUDED.doyenne_id;

-- Doyenné de Klouékanmey — 8 paroisses
INSERT INTO paroisses (nom_paroisse, code_paroisse, vocable, doyenne_id) VALUES
    ('Adjahonmey', 'ADH', 'Christ-Roi', (SELECT id_doyenne FROM doyennes WHERE slug = 'klouekanmey')),
    ('Akimè', 'AKI', 'Saint Michel', (SELECT id_doyenne FROM doyennes WHERE slug = 'klouekanmey')),
    ('Djotto', 'DJO', 'Notre-Dame de Lourdes', (SELECT id_doyenne FROM doyennes WHERE slug = 'klouekanmey')),
    ('Houédogli', 'HOU', 'Notre-Dame de Miséricorde', (SELECT id_doyenne FROM doyennes WHERE slug = 'klouekanmey')),
    ('Kédji', 'KED', 'Saint Antoine de Padoue', (SELECT id_doyenne FROM doyennes WHERE slug = 'klouekanmey')),
    ('Klouékanmè', 'KLK', 'Notre-Dame de l''Espérance', (SELECT id_doyenne FROM doyennes WHERE slug = 'klouekanmey')),
    ('Lanta', 'LAN', 'Saint François d''Assise', (SELECT id_doyenne FROM doyennes WHERE slug = 'klouekanmey')),
    ('Tchanvédji', 'TCH', 'Sanctuaire Marial Diocésain', (SELECT id_doyenne FROM doyennes WHERE slug = 'klouekanmey'))
ON CONFLICT (code_paroisse) DO UPDATE
    SET nom_paroisse = EXCLUDED.nom_paroisse,
        vocable      = EXCLUDED.vocable,
        doyenne_id   = EXCLUDED.doyenne_id;

-- Doyenné de Lalo — 4 paroisses
INSERT INTO paroisses (nom_paroisse, code_paroisse, vocable, doyenne_id) VALUES
    ('Baléoungbé', 'BAL', 'Épiphanie', (SELECT id_doyenne FROM doyennes WHERE slug = 'lalo')),
    ('Hlassamey', 'HLA', 'Saints Pierre et Paul', (SELECT id_doyenne FROM doyennes WHERE slug = 'lalo')),
    ('Lalo', 'LAL', 'Saint Augustin', (SELECT id_doyenne FROM doyennes WHERE slug = 'lalo')),
    ('Tchikpé-Koutimè', 'TKO', 'Bon Pasteur', (SELECT id_doyenne FROM doyennes WHERE slug = 'lalo'))
ON CONFLICT (code_paroisse) DO UPDATE
    SET nom_paroisse = EXCLUDED.nom_paroisse,
        vocable      = EXCLUDED.vocable,
        doyenne_id   = EXCLUDED.doyenne_id;

-- Doyenné de Lokossa — 9 paroisses
INSERT INTO paroisses (nom_paroisse, code_paroisse, vocable, doyenne_id) VALUES
    ('Adjakomey', 'ADK', 'Sainte Marie, Mère de Dieu', (SELECT id_doyenne FROM doyennes WHERE slug = 'lokossa')),
    ('Adrogbo-Zoungbomè', 'ADZ', 'Marie Reine des Apôtres', (SELECT id_doyenne FROM doyennes WHERE slug = 'lokossa')),
    ('Agamé', 'AGA', 'Christ Roi', (SELECT id_doyenne FROM doyennes WHERE slug = 'lokossa')),
    ('Agnivêdji', 'AGN', 'Sainte Catherine de Sienne', (SELECT id_doyenne FROM doyennes WHERE slug = 'lokossa')),
    ('Agonvè', 'AGV', 'Sainte Thérèse de l''Enfant-Jésus', (SELECT id_doyenne FROM doyennes WHERE slug = 'lokossa')),
    ('Houin', 'HUN', 'Saint Basile', (SELECT id_doyenne FROM doyennes WHERE slug = 'lokossa')),
    ('Lokossa - Cathédrale', 'CAN', 'Saint Pierre-Claver', (SELECT id_doyenne FROM doyennes WHERE slug = 'lokossa')),
    ('Ouèdèmé-Adja', 'OAD', 'Saint Augustin', (SELECT id_doyenne FROM doyennes WHERE slug = 'lokossa')),
    ('Zogbédji', 'ZOG', 'Christ-Roi', (SELECT id_doyenne FROM doyennes WHERE slug = 'lokossa'))
ON CONFLICT (code_paroisse) DO UPDATE
    SET nom_paroisse = EXCLUDED.nom_paroisse,
        vocable      = EXCLUDED.vocable,
        doyenne_id   = EXCLUDED.doyenne_id;

-- Doyenné de Athiémé — 4 paroisses
INSERT INTO paroisses (nom_paroisse, code_paroisse, vocable, doyenne_id) VALUES
    ('Athiémé', 'ATH', 'Saint Louis', (SELECT id_doyenne FROM doyennes WHERE slug = 'athieme')),
    ('Adohoun', 'ADO', 'Saint Jean-Marie Vianney', (SELECT id_doyenne FROM doyennes WHERE slug = 'athieme')),
    ('Konouhoué', 'KON', 'Saint Jean-Marie Vianney', (SELECT id_doyenne FROM doyennes WHERE slug = 'athieme')),
    ('Kpinnou', 'KPI', 'Notre-Dame de Lourdes', (SELECT id_doyenne FROM doyennes WHERE slug = 'athieme'))
ON CONFLICT (code_paroisse) DO UPDATE
    SET nom_paroisse = EXCLUDED.nom_paroisse,
        vocable      = EXCLUDED.vocable,
        doyenne_id   = EXCLUDED.doyenne_id;

-- Doyenné de Sè — 5 paroisses
INSERT INTO paroisses (nom_paroisse, code_paroisse, vocable, doyenne_id) VALUES
    ('Drè', 'DRE', 'Saint Michel', (SELECT id_doyenne FROM doyennes WHERE slug = 'se')),
    ('Houéyogbé', 'HYO', 'Saint Pierre Claver', (SELECT id_doyenne FROM doyennes WHERE slug = 'se')),
    ('Manonkpon-Zoungbonou', 'MAN', 'Saint Louis', (SELECT id_doyenne FROM doyennes WHERE slug = 'se')),
    ('Mongnonhoui', 'MON', 'Saint Jean-Baptiste', (SELECT id_doyenne FROM doyennes WHERE slug = 'se')),
    ('Sè', 'SEE', 'Saint Bernard', (SELECT id_doyenne FROM doyennes WHERE slug = 'se'))
ON CONFLICT (code_paroisse) DO UPDATE
    SET nom_paroisse = EXCLUDED.nom_paroisse,
        vocable      = EXCLUDED.vocable,
        doyenne_id   = EXCLUDED.doyenne_id;

-- Garde-fou : le diocèse compte officiellement 10 doyennés et 62 paroisses.
DO $$
DECLARE nb_d INT; nb_p INT;
BEGIN
    SELECT COUNT(*) INTO nb_d FROM doyennes;
    SELECT COUNT(*) INTO nb_p FROM paroisses;
    IF nb_d <> 10 OR nb_p <> 62 THEN
        RAISE EXCEPTION 'Référentiel incomplet : % doyennés, % paroisses (attendu 10 et 62).', nb_d, nb_p;
    END IF;
END $$;

COMMIT;
