from django.contrib import admin

from .models import (
    Customer,
    Order,
    OrderItem,
    Payment,
    PendingOrder,
    PendingOrderItem,
    PendingOrderFulfillment,
)


# =========================================================
# CUSTOMER
# =========================================================

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "full_name",
        "phone",
        "email",
        "created_at",
    )

    search_fields = (
        "full_name",
        "phone",
        "email",
    )


# =========================================================
# ORDER ITEM INLINE
# =========================================================

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


# =========================================================
# PAYMENT INLINE
# =========================================================

class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


# =========================================================
# ORDER
# =========================================================

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "customer",
        "created_at",
    )

    list_filter = (
        "created_at",
    )

    search_fields = (
        "customer__full_name",
    )

    inlines = [
        OrderItemInline,
        PaymentInline,
    ]


# =========================================================
# ORDER ITEM
# =========================================================

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "order",
        "product",
        "batch",
        "quantity",
        "price_per_unit",
        "created_at",
    )

    list_filter = (
        "created_at",
    )


# =========================================================
# PAYMENT
# =========================================================

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "order",
        "amount",
        "method",
        "created_at",
    )

    list_filter = (
        "method",
        "created_at",
    )


# =========================================================
# PENDING ORDER ITEM INLINE
# =========================================================

class PendingOrderItemInline(admin.TabularInline):
    model = PendingOrderItem
    extra = 0


# =========================================================
# PENDING ORDER
# =========================================================

@admin.register(PendingOrder)
class PendingOrderAdmin(admin.ModelAdmin):

    list_display = (
        "order_number",
        "customer",
        "status",
        "expected_delivery_date",
        "total_amount",
        "deposit_paid",
        "balance_due",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "order_number",
        "customer__full_name",
    )

    inlines = [
        PendingOrderItemInline,
    ]


# =========================================================
# PENDING ORDER ITEM
# =========================================================

@admin.register(PendingOrderItem)
class PendingOrderItemAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "pending_order",
        "product",
        "batch",
        "quantity_ordered",
        "unit_price",
    )


# =========================================================
# PENDING ORDER FULFILLMENT
# =========================================================

@admin.register(PendingOrderFulfillment)
class PendingOrderFulfillmentAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "pending_order_item",
        "quantity_delivered",
        "delivered_at",
    )