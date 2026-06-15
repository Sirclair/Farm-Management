from rest_framework import serializers

from .models import (
    InventoryItem,
    StockLog,
    Supplier,
    PurchaseOrder,
    PurchaseOrderItem,
    InventoryPurchase,
)


# ==================================================
# INVENTORY ITEM
# ==================================================
class InventoryItemSerializer(serializers.ModelSerializer):

    stock_display = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem

        fields = [
            "id",

            "farm",

            "name",
            "category",

            # STOCK
            "current_level",
            "inventory_unit",

            # PURCHASE
            "purchase_unit",
            "conversion_factor",

            # COST
            "cost_per_unit",
            "min_stock_level",

            # DISPLAY
            "stock_display",

            "updated_at",
        ]

        read_only_fields = [
            "farm",
            "updated_at",
            "stock_display",
        ]

    def get_stock_display(self, obj):
        return (
            f"{obj.current_level} "
            f"{obj.inventory_unit}"
        )


# ==================================================
# STOCK LOG
# ==================================================
class StockLogSerializer(serializers.ModelSerializer):

    item_name = serializers.CharField(
        source="item.name",
        read_only=True,
    )

    inventory_unit = serializers.CharField(
        source="item.inventory_unit",
        read_only=True,
    )

    class Meta:
        model = StockLog

        fields = [
            "id",

            "item",
            "item_name",

            "action",

            "quantity_changed",

            "inventory_unit",

            "unit_price_at_time",

            "timestamp",
        ]

        read_only_fields = [
            "timestamp",
        ]


# ==================================================
# SUPPLIER
# ==================================================
class SupplierSerializer(serializers.ModelSerializer):

    class Meta:
        model = Supplier

        fields = "__all__"

        read_only_fields = [
            "farm",
            "created_at",
        ]


# ==================================================
# PURCHASE ORDER ITEM
# ==================================================
class PurchaseOrderItemSerializer(
    serializers.ModelSerializer
):

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


# ==================================================
# PURCHASE ORDER
# ==================================================
class PurchaseOrderSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = PurchaseOrder

        fields = "__all__"

        read_only_fields = [
            "farm",
            "created_at",
            "updated_at",
        ]


# ==================================================
# INVENTORY PURCHASE
# ==================================================
class InventoryPurchaseSerializer(
    serializers.ModelSerializer
):

    inventory_item_name = serializers.CharField(
        source="inventory_item.name",
        read_only=True,
    )

    inventory_unit = serializers.CharField(
        source="inventory_item.inventory_unit",
        read_only=True,
    )

    purchase_unit = serializers.CharField(
        source="inventory_item.purchase_unit",
        read_only=True,
    )

    class Meta:
        model = InventoryPurchase

        fields = [
            "id",

            "farm",

            "supplier",

            "inventory_item",

            "inventory_item_name",

            "quantity",

            "inventory_unit",

            "purchase_unit",

            "unit_price",

            "total_cost",

            "notes",

            "created_at",
        ]

        read_only_fields = [
            "farm",
            "created_at",
        ]