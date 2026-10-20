import { Suspense, lazy, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { useAuth } from './store/authStore';
import { droits } from './services/authService';
import { Login } from './pages/Login';
import { cn } from './lib/utils';

// Le scanner embarque le décodeur vidéo : il n'est chargé qu'à l'ouverture
// de la page, pour ne pas peser sur le premier affichage en connexion mobile.
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Recensement = lazy(() => import('./pages/Recensement').then((m) => ({ default: m.Recensement })));
const Annuaire = lazy(() => import('./pages/Annuaire').then((m) => ({ default: m.Annuaire })));
const Scanner = lazy(() => import('./pages/Scanner').then((m) => ({ default: m.Scanner })));
const Formateurs = lazy(() => import('./pages/Formateurs').then((m) => ({ default: m.Formateurs })));

/** Barre la route si la session manque ou si le rôle n'y donne pas droit. */
function Protege({
  autorise,
  children,
}: {
  autorise: (c: ReturnType<typeof useAuth.getState>['compte']) => boolean;
  children: ReactNode;
}) {
  const compte = useAuth((s) => s.compte);
  const emplacement = useLocation();

  if (!compte) {
    return <Navigate to="/connexion" state={{ depuis: emplacement.pathname }} replace />;
  }
  if (!autorise(compte)) {
    // Le contrôleur de rassemblement n'a que le scanner : on l'y renvoie
    // plutôt que de lui opposer un refus qu'il ne peut pas lever.
    return <Navigate to={droits.peutVoirTableauDeBord(compte) ? '/' : '/scanner'} replace />;
  }
  return <>{children}</>;
}

function Chargement() {
  return (
    <div className="grid place-items-center py-24 text-petit text-texte-faible" role="status">
      Chargement…
    </div>
  );
}

function Atelier() {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="flex min-h-dvh bg-fond-discret">
      {/* Navigation fixe à partir du grand écran. La colonne garde le fond
          de la barre sur toute la hauteur du document, sinon une page longue
          laisse apparaître le fond sous la zone collante. */}
      <div className="sans-impression hidden border-r border-bordure bg-fond lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar />
        </div>
      </div>

      {/* Tiroir de navigation sur téléphone et tablette. */}
      {menuOuvert && (
        <div className="sans-impression fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            aria-label="Fermer la navigation"
            onClick={() => setMenuOuvert(false)}
            className="absolute inset-0 bg-texte/40"
          />
          <div className="relative h-full">
            <Sidebar onNaviguer={() => setMenuOuvert(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOuvrirMenu={() => setMenuOuvert(true)} />
        <main className={cn('mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6')}>
          <Suspense fallback={<Chargement />}>
            <Routes>
              <Route
                path="/"
                element={
                  <Protege autorise={droits.peutVoirTableauDeBord}>
                    <Dashboard />
                  </Protege>
                }
              />
              <Route
                path="/recensement"
                element={
                  <Protege autorise={droits.peutSaisir}>
                    <Recensement />
                  </Protege>
                }
              />
              <Route
                path="/annuaire"
                element={
                  <Protege autorise={droits.peutConsulterAnnuaire}>
                    <Annuaire />
                  </Protege>
                }
              />
              <Route
                path="/formateurs"
                element={
                  <Protege autorise={droits.peutGererFormateurs}>
                    <Formateurs />
                  </Protege>
                }
              />
              <Route
                path="/scanner"
                element={
                  <Protege autorise={droits.peutScanner}>
                    <Scanner />
                  </Protege>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export function App() {
  const compte = useAuth((s) => s.compte);

  return (
    <Routes>
      <Route
        path="/connexion"
        element={compte ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="*" element={compte ? <Atelier /> : <Navigate to="/connexion" replace />} />
    </Routes>
  );
}
