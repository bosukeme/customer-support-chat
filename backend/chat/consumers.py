import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django_redis import get_redis_connection


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = (self.scope['url_route']
                                ['kwargs']
                                ['conversation_id'])

        print(self.conversation_id)

        self.group_name = f"conversation_{self.conversation_id}"
        user = self.scope['user']
        print("Connecting user:", user)
        if not user.is_authenticated:
            await self.close()
            return

        can_join = await self.user_can_join(user, self.conversation_id)
        if not can_join:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

        redis_conn = get_redis_connection("default")
        redis_conn.hset("online_users", user.username, user.role)

        await self.channel_layer.group_send(
            "presence_updates",
            {
                "type": "user_online",
                "user": user.username,
                "role": user.role,
            },
        )

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.join",
                "user": user.username,
                "role": "supervisor" if user.role ==
                "SUPERVISOR" else user.role.lower(),
            },
        )

    async def disconnect(self, close_code):
        user = self.scope["user"]

        redis_conn = get_redis_connection("default")
        redis_conn.hdel("online_users", user.username)

        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

        await self.channel_layer.group_send(
            "presence_updates",
            {
                "type": "user_offline",
                "user": user.username,
            },
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        user = self.scope["user"]
        msg_type = data.get("type")

        print(user)

        if msg_type in ["typing.start", "typing.stop"]:
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.typing",
                    "event": msg_type,
                    "user": user.username,
                },
            )
            return

        if msg_type == "message":
            message = data.get("message", "").strip()

            if not message:
                return

            # Save message to DB
            msg_obj = await self.save_message(user, self.conversation_id,
                                              message)

            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "chat.message",
                    "content": message,
                    "sender": user.username,
                    "timestamp": msg_obj.timestamp.isoformat(),
                },
            )

    async def chat_typing(self, event):
        await self.send(text_data=json.dumps({
            "type": event["event"],  # typing.start / typing.stop
            "user": event["user"],
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "message",
            "content": event["content"],
            "sender": event["sender"],
            "timestamp": event["timestamp"],
        }))

    async def chat_join(self, event):
        await self.send(text_data=json.dumps({
            "type": "user.join",
            "user": event["user"],
            "role": event["role"],
        }))

    async def user_online(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence.online",
            "user": event["user"],
            "role": event["role"]
        }))

    async def user_offline(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence.offline",
            "user": event["user"]
        }))

    @database_sync_to_async
    def save_message(self, user, conversation_id, message):
        from .models import Conversation, Message

        conversation = Conversation.objects.get(id=conversation_id)
        return Message.objects.create(conversation=conversation, sender=user,
                                      content=message)

    @database_sync_to_async
    def user_can_join(self, user, conversation_id):
        from .models import Conversation
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            # Supervisors can join ANY conversation
            if user.role == "SUPERVISOR":
                return True
            if user.role == "AGENT" and conversation.agent == user:
                return True
            if user.role == "CUSTOMER" and conversation.customer == user:
                return True
            return False
        except Conversation.DoesNotExist:
            return False

    # @database_sync_to_async
    # def user_in_conversation(self, user, conversation_id):
    #     from .models import Conversation

    #     try:
    #         convo = Conversation.objects.get(id=conversation_id)
    #         return convo.customer == user or convo.agent == user \
    #             or user.role == "SUPERVISOR"

    #     except Conversation.DoesNotExist:
    #         return False


class AgentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.agent_id = self.scope["user"].id
        self.group_name = f"agent_{self.agent_id}"

        if not self.scope["user"].is_authenticated or \
                self.scope["user"].role != "AGENT":
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

    async def new_conversation(self, event):
        await self.send_json({
            "type": "new_conversation",
            "conversation_id": event["conversation_id"],
            "customer": event["customer"]
        })
