from accounts.models import User

if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser(
        username="admin",
        email="zonketasales@gmail.com",
        password="Admin@12345"
    )
    print("Superuser created")
else:
    print("Superuser already exists")