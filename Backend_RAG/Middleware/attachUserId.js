// Middleware/attachUserId.js

export const attachUserId = (req, res, next) => {

  if (req.kauth?.grant?.access_token?.content) {
    req.userId = req.kauth.grant.access_token.content.sub;           // Keycloak unique ID
    req.username = req.kauth.grant.access_token.content.preferred_username; 
    req.email = req.kauth.grant.access_token.content.email;    
    req.roles = req.kauth.grant.access_token.content.realm_access.roles;  
  }
  next();
  
};