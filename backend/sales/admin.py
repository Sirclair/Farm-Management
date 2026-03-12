from django.contrib import admin
from .models import Order, OrderItem, Customer

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1 # Shows one empty row for adding items
    # Removed readonly_fields so the model can receive the auto-calculated price

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_customer_name', 'farm', 'status', 'total_amount', 'created_at']
    list_filter = ['status', 'farm', 'created_at']
    inlines = [OrderItemInline]

    def get_customer_name(self, obj):
        if obj.user_customer:
            return f"User: {obj.user_customer.username}"
        if obj.manual_customer:
            return f"Manual: {obj.manual_customer.full_name}"
        return "Walk-in"
    
    get_customer_name.short_description = 'Customer'

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'farm', 'email', 'phone_number']
    search_fields = ['full_name', 'email']