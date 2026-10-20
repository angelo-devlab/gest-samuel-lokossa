import { DIOCESE, NB_DOYENNES_PAROISSES } from '../../config/libelles';

export function Footer() {
  return (
    <footer className="sans-impression border-t border-bordure px-4 py-4 text-micro text-texte-faible">
      <p>
        {DIOCESE.organisation} — {DIOCESE.nom}, {DIOCESE.pays}.{' '}
        {NB_DOYENNES_PAROISSES}
      </p>
      <p className="mt-0.5">
        Registre Matrice Diocésain, version 1.0.
        Conception et Design UX/UI : Angelo ADANHOUNME (ADH).
      </p>
    </footer>
  );
}
