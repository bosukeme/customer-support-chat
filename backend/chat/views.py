from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from drf_spectacular.utils import extend_schema

from accounts.permissions import IsCustomer, IsAgentOrSupervisor, IsSupervisor
from chat.models import Conversation, Message
from chat.serializers import (
    ConversationSerializer, MessageSerializer, MessageSerializer2,
    SimpleDetailSerializer
)
# from accounts.permissions import IsCustomer, IsAgentOrSupervisor


class ConversationCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return Conversation.objects.filter(
            customer=self.request.user
        ).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        # Check for existing open conversation
        open_convo = Conversation.objects.filter(
            customer=request.user, status="OPEN").first()

        if open_convo:
            # If an open conversation exists, serialize and return it
            serializer = self.get_serializer(open_convo)
            # Use 200 OK or 201 Created depending on desired semantics
            return Response(serializer.data, status=200)

        # If no open conversation, proceed with creation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED,
                        headers=headers)

    def perform_create(self, serializer):

        return serializer.save(customer=self.request.user,
                               status=Conversation.Status.OPEN)


# class ConversationMessagesView(generics.ListAPIView):
#     serializer_class = MessageSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         conversation_id = self.kwargs["pk"]
#         conversation = Conversation.objects.get(id=conversation_id)
#         user = self.request.user

#         if user.role == "CUSTOMER" and conversation.customer != user:
#             return Message.objects.none()
#         elif user.role == "AGENT" and conversation.agent != user:
#             return Message.objects.none()
#         return conversation.messages.all()

@extend_schema(
    responses={status.HTTP_200_OK: MessageSerializer2(many=True)},
    request=None
)
@api_view(["GET"])
def get_conversation_messages(request, conversation_id):
    messages = Message.objects.filter(
        conversation_id=conversation_id).order_by("timestamp")
    serializer = MessageSerializer2(messages, many=True)
    return Response(serializer.data)


class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class AgentConversationsView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAgentOrSupervisor]

    def get_queryset(self):
        user = self.request.user
        if user.role != "AGENT" and user.role != "SUPERVISOR":
            return Conversation.objects.none()
        # print(Conversation.objects.filter(status="OPEN", agent__isnull=True))
        return (Conversation.objects.filter(status="OPEN")
                |
                Conversation.objects.filter(agent=user, status="ASSIGNED"))


class AcceptConversationView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        # The request body is empty
        request=None,
        responses={
            status.HTTP_200_OK: SimpleDetailSerializer,
            status.HTTP_403_FORBIDDEN: SimpleDetailSerializer,
            status.HTTP_404_NOT_FOUND: SimpleDetailSerializer,
            status.HTTP_400_BAD_REQUEST: SimpleDetailSerializer,
        }
    )
    def post(self, request, conversation_id):
        try:
            user = request.user
            if user.role != "AGENT":
                return Response({"detail": "Not authorized"},
                                status=status.HTTP_403_FORBIDDEN)

            try:
                convo = Conversation.objects.get(id=conversation_id)
            except Conversation.DoesNotExist:
                return Response({"detail": "Conversation not found"},
                                status=404)
            print(convo)
            print(convo.agent)
            # if convo.agent is not None:
            #     return Response({"detail": "Conversation already assigned"},
            #                     status=400)

            convo.agent = user
            convo.status = Conversation.Status.ASSIGNED
            convo.save()

            # Notify agent group via Channels
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"agent_{user.id}",
                {
                    "type": "new_conversation",
                    "conversation_id": str(convo.id),
                    "customer": convo.customer.username
                }
            )

            return Response({"detail": "Conversation accepted"})
        except Exception as e:
            print("Error: ", e)


class CloseConversationView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=None,
        responses={
            status.HTTP_200_OK: SimpleDetailSerializer,
            status.HTTP_404_NOT_FOUND: SimpleDetailSerializer,
        }
    )
    def post(self, request, conversation_id):
        user = request.user
        try:
            convo = Conversation.objects.get(id=conversation_id, agent=user)
        except Conversation.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)

        convo.status = Conversation.Status.CLOSED
        convo.save()
        return Response({"detail": "Conversation closed"})


@extend_schema(
    responses={status.HTTP_200_OK: ConversationSerializer(many=True)},
    request=None
)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsSupervisor])
def supervisor_conversations_view(request):
    """
    Return all active conversations for supervisors to monitor.
    Active = OPEN or ASSIGNED.
    """
    convos = Conversation.objects.filter(
        status__in=[Conversation.Status.OPEN, Conversation.Status.ASSIGNED]) \
        .order_by("-updated_at")
    serializer = ConversationSerializer(
        convos, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)
