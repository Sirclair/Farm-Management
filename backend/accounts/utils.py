from rest_framework.exceptions import PermissionDenied


def get_user_farm(user):
    """
    Central source of truth for resolving a user's active farm.
    """
    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required")

    farm = getattr(user, "active_farm", None)

    if not farm:
        return None

    return farm
