#from django.conf import settings
from django.contrib.auth import update_session_auth_hash
#from django.core.mail import send_mail
from django.utils import timezone

from accounts.utils import get_user_farm

from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Farm, User
from .serializers import (
    FarmProductSerializer,
    FarmRegistrationSerializer,
    FarmSerializer,
    UserProfileSerializer,
)

from flock.models import FlockBatch

# ---------------- OTP ----------------


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")

        if not email or not code:
            return Response({"error": "Email and code required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if user.otp_code != code:
            return Response({"error": "Invalid code"}, status=400)

        if user.otp_expiry and timezone.now() > user.otp_expiry:
            return Response({"error": "Code expired"}, status=400)

        user.is_verified = True
        user.otp_code = None
        user.save()

        return Response({"message": "Verified"})


# ---------------- AUTH ----------------


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = FarmRegistrationSerializer
    permission_classes = [AllowAny]
        
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
    })

# ---------------- FARMS ----------------


class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if getattr(self, "swagger_fake_view", False):
            return Farm.objects.none()

        return Farm.objects.filter(memberships__user=user)


class ExploreFarmsView(generics.ListAPIView):
    queryset = Farm.objects.all()
    serializer_class = FarmSerializer
    permission_classes = [AllowAny]


# ---------------- PRODUCTS ----------------


class FarmProductListView(generics.ListAPIView):
    serializer_class = FarmProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return FlockBatch.objects.filter(farm_id=self.kwargs["farm_id"]).order_by("-id")


# ---------------- PASSWORD ----------------


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        if not user.check_password(request.data.get("old_password")):
            return Response({"error": "Wrong password"}, status=400)

        user.set_password(request.data.get("new_password"))
        user.save()
        update_session_auth_hash(request, user)

        return Response({"message": "Password updated"})
