from decimal import Decimal, InvalidOperation
from django.db import transaction

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.utils import get_user_farm

from .models import FlockBatch, DailyRecord, StockAdjustment
from .serializers import (
    FlockBatchSerializer,
    DailyRecordSerializer,
    StockAdjustmentSerializer,
)

from inventory.models import InventoryItem, StockLog


class FlockBatchViewSet(viewsets.ModelViewSet):
    serializer_class = FlockBatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = get_user_farm(self.request.user)
        return FlockBatch.objects.filter(farm=farm).order_by("-id")

    def perform_create(self, serializer):
        farm = get_user_farm(self.request.user)
        serializer.save(farm=farm)


class DailyRecordViewSet(viewsets.ModelViewSet):
    serializer_class = DailyRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = get_user_farm(self.request.user)
        return DailyRecord.objects.filter(flock__farm=farm)

    def create(self, request, *args, **kwargs):
        farm = get_user_farm(request.user)

        flock_id = request.data.get("flock")

        try:
            flock = FlockBatch.objects.get(id=flock_id, farm=farm)
        except FlockBatch.DoesNotExist:
            return Response({"error": "Invalid flock"}, status=404)

        return super().create(request, *args, **kwargs)


class StockAdjustmentViewSet(viewsets.ModelViewSet):
    serializer_class = StockAdjustmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = get_user_farm(self.request.user)
        return StockAdjustment.objects.filter(flock__farm=farm)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        farm = get_user_farm(request.user)

        flock_id = request.data.get("flock")
        quantity = int(request.data.get("quantity", 0))
        adjustment_type = request.data.get("adjustment_type")

        try:
            flock = FlockBatch.objects.get(id=flock_id, farm=farm)
        except FlockBatch.DoesNotExist:
            return Response({"error": "Flock not found"}, status=404)

        if adjustment_type == "remove" and quantity > flock.current_stock:
            return Response(
                {"error": "Not enough stock"},
                status=400
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)

        return Response(serializer.data, status=201)