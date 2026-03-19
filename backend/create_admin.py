import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User # Use your custom user model path

username = "admin"
password = "admin"
email = "admin@example.com"

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f"Superuser '{username}' created successfully.")
else:
    print(f"Superuser '{username}' already exists.")
