from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order

@receiver(post_save, sender=Order)
def notify_farmer_on_new_order(sender, instance, created, **kwargs):
    if created:
        # Check which customer field is being used
        if instance.user_customer:
            customer_name = instance.user_customer.get_full_name() or instance.user_customer.username
        elif instance.manual_customer:
            customer_name = instance.manual_customer.full_name
        else:
            customer_name = "Walk-in Buyer"
            
        print(f"NOTIFICATION: New order from {customer_name} at {instance.farm.name}!")