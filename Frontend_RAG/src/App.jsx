import { Routes, Route } from 'react-router-dom';
import useAxiosPrivate from './api/useAxiosPrivate';
import { useKeycloak } from '@react-keycloak/web';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRouteProtector } from './components/AdminProtecte';
import { Landing } from './pages/landing/Landing';
import { Public } from './pages/public/public';
import { Home } from './pages/home/Home';
import { Admin } from './pages/admin/Admin';

function App() {
  const { keycloak, initialized } = useKeycloak();
  const axiosPrivate = useAxiosPrivate();

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
