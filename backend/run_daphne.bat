@echo off
set DJANGO_SETTINGS_MODULE=support_chat.settings
daphne support_chat.asgi:application -p 8000
