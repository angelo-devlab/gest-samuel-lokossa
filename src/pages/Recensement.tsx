import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { SamuelEnrichi, SamuelSaisie } from '../types/samuel';
import { RecensementForm } from '../components/forms/RecensementForm';
import { PassCardPreview } from '../components/qr/PassCardPreview';
import { Panneau } from '../components/ui/Panneau';
import { Button } from '../components/ui/Button';
import { samuelService } from '../services/samuelService';
import { useRegistre } from '../store/useRegistre';
import { exporterFicheSamuel } from '../components/pdf/FicheSamuelPDF';

/**
 * Inscription d'un nouveau Samuel (CDCF Module 2).
 *
 * Après enregistrement, le Pass est montré immédiatement : le responsable
 * voit le matricule attribué et peut imprimer la fiche sans changer d'écran.
 */
export function Recensement() {
  const { paroissesAutorisees, recharger } = useRegistre();
  const [dernierInscrit, setDernierInscrit] = useState<SamuelEnrichi | null>(null);

  async function enregistrer(saisie: SamuelSaisie) {
    const cree = await samuelService.creer(saisie);
    setDernierInscrit(cree);
    await recharger();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="border-b border-bordure pb-4">
        <h1 className="text-titre">Recensement</h1>
        <p className="mt-1 text-petit text-texte-doux">
          Inscrire un Samuel au Registre Matrice Diocésain. Le matricule et le
          groupe sont attribués automatiquement.
        </p>
      </header>

      {dernierInscrit && (
        <Panneau
          className="border-vert-bordure bg-vert-clair"
          titre={`${dernierInscrit.prenom} ${dernierInscrit.nom} est inscrit`}
          description={`Matricule ${dernierInscrit.id_nid} — en attente de validation pastorale`}
          actions={
            <>
              <Button taille="petit" onClick={() => void exporterFicheSamuel(dernierInscrit)}>
                Imprimer la fiche
              </Button>
              <Link to="/annuaire">
                <Button taille="petit" variante="discret">
                  Voir dans l'annuaire
                </Button>
              </Link>
            </>
          }
          contenuClassName="flex flex-col items-center gap-3 sm:flex-row sm:items-start"
        >
          <PassCardPreview membre={dernierInscrit} className="max-w-xs" />
          <p className="text-petit text-texte-doux">
            Le Pass sera actif une fois le dossier validé par l'Aumônier ou le
            Curé. Vous pouvez dès à présent inscrire le Samuel suivant : le
            formulaire ci-dessous a été vidé.
          </p>
        </Panneau>
      )}

      <RecensementForm
        paroissesAutorisees={paroissesAutorisees}
        onEnregistrer={enregistrer}
      />
    </div>
  );
}
