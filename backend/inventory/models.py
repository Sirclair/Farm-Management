from django.db import models

class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('feed', 'Feed'),
        ('medicine', 'Medicine'),
        ('equipment', 'Equipment'),
        ('other', 'Other'),
    ]

    farm = models.ForeignKey('accounts.Farm', on_delete=models.CASCADE, related_name='inventory_items')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='feed')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, help_text="Weight in KG or unit count")
    unit = models.CharField(max_length=50, default='KG')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) 
    min_stock_level = models.DecimalField(max_digits=10, decimal_places=2, default=10.0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # One farm cannot have two separate items with the same name.
        unique_together = ('name', 'farm')

    def __str__(self):
        return f"{self.name} ({self.quantity}{self.unit})"

class StockLog(models.Model):
    ACTION_CHOICES = [('add', 'Restock'), ('remove', 'Usage')]
    
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, default='add')
    quantity_changed = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price_at_time = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.item.name} - {self.action} {self.quantity_changed}"