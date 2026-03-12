from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import DailyRecord

@receiver(post_save, sender=DailyRecord)
def check_flock_health(sender, instance, created, **kwargs):
    if created:
        flock = instance.flock
        # Prevent division by zero if quantity_received is missing
        if flock.quantity_received > 0:
            mortality_rate = (instance.mortality / flock.quantity_received) * 100
            
            if mortality_rate > 5:
                # This shows in your terminal/logs
                print(f"⚠️ HEALTH ALERT: High mortality in {flock.batch_number} ({mortality_rate:.1f}%)")