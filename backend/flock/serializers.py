from rest_framework import serializers
from .models import FlockBatch, DailyRecord, StockAdjustment


# =========================================================
# FLOCK BATCH SERIALIZER (SAFE MULTI-TENANT VERSION)
# =========================================================
class FlockBatchSerializer(serializers.ModelSerializer):
    current_stock = serializers.ReadOnlyField()
    total_mortality_count = serializers.ReadOnlyField()
    total_sold_count = serializers.ReadOnlyField()
    survival_rate = serializers.ReadOnlyField()
    age_in_weeks = serializers.ReadOnlyField()

    class Meta:
        model = FlockBatch

        fields = [
            "id",
            "name",
            "flock_type",
            "batch_number",
            "breed",
            "quantity_received",
            "acquisition_date",
            "status",
            "chick_cost",
            "selling_price_per_bird",
            "image",

            # derived fields
            "current_stock",
            "total_mortality_count",
            "total_sold_count",
            "survival_rate",
            "age_in_weeks",
        ]

        read_only_fields = [
            "batch_number",
        ]

    def validate(self, attrs):
        """
        Optional: enforce business rules here if needed
        (kept light to avoid over-coupling)
        """
        if attrs.get("quantity_received", 0) < 0:
            raise serializers.ValidationError("Quantity cannot be negative")
        return attrs


# =========================================================
# DAILY RECORD SERIALIZER
# =========================================================
class DailyRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyRecord
        fields = "__all__"

    def validate(self, attrs):
        if attrs.get("mortality", 0) < 0:
            raise serializers.ValidationError("Mortality cannot be negative")
        return attrs


# =========================================================
# STOCK ADJUSTMENT SERIALIZER
# =========================================================
class StockAdjustmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockAdjustment

        fields = "__all__"

        read_only_fields = [
            "created_by",
            "created_at",
            "stock_before",
            "stock_after",
            "approved",
            "approved_at",
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value