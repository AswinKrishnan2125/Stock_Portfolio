"""
ASGI config for stocktracker project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
# import stockapp.routing  # 👈 replace `stockapp` with your actual app name
import portfolio.routing  # 👈 add this line to import your routing


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stocktracker.settings')
django.setup()

# HTTP (Django views) + WebSocket (Channels)
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            portfolio.routing.websocket_urlpatterns
        )
    ),
})
