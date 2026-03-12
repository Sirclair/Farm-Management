from rest_framework import serializers
from .models import FlockBatch, DailyRecord

class DailyRecordSerializer(serializers.ModelSerializer):
    # We use PrimaryKeyRelatedField to ensure the ID sent from frontend 
    # is mapped to the 'flock' field in the model
    flock = serializers.PrimaryKeyRelatedField(queryset=FlockBatch.objects.all())

    class Meta:
        model = DailyRecord
        fields = ['id', 'flock', 'date', 'mortality', 'feed_used_kg']

class FlockBatchSerializer(serializers.ModelSerializer):
    total_mortality_count = serializers.ReadOnlyField()
    mortality_percentage = serializers.ReadOnlyField()
    total_sold_count = serializers.ReadOnlyField()

    class Meta:
        model = FlockBatch
        fields = [
            'id', 'name', 'batch_number', 'breed', 
            'quantity_received', 'current_stock', 'acquisition_date', 
            'status', 'chick_cost', 'feed_cost_total', 
            'selling_price_per_bird', 'total_mortality_count', 
            'mortality_percentage', 'total_sold_count'
        ]