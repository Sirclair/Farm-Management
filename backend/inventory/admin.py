from django.contrib import admin
from .models import InventoryItem, StockLog


# =========================
# INVENTORY ITEM ADMIN
# =========================
@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "category",
        "farm",
        "current_level",
        "inventory_unit",      # ✅ FIXED
        "purchase_unit",
        "conversion_factor",
        "cost_per_unit",
        "updated_at",
    )

    list_filter = (
        "category",
        "farm",
        "inventory_unit",
    )

    search_fields = (
        "name",
        "category",
    )


# =========================
# STOCK LOG ADMIN
# =========================
@admin.register(StockLog)
class StockLogAdmin(admin.ModelAdmin):

    list_display = (
        "item",
        "action",
        "quantity_changed",
        "unit_price_at_time",
        "timestamp",
    )

    list_filter = (
        "action",
        "timestamp",
    )