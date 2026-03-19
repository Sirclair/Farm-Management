import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

def sync_admin():
    User = get_user_model()
    # Pulling from Render Env Vars
    username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
    password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "FarmAdmin") 
    
    user, created = User.objects.get_or_create(username=username)
    
    user.set_password(password) # This updates the password if they exist
    user.is_superuser = True
    user.is_staff = True
    user.save()
    
    if created:
        print(f"Admin {username} created.")
    else:
        print(f"Admin {username} password updated.")

if __name__ == "__main__":
    sync_admin()
