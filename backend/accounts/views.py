
from django.contrib.auth import authenticate, update_session_auth_hash
from django.db import transaction

from rest_framework import generics, permissions, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from flock.models import FlockBatch

from .models import (
    Farm,
    User,
    FarmMembership,
)

from .permissions import (
    InventoryPermission,
    CanManageStaff,
)

from .serializers import (
    FarmProductSerializer,
    FarmRegistrationSerializer,
    FarmSerializer,
    UserProfileSerializer,
)

from .utils import get_user_farm


# =====================================================
# REGISTER
# =====================================================

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = FarmRegistrationSerializer
    permission_classes = [AllowAny]


# =====================================================
# CURRENT USER
# =====================================================

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):

    memberships = (
        request.user.farm_memberships
        .select_related("farm")
        .filter(is_active=True)
    )

    if (
        request.user.active_membership
        and not memberships.filter(
            id=request.user.active_membership.id
        ).exists()
    ):
        request.user.active_membership = None
        request.user.save(
            update_fields=["active_membership"]
        )

    return Response({

        "user":
        UserProfileSerializer(
            request.user
        ).data,

        "active_farm":
        (
            request.user.current_farm.id
            if request.user.current_farm
            else None
        ),

        "farms": [

            {
                "id": m.farm.id,
                "name": m.farm.name,
                "role": m.role,

                "permissions": {
                    "inventory": m.can_manage_inventory,
                    "finance": m.can_manage_finance,
                    "sales": m.can_manage_sales,
                    "staff": m.can_manage_staff,
                }
            }

            for m in memberships
        ]
    })


# =====================================================
# FARM VIEWSET
# =====================================================

class FarmViewSet(viewsets.ModelViewSet):

    serializer_class = FarmSerializer
    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        if getattr(
            self,
            "swagger_fake_view",
            False
        ):
            return Farm.objects.none()

        return (
            Farm.objects
            .filter(
                memberships__user=self.request.user,
                memberships__is_active=True,
            )
            .distinct()
        )


# =====================================================
# EXPLORE FARMS
# =====================================================

class ExploreFarmsView(
    generics.ListAPIView
):
    queryset = Farm.objects.all()
    serializer_class = FarmSerializer
    permission_classes = [AllowAny]


# =====================================================
# FARM PRODUCTS
# =====================================================

class FarmProductListView(
    generics.ListAPIView
):

    serializer_class = FarmProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):

        return (
            FlockBatch.objects
            .filter(
                farm_id=self.kwargs["farm_id"]
            )
            .order_by("-id")
        )


# =====================================================
# CREATE FARM USER
# =====================================================

class CreateFarmUserView(APIView):

    permission_classes = [
        permissions.IsAuthenticated,
        CanManageStaff,
    ]

    ROLE_PERMISSIONS = {

        "manager": {
            "can_manage_inventory": True,
            "can_manage_finance": True,
            "can_manage_sales": True,
            "can_manage_staff": True,
        },

        "finance": {
            "can_manage_inventory": False,
            "can_manage_finance": True,
            "can_manage_sales": False,
            "can_manage_staff": False,
        },

        "staff": {
            "can_manage_inventory": True,
            "can_manage_finance": False,
            "can_manage_sales": True,
            "can_manage_staff": False,
        },

        "viewer": {
            "can_manage_inventory": False,
            "can_manage_finance": False,
            "can_manage_sales": False,
            "can_manage_staff": False,
        },
    }

    def post(self, request):

        farm = get_user_farm(
            request.user
        )

        if not farm:
            return Response(
                {
                    "error": "No active farm"
                },
                status=400
            )

        role = request.data.get(
            "role",
            "staff"
        )

        if role not in self.ROLE_PERMISSIONS:
            return Response(
                {
                    "error": "Invalid role"
                },
                status=400
            )

        username = (
            request.data
            .get(
                "username",
                ""
            )
            .strip()
        )

        email = (
            request.data
            .get(
                "email",
                ""
            )
            .strip()
        )

        password = (
            request.data
            .get(
                "password"
            )
        )

        if not username or not password:
            return Response(
                {
                    "error":
                    "Username and password required"
                },
                status=400
            )

        if User.objects.filter(
            username=username
        ).exists():

            return Response(
                {
                    "error":
                    "Username already exists"
                },
                status=400
            )

        with transaction.atomic():

            user = User.objects.create_user(

                username=username,
                email=email,
                password=password,
                role=role,
                is_verified=True,
            )

            membership = (
                FarmMembership.objects.create(

                    user=user,
                    farm=farm,
                    role=role,

                    **self.ROLE_PERMISSIONS[
                        role
                    ]
                )
            )

            user.active_membership = membership

            user.save(
                update_fields=[
                    "active_membership"
                ]
            )

        return Response({

            "message": "User created",

            "user": {

                "username":
                user.username,

                "role":
                role,

                "farm":
                farm.name,
            }

        }, status=201)


# =====================================================
# SWITCH FARM
# =====================================================

class SwitchFarmView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def post(
        self,
        request
    ):

        farm_id = request.data.get(
            "farm_id"
        )

        if not farm_id:
            return Response(
                {
                    "error":
                    "farm_id required"
                },
                status=400
            )

        membership = (
            FarmMembership.objects
            .select_related(
                "farm"
            )
            .filter(
                user=request.user,
                farm_id=farm_id,
                is_active=True,
            )
            .first()
        )

        if not membership:
            return Response(
                {
                    "error":
                    "You do not belong to this farm"
                },
                status=403
            )

        request.user.active_membership = membership

        request.user.save(
            update_fields=[
                "active_membership"
            ]
        )

        return Response({

            "message":
            "Farm switched",

            "farm":
            membership.farm.name,

            "role":
            membership.role,
        })


# =====================================================
# LOGIN
# =====================================================

# =====================================================
# LOGIN
# =====================================================

class LoginView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        try:
            username = request.data.get(
                "username",
                ""
            ).strip()

            password = request.data.get(
                "password",
                ""
            )

            print("\n========== LOGIN START ==========")
            print("USERNAME:", username)

            user = authenticate(
                request,
                username=username,
                password=password,
            )

            if not user:
                print("AUTH FAILED")

                return Response(
                    {
                        "error":
                        "Invalid username or password"
                    },
                    status=400
                )

            print("AUTH SUCCESS:", user.username)

            memberships = (
                user.farm_memberships
                .select_related("farm")
                .filter(is_active=True)
            )

            # auto recover membership
            if not user.active_membership:

                membership = memberships.first()

                if membership:
                    user.active_membership = membership

                    user.save(
                        update_fields=[
                            "active_membership"
                        ]
                    )

            token, created = (
                Token.objects
                .get_or_create(
                    user=user
                )
            )

            print(
                "TOKEN:",
                token.key[:10]
            )

            response = {

                "token":
                token.key,

                "user":
                UserProfileSerializer(
                    user,
                    context={
                        "request": request
                    }
                ).data,

                "active_farm":
                (
                    user.current_farm.id
                    if user.current_farm
                    else None
                ),

                "farms": [
                    {
                        "id": m.farm.id,
                        "name": m.farm.name,
                        "role": m.role,

                        "permissions": {
                            "inventory": m.can_manage_inventory,
                            "finance": m.can_manage_finance,
                            "sales": m.can_manage_sales,
                            "staff": m.can_manage_staff,
                        }
                    }

                    for m in memberships
                ]
            }

            print("LOGIN RESPONSE OK")
            print("===============================\n")

            return Response(
                response,
                status=200
            )

        except Exception as e:

            print("\nLOGIN ERROR:")
            print(str(e))

            return Response(
                {
                    "error":
                    str(e)
                },
                status=500
            )

# =====================================================
# CHANGE PASSWORD
# =====================================================

class ChangePasswordView(
    APIView
):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def post(
        self,
        request
    ):

        user = request.user

        if not user.check_password(
            request.data.get(
                "old_password"
            )
        ):

            return Response(
                {
                    "error":
                    "Wrong password"
                },
                status=400
            )

        user.set_password(
            request.data.get(
                "new_password"
            )
        )

        user.save()

        update_session_auth_hash(
            request,
            user,
        )

        return Response({
            "message":
            "Password updated"
        })
