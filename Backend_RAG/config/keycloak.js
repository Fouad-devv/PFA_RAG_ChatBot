// keycloak.js
import session from 'express-session';
import Keycloak from 'keycloak-connect';

const memoryStore = new session.MemoryStore();

const keycloakConfig = {
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'ClientPFE',
  bearerOnly: true,
  serverUrl: process.env.KEYCLOAK_URL || 'http://localhost:8081/',
  realm: process.env.KEYCLOAK_REALM || 'RealmPFE',
};

const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

export { keycloak, memoryStore };