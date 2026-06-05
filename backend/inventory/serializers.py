from rest_framework import serializers
from .models import (
    InventoryItem,
    StockLog,
    Supplier,
    PurchaseOrder,
    PurchaseOrderItem,
    InventoryPurchase,
)


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = "__all__"
        read_only_fields = ["farm", "updated_at"]


class StockLogSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = StockLog
        fields = "__all__"
        read_only_fields = ["timestamp"]


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"
        read_only_fields = ["farm", "created_at"]


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    total = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrderItem
        fields = ["id", "item_name", "quantity", "unit_price", "total"]

    def get_total(self, obj):
        return obj.get_total()


class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = "__all__"
        read_only_fields = ["farm", "created_at", "updated_at"]


class InventoryPurchaseSerializer(serializers.ModelSerializer):
    inventory_item_name = serializers.CharField(source="inventory_item.name", read_only=True)

    class Meta:
        model = InventoryPurchase
        fields = "__all__"
        read_only_fields = ["farm", "created_at"]