import random
from datetime import timedelta

import pytz

from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser


# =====================================================
# FARM
# =====================================================
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

    def member_count(self):
        return self.memberships.count()

    def __str__(self):
        return self.name


# =====================================================
# USER
# =====================================================
class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Platform Admin"),
        ("owner", "Farm Owner"),
        ("manager", "Farm Manager"),
        ("staff", "Farm Staff"),
        ("finance", "Finance"),
        ("viewer", "Viewer"),
        ("customer", "Marketplace Customer"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")

    is_verified = models.BooleanField(default=False)

    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)

    active_membership = models.ForeignKey(
        "FarmMembership",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="active_users",
    )

    def generate_otp(self):
        self.otp_code = str(random.randint(100000, 999999))
        self.otp_expiry = timezone.now() + timedelta(minutes=10)

        self.save(update_fields=["otp_code", "otp_expiry"])
        return self.otp_code

    @property
    def current_farm(self):
        if self.active_membership and self.active_membership.farm:
            return self.active_membership.farm

        membership = (
            self.farm_memberships
            .select_related("farm")
            .filter(is_active=True)
            .first()
        )

        return membership.farm if membership else None

    def __str__(self):
        return self.username


# =====================================================
# FARM MEMBERSHIP
# =====================================================
class FarmMembership(models.Model):
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("manager", "Manager"),
        ("staff", "Staff"),
        ("finance", "Finance"),
        ("viewer", "Viewer"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="farm_memberships")
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="memberships")

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="staff")

    can_manage_inventory = models.BooleanField(default=False)
    can_manage_finance = models.BooleanField(default=False)
    can_manage_sales = models.BooleanField(default=False)
    can_manage_staff = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "farm")
        indexes = [models.Index(fields=["farm", "role"])]

    def save(self, *args, **kwargs):
        if self.role == "owner":
            self.can_manage_inventory = True
            self.can_manage_finance = True
            self.can_manage_sales = True
            self.can_manage_staff = True

        elif self.role == "manager":
            self.can_manage_inventory = True
            self.can_manage_sales = True

        elif self.role == "finance":
            self.can_manage_finance = True

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} • {self.farm.name} • {self.role}"