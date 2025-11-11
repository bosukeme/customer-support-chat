from rest_framework import generics, permissions

from accounts.permissions import IsCustomer
# from rest_framework.response import Response
# from rest_framework.views import APIView

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationCreateView(generics.ListCreateAPIView):
    queryset = Conversation.objects.all().order_by("-created_at")
    serializer_class = ConversationSerializer
    permission_classes = [IsCustomer]

    def perform_create(self, serializer):
        return serializer.save(customer=self.request.user)


class ConversationMessagesView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs["pk"]
        conversation = Conversation.objects.get(id=conversation_id)
        user = self.request.user

        if user.role == "CUSTOMER" and conversation.customer != user:
            return Message.objects.none()
        elif user.role == "AGENT" and conversation.agent != user:
            return Message.objects.none()
        elif user.role == "SUPERVISOR":
            return conversation.messages.all()

        return conversation.messages.all()


class MessageCreateView(generics.CreateAPIView):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
