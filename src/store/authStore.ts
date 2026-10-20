import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type Compte } from '../services/authService';

/**
 * Session du responsable connecté.
 * Persistée pour qu'un rafraîchissement de page au presbytère ne fasse pas
 * perdre la saisie en cours.
 */

interface AuthState {
  compte: Compte | null;
  enCours: boolean;
  erreur: string | null;
  connecter: (identifiant: string, motDePasse: string) => Promise<void>;
  deconnecter: () => Promise<void>;
  effacerErreur: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      compte: null,
      enCours: false,
      erreur: null,

      connecter: async (identifiant, motDePasse) => {
        set({ enCours: true, erreur: null });
        try {
          const compte = await authService.connecter(identifiant, motDePasse);
          set({ compte, enCours: false });
        } catch (e) {
          set({
            erreur: e instanceof Error ? e.message : 'Connexion impossible.',
            enCours: false,
            compte: null,
          });
          throw e;
        }
      },

      deconnecter: async () => {
        await authService.deconnecter();
        set({ compte: null, erreur: null });
      },

      effacerErreur: () => set({ erreur: null }),
    }),
    {
      name: 'pass-samuel:session',
      partialize: (s) => ({ compte: s.compte }),
    },
  ),
);
