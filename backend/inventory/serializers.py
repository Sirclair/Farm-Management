# inventory/serializers.py
from rest_framework import serializers
from .models import InventoryItem

class InventoryItemSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()  

    class Meta:
        model = InventoryItem
        # Include unit_price in the fields list
        fields = ['id', 'name', 'category', 'quantity', 'unit', 'unit_price', 'min_stock_level', 'status', 'is_low_stock', 'updated_at']

    def get_status(self, obj):
        if obj.quantity <= 0: return "OUT OF STOCK"
        if obj.quantity <= obj.min_stock_level: return "LOW STOCK"
        return "HEALTHY"
    
    def get_is_low_stock(self, obj):
        return obj.quantity <= obj.min_stock_level