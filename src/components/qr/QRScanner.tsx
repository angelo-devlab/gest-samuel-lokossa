import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '../ui/Button';

/**
 * Lecture du QR Code par la caméra (CDCF Module 4).
 *
 * La caméra arrière est demandée en priorité : au portail d'un camp, on
 * présente le Pass devant l'appareil, pas devant son propre visage.
 *
 * Deux particularités de @zxing/library à connaître ici :
 *   — la fonction de rappel est appelée à chaque image analysée, avec une
 *     exception « code introuvable » tant que rien n'est lu ; ces appels sont
 *     la normale et non une erreur à signaler ;
 *   — l'arrêt passe par `reset()`, qui libère aussi le flux de la caméra.
 *     Sans cet appel, le voyant de l'appareil reste allumé après la sortie.
 *
 * Un même code n'est annoncé qu'une fois toutes les deux secondes : sinon le
 * contrôle se redéclencherait en boucle pendant que la carte reste devant
 * l'objectif.
 */

const DELAI_ANTI_REPETITION = 2000;

type Etat = 'arrete' | 'demarrage' | 'lecture' | 'refuse' | 'indisponible';

export function QRScanner({
  onLecture,
  actif = true,
}: {
  onLecture: (contenu: string) => void;
  actif?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lecteurRef = useRef<BrowserMultiFormatReader | null>(null);
  const dernier = useRef<{ contenu: string; horodatage: number } | null>(null);
  // Garde la dernière fonction de rappel sans relancer la caméra à chaque
  // rendu. L'affectation passe par un effet : écrire une ref pendant le rendu
  // n'est pas sûr, React pouvant rendre un composant sans le valider.
  const rappelRef = useRef(onLecture);
  useEffect(() => {
    rappelRef.current = onLecture;
  }, [onLecture]);

  const [etat, setEtat] = useState<Etat>('arrete');
  const [message, setMessage] = useState<string | null>(null);

  const arreter = useCallback(() => {
    lecteurRef.current?.reset();
    lecteurRef.current = null;
    setEtat('arrete');
  }, []);

  const demarrer = useCallback(async () => {
    if (lecteurRef.current || !videoRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setEtat('indisponible');
      setMessage(
        "Ce navigateur ne donne pas accès à la caméra. Saisissez le matricule à la main.",
      );
      return;
    }

    setEtat('demarrage');
    setMessage(null);

    const lecteur = new BrowserMultiFormatReader();
    lecteurRef.current = lecteur;

    try {
      await lecteur.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        (resultat) => {
          // Pas de code dans l'image : cas courant, rien à signaler.
          if (!resultat) return;

          const contenu = resultat.getText();
          const maintenant = Date.now();
          if (
            dernier.current?.contenu === contenu &&
            maintenant - dernier.current.horodatage < DELAI_ANTI_REPETITION
          ) {
            return;
          }
          dernier.current = { contenu, horodatage: maintenant };
          rappelRef.current(contenu);
        },
      );
      setEtat('lecture');
    } catch (e) {
      lecteur.reset();
      lecteurRef.current = null;
      const nom = e instanceof DOMException ? e.name : '';
      if (nom === 'NotAllowedError' || nom === 'SecurityError') {
        setEtat('refuse');
        setMessage(
          "L'accès à la caméra a été refusé. Autorisez-le dans les réglages du navigateur, puis relancez le scanner.",
        );
      } else if (nom === 'NotFoundError' || nom === 'OverconstrainedError') {
        setEtat('indisponible');
        setMessage('Aucune caméra utilisable sur cet appareil.');
      } else {
        setEtat('indisponible');
        setMessage("La caméra n'a pas pu démarrer. Saisissez le matricule à la main.");
      }
    }
  }, []);

  useEffect(() => {
    if (actif) void demarrer();
    else arreter();
    // Libère la caméra en quittant la page : le voyant doit s'éteindre.
    return arreter;
  }, [actif, demarrer, arreter]);

  const COINS = [
    'top-0 left-0 border-t-2 border-l-2',
    'top-0 right-0 border-t-2 border-r-2',
    'bottom-0 left-0 border-b-2 border-l-2',
    'bottom-0 right-0 border-b-2 border-r-2',
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-panneau)] border border-bordure bg-texte">
        <video
          ref={videoRef}
          muted
          playsInline
          className="size-full object-cover"
          aria-label="Flux de la caméra"
        />

        {etat === 'lecture' && (
          // Cadre de visée : montre où présenter la carte.
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative size-[58%]">
              {COINS.map((coin) => (
                <span key={coin} className={`absolute size-7 border-orange ${coin}`} />
              ))}
            </div>
          </div>
        )}

        {etat !== 'lecture' && (
          <div className="absolute inset-0 grid place-items-center bg-texte/85 px-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <p className="max-w-xs text-petit text-white/80">
                {etat === 'demarrage'
                  ? 'Ouverture de la caméra…'
                  : (message ?? "Le scanner est à l'arrêt.")}
              </p>
              {etat !== 'demarrage' && (
                <Button variante="principal" taille="petit" onClick={() => void demarrer()}>
                  {etat === 'arrete' ? 'Démarrer le scanner' : 'Réessayer'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {etat === 'lecture' && (
        <div className="flex items-center justify-between gap-3 text-petit text-texte-faible">
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2 animate-pulse rounded-full bg-vert-action" />
            Présentez le Pass devant la caméra
          </span>
          <Button taille="petit" variante="discret" onClick={arreter}>
            Arrêter
          </Button>
        </div>
      )}
    </div>
  );
}
