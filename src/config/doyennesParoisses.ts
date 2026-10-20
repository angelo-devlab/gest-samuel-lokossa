/**
 * Référentiel territorial officiel du Diocèse de Lokossa.
 * 10 doyennés, 62 paroisses. Source : CDCF Pass-Samuel v2.0, § 2.1.
 *
 * Le `code` de chaque paroisse est le segment PAR du NID (LOK-YYYY-PAR-XXX).
 * Il est stable et ne doit jamais être modifié une fois des matricules émis.
 */

export interface ParoisseRef {
  /** Segment PAR du matricule diocésain, 3 lettres, unique sur le diocèse. */
  code: string;
  nom: string;
  /** Saint patron ou vocable de la paroisse. */
  vocable: string;
}

export interface DoyenneRef {
  /** Identifiant court du doyenné, utilisé dans les filtres et les URL. */
  slug: string;
  nom: string;
  paroisses: ParoisseRef[];
}

export const DOYENNES: DoyenneRef[] = [
  {
    slug: 'agoue',
    nom: 'Agoué',
    paroisses: [
      { code: 'ADJ', nom: 'Adjaha', vocable: 'Saint Augustin' },
      { code: 'AGO', nom: 'Agoué', vocable: 'Sacré-Cœur' },
      { code: 'GPP', nom: 'Grand-Popo', vocable: 'Saint Joseph' },
      { code: 'HIL', nom: 'Hillacondji', vocable: "Notre-Dame de l'Assomption" },
      { code: 'SOH', nom: 'Sohonmé', vocable: 'Saint Enfant-Jésus' },
      { code: 'DJG', nom: 'Djanglanmey', vocable: "Sainte Thérèse de l'Enfant-Jésus" },
    ],
  },
  {
    slug: 'azove',
    nom: 'Azové',
    paroisses: [
      { code: 'APL', nom: 'Aplahoué', vocable: 'Saint Michel' },
      { code: 'AZV', nom: 'Azové', vocable: 'Immaculée Conception' },
      { code: 'DJK', nom: 'Djakotomey', vocable: "Sainte Thérèse de l'Enfant Jésus" },
      { code: 'KIS', nom: 'Kissamey', vocable: 'Sainte Claire' },
      { code: 'HOK', nom: 'Hoky', vocable: 'Sainte Famille' },
      { code: 'SAH', nom: 'Sahou', vocable: 'Saint Esprit' },
    ],
  },
  {
    slug: 'bopa',
    nom: 'Bopa',
    paroisses: [
      { code: 'BOP', nom: 'Bopa', vocable: 'Sainte Anne' },
      { code: 'DJB', nom: 'Djibio', vocable: 'Saint Jean-Marie Vianney' },
      { code: 'DOU', nom: 'Doutou', vocable: 'Sacré-Cœur' },
      { code: 'LOB', nom: 'Lobogo', vocable: 'Sacré-Cœur' },
      { code: 'OPE', nom: 'Ouèdèmè-Pédah', vocable: 'Notre-Dame des Pêcheurs' },
      { code: 'POS', nom: 'Possotomè', vocable: 'Sainte Famille' },
      { code: 'ZGB', nom: 'Zoungbo', vocable: 'Saint Esprit' },
    ],
  },
  {
    slug: 'come',
    nom: 'Comè',
    paroisses: [
      { code: 'AKO', nom: 'Akodéha', vocable: 'Saint Ambroise' },
      { code: 'CM1', nom: 'Comè I', vocable: 'Saint Michel' },
      { code: 'CM2', nom: 'Comè II - Ségbé', vocable: 'Notre-Dame de la Divine Miséricorde' },
      { code: 'GAD', nom: 'Gadomè', vocable: 'Sainte Lucie' },
      { code: 'GUE', nom: 'Guézin', vocable: 'Sainte Anne' },
      { code: 'KPE', nom: 'Kpétou', vocable: 'Sainte Rita' },
      { code: 'OUM', nom: 'Oumako', vocable: 'Notre-Dame de Lourdes' },
    ],
  },
  {
    slug: 'dogbo',
    nom: 'Dogbo',
    paroisses: [
      { code: 'DEV', nom: 'Dévé', vocable: "Sainte Thérèse de l'Enfant-Jésus" },
      { code: 'DOG', nom: 'Dogbo', vocable: 'Saint Jean Baptiste' },
      { code: 'HDG', nom: 'Honton Dégbéhoué', vocable: 'Saint Paul' },
      { code: 'MID', nom: 'Midangbé', vocable: 'Saint Pierre' },
      { code: 'TOV', nom: 'Toviklin', vocable: 'Sainte Famille' },
      { code: 'KPO', nom: 'Kpohoudjou', vocable: 'Sainte Véronique' },
    ],
  },
  {
    slug: 'klouekanmey',
    nom: 'Klouékanmey',
    paroisses: [
      { code: 'ADH', nom: 'Adjahonmey', vocable: 'Christ-Roi' },
      { code: 'AKI', nom: 'Akimè', vocable: 'Saint Michel' },
      { code: 'DJO', nom: 'Djotto', vocable: 'Notre-Dame de Lourdes' },
      { code: 'HOU', nom: 'Houédogli', vocable: 'Notre-Dame de Miséricorde' },
      { code: 'KED', nom: 'Kédji', vocable: 'Saint Antoine de Padoue' },
      { code: 'KLK', nom: 'Klouékanmè', vocable: "Notre-Dame de l'Espérance" },
      { code: 'LAN', nom: 'Lanta', vocable: "Saint François d'Assise" },
      { code: 'TCH', nom: 'Tchanvédji', vocable: 'Sanctuaire Marial Diocésain' },
    ],
  },
  {
    slug: 'lalo',
    nom: 'Lalo',
    paroisses: [
      { code: 'BAL', nom: 'Baléoungbé', vocable: 'Épiphanie' },
      { code: 'HLA', nom: 'Hlassamey', vocable: 'Saints Pierre et Paul' },
      { code: 'LAL', nom: 'Lalo', vocable: 'Saint Augustin' },
      { code: 'TKO', nom: 'Tchikpé-Koutimè', vocable: 'Bon Pasteur' },
    ],
  },
  {
    slug: 'lokossa',
    nom: 'Lokossa',
    paroisses: [
      { code: 'ADK', nom: 'Adjakomey', vocable: 'Sainte Marie, Mère de Dieu' },
      { code: 'ADZ', nom: 'Adrogbo-Zoungbomè', vocable: 'Marie Reine des Apôtres' },
      { code: 'AGA', nom: 'Agamé', vocable: 'Christ Roi' },
      { code: 'AGN', nom: 'Agnivêdji', vocable: 'Sainte Catherine de Sienne' },
      { code: 'AGV', nom: 'Agonvè', vocable: "Sainte Thérèse de l'Enfant-Jésus" },
      { code: 'HUN', nom: 'Houin', vocable: 'Saint Basile' },
      { code: 'CAN', nom: 'Lokossa - Cathédrale', vocable: 'Saint Pierre-Claver' },
      { code: 'OAD', nom: 'Ouèdèmé-Adja', vocable: 'Saint Augustin' },
      { code: 'ZOG', nom: 'Zogbédji', vocable: 'Christ-Roi' },
    ],
  },
  {
    slug: 'athieme',
    nom: 'Athiémé',
    paroisses: [
      { code: 'ATH', nom: 'Athiémé', vocable: 'Saint Louis' },
      { code: 'ADO', nom: 'Adohoun', vocable: 'Saint Jean-Marie Vianney' },
      { code: 'KON', nom: 'Konouhoué', vocable: 'Saint Jean-Marie Vianney' },
      { code: 'KPI', nom: 'Kpinnou', vocable: 'Notre-Dame de Lourdes' },
    ],
  },
  {
    slug: 'se',
    nom: 'Sè',
    paroisses: [
      { code: 'DRE', nom: 'Drè', vocable: 'Saint Michel' },
      { code: 'HYO', nom: 'Houéyogbé', vocable: 'Saint Pierre Claver' },
      { code: 'MAN', nom: 'Manonkpon-Zoungbonou', vocable: 'Saint Louis' },
      { code: 'MON', nom: 'Mongnonhoui', vocable: 'Saint Jean-Baptiste' },
      { code: 'SEE', nom: 'Sè', vocable: 'Saint Bernard' },
    ],
  },
];

/** Paroisse enrichie du doyenné auquel elle est rattachée. */
export interface ParoisseAvecDoyenne extends ParoisseRef {
  doyenneSlug: string;
  doyenneNom: string;
}

export const PAROISSES: ParoisseAvecDoyenne[] = DOYENNES.flatMap((d) =>
  d.paroisses.map((p) => ({ ...p, doyenneSlug: d.slug, doyenneNom: d.nom })),
);

const PAR_PAR_CODE = new Map(PAROISSES.map((p) => [p.code, p]));
const DOYENNE_PAR_SLUG = new Map(DOYENNES.map((d) => [d.slug, d]));

export function getParoisse(code: string): ParoisseAvecDoyenne | undefined {
  return PAR_PAR_CODE.get(code);
}

export function getDoyenne(slug: string): DoyenneRef | undefined {
  return DOYENNE_PAR_SLUG.get(slug);
}

/** Paroisses d'un doyenné, pour le second niveau de la liste en cascade. */
export function paroissesDuDoyenne(slug: string): ParoisseRef[] {
  return DOYENNE_PAR_SLUG.get(slug)?.paroisses ?? [];
}

export const NB_DOYENNES = DOYENNES.length;
export const NB_PAROISSES = PAROISSES.length;
