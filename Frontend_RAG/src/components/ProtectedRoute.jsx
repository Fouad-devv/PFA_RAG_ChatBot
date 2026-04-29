
import { useKeycloak } from '@react-keycloak/web';

export const ProtectedRoute = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();

  // Remove hash from URL after login/redirect
  if (initialized && window.location.hash) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  
  // wait for Keycloak to initialize
  if (!initialized) return <p className="p-10 text-center">Loading...</p>;


  // if user is not authenticated, redirect to login
  if (!keycloak?.authenticated) {
    keycloak.login({ redirectUri: window.location.origin });
    return <p className="p-10 text-center">Redirecting to login...</p>;
  }

  return children;
};