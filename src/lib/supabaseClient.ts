import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase.
 *
 * Les clés arrivent par variables d'environnement (voir .env.example).
 * Tant qu'elles ne sont pas renseignées, l'application écrit dans le
 * stockage du navigateur : le registre démarre vide et reste sur le poste.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const cleAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigure = Boolean(url && cleAnon);

export const supabase: SupabaseClient | null = supabaseConfigure
  ? createClient(url as string, cleAnon as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/** Lève une erreur explicite plutôt que de laisser passer un client absent. */
export function exigerSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase n'est pas configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}
