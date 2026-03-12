from django.contrib import admin
from .models import User, Farm, FarmMembership

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff')
    search_fields = ('username', 'email')

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    # Changed 'city' to 'address' to match your model
    list_display = ('name', 'owner_name', 'address', 'currency_code')
    search_fields = ('name', 'owner_name')

@admin.register(FarmMembership)
class FarmMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'farm', 'role', 'joined_at')
    list_filter = ('farm', 'role')