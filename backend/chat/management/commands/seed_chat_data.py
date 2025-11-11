from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from chat.models import Conversation, Message

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with sample users, conversations, and messages."

    def handle(self, *args, **options):
        # 1. Create supervisor
        supervisor, _ = User.objects.get_or_create(
            username="supervisor",
            defaults={
                "email": "supervisor@example.com",
                "role": User.Roles.SUPERVISOR,
                "password": "supervisor123"
            },
        )
        supervisor.set_password("supervisor123")
        supervisor.save()

        # 2. Create agents
        agent1, _ = User.objects.get_or_create(
            username="agent1",
            defaults={
                "email": "agent1@example.com",
                "role": User.Roles.AGENT,
                "password": "agent123"
            },
        )
        agent1.set_password("agent123")
        agent1.save()

        agent2, _ = User.objects.get_or_create(
            username="agent2",
            defaults={
                "email": "agent2@example.com",
                "role": User.Roles.AGENT,
                "password": "agent123"
            },
        )
        agent2.set_password("agent123")
        agent2.save()

        # 3. Create customers
        customers = []
        for i in range(1, 4):
            cust, _ = User.objects.get_or_create(
                username=f"customer{i}",
                defaults={
                    "email": f"customer{i}@example.com",
                    "role": User.Roles.CUSTOMER,
                    "password": "customer123"
                },
            )
            cust.set_password("customer123")
            cust.save()
            customers.append(cust)

        # 4. Create conversations
        conversations = []
        for i, customer in enumerate(customers, start=1):
            agent = agent1 if i % 2 == 0 else agent2
            convo, _ = Conversation.objects.get_or_create(
                customer=customer, agent=agent
            )
            conversations.append(convo)

        # 5. Add sample messages
        for convo in conversations:
            Message.objects.get_or_create(
                conversation=convo,
                sender=convo.customer,
                content="Hello, I need help with my order.",
            )
            Message.objects.get_or_create(
                conversation=convo,
                sender=convo.agent,
                content="Sure! Can you provide your order ID?",
            )

        self.stdout.write(self.style.SUCCESS(
            "Database seeded successfully!"))
        self.stdout.write("Login credentials:")
        self.stdout.write("- Supervisor: supervisor / supervisor123")
        self.stdout.write("- Agent1: agent1 / agent123")
        self.stdout.write("- Agent2: agent2 / agent123")
        self.stdout.write("- Customers: customer1–3 / customer123")
