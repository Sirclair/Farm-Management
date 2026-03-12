from rest_framework import serializers
from .models import FlockBatch, DailyRecord
from drf_spectacular.utils import extend_schema_field

class DailyRecordSerializer(serializers.ModelSerializer):
    flock = serializers.PrimaryKeyRelatedField(queryset=FlockBatch.objects.all())

    class Meta:
        model = DailyRecord
        fields = ['id', 'flock', 'date', 'mortality', 'feed_used_kg']

class FlockBatchSerializer(serializers.ModelSerializer):
    # Apply the decorator to the field definitions or use SerializerMethodField
    total_mortality_count = serializers.IntegerField(read_only=True)
    total_sold_count = serializers.IntegerField(read_only=True)
    mortality_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = FlockBatch
        fields = [
            'id', 'name', 'batch_number', 'breed', 
            'quantity_received', 'current_stock', 'acquisition_date', 
            'status', 'chick_cost', 'feed_cost_total', 
            'selling_price_per_bird', 'total_mortality_count', 
            'mortality_percentage', 'total_sold_count'
        ]