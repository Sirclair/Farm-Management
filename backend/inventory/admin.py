from django.contrib import admin
from .models import InventoryItem,StockLog  

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    # These columns will appear in the admin list view
    list_display = ('name', 'farm', 'category', 'quantity', 'unit', 'unit_price', 'updated_at')
    
    # This adds a filter sidebar on the right
    list_filter = ('category', 'farm')
    
    # This adds a search bar at the top
    search_fields = ('name', 'farm__name')

@admin.register(StockLog)
class StockLogAdmin(admin.ModelAdmin):
    list_display = ('item', 'action', 'quantity_changed', 'unit_price_at_time', 'timestamp')
    list_filter = ('action',)