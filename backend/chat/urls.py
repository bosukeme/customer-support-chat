from django.urls import path

from .views import (
    ConversationCreateView, ConversationMessagesView, MessageCreateView
    )


urlpatterns = [
    path("conversations/", ConversationCreateView.as_view(),
         name="conversation-create"),
    path("conversations/<uuid:pk>/messages/",
         ConversationMessagesView.as_view(), name="conversation-messages"),
    path("messages/", MessageCreateView.as_view(), name="message-create"),
]
