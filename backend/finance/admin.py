from django.contrib import admin
from .models import Expense, Income

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['date', 'category', 'amount', 'farm']
    list_filter = ['category', 'date', 'farm']
    search_fields = ['description', 'category']

@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ['date', 'source', 'amount', 'farm']
    list_filter = ['source', 'date', 'farm']
    search_fields = ['source']