from django.urls import path

from .views import (
    ConversationCreateView,
    #     ConversationMessagesView,
    MessageCreateView,
    AgentConversationsView,
    AcceptConversationView,
    CloseConversationView,
    get_conversation_messages,
    supervisor_conversations_view
)


urlpatterns = [
    path("conversations/", ConversationCreateView.as_view(),
         name="conversation-create"),
    #     path("conversations/<uuid:pk>/messages/",
    #          ConversationMessagesView.as_view(), name="conversation-messages"),
    path("messages/", MessageCreateView.as_view(), name="message-create"),
    path("messages/<uuid:conversation_id>/",
         get_conversation_messages, name="get_conversation_messages"),

    path("agents/conversations/", AgentConversationsView.as_view(),
         name="agent-conversations"),
    path("agents/accept/<uuid:conversation_id>/",
         AcceptConversationView.as_view(), name="accept-conversation"),
    path("agents/close/<uuid:conversation_id>/",
         CloseConversationView.as_view(), name="close-conversation"),

    path("supervisor/conversations/", supervisor_conversations_view,
         name="supervisor-conversations"),
]
