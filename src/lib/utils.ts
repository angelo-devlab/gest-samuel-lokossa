import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusionne des classes Tailwind en laissant la dernière l'emporter. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateLongue = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dateCourte = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formaterDate(valeur: string | Date | null | undefined): string {
  if (!valeur) return '—';
  const d = new Date(valeur);
  return Number.isNaN(d.getTime()) ? '—' : dateLongue.format(d);
}

export function formaterDateCourte(valeur: string | Date | null | undefined): string {
  if (!valeur) return '—';
  const d = new Date(valeur);
  return Number.isNaN(d.getTime()) ? '—' : dateCourte.format(d);
}

/** Âge en années pleines à la date de référence. */
export function calculerAge(dateNaissance: string | Date, reference: Date = new Date()): number {
  const n = new Date(dateNaissance);
  if (Number.isNaN(n.getTime())) return 0;
  let age = reference.getFullYear() - n.getFullYear();
  const m = reference.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && reference.getDate() < n.getDate())) age--;
  return Math.max(0, age);
}

/** Espace fine insécable entre les milliers, comme dans les documents officiels. */
export function formaterNombre(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

/** Initiales pour l'avatar de secours quand aucune photo n'est fournie. */
export function initiales(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

/** Retire les accents pour que « Comè » soit trouvé en tapant « come ». */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Date du jour au format attendu par <input type="date">. */
export function aujourdhuiISO(): string {
  return new Date().toISOString().slice(0, 10);
}
