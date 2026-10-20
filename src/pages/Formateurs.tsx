import { useEffect, useMemo, useState } from 'react';
import type { FormateurSaisie } from '../types/formateur';
import type { FormateurEnrichi } from '../services/formateurService';
import { formateurService } from '../services/formateurService';
import { useAuth } from '../store/authStore';
import { paroissesVisibles } from '../services/authService';
import { DataTable, type Colonne } from '../components/ui/DataTable';
import { Panneau, Vide } from '../components/ui/Panneau';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { FormateurForm } from '../components/forms/FormateurForm';
import { GROUPES } from '../config/constants';
import { normaliser, formaterNombre } from '../lib/utils';
import { getParoisse } from '../config/doyennesParoisses';
import type { NumeroGroupe } from '../config/constants';
import { BadgeGroupe } from '../components/ui/Badge';

/**
 * Fichier des formateurs et affectation par groupe (CDCF Module 3).
 */
export function Formateurs() {
  const compte = useAuth((s) => s.compte);
  const autorisees = useMemo(() => paroissesVisibles(compte), [compte]);

  const [formateurs, setFormateurs] = useState<FormateurEnrichi[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [enEdition, setEnEdition] = useState<FormateurEnrichi | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function charger() {
    setChargement(true);
    setErreur(null);
    try {
      const tous = await formateurService.tous();
      setFormateurs(
        autorisees === null ? tous : tous.filter((f) => autorisees.includes(f.paroisse_code)),
      );
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Les formateurs n’ont pas pu être chargés.');
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    void charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorisees]);

  const resultats = useMemo(() => {
    const q = normaliser(recherche);
    if (!q) return formateurs;
    return formateurs.filter((f) =>
      normaliser(`${f.nom} ${f.prenom} ${f.paroisse_nom} ${f.doyenne_nom}`).includes(q),
    );
  }, [formateurs, recherche]);

  /** Paroisses du périmètre où aucun groupe n'est encadré. */
  const groupesDecouverts = useMemo(() => {
    const couverture = new Map<string, Set<number>>();
    for (const f of formateurs) {
      const cible = f.paroisse_affectation_code ?? f.paroisse_code;
      const s = couverture.get(cible) ?? new Set<number>();
      // Sécurisation : on s'assure que f.groupes existe avant d'itérer
      const listeGroupes: NumeroGroupe[] = Array.isArray(f.groupes) ? f.groupes : [];
      listeGroupes.forEach((g: NumeroGroupe) => s.add(g));
      couverture.set(cible, s);
    }

    const manques: { paroisse: string; groupes: number[] }[] = [];
    const codes = autorisees ?? [...new Set(formateurs.map((f) => f.paroisse_code))];
    for (const code of codes) {
      const couverts = couverture.get(code) ?? new Set<number>();
      const absents = [1, 2, 3].filter((g) => !couverts.has(g));
      if (absents.length > 0) {
        manques.push({ paroisse: getParoisse(code)?.nom ?? code, groupes: absents });
      }
    }
    return manques.slice(0, 8);
  }, [formateurs, autorisees]);

  async function enregistrer(saisie: FormateurSaisie) {
    if (enEdition) await formateurService.modifier(enEdition.id_formateur, saisie);
    else await formateurService.creer(saisie);
    setEnEdition(null);
    setAjoutOuvert(false);
    await charger();
  }

  async function supprimer(f: FormateurEnrichi) {
    await formateurService.supprimer(f.id_formateur);
    setEnEdition(null);
    await charger();
  }

  const colonnes: Colonne<FormateurEnrichi>[] = [
    {
      cle: 'nom',
      entete: 'Formateur',
      valeurTri: (f) => `${f.nom} ${f.prenom}`,
      rendu: (f) => (
        <span>
          <span className="font-semibold">{f.nom}</span>{' '}
          <span className="text-texte-doux">{f.prenom}</span>
          {f.est_decanal_secteur && (
            <Badge ton="bleu" className="ml-2">
              Décanal de secteur
            </Badge>
          )}
        </span>
      ),
    },
    {
      cle: 'paroisse',
      entete: 'Rattachement',
      masquerSous: 'sm',
      valeurTri: (f) => f.paroisse_nom,
      rendu: (f) => (
        <span className="text-petit">
          {f.paroisse_nom}
          <span className="block text-micro text-texte-faible">{f.doyenne_nom}</span>
        </span>
      ),
    },
    {
      cle: 'affectation',
      entete: 'Paroisse encadrée',
      masquerSous: 'md',
      valeurTri: (f) => f.affectation_nom,
      rendu: (f) =>
        f.paroisse_affectation_code && f.paroisse_affectation_code !== f.paroisse_code ? (
          <span className="text-petit text-bleu-lien">{f.affectation_nom}</span>
        ) : (
          <span className="text-petit text-texte-faible">Sa paroisse</span>
        ),
    },
    {
      cle: 'groupes',
      entete: 'Groupes',
      valeurTri: (f) => (f.groupes || []).join(','),
      rendu: (f) => {
        const groupesAffiches: NumeroGroupe[] = Array.isArray(f.groupes) ? f.groupes : [];
        return (
          <span className="flex flex-wrap gap-1">
            {groupesAffiches.length === 0 ? (
              <span className="text-petit text-texte-faible">—</span>
            ) : (
             groupesAffiches.map((g: NumeroGroupe) => (
  <BadgeGroupe key={g} groupe={g} bref />
))
            )}
          </span>
        );
      },
    },
    {
      cle: 'contact',
      entete: 'Contact',
      masquerSous: 'lg',
      rendu: (f) => <span className="chiffres text-petit">{f.contact ?? '—'}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-bordure pb-4">
        <div>
          <h1 className="text-titre">Formateurs</h1>
          <p className="mt-1 text-petit text-texte-doux">
            {chargement
              ? 'Chargement…'
              : `${formaterNombre(resultats.length)} encadrant${resultats.length > 1 ? 's' : ''} dans votre périmètre`}
          </p>
        </div>
        <Button variante="principal" onClick={() => setAjoutOuvert(true)}>
          Ajouter un formateur
        </Button>
      </header>

      {erreur && (
        <p role="alert" className="rounded-[var(--radius-panneau)] border border-rouge-bordure bg-rouge-clair px-3 py-2.5 text-petit text-rouge">
          {erreur}
        </p>
      )}

      {groupesDecouverts.length > 0 && (
        <Panneau
          titre="Groupes sans encadrant"
          description="Ces groupes n'ont aucun formateur affecté."
          className="border-orange-bordure bg-orange-clair"
        >
          <ul className="flex flex-wrap gap-x-6 gap-y-1.5">
            {groupesDecouverts.map((m) => (
              <li key={m.paroisse} className="text-petit">
                {m.paroisse}
                <span className="ml-1.5 text-texte">
                  {m.groupes.map((g) => `Groupe ${g}`).join(', ')}
                </span>
              </li>
            ))}
          </ul>
        </Panneau>
      )}

      <Panneau className="sans-impression">
        <Input
          label="Rechercher"
          type="search"
          placeholder="Nom, prénom ou paroisse"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </Panneau>

      {!chargement && resultats.length === 0 ? (
        <Panneau>
          <Vide
            titre="Aucun formateur"
            action={<Button onClick={() => setAjoutOuvert(true)}>Ajouter un formateur</Button>}
          >
            Enregistrez les encadrants de vos paroisses pour les affecter aux
            trois groupes.
          </Vide>
        </Panneau>
      ) : (
        <DataTable
          colonnes={colonnes}
          lignes={resultats}
          cle={(f) => String(f.id_formateur)}
          onLigneClic={setEnEdition}
          legende="Formateurs et affectations"
          parPage={20}
        />
      )}

      <Modal
        ouvert={ajoutOuvert}
        onFermer={() => setAjoutOuvert(false)}
        titre="Ajouter un formateur"
        sousTitre="Rattachement, groupes encadrés et statut décanal"
      >
        <FormateurForm
          paroissesAutorisees={autorisees}
          onEnregistrer={enregistrer}
          onAnnuler={() => setAjoutOuvert(false)}
        />
      </Modal>

     <Modal
        ouvert={enEdition !== null}
        onFermer={() => setEnEdition(null)}
        titre={enEdition ? `${enEdition.prenom} ${enEdition.nom}` : ''}
        sousTitre={enEdition ? `${enEdition.paroisse_nom} — ${enEdition.doyenne_nom}` : undefined}
        pied={
          enEdition ? (
            <Button
              taille="petit"
              variante="danger"
              onClick={() => void supprimer(enEdition)}
            >
              Retirer du fichier
            </Button>
          ) : undefined
        }
      >
        {enEdition && (
          <FormateurForm
        valeursInitiales={{
          nom: enEdition.nom,
          prenom: enEdition.prenom,
          contact: enEdition.contact,
          paroisse_code: enEdition.paroisse_code,
          est_decanal_secteur: enEdition.est_decanal_secteur,
          groupes: enEdition.groupes ?? [],
          paroisse_affectation_code: enEdition.paroisse_affectation_code,
        }}
        paroissesAutorisees={autorisees}
        onEnregistrer={enregistrer}
        onAnnuler={() => setEnEdition(null)}
      />
        )}
      </Modal>

      <Panneau titre="Les trois groupes" className="sans-impression">
        <dl className="grid gap-4 sm:grid-cols-3">
          {GROUPES.map((g) => (
            <div key={g.numero}>
              <dt className="text-base font-medium">
                Groupe {g.numero} — {g.nom}
              </dt>
              <dd className="mt-0.5 text-petit text-texte-faible">{g.critere}</dd>
            </div>
          ))}
        </dl>
      </Panneau>
    </div>
  );
}
