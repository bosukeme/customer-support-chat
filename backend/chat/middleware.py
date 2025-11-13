from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str):
    try:
        access_token = AccessToken(token_str)
        user_id = access_token["user_id"]
        return User.objects.get(id=user_id)
    except (TokenError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware that reads JWT from cookies (not headers)
    and authenticates the user for WebSocket connections.
    """

    async def __call__(self, scope, receive, send):
        cookies = {}
        headers = dict(scope.get("headers", []))
        if b"cookie" in headers:
            cookie_str = headers[b"cookie"].decode()
            for cookie in cookie_str.split(";"):
                if "=" in cookie:
                    name, value = cookie.strip().split("=", 1)
                    cookies[name] = value
        token = cookies.get("access_token")
        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)
