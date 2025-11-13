from django.urls import re_path

from .consumers import ChatConsumer
from .supervisor_consumer import SupervisorConsumer

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<conversation_id>[0-9a-f-]{36})/$",
            ChatConsumer.as_asgi()),
    re_path(r"ws/supervisor/$", SupervisorConsumer.as_asgi()),
]
