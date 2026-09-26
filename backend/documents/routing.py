from django.urls import re_path
from .consumers import DocumentIndexingConsumer

websocket_urlpatterns = [
    re_path(r"^ws/documents/(?P<document_id>\d+)/$", DocumentIndexingConsumer.as_asgi()),
]
