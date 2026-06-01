from rest_framework import serializers
from .models import FlockBatch, DailyRecord, StockAdjustment


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
            "farm",
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
            "current_stock",
            "total_mortality_count",
            "total_sold_count",
            "survival_rate",
            "age_in_weeks",
        ]
        read_only_fields = [
            "farm",
            "batch_number",
        ]


class DailyRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyRecord
        fields = "__all__"

class StockAdjustmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = StockAdjustment
        fields = "__all__"
        read_only_fields = [
            "created_by",
            "created_at",
        ]