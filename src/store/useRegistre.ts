import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SamuelEnrichi } from '../types/samuel';
import { samuelService } from '../services/samuelService';
import { paroissesVisibles } from '../services/authService';
import { useAuth } from './authStore';

/**
 * Charge le registre réduit au périmètre du compte connecté.
 *
 * Le filtrage est refait ici bien que les politiques RLS l'appliquent déjà
 * côté serveur : sans serveur branché il n'y a pas de RLS, et sous Supabase
 * il évite d'afficher brièvement des fiches que la base refusera.
 */
export function useRegistre() {
  const compte = useAuth((s) => s.compte);
  const [membres, setMembres] = useState<SamuelEnrichi[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const autorisees = useMemo(() => paroissesVisibles(compte), [compte]);

  const recharger = useCallback(async () => {
    setErreur(null);
    try {
      const tous = await samuelService.tous();
      setMembres(autorisees === null ? tous : tous.filter((m) => autorisees.includes(m.paroisse_code)));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Le registre n’a pas pu être chargé.');
      setMembres([]);
    } finally {
      setChargement(false);
    }
  }, [autorisees]);

  useEffect(() => {
    // Le périmètre a changé : on repasse en chargement avant de relire.
    setChargement(true);
    void recharger();
  }, [recharger]);

  return { membres, chargement, erreur, recharger, paroissesAutorisees: autorisees };
}
