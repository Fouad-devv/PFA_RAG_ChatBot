// Middleware/attachUserId.js

export const attachUserId = (req, res, next) => {
  if (req.tokenPayload) {
    req.userId   = req.tokenPayload.sub;
    req.username = req.tokenPayload.preferred_username;
    req.email    = req.tokenPayload.email;
    req.roles    = req.tokenPayload.realm_access?.roles || [];
  }
  next();
};