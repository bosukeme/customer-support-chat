from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(
        source="sender.username", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender",
                  "sender_username", "content", "timestamp"]
        read_only_fields = ["id", "timestamp", "sender", "sender_username"]


class MessageSerializer2(serializers.ModelSerializer):
    sender = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "content", "timestamp"]


class ConversationSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(
        source="customer.username", read_only=True)
    agent_username = serializers.CharField(
        source="agent.username", read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            "id",
            "customer",          # <-- Needs to be read_only
            "customer_username",
            "agent",             # <-- Needs to be read_only/optional
            "agent_username",
            "status",            # <-- Needs to be read_only
            "created_at",
            "updated_at",
            "messages",
        ]
        # ADD 'customer', 'agent', and 'status' to read_only_fields
        read_only_fields = [
            "id",
            "customer",
            "agent",
            "status",
            "created_at",
            "updated_at",
            "messages"
        ]


class SimpleDetailSerializer(serializers.Serializer):
    detail = serializers.CharField()
