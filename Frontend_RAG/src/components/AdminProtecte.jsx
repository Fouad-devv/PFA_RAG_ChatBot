import { useKeycloak } from '@react-keycloak/web';

export const AdminRouteProtector = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();

  // wait until Keycloak finishes initializing
  if (!initialized) return <p className="p-10 text-center">Loading...</p>;

  // if user not authenticated → redirect to Keycloak login
  if (!keycloak?.authenticated) {
    keycloak.login({ redirectUri: window.location.origin });
    return <p className="p-10 text-center">Redirecting to login...</p>;
  }

  // if user is authenticated but not an admin → show unauthorized
  if (!keycloak.hasRealmRole('admin')) {
    return <p className="p-10 text-center">You are not authorized to view this page</p>;
  }

  
  return children;
};