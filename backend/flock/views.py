from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import FlockBatch, DailyRecord
from .serializers import FlockBatchSerializer, DailyRecordSerializer
from accounts.models import FarmMembership


class FlockBatchViewSet(viewsets.ModelViewSet):

    serializer_class = FlockBatchSerializer
    permission_classes = [IsAuthenticated]

    def get_user_farm(self):

        membership = FarmMembership.objects.filter(
            user=self.request.user
        ).select_related("farm").first()

        return membership.farm if membership else None

    def get_queryset(self):

        farm = self.get_user_farm()

        if not farm:
            return FlockBatch.objects.none()

        return FlockBatch.objects.filter(farm=farm).order_by("-id")

    def perform_create(self, serializer):

        farm = self.get_user_farm()

        if not farm:
            raise serializers.ValidationError(
                {"error": "User not linked to farm"}
            )

        serializer.save(farm=farm)

    @action(detail=True, methods=["get"])

    def download_report(self, request, pk=None):

        batch = self.get_object()

        return Response(
            {
                "batch": batch.batch_number,
                "stock": batch.current_stock,
                "mortality": batch.total_mortality_count,
            }
        )


class DailyRecordViewSet(viewsets.ModelViewSet):

    serializer_class = DailyRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_user_farm(self):

        membership = FarmMembership.objects.filter(
            user=self.request.user
        ).select_related("farm").first()

        return membership.farm if membership else None

    def get_queryset(self):

        farm = self.get_user_farm()

        if not farm:
            return DailyRecord.objects.none()

        return DailyRecord.objects.filter(flock__farm=farm)

    def perform_create(self, serializer):

        flock = serializer.validated_data["flock"]

        farm = self.get_user_farm()

        if not farm or flock.farm != farm:
            raise PermissionDenied("Unauthorized access")

        serializer.save()