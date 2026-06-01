from django.contrib import admin
from .models import Farm, FarmMembership, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "is_staff", "is_verified")
    list_filter = ("role", "is_staff", "is_verified")
    search_fields = ("username", "email")


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "owner_name",
        "address",
        "currency_code",
        "is_active_subscription",
    )
    search_fields = ("name", "owner_name", "email")


@admin.register(FarmMembership)
class FarmMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "farm", "role", "joined_at")
    list_filter = ("farm", "role")
    search_fields = ("user__username", "farm__name")
