from rest_framework import serializers
from .models import Order, OrderItem, Customer


class CustomerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Customer
        fields = "__all__"


class OrderItemSerializer(serializers.ModelSerializer):

    batch_name = serializers.ReadOnlyField(source="batch.name")

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "batch",
            "batch_name",
            "quantity",
            "price_at_sale",
        ]


class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(many=True, read_only=True)

    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order

        fields = [
            "id",
            "farm",
            "user_customer",
            "manual_customer",
            "customer_name",
            "status",
            "payment_method",
            "total_amount",
            "items",
            "created_at",
        ]

        read_only_fields = ["total_amount", "farm"]

    def get_customer_name(self, obj):

        if obj.user_customer:
            return obj.user_customer.get_full_name() or obj.user_customer.username

        if obj.manual_customer:
            return obj.manual_customer.full_name

        return "Walk-in"