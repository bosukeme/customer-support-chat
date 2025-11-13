# chat/utils.py
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Conversation
from django.contrib.auth import get_user_model

User = get_user_model()


def auto_assign_conversation(conversation):
    # find all agents
    agents = User.objects.filter(role="AGENT")
    # get agent with least open conversations
    least_busy = min(
        agents, key=lambda a: a.agent_conversations.filter(status="OPEN").count())
    conversation.agent = least_busy
    conversation.save()

    # Notify agent via channels
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"agent_{least_busy.id}",
        {
            "type": "new_conversation",
            "conversation_id": str(conversation.id),
            "customer": conversation.customer.username
        }
    )
