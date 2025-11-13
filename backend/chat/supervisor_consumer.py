import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django_redis import get_redis_connection


class SupervisorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]

        # Only supervisors can connect here
        if not user.is_authenticated or user.role != "SUPERVISOR":
            await self.close()
            return

        # Join the global presence group
        await self.channel_layer.group_add("presence_updates",
                                           self.channel_name)
        await self.accept()

        # On connect — send current online users
        redis_conn = get_redis_connection("default")
        online_users = redis_conn.hgetall("online_users")

        users_list = [
            {
                "username": username.decode(),
                "role": role.decode(),
            }
            for username, role in online_users.items()
        ]

        await self.send(text_data=json.dumps({
            "type": "presence.snapshot",
            "users": users_list,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("presence_updates",
                                               self.channel_name)

    # Handle events broadcast from ChatConsumer
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
