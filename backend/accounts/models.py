import random
from datetime import timedelta

import pytz
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class Farm(models.Model):
    name = models.CharField(max_length=255, unique=True)
    owner_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    country = models.CharField(max_length=100, default="South Africa")
    currency_code = models.CharField(max_length=3, default="ZAR")

    timezone = models.CharField(
        max_length=32,
        choices=[(tz, tz) for tz in pytz.all_timezones],
        default="Africa/Johannesburg",
    )

    is_active_subscription = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Global Platform Admin"),
        ("owner", "Farm Owner"),
        ("manager", "Farm Manager"),
        ("staff", "Farm Staff"),
        ("customer", "Marketplace Customer"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")
    is_verified = models.BooleanField(default=False)

    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)

    def generate_otp(self):
        self.otp_code = str(random.randint(100000, 999999))
        self.otp_expiry = timezone.now() + timedelta(minutes=10)
        self.save(update_fields=["otp_code", "otp_expiry"])
        return self.otp_code

    def __str__(self):
        return self.username

    # ❌ REMOVED: active_farm (this was your production bug source)
    # Farm must always be resolved via FarmMembership explicitly


class FarmMembership(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="farm_memberships"
    )
    farm = models.ForeignKey(
        Farm, on_delete=models.CASCADE, related_name="memberships"
    )
    role = models.CharField(max_length=20, choices=User.ROLE_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "farm")