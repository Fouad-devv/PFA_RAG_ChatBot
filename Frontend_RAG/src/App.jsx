import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import useAxiosPrivate from './api/useAxiosPrivate';
import { useKeycloak } from '@react-keycloak/web';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRouteProtector } from './components/AdminProtecte';
import { Landing } from './pages/landing/Landing';
import { Public } from './pages/public/Public';
import { Home } from './pages/home/Home';
import { Admin } from './pages/admin/Admin';

const PAGE_TITLES = {
  '/': 'Code du Travail Marocain',
  '/chat': 'Chat Public | Code du Travail',
  '/home': 'Accueil | Code du Travail',
  '/admin': 'Administration | Code du Travail',
};

function App() {
  const { keycloak, initialized } = useKeycloak();
  const axiosPrivate = useAxiosPrivate();
  const location = useLocation();

  useEffect(() => {
    document.title = PAGE_TITLES[location.pathname] ?? 'Code du Travail Marocain';
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/chat" element={<Public />} />
      <Route path="/home" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRouteProtector>
          <Admin />
        </AdminRouteProtector>
      } />
    </Routes>
  );
}

export default App;
