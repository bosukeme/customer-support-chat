from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def notify_offline_user(email: str, message: str):
    """
    Send email notification to a user that they received a chat message
    while offline.
    """
    send_mail(
        subject="New Chat Message Received",
        message=f"You received a new message:\n\n{message}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
