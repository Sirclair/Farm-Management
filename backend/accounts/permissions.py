from rest_framework.permissions import BasePermission


# =========================================================
# BASE FARM PERMISSION
# =========================================================
class FarmPermission(BasePermission):

    required_permission = None

    def has_permission(self, request, view):

        user = request.user

        if not user or not user.is_authenticated:
            return False

        membership = getattr(
            user,
            "active_membership",
            None
        )

        if not membership:
            return False

        # owner bypass
        if membership.role == "owner":
            return True

        permission_field = self.required_permission

        if not permission_field:
            return True

        return getattr(
            membership,
            permission_field,
            False
        )


# =========================================================
# INVENTORY
# =========================================================
class InventoryPermission(FarmPermission):
    required_permission = "can_manage_inventory"


# =========================================================
# FINANCE
# =========================================================
class FinancePermission(FarmPermission):
    required_permission = "can_manage_finance"


# =========================================================
# SALES
# =========================================================
class SalesPermission(FarmPermission):
    required_permission = "can_manage_sales"


# =========================================================
# STAFF
# =========================================================
class CanManageStaff(FarmPermission):
    required_permission = "can_manage_staff"