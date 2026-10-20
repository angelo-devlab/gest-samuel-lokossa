# Pass-Samuel

Registre Matrice Diocésain (RMD) de l'**Aumônerie Diocésaine des Samuels**,
Diocèse de Lokossa, Bénin — 10 doyennés, 62 paroisses, 9 grades liturgiques.

Application web de recensement des servants d'autel : matricule diocésain
automatique, Pass à QR Code, annuaires imprimables et contrôle des accès aux
rassemblements.

Conforme au Cahier des Charges Fonctionnel v2.0.

---

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
```

Sans configuration, l'application écrit dans le stockage du navigateur. **Le
registre démarre vide** : aucune fiche n'est fabriquée, seules celles que les
responsables saisissent existent. Quatre comptes d'accès sont proposés sur
l'écran de connexion, un par rôle, et le référentiel territorial (10 doyennés,
62 paroisses, 9 grades) est déjà en place dans les listes déroulantes.

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Sert le build de production |
| `npm test` | Suite de tests (49 tests) |
| `npm run lint` | Analyse statique |

### Identité visuelle

L'interface suit la **charte graphique UniLib** : fonds blancs, bordures fines
de 1 px, ombres légères, rayon de base 8 px, et une seule famille de caractères,
**Inter**.

| Rôle | Couleur | Usage |
| --- | --- | --- |
| Primaire | `#4CAF50` | Action principale, succès, aplats et jauges |
| Secondaire | `#2196F3` | Liens, anneau de focus, navigation, classement |
| Accent | `#FF9800` | Mise en avant rare, alerte douce |
| Texte | `#212121` | Tout le texte courant |
| Bordure | `#E0E0E0` | Filets de 1 px |

La charte signale elle-même que le blanc sur `#4CAF50` ne tient que 2,8:1 et
sur `#2196F3` que 3,1:1, ce qui les réserve aux gros caractères gras. Dès qu'un
texte repose sur un aplat, l'interface descend donc d'un cran dans la même
famille Material : `#2E7D32` pour le vert d'action (5,1:1) et `#1565C0` pour le
bleu des liens (5,8:1). Les trois teintes de marque restent employées telles
quelles pour les aplats, les filets et les jauges, où aucun texte ne repose
dessus.

Règle de sobriété de la charte — jamais plus de deux couleurs vives par écran —
appliquée ainsi : le vert porte les quantités et la réussite, le bleu porte le
classement et la navigation, l'orange ne sert qu'à désigner ce qui attend une
décision.

La charte ne décrit que des fonds clairs ; l'interface n'a donc pas de thème
sombre.

## Brancher la base de données

1. Créer un projet Supabase (ou une base PostgreSQL 14+).
2. Exécuter les scripts de `database/` **dans cet ordre** :

   ```bash
   psql "$DATABASE_URL" -f database/schema.sql
   psql "$DATABASE_URL" -f database/seed_doyennes_paroisses.sql
   psql "$DATABASE_URL" -f database/seed_grades.sql
   psql "$DATABASE_URL" -f database/policies.sql   # Supabase uniquement
   ```

   `policies.sql` suppose la présence de `auth.uid()` et du rôle
   `authenticated` : il ne s'applique qu'à Supabase.

3. Copier `.env.example` en `.env` et renseigner les deux clés :

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=…
   ```

   Ne jamais y placer la clé `service_role` : elle contourne les politiques
   RLS et donnerait accès à l'ensemble du diocèse depuis le navigateur.

4. Créer les comptes dans Supabase Auth, puis une ligne dans `profils` par
   compte, avec son rôle et son périmètre :

   ```sql
   INSERT INTO profils (id, nom_complet, role, doyenne_id, paroisse_id) VALUES
     ('<uuid auth>', 'Père Antoine Dossou', 'admin_diocesain', NULL, NULL),
     ('<uuid auth>', 'Abbé Célestin Vigan', 'aumonier_decanal',
       (SELECT id_doyenne FROM doyennes WHERE slug = 'lokossa'), NULL),
     ('<uuid auth>', 'Marc Adandé', 'responsable_paroissial', NULL,
       (SELECT id_paroisse FROM paroisses WHERE code_paroisse = 'CAN'));
   ```

Au redémarrage, l'application détecte les clés et bascule sur le serveur ;
l'écran de connexion n'affiche plus les comptes de démonstration.

## Règles métier

### Matricule diocésain (NID)

Format `LOK-AAAA-PAR-XXX`, par exemple `LOK-2026-CAN-042`.

| Segment | Sens |
| --- | --- |
| `LOK` | Diocèse de Lokossa |
| `AAAA` | Année d'entrée chez les Samuels |
| `PAR` | Code à 3 lettres de la paroisse, unique sur le diocèse |
| `XXX` | Séquence, remise à zéro par couple (année, paroisse) |

La séquence reprend **après le plus haut numéro déjà émis** pour ce couple, et
non au nombre d'inscrits : une radiation ne peut donc pas provoquer de doublon.
Les codes de paroisse sont figés dans `src/config/doyennesParoisses.ts` et ne
doivent jamais changer une fois des matricules émis.

### Groupes

Recalculés à chaque lecture, jamais saisis.

| Groupe | Critère |
| --- | --- |
| 1 — Nouveaux | Moins d'un an d'ancienneté |
| 2 — Confirmés | Entre 1 et 3 ans |
| 3 — Anciens | Plus de 3 ans, **ou** responsable de groupe |

Les bornes sont comparées de jour à jour. Le jour du troisième anniversaire, le
Samuel reste en Groupe 2 du matin au soir et ne passe en Groupe 3 que le
lendemain. Les dates civiles sont normalisées à minuit local
(`src/lib/dates.ts`) pour qu'un fuseau horaire ne décale pas un dossier d'un
jour.

La même règle est écrite deux fois — en TypeScript (`src/lib/calculGroupe.ts`)
et en SQL (fonction `calculer_groupe`, appelée par un trigger). Toute
modification doit porter sur les deux.

### Contrôle d'un Pass

Quatre issues, dans cet ordre de vérification :

| Verdict | Signification |
| --- | --- |
| `inconnu` | Code étranger au Pass-Samuel, ou matricule absent du registre |
| `empreinte_invalide` | Matricule connu mais empreinte non concordante : carte recopiée |
| `non_valide` | Pass authentique mais dossier sans validation pastorale |
| `accepte` | Le porteur peut entrer |

La saisie manuelle du seul matricule est acceptée quand le code est abîmé :
l'étape d'empreinte est alors sautée, le contrôleur ayant la carte sous les yeux.
La validation pastorale, elle, reste exigée dans tous les cas.

## Rôles et périmètres

| Rôle | Périmètre | Droits |
| --- | --- | --- |
| Administrateur diocésain | 62 paroisses | Tout, y compris suppression et configuration |
| Aumônier / responsable décanal | Son doyenné | Consultation, validation pastorale, formateurs |
| Responsable paroissial | Sa paroisse | Saisie, mise à jour des grades, annuaire local |
| Contrôleur de rassemblement | Mode scanner | Lecture des Pass validés uniquement |

Les contrôles côté interface ne font que masquer ce qui n'est pas permis. Sous
Supabase, **c'est la base qui tranche** : `database/policies.sql` applique les
mêmes règles en Row Level Security, y compris pour une requête forgée à la main.

## Exports PDF

Générés dans le navigateur, sans serveur d'impression.

| Document | Format | Où |
| --- | --- | --- |
| Annuaire | A4 paysage, rupture par paroisse | Annuaire → « Annuaire PDF » |
| Registre des effectifs | A4 portrait, totaux par paroisse et groupe | Tableau de bord |
| Planche d'autocollants QR | A4, 24 étiquettes (3 × 8) | Annuaire → « Planche QR » |
| Fiche individuelle | A4, dossier complet et QR | Fiche d'un Samuel |

La planche suit la trame d'étiquettes A4 la plus répandue (63,5 × 33,9 mm,
3 colonnes × 8 lignes), afin de sortir directement sur des feuilles du commerce.

Les QR sont ajoutés avec la compression jsPDF : sans elle, chaque code est
réencodé en bitmap brut et une planche de 200 étiquettes dépasse 40 Mo au lieu
de 500 Ko.

## Arborescence

```
pass-samuel-web/
├── database/
│   ├── schema.sql                   Tables, contraintes, triggers, vues
│   ├── seed_doyennes_paroisses.sql  10 doyennés, 62 paroisses (généré)
│   ├── seed_grades.sql              9 grades liturgiques (généré)
│   └── policies.sql                 Row Level Security par rôle
├── public/
│   ├── logo-pass-samuel.png         Logo du diocèse (192 px)
│   └── favicon-32.png
└── src/
    ├── components/
    │   ├── ui/        Button, Input, Select, Modal, DataTable, Badge, Panneau
    │   ├── forms/     RecensementForm, DoyenneParoisseSelect, GradeSelect,
    │   │              FormateurForm
    │   ├── qr/        QRScanner (caméra), PassCardPreview (la carte)
    │   ├── pdf/       AnnuairePDF, PlancheStickersQRPDF, FicheSamuelPDF
    │   └── layout/    Header, Sidebar, Footer
    ├── config/        Référentiels figés : doyennés, paroisses, grades, rôles
    ├── lib/           calculGroupe, generateNID, controle, dates, qr,
    │                  pdfExporter, supabaseClient, utils
    ├── pages/         Login, Dashboard, Recensement, Annuaire, Scanner,
    │                  Formateurs
    ├── services/      samuelService, paroisseService, formateurService,
    │                  authService, stockageLocal
    ├── store/         authStore (zustand), useRegistre
    └── types/         samuel, paroisse, grade, formateur
```

Les référentiels territoriaux sont livrés avec l'application plutôt que chargés
du serveur : les listes déroulantes restent utilisables hors connexion, au
presbytère comme sur le terrain, et une coupure réseau ne bloque jamais une
inscription. Les fichiers `seed_*.sql` sont engendrés depuis ces mêmes sources,
de sorte que la base et l'interface ne peuvent pas diverger.

## Pile technique

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · Zustand ·
Supabase (PostgreSQL) · jsPDF + jspdf-autotable · qrcode · @zxing/library ·
Vitest

## Tests

```bash
npm test
```

49 tests couvrant les bornes du calcul de groupe (y compris les pièges de
fuseau horaire), l'émission des matricules, les empreintes QR, les quatre
verdicts de contrôle, les périmètres d'accès par rôle et la règle du formateur
décanal de secteur.

Les tests ne dépendent d'aucune donnée préexistante : ils construisent eux-mêmes
les cas dont ils ont besoin.
