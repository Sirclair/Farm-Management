from rest_framework import serializers
from .models import Product, ProductCategory, InventoryItem


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    # This adds the category name to the response for easier reading on the frontend
    category_name = serializers.ReadOnlyField(source="category.name")

    class Meta:
        model = Product

        fields = [
            "id",
            "farm",
            "category",
            "category_name",
            "name",
            "description",
            "product_type",
            "live_type",
            "selling_unit",
            "price",
            "cost",
            "stock_quantity",
            "bulk_quantity",
            "bulk_price",
            "is_active",
        ]
        # We make farm read-only because we set it automatically in the view
        read_only_fields = ["farm"]


class InventoryItemSerializer(serializers.ModelSerializer):
    # This exposes the @property logic we wrote in models.py
    is_low = serializers.ReadOnlyField()

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "farm",
            "name",
            "category",
            "quantity_on_hand",
            "unit",
            "min_threshold",
            "is_low",
        ]
        read_only_fields = ["farm"]
