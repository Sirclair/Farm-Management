from django.contrib.auth import update_session_auth_hash
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
)

from flock.models import FlockBatch


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


class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Farm.objects.none()

        return Farm.objects.filter(memberships__user=self.request.user)


class ExploreFarmsView(generics.ListAPIView):
    queryset = Farm.objects.all()
    serializer_class = FarmSerializer
    permission_classes = [AllowAny]


class FarmProductListView(generics.ListAPIView):
    serializer_class = FarmProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return FlockBatch.objects.filter(
            farm_id=self.kwargs["farm_id"]
        ).order_by("-id")


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