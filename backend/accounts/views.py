from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import update_session_auth_hash

from .models import Farm, User
from .serializers import (
    FarmRegistrationSerializer,
    FarmSerializer,
    UserProfileSerializer
)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):

    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)


class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = FarmRegistrationSerializer


class FarmViewSet(viewsets.ModelViewSet):

    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        return Farm.objects.filter(memberships__user=self.request.user)


class ChangePasswordView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):

        user = request.user

        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not user.check_password(old_password):

            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        update_session_auth_hash(request, user)

        return Response(
            {"message": "Password updated successfully."},
            status=status.HTTP_200_OK
        )