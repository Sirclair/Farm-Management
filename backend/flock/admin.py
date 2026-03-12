from django.contrib import admin
from .models import FlockBatch, DailyRecord


@admin.register(FlockBatch)
class FlockBatchAdmin(admin.ModelAdmin):
    list_display = [
        "batch_number",
        "name",
        "quantity_received",
        "current_stock",
        "status",
        "farm",
    ]
    search_fields = ["batch_number", "name"]


@admin.register(DailyRecord)
class DailyRecordAdmin(admin.ModelAdmin):
    list_display = ["flock", "date", "mortality", "feed_used_kg"]
    list_filter = ["date", "flock"]