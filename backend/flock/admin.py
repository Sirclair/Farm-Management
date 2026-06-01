from django.contrib import admin
from .models import FlockBatch, DailyRecord


@admin.register(FlockBatch)
class FlockBatchAdmin(admin.ModelAdmin):
    list_display = [
        "batch_number",
        "name",
        "quantity_received",
        "status",
        "farm",
    ]
    search_fields = ["batch_number", "name"]
    ordering = ["-id"]


@admin.register(DailyRecord)
class DailyRecordAdmin(admin.ModelAdmin):
    list_display = ["flock", "date", "mortality", "feed_used_kg"]
    list_filter = ["date", "flock"]
