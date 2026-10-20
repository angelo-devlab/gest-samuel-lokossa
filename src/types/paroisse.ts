/** Entités territoriales telles que stockées en base. */

export interface Doyenne {
  id_doyenne: number;
  nom_doyenne: string;
}

export interface Paroisse {
  id_paroisse: number;
  nom_paroisse: string;
  code_paroisse: string;
  doyenne_id: number;
}
