from django.db import models
from django.contrib.auth.models import AbstractUser
import pytz 

class Farm(models.Model):
    name = models.CharField(max_length=255, unique=True) # Unique prevents duplicates like two "Zonke Farms"
    owner_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    country = models.CharField(max_length=100, default="South Africa")
    currency_code = models.CharField(max_length=3, default="ZAR")
    timezone = models.CharField(
        max_length=32, 
        choices=[(tz, tz) for tz in pytz.all_timezones], 
        default='Africa/Johannesburg'
    )
    is_active_subscription = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.country})"

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Global Platform Admin'), # You, the software creator
        ('owner', 'Farm Owner'),
        ('manager', 'Farm Manager'),
        ('staff', 'Farm Staff'),
        ('customer', 'Marketplace Customer'), # Buys from farms
    )
    # This is their global identity on your platform
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')

    @property
    def active_farm(self):
        """Helper to get the user's primary farm data."""
        membership = self.farm_memberships.select_related('farm').first()
        return membership.farm if membership else None
        
    @property
    def farm_role(self):
        """Helper to get the specific role they play in their active farm."""
        membership = self.farm_memberships.first()
        return membership.role if membership else self.role

    def __str__(self):
        return self.username

class FarmMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="farm_memberships")
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="memberships")
    # Their role specific to THIS farm
    role = models.CharField(max_length=20, choices=User.ROLE_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'farm')

    def __str__(self):
        return f"{self.user.username} - {self.role} at {self.farm.name}"