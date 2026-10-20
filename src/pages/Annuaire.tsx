import { useMemo, useState } from 'react';
import type { FiltresAnnuaire, SamuelEnrichi } from '../types/samuel';
import type { NumeroGroupe } from '../config/constants';
import { useRegistre } from '../store/useRegistre';
import { useAuth } from '../store/authStore';
import { droits } from '../services/authService';
import { samuelService, FILTRES_VIDES } from '../services/samuelService';
import { normaliser, formaterDateCourte, formaterNombre } from '../lib/utils';
import { libelleGrade, rangDuGrade } from '../config/grades';
import { GROUPES } from '../config/constants';
import { DataTable, type Colonne } from '../components/ui/DataTable';
import { Panneau, Champ, Vide } from '../components/ui/Panneau';
import { Badge, BadgeGroupe, BadgeValidation } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { DoyenneParoisseSelect } from '../components/forms/DoyenneParoisseSelect';
import { GradeSelect } from '../components/forms/GradeSelect';
import { RecensementForm } from '../components/forms/RecensementForm';
import { valeursDepuisMembre } from '../components/forms/valeursRecensement';
import { PassCardPreview, PassCardVerso } from '../components/qr/PassCardPreview';
import { exporterAnnuaire } from '../components/pdf/AnnuairePDF';
import { exporterPlancheStickers, nbPagesPlanche } from '../components/pdf/PlancheStickersQRPDF';
import { exporterFicheSamuel } from '../components/pdf/FicheSamuelPDF';
import { paroisseService } from '../services/paroisseService';

/**
 * Annuaire : recherche, filtres et exports PDF (CDCF Module 5).
 */
export function Annuaire() {
  const { membres, chargement, recharger, paroissesAutorisees } = useRegistre();
  const compte = useAuth((s) => s.compte);
  const [filtres, setFiltres] = useState<FiltresAnnuaire>(FILTRES_VIDES);
  const [selection, setSelection] = useState<SamuelEnrichi | null>(null);
  // La fiche s'ouvre en consultation ; l'édition réécrit le dossier complet.
  const [modeEdition, setModeEdition] = useState(false);
  const [nouveauGrade, setNouveauGrade] = useState('');
  const [exportEnCours, setExportEnCours] = useState<string | null>(null);
  const [messageExport, setMessageExport] = useState<string | null>(null);

  const resultats = useMemo(() => {
    const q = normaliser(filtres.recherche);
    return membres.filter((m) => {
      if (filtres.doyenneSlug && m.doyenne_slug !== filtres.doyenneSlug) return false;
      if (filtres.paroisseCode && m.paroisse_code !== filtres.paroisseCode) return false;
      if (filtres.groupe && m.groupe_calcule !== filtres.groupe) return false;
      if (filtres.grade && m.grade_actuel !== filtres.grade) return false;
      if (filtres.valide !== null && m.statut_validation !== filtres.valide) return false;
      if (q && !normaliser(`${m.nom} ${m.prenom} ${m.id_nid} ${m.paroisse_nom}`).includes(q)) {
        return false;
      }
      return true;
    });
  }, [membres, filtres]);

  /** Décrit le filtre courant : sert de sous-titre aux PDF et de repère à l'écran. */
  const perimetre = useMemo(() => {
    const morceaux: string[] = [];
    if (filtres.paroisseCode) morceaux.push(paroisseService.paroisse(filtres.paroisseCode)?.nom ?? '');
    else if (filtres.doyenneSlug) morceaux.push(`Doyenné de ${paroisseService.doyenne(filtres.doyenneSlug)?.nom}`);
    else morceaux.push('Ensemble du périmètre');
    if (filtres.groupe) morceaux.push(`Groupe ${filtres.groupe}`);
    if (filtres.grade) morceaux.push(libelleGrade(filtres.grade));
    if (filtres.valide === true) morceaux.push('validés');
    if (filtres.valide === false) morceaux.push('en attente');
    return morceaux.filter(Boolean).join(', ');
  }, [filtres]);

  const filtreActif =
    filtres.recherche !== '' ||
    filtres.doyenneSlug !== null ||
    filtres.paroisseCode !== null ||
    filtres.groupe !== null ||
    filtres.grade !== null ||
    filtres.valide !== null;

  function ouvrirFiche(m: SamuelEnrichi) {
    setSelection(m);
    setModeEdition(false);
    setNouveauGrade(m.grade_actuel);
  }

  function fermerFiche() {
    setSelection(null);
    setModeEdition(false);
  }

  async function basculerValidation(m: SamuelEnrichi) {
    const maj = await samuelService.valider(m.id_nid, !m.statut_validation);
    setSelection(maj);
    await recharger();
  }

  /** Mise à jour du grade : l'acte courant d'un responsable paroissial. */
  async function promouvoir(m: SamuelEnrichi) {
    if (!nouveauGrade || nouveauGrade === m.grade_actuel) return;
    const maj = await samuelService.promouvoir(m.id_nid, nouveauGrade as SamuelEnrichi['grade_actuel']);
    setSelection(maj);
    await recharger();
  }

  async function enregistrerEdition(m: SamuelEnrichi, saisie: Parameters<typeof samuelService.modifier>[1]) {
    const maj = await samuelService.modifier(m.id_nid, saisie);
    setSelection(maj);
    setModeEdition(false);
    await recharger();
  }

  async function lancerPlanche() {
    setExportEnCours('planche');
    setMessageExport(null);
    try {
      await exporterPlancheStickers({ membres: resultats });
    } catch (e) {
      setMessageExport(e instanceof Error ? e.message : "L'export n'a pas abouti.");
    } finally {
      setExportEnCours(null);
    }
  }

  async function lancerFiche(m: SamuelEnrichi) {
    setExportEnCours(`fiche-${m.id_nid}`);
    try {
      await exporterFicheSamuel(m);
    } finally {
      setExportEnCours(null);
    }
  }

  const colonnes: Colonne<SamuelEnrichi>[] = [
    {
      cle: 'nid',
      entete: 'Matricule',
      largeur: '11rem',
      masquerSous: 'sm',
      valeurTri: (m) => m.id_nid,
      rendu: (m) => <span className="matricule text-petit">{m.id_nid}</span>,
    },
    {
      cle: 'nom',
      entete: 'Samuel',
      valeurTri: (m) => `${m.nom} ${m.prenom}`,
      rendu: (m) => (
        <span>
          <span className="font-semibold">{m.nom}</span>{' '}
          <span className="text-texte-doux">{m.prenom}</span>
          <span className="matricule block text-micro text-texte-faible sm:hidden">
            {m.id_nid}
          </span>
        </span>
      ),
    },
    {
      cle: 'paroisse',
      entete: 'Paroisse',
      masquerSous: 'md',
      valeurTri: (m) => m.paroisse_nom,
      rendu: (m) => (
        <span className="text-petit">
          {m.paroisse_nom}
          <span className="block text-micro text-texte-faible">{m.doyenne_nom}</span>
        </span>
      ),
    },
    {
      cle: 'grade',
      entete: 'Grade',
      masquerSous: 'sm',
      valeurTri: (m) => rangDuGrade(m.grade_actuel),
      rendu: (m) => (
        <span className="text-petit">
          <span className="chiffres text-bleu-lien">{rangDuGrade(m.grade_actuel)}</span>{' '}
          {libelleGrade(m.grade_actuel)}
        </span>
      ),
    },
    {
      cle: 'groupe',
      entete: 'Groupe',
      masquerSous: 'lg',
      valeurTri: (m) => m.groupe_calcule,
      rendu: (m) => <BadgeGroupe groupe={m.groupe_calcule} bref />,
    },
    {
      cle: 'validation',
      entete: 'Pass',
      valeurTri: (m) => (m.statut_validation ? 1 : 0),
      rendu: (m) => <BadgeValidation valide={m.statut_validation} />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-bordure pb-4">
        <div>
          <h1 className="text-titre">Annuaire</h1>
          <p className="mt-1 text-petit text-texte-doux">
            {chargement
              ? 'Chargement…'
              : `${formaterNombre(resultats.length)} Samuel${resultats.length > 1 ? 's' : ''} sur ${formaterNombre(membres.length)}`}
          </p>
        </div>

        <div className="sans-impression flex flex-wrap gap-2">
          <Button
            onClick={() => exporterAnnuaire({ membres: resultats, perimetre })}
            disabled={resultats.length === 0}
          >
            Annuaire PDF
          </Button>
          <Button
            variante="principal"
            onClick={() => void lancerPlanche()}
            disabled={resultats.length === 0}
            enCours={exportEnCours === 'planche'}
          >
            Planche QR ({nbPagesPlanche(resultats.length)} page
            {nbPagesPlanche(resultats.length) > 1 ? 's' : ''})
          </Button>
        </div>
      </header>

      {messageExport && (
        <p role="alert" className="rounded-[var(--radius-panneau)] border border-rouge-bordure bg-rouge-clair px-3 py-2.5 text-petit text-rouge">
          {messageExport}
        </p>
      )}

      <Panneau
        titre="Filtrer"
        actions={
          filtreActif ? (
            <Button taille="petit" variante="discret" onClick={() => setFiltres(FILTRES_VIDES)}>
              Tout afficher
            </Button>
          ) : undefined
        }
        className="sans-impression"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Rechercher"
            type="search"
            placeholder="Nom, prénom, matricule ou paroisse"
            value={filtres.recherche}
            onChange={(e) => setFiltres((f) => ({ ...f, recherche: e.target.value }))}
          />
          <DoyenneParoisseSelect
            doyenneSlug={filtres.doyenneSlug ?? ''}
            paroisseCode={filtres.paroisseCode ?? ''}
            onChange={(d, p) =>
              setFiltres((f) => ({ ...f, doyenneSlug: d || null, paroisseCode: p || null }))
            }
            paroissesAutorisees={paroissesAutorisees}
            avecTous
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Groupe"
              invite="Tous les groupes"
              value={filtres.groupe ? String(filtres.groupe) : ''}
              onChange={(e) =>
                setFiltres((f) => ({
                  ...f,
                  groupe: e.target.value ? (Number(e.target.value) as NumeroGroupe) : null,
                }))
              }
              options={GROUPES.map((g) => ({
                valeur: String(g.numero),
                libelle: `Groupe ${g.numero} — ${g.nom}`,
              }))}
            />
            <GradeSelect
              label="Grade"
              valeur={filtres.grade ?? ''}
              onChange={(g) => setFiltres((f) => ({ ...f, grade: g || null }))}
              avecTous
            />
            <Select
              label="Statut du Pass"
              invite="Tous les statuts"
              value={filtres.valide === null ? '' : filtres.valide ? 'oui' : 'non'}
              onChange={(e) =>
                setFiltres((f) => ({
                  ...f,
                  valide: e.target.value === '' ? null : e.target.value === 'oui',
                }))
              }
              options={[
                { valeur: 'oui', libelle: 'Validés' },
                { valeur: 'non', libelle: 'En attente de validation' },
              ]}
            />
          </div>
        </div>
      </Panneau>

      {!chargement && resultats.length === 0 ? (
        <Panneau>
          <Vide
            titre="Aucun Samuel ne correspond"
            action={
              filtreActif ? (
                <Button onClick={() => setFiltres(FILTRES_VIDES)}>Tout afficher</Button>
              ) : undefined
            }
          >
            Élargissez la recherche ou retirez un filtre.
          </Vide>
        </Panneau>
      ) : (
        <DataTable
          colonnes={colonnes}
          lignes={resultats}
          cle={(m) => m.id_nid}
          onLigneClic={ouvrirFiche}
          legende={`Annuaire — ${perimetre}`}
          parPage={25}
        />
      )}

      {/* Fiche détaillée */}
      <Modal
        ouvert={selection !== null}
        onFermer={fermerFiche}
        titre={selection ? `${selection.prenom} ${selection.nom}` : ''}
        sousTitre={
          selection ? (
            <span className="matricule">{selection.id_nid}</span>
          ) : undefined
        }
        largeur="large"
        pied={
          selection && !modeEdition ? (
            <>
              {droits.peutSaisir(compte) && (
                <Button taille="petit" variante="discret" onClick={() => setModeEdition(true)}>
                  Modifier la fiche
                </Button>
              )}
              <Button
                taille="petit"
                onClick={() => void lancerFiche(selection)}
                enCours={exportEnCours === `fiche-${selection.id_nid}`}
              >
                Imprimer la fiche
              </Button>
              {droits.peutValider(compte) && (
                <Button
                  taille="petit"
                  variante={selection.statut_validation ? 'danger' : 'principal'}
                  onClick={() => void basculerValidation(selection)}
                >
                  {selection.statut_validation
                    ? 'Retirer la validation'
                    : 'Valider le dossier'}
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {selection && modeEdition && (
          <RecensementForm
            valeursInitiales={valeursDepuisMembre(selection)}
            nidExistant={selection.id_nid}
            paroissesAutorisees={paroissesAutorisees}
            onEnregistrer={(saisie) => enregistrerEdition(selection, saisie)}
            onAnnuler={() => setModeEdition(false)}
          />
        )}

        {selection && !modeEdition && (
          <div className="grid gap-5 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col gap-3">
              <PassCardPreview membre={selection} />
              <PassCardVerso membre={selection} />
            </div>

            <div className="flex flex-col gap-4">
              {/* En-tête avec la photo du Samuel */}
              <div className="flex items-center gap-4 rounded-[var(--radius-panneau)] border border-bordure bg-fond-discret p-3">
                {selection.photo_url ? (
                  <img
                    src={selection.photo_url}
                    alt={`${selection.prenom} ${selection.nom}`}
                    className="h-16 w-16 rounded-full object-cover border-2 border-vert-bordure shadow-sm"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-full border border-bordure bg-fond text-moyen font-bold text-texte-doux">
                    {selection.prenom[0]}{selection.nom[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-moyen font-bold text-texte">
                    {selection.prenom} {selection.nom}
                  </h3>
                  <p className="matricule text-petit text-bleu-lien">{selection.id_nid}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <BadgeValidation valide={selection.statut_validation} />
                <BadgeGroupe groupe={selection.groupe_calcule} />
                {selection.est_responsable && <Badge ton="bleu">Responsable</Badge>}
              </div>

              <dl className="divide-y divide-[var(--color-bordure)]">
                <Champ intitule="Paroisse">
                  {paroisseService.libelleComplet(selection.paroisse_code)}
                </Champ>
                <Champ intitule="Doyenné">{selection.doyenne_nom}</Champ>
                <Champ intitule="Grade liturgique">
                  <span className="chiffres text-bleu-lien">
                    {rangDuGrade(selection.grade_actuel)}
                  </span>{' '}
                  {libelleGrade(selection.grade_actuel)}
                </Champ>
                <Champ intitule="Né(e) le">
                  {formaterDateCourte(selection.date_naissance)}
                </Champ>
                <Champ intitule="Entré(e) le">
                  {formaterDateCourte(selection.date_entree)}
                </Champ>
                <Champ intitule="Ancienneté">
                  {selection.anciennete_annees} an{selection.anciennete_annees > 1 ? 's' : ''}
                </Champ>
                <Champ intitule="Téléphone des parents">
                  {selection.contact_parent ?? '—'}
                </Champ>
                <Champ intitule="Sacrements">
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {([
                      ['Baptême', selection.baptise],
                      ['Communion', selection.premiere_communion],
                      ['Confirmation', selection.confirme],
                    ] as const).map(([nom, recu]) => (
                      <Badge key={nom} ton={recu ? 'vert' : 'neutre'}>
                        {nom}
                      </Badge>
                    ))}
                  </span>
                </Champ>
              </dl>

              {/* Promotion dans les grades */}
              {droits.peutPromouvoir(compte) && (
                <div className="rounded-[var(--radius-panneau)] border border-bordure bg-fond-discret px-3.5 py-3">
                  <GradeSelect
                    label="Faire progresser dans les grades"
                    valeur={nouveauGrade}
                    onChange={setNouveauGrade}
                  />
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <p className="text-micro text-texte-faible">
                      {nouveauGrade && nouveauGrade !== selection.grade_actuel
                        ? `De ${libelleGrade(selection.grade_actuel)} à ${libelleGrade(nouveauGrade)}`
                        : 'Choisissez le nouveau grade pour enregistrer la promotion.'}
                    </p>
                    <Button
                      taille="petit"
                      variante="principal"
                      className="shrink-0"
                      disabled={!nouveauGrade || nouveauGrade === selection.grade_actuel}
                      onClick={() => void promouvoir(selection)}
                    >
                      Enregistrer le grade
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}