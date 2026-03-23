from rest_framework import serializers
from .models import FlockBatch, DailyRecord

class DailyRecordSerializer(serializers.ModelSerializer):
    flock = serializers.PrimaryKeyRelatedField(queryset=FlockBatch.objects.all())

    class Meta:
        model = DailyRecord
        fields = ['id', 'flock', 'date', 'mortality', 'feed_used_kg']

    def validate(self, data):
        flock = data['flock']
        date = data.get('date')
        mortality = data.get('mortality', 0)

        # 1. Check for Duplicate Daily Records
        if DailyRecord.objects.filter(flock=flock, date=date).exists():
            raise serializers.ValidationError({
                "error": f"A record for {flock.batch_number} already exists for {date}."
            })

        # 2. Check Mortality vs. Physical Stock
        if mortality > flock.current_stock:
            raise serializers.ValidationError({
                "error": f"Mortality ({mortality}) cannot exceed current stock ({flock.current_stock})."
            })
            
        return data

class FlockBatchSerializer(serializers.ModelSerializer):
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
