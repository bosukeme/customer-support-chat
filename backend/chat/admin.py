from django.contrib import admin
from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "agent", "created_at")
    list_filter = ("created_at",)
    search_fields = ("customer__username", "agent__username")
    ordering = ("-created_at",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "content", "timestamp")
    list_filter = ("timestamp",)
    search_fields = ("conversation__id", "sender__username", "content")
    ordering = ("timestamp",)
