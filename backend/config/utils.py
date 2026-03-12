from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from .models import ActivityLog # We will create this in a 'logs' app or 'accounts'

def log_action(user, instance, action_type):
    # action_type could be 'CREATE', 'UPDATE', or 'DELETE'
    print(f"User {user.username} performed {action_type} on {instance}")
    # In a real world-class app, you'd save this to a 'Log' table