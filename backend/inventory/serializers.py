from rest_framework import serializers
from .models import InventoryItem
from drf_spectacular.utils import extend_schema_field

class InventoryItemSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()  

    class Meta:
        model = InventoryItem
        fields = ['id', 'name', 'category', 'quantity', 'unit', 'unit_price', 'min_stock_level', 'status', 'is_low_stock', 'updated_at']

    @extend_schema_field(serializers.CharField())
    def get_status(self, obj):
        if obj.quantity <= 0: return "OUT OF STOCK"
        if obj.quantity <= obj.min_stock_level: return "LOW STOCK"
        return "HEALTHY"
    
    @extend_schema_field(serializers.BooleanField())
    def get_is_low_stock(self, obj):
        return obj.quantity <= obj.min_stock_level