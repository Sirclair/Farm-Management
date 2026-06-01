from django.contrib import admin
from .models import InventoryItem, StockLog


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "farm",
        "current_level",
        "unit_of_measure",
        "cost_per_unit",
        "updated_at",
    )
    list_filter = ("category", "farm")
    search_fields = ("name",)


@admin.register(StockLog)
class StockLogAdmin(admin.ModelAdmin):
    list_display = ("item", "action", "quantity_changed", "timestamp")
    list_filter = ("action", "timestamp")
