from decimal import Decimal, InvalidOperation

from django.db import transaction

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    DailyRecord,
    FlockBatch,
    StockAdjustment,
)

from .serializers import (
    DailyRecordSerializer,
    FlockBatchSerializer,
    StockAdjustmentSerializer,
)

from inventory.models import InventoryItem, StockLog


# =========================================================
# FLOCK BATCH VIEWSET
# =========================================================
class FlockBatchViewSet(viewsets.ModelViewSet):
    serializer_class = FlockBatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = getattr(self.request.user, "active_farm", None)

        if not farm:
            return FlockBatch.objects.none()

        return FlockBatch.objects.filter(
            farm=farm
        ).order_by("-id")

    def perform_create(self, serializer):
        serializer.save(
            farm=self.request.user.active_farm
        )


# =========================================================
# DAILY RECORD VIEWSET
# =========================================================
class DailyRecordViewSet(viewsets.ModelViewSet):
    serializer_class = DailyRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = getattr(self.request.user, "active_farm", None)

        if not farm:
            return DailyRecord.objects.none()

        return DailyRecord.objects.filter(
            flock__farm=farm
        )

    def create(self, request, *args, **kwargs):
        farm = getattr(request.user, "active_farm", None)

        if not farm:
            return Response(
                {"error": "No active farm context detected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        flock_id = request.data.get("flock")
        record_date = request.data.get("date")

        # =====================================================
        # FEED PAYLOAD DETECTION
        # =====================================================
        is_feed_in_payload = "feed_used_kg" in request.data

        new_feed_used = Decimal("0.00")

        if is_feed_in_payload:
            try:
                raw_feed = request.data.get("feed_used_kg")

                if raw_feed not in [None, ""]:
                    new_feed_used = Decimal(str(raw_feed))

            except (InvalidOperation, ValueError, TypeError):
                return Response(
                    {
                        "error": (
                            "Invalid feed_used_kg "
                            "numeric format payload"
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            with transaction.atomic():

                # =====================================================
                # FEED INVENTORY
                # =====================================================
                feed_item = InventoryItem.objects.filter(
                    farm=farm,
                    category__iexact="feed"
                ).first()

                # =====================================================
                # EXISTING DAILY RECORD
                # =====================================================
                existing_record = DailyRecord.objects.filter(
                    flock_id=flock_id,
                    date=record_date
                ).first()

                # =====================================================
                # UPDATE EXISTING RECORD
                # =====================================================
                if existing_record:

                    old_feed_used = Decimal(
                        str(existing_record.feed_used_kg or 0)
                    )

                    if not is_feed_in_payload:
                        new_feed_used = old_feed_used

                    feed_difference = (
                        new_feed_used - old_feed_used
                    )

                    if feed_difference != 0:

                        if not feed_item:
                            return Response(
                                {
                                    "error": (
                                        "Inventory item not found. "
                                        "Please create a feed stock item."
                                    )
                                },
                                status=status.HTTP_400_BAD_REQUEST
                            )

                        if (
                            feed_difference > 0
                            and feed_item.current_level < feed_difference
                        ):
                            return Response(
                                {
                                    "error": (
                                        f"Insufficient feed stock. "
                                        f"Available: "
                                        f"{feed_item.current_level} "
                                        f"{feed_item.unit_of_measure}"
                                    )
                                },
                                status=status.HTTP_400_BAD_REQUEST
                            )

                        # =========================================
                        # UPDATE FEED STOCK
                        # =========================================
                        feed_item.current_level -= feed_difference

                        feed_item.save()

                        # =========================================
                        # STOCK LOG
                        # =========================================
                        StockLog.objects.create(
                            item=feed_item,
                            action=(
                                "use"
                                if feed_difference > 0
                                else "adj"
                            ),
                            quantity_changed=abs(feed_difference),
                            unit_price_at_time=(
                                feed_item.cost_per_unit
                            )
                        )

                    serializer = self.get_serializer(
                        existing_record,
                        data=request.data,
                        partial=True
                    )

                    serializer.is_valid(raise_exception=True)

                    serializer.save()

                    return Response(
                        serializer.data,
                        status=status.HTTP_200_OK
                    )

                # =====================================================
                # CREATE NEW RECORD
                # =====================================================
                else:

                    if new_feed_used > 0:

                        if not feed_item:
                            return Response(
                                {
                                    "error": (
                                        "Inventory item not found. "
                                        "Please create a feed stock item."
                                    )
                                },
                                status=status.HTTP_400_BAD_REQUEST
                            )

                        if (
                            feed_item.current_level
                            < new_feed_used
                        ):
                            return Response(
                                {
                                    "error": (
                                        f"Insufficient feed stock. "
                                        f"Available: "
                                        f"{feed_item.current_level} "
                                        f"{feed_item.unit_of_measure}"
                                    )
                                },
                                status=status.HTTP_400_BAD_REQUEST
                            )

                        # =========================================
                        # REDUCE FEED STOCK
                        # =========================================
                        feed_item.current_level -= new_feed_used

                        feed_item.save()

                        # =========================================
                        # STOCK LOG
                        # =========================================
                        StockLog.objects.create(
                            item=feed_item,
                            action="use",
                            quantity_changed=new_feed_used,
                            unit_price_at_time=(
                                feed_item.cost_per_unit
                            )
                        )

                    serializer = self.get_serializer(
                        data=request.data
                    )

                    serializer.is_valid(raise_exception=True)

                    serializer.save()

                    return Response(
                        serializer.data,
                        status=status.HTTP_201_CREATED
                    )

        except Exception as err:
            return Response(
                {
                    "error": (
                        "Transaction rejected by database "
                        f"logic engine: {str(err)}"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )


# =========================================================
# STOCK ADJUSTMENT VIEWSET
# =========================================================
class StockAdjustmentViewSet(viewsets.ModelViewSet):
    serializer_class = StockAdjustmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = getattr(self.request.user, "active_farm", None)

        if not farm:
            return StockAdjustment.objects.none()

        return StockAdjustment.objects.filter(
            flock__farm=farm
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user
        )

    def create(self, request, *args, **kwargs):

        flock_id = request.data.get("flock")
        quantity = int(request.data.get("quantity", 0))
        adjustment_type = request.data.get("adjustment_type")

        try:
            flock = FlockBatch.objects.get(
                id=flock_id,
                farm=request.user.active_farm
            )

        except FlockBatch.DoesNotExist:
            return Response(
                {"error": "Flock batch not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # =====================================================
        # SAFETY VALIDATION
        # =====================================================
        if adjustment_type == "remove":

            if quantity > flock.current_stock:

                return Response(
                    {
                        "error": (
                            f"Cannot remove {quantity} birds. "
                            f"Current stock is "
                            f"{flock.current_stock}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        serializer.save(
            created_by=request.user
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )