import { Routes, Route } from 'react-router-dom';
import useAxiosPrivate from './api/useAxiosPrivate';
import { useKeycloak } from '@react-keycloak/web';

import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/landing/Landing';
import { Public } from './pages/public/public';
import { Home } from './pages/home/Home';

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
    </Routes>
  );
}

export default App;
