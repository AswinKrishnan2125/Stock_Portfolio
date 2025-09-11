import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token):
    try:
        validated_token = JWTAuthentication().get_validated_token(token)
        user = JWTAuthentication().get_user(validated_token)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        return None

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return JWTAuthMiddlewareInstance(scope, self.inner)

class JWTAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = dict(scope)
        self.inner = inner

    async def __call__(self, receive, send):
        # Get token from query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        if 'token=' in query_string:
            import urllib.parse
            params = urllib.parse.parse_qs(query_string)
            token_list = params.get('token')
            if token_list:
                token = token_list[0]
        print(f"[JWT DEBUG] token from query: {token}")
        if token:
            try:
                user = await get_user_from_token(token)
                print(f"[JWT DEBUG] user from token: {user}")
                self.scope['user'] = user
            except Exception as e:
                print(f"[JWT DEBUG] error authenticating token: {e}")
                self.scope['user'] = None
        else:
            print("[JWT DEBUG] no token found in query string")
            self.scope['user'] = None
        return await self.inner(self.scope, receive, send)

# Usage in asgi.py:
# from authentication.channels_jwt_middleware import JWTAuthMiddleware
# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": JWTAuthMiddleware(AuthMiddlewareStack(URLRouter(websocket_urlpatterns)))
# })
