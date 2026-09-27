import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import documents.routing

class HostRewriteMiddleware:
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        if 'headers' in scope:
            # Force the host header to 'localhost' to bypass all Django host validation bugs
            new_headers = []
            for name, value in scope['headers']:
                if name == b'host':
                    new_headers.append((b'host', b'localhost'))
                else:
                    new_headers.append((name, value))
            scope['headers'] = new_headers
        return await self.app(scope, receive, send)

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": HostRewriteMiddleware(django_asgi_app),
    "websocket": HostRewriteMiddleware(
        AuthMiddlewareStack(
            URLRouter(
                documents.routing.websocket_urlpatterns
            )
        )
    ),
})
