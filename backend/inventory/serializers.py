from rest_framework import serializers

from .models import (
    InventoryItem,
    StockLog,
    Supplier,
    PurchaseOrder,
    PurchaseOrderItem,
    InventoryPurchase,
)


# =========================
# INVENTORY ITEM
# =========================
class InventoryItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = InventoryItem

        fields = [
            "id",
            "farm",
            "name",
            "category",
            "current_level",
            "unit_of_measure",
            "cost_per_unit",
            "min_stock_level",
            "updated_at",
        ]

        read_only_fields = ["farm", "updated_at"]


# =========================
# STOCK LOG
# =========================
class StockLogSerializer(serializers.ModelSerializer):

    item_name = serializers.CharField(
        source="item.name",
        read_only=True
    )

    class Meta:
        model = StockLog

        fields = [
            "id",
            "item",
            "item_name",
            "action",
            "quantity_changed",
            "unit_price_at_time",
            "timestamp",
        ]

        read_only_fields = ["timestamp"]


# =========================
# SUPPLIER
# =========================
class SupplierSerializer(serializers.ModelSerializer):

    class Meta:
        model = Supplier

        fields = [
            "id",
            "farm",
            "name",
            "contact_person",
            "phone",
            "email",
            "is_active",
            "created_at",
        ]

        read_only_fields = ["farm", "created_at"]


# =========================
# PURCHASE ORDER ITEM
# =========================
class PurchaseOrderItemSerializer(serializers.ModelSerializer):

    total = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrderItem

        fields = [
            "id",
            "item_name",
            "quantity",
            "unit_price",
            "total",
        ]

    def get_total(self, obj):
        return obj.get_total()


# =========================
# PURCHASE ORDER
# =========================
class PurchaseOrderSerializer(serializers.ModelSerializer):

    items = PurchaseOrderItemSerializer(
        many=True,
        read_only=True
    )

    supplier_name = serializers.CharField(
        source="supplier.name",
        read_only=True
    )

    class Meta:
        model = PurchaseOrder

        fields = [
            "id",
            "farm",
            "supplier",
            "supplier_name",
            "reference",
            "status",
            "total_amount",
            "items",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "farm",
            "created_at",
            "updated_at",
        ]


# =========================
# INVENTORY PURCHASE
# =========================
class InventoryPurchaseSerializer(serializers.ModelSerializer):

    inventory_item_name = serializers.CharField(
        source="inventory_item.name",
        read_only=True
    )

    supplier_name = serializers.CharField(
        source="supplier.name",
        read_only=True
    )

    class Meta:
        model = InventoryPurchase

        fields = [
            "id",
            "farm",
            "supplier",
            "supplier_name",
            "inventory_item",
            "inventory_item_name",
            "quantity",
            "unit_price",
            "total_cost",
            "notes",
            "created_at",
        ]

        read_only_fields = [
            "farm",
            "created_at",
        ]