from rest_framework import serializers
from .models import FlockBatch, DailyRecord

class DailyRecordSerializer(serializers.ModelSerializer):
    flock = serializers.PrimaryKeyRelatedField(queryset=FlockBatch.objects.all())

    class Meta:
        model = DailyRecord
        fields = ['id', 'flock', 'date', 'mortality', 'feed_used_kg']

    def validate(self, data):
        """
        Logic: Ensure mortality doesn't exceed the birds currently alive.
        """
        flock = data['flock']
        mortality = data.get('mortality', 0)
        
        # We access current_stock directly from the FlockBatch instance
        if mortality > flock.current_stock:
            raise serializers.ValidationError({
                "error": f"Mortality ({mortality}) cannot exceed current stock ({flock.current_stock})."
            })
            
        return data

class FlockBatchSerializer(serializers.ModelSerializer):
    # These remain read_only as they are calculated properties in your Model
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
