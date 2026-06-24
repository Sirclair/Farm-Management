from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from .models import FarmMembership

def get_user_farm(user):

    if user.active_membership and user.active_membership.farm:
        return user.active_membership.farm

    membership = (
        user.farm_memberships
        .select_related("farm")
        .filter(is_active=True)
        .first()
    )

    if membership:
        user.active_membership = membership
        user.save(update_fields=["active_membership"])
        return membership.farm

    return None