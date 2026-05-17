import logging
from functools import lru_cache
from typing import List, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
from jwt import PyJWKClient, PyJWKClientError
from pydantic import BaseModel, Field

from helpers.config import get_settings


logger = logging.getLogger("uvicorn.error")


class CurrentUser(BaseModel):
    user_id: str
    username: Optional[str] = None
    email: Optional[str] = None
    roles: List[str] = Field(default_factory=list)
    raw_claims: dict = Field(default_factory=dict)


def _issuer() -> str:
    s = get_settings()
    return f"{s.KEYCLOAK_SERVER_URL.rstrip('/')}/realms/{s.KEYCLOAK_REALM}"


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient:
    jwks_url = f"{_issuer()}/protocol/openid-connect/certs"
    return PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)


_settings = get_settings()
_oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{_issuer()}/protocol/openid-connect/auth",
    tokenUrl=f"{_issuer()}/protocol/openid-connect/token",
    auto_error=True,
)


def _extract_roles(claims: dict, client_id: Optional[str]) -> List[str]:
    realm_roles = claims.get("realm_access", {}).get("roles", [])
    client_roles: List[str] = []
    if client_id:
        client_roles = (
            claims.get("resource_access", {}).get(client_id, {}).get("roles", [])
        )
    return list({*realm_roles, *client_roles})


async def get_current_user(token: str = Depends(_oauth2_scheme)) -> CurrentUser:
    settings = get_settings()
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=settings.KEYCLOAK_AUDIENCE,
            issuer=_issuer(),
            options={"require": ["exp", "iat", "sub"]},
        )
    except (jwt.InvalidTokenError, PyJWKClientError) as exc:
        logger.warning("JWT rejected: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return CurrentUser(
        user_id=claims["sub"],
        username=claims.get("preferred_username"),
        email=claims.get("email"),
        roles=_extract_roles(claims, settings.KEYCLOAK_CLIENT_ID),
        raw_claims=claims,
    )


def require_roles(*required: str):
    async def _checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not set(required).issubset(user.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _checker
