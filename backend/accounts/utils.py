from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from .models import FarmMembership


def get_user_farm(user):
    """
    Single source of truth for farm resolution.
    No silent failures allowed.
    """

    if not user or not user.is_authenticated:
        raise NotAuthenticated("Authentication required")

    membership = (
        FarmMembership.objects
        .select_related("farm")
        .filter(user=user)
        .order_by("-joined_at")
        .first()
    )

    if not membership:
        raise PermissionDenied("No farm assigned to this user")

    return membership.farm