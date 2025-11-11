import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = (self.scope['url_route']
                                ['kwargs']
                                ['conversation_id'])

        self.group_name = f"conversation_{self.conversation_id}"

        user = self.scope['user']
        if not user.is_authenticated:
            await self.close()
            return

        allowed = await self.user_in_conversation(user, self.conversation_id)
        if not allowed:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message", "")
        user = self.scope["user"]

        if message.strip() == "":
            return

        # Save message to DB
        msg_obj = await self.save_message(user, self.conversation_id, message)

        # Broadcast message to group
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": user.username,
                "timestamp": msg_obj.timestamp.isoformat(),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"],
            "timestamp": event["timestamp"],
        }))

    @database_sync_to_async
    def save_message(self, user, conversation_id, message):
        conversation = Conversation.objects.get(id=conversation_id)
        return Message.objects.create(conversation=conversation, sender=user,
                                      content=message)

    @database_sync_to_async
    def user_in_conversation(self, user, conversation_id):
        try:
            convo = Conversation.objects.get(id=conversation_id)
            return convo.customer == user or convo.agent == user \
                or user.role == "SUPERVISOR"

        except Conversation.DoesNotExist:
            return False
