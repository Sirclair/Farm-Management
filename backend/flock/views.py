from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from config.mixins import FarmQuerySetMixin
from .models import FlockBatch, DailyRecord
from .serializers import FlockBatchSerializer, DailyRecordSerializer

class FlockBatchViewSet(FarmQuerySetMixin, viewsets.ModelViewSet):
    queryset = FlockBatch.objects.all()
    serializer_class = FlockBatchSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        farm = self.get_user_farm()
        if not farm:
            raise PermissionDenied("User not linked to farm")
        serializer.save(farm=farm)

    @action(detail=True, methods=["get"])
    def download_report(self, request, pk=None):
        batch = self.get_object()
        return Response({
            "batch": batch.batch_number,
            "stock": batch.current_stock,
            "mortality": batch.total_mortality_count,
        })

class DailyRecordViewSet(FarmQuerySetMixin, viewsets.ModelViewSet):
    queryset = DailyRecord.objects.all()
    serializer_class = DailyRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Override for specific nested filtering
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return DailyRecord.objects.none()
        farm = self.get_user_farm()
        return DailyRecord.objects.filter(flock__farm=farm)

    def perform_create(self, serializer):
        flock = serializer.validated_data["flock"]
        farm = self.get_user_farm()
        if not farm or flock.farm != farm:
            raise PermissionDenied("Unauthorized access")
        serializer.save()