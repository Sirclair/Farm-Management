from accounts.models import FarmMembership
from rest_framework import serializers

class FarmQuerySetMixin:
    """
    Reusable logic to filter querysets by the user's farm 
    and prevent crashes during system checks/doc generation.
    """
    def get_user_farm(self):
        membership = FarmMembership.objects.filter(
            user=self.request.user
        ).select_related("farm").first()
        return membership.farm if membership else None

    def get_queryset(self):
        # The Guard Clause for Swagger/System Checks
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return self.queryset.model.objects.none()

        farm = self.get_user_farm()
        if not farm:
            return self.queryset.model.objects.none()
            
        return self.queryset.model.objects.filter(farm=farm)