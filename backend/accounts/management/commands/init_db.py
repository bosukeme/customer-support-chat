import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings


class Command(BaseCommand):
    help = "Create Postgres DB if not exists and run migrations"

    def handle(self, *args, **options):
        db_name = settings.DATABASES['default']['NAME']
        db_user = settings.DATABASES['default']['USER']
        db_password = settings.DATABASES['default']['PASSWORD']
        db_host = settings.DATABASES['default']['HOST']
        db_port = settings.DATABASES['default']['PORT']

        # Connect to default 'postgres' database
        conn = psycopg2.connect(
            dbname="postgres",
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if DB exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname=%s", (db_name,))
        exists = cursor.fetchone()
        if not exists:
            cursor.execute(f'CREATE DATABASE "{db_name}";')
            self.stdout.write(self.style.SUCCESS(
                f"Database '{db_name}' created successfully!"))
        else:
            self.stdout.write(f"Database '{db_name}' already exists.")

        cursor.close()
        conn.close()

        self.stdout.write("Making migrations...")
        call_command('makemigrations', interactive=False)

        # Run Django migrations
        self.stdout.write("Running migrations...")
        call_command('migrate', interactive=False)
        self.stdout.write(self.style.SUCCESS(
            "Migrations applied successfully!"))
