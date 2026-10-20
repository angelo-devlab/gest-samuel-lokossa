import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../store/authStore';
import { COMPTES_LOCAUX } from '../services/authService';
import { supabaseConfigure } from '../lib/supabaseClient';
import { DIOCESE } from '../config/constants';
import { NB_DOYENNES, NB_PAROISSES } from '../config/doyennesParoisses';
import { getRoleRef } from '../config/constants';
import { cn } from '../lib/utils';

/**
 * Connexion (CDCF § 6).
 *
 * Tant que Supabase n'est pas configuré, les quatre comptes d'accès locaux
 * sont proposés en clair, un par rôle. Dès que les clés du serveur sont
 * fournies, seuls l'adresse et le mot de passe restent.
 */
export function Login() {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const connecter = useAuth((s) => s.connecter);
  const erreur = useAuth((s) => s.erreur);
  const enCours = useAuth((s) => s.enCours);
  const naviguer = useNavigate();

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    try {
      await connecter(identifiant, motDePasse);
      naviguer('/');
    } catch {
      // Le message est porté par le magasin de session.
    }
  }

  async function entrerAvecCompte(id: string) {
    setIdentifiant(id);
    setMotDePasse('demo');
    try {
      await connecter(id, 'demo');
      naviguer('/');
    } catch {
      /* idem */
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Volet d'identité : ce que le Pass est, avant de demander qui vous êtes.
          Fond discret plutôt qu'aplat sombre, bordure fine, une seule couleur
          vive — le vert des chiffres clés. */}
      <section className="relative flex flex-col justify-between border-b border-bordure bg-fond-discret px-6 py-10 sm:px-10 lg:border-r lg:border-b-0 lg:px-14">
        <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-vert" />

        <div className="flex items-center gap-3 pt-2">
          <img src="/logo-pass-samuel.png" alt="" aria-hidden className="size-12 shrink-0" />
          <div>
            <p className="text-moyen leading-tight font-bold">Gest-Samuel</p>
            <p className="text-micro text-texte-faible">{DIOCESE.organisation}</p>
          </div>
        </div>

        <div className="max-w-md py-12">
          <h1 className="text-masthead leading-[1.1]">
            Le Registre des Samuel du{' '}
            {DIOCESE.nom.replace('Diocèse de ', 'diocèse de ')}
          </h1>
          <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-texte-doux">
            Chaque servant d'autel reçoit un matricule diocésain et un QR Code. Les responsables inscrivent, valident et impriment depuis
            leur paroisse ; le contrôle à l'entrée des camps se fait d'un coup
            de caméra.
          </p>

          {/* Trois chiffres qui situent le périmètre, sans emphase décorative. */}
          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5 border-t border-bordure pt-7">
            {[
              [NB_DOYENNES, 'doyennés'],
              [NB_PAROISSES, 'paroisses'],
              [9, 'grades liturgiques'],
            ].map(([valeur, intitule]) => (
              <div key={String(intitule)}>
                <dt className="sr-only">{intitule}</dt>
                <dd>
                  <span className="chiffres text-titre font-extrabold text-vert-action">
                    {valeur}
                  </span>
                  <span className="mt-0.5 block text-petit text-texte-faible">{intitule}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-micro text-texte-faible">
          {DIOCESE.nom}, {DIOCESE.pays}
        </p>
      </section>

      {/* Volet de connexion. */}
      <section className="flex items-center justify-center bg-fond px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <h2 className="text-titre">Connexion</h2>
          <p className="mt-1.5 text-base text-texte-doux">
            Accédez au registre selon votre charge pastorale.
          </p>

          <form onSubmit={soumettre} className="mt-8 flex flex-col gap-4">
            <Input
              label={supabaseConfigure ? 'Adresse électronique' : 'Identifiant'}
              type={supabaseConfigure ? 'email' : 'text'}
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              autoComplete="username"
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              autoComplete="current-password"
              required
            />

            {erreur && (
              <p
                role="alert"
                className="rounded-[var(--radius-petit)] border border-rouge-bordure bg-rouge-clair px-3 py-2.5 text-petit text-rouge"
              >
                {erreur}
              </p>
            )}

            <Button type="submit" variante="principal" taille="grand" enCours={enCours}>
              Entrer dans le registre
            </Button>
          </form>

          {!supabaseConfigure && (
            <div className="mt-10 border-t border-bordure pt-7">
              <h3 className="text-moyen">Comptes d'accès</h3>
              <p className="mt-1 text-petit text-texte-faible">
                Le serveur n'est pas encore branché. Chaque compte ouvre son
                périmètre ; le registre démarre vide et reste sur ce poste.
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {COMPTES_LOCAUX.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => void entrerAvecCompte(c.id)}
                      disabled={enCours}
                      className={cn(
                        'w-full rounded-[var(--radius-petit)] border border-bordure bg-fond px-3.5 py-3 text-left',
                        'transition-colors hover:border-bleu-lien hover:bg-bleu-actif',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                      )}
                    >
                      <span className="block text-base font-semibold">
                        {getRoleRef(c.role)?.nom}
                      </span>
                      <span className="block text-micro text-texte-faible">
                        {c.nomComplet} — {c.description}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
