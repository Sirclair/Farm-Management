from django.db import models
from accounts.models import Farm

class ProductCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Product Categories" 

class Product(models.Model):
    # Link to the specific Farm (Multi-tenancy)
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="products")
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Marketplace details
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Sale price in Rand")
    stock_quantity = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    image = models.ImageField(upload_to='products/', null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.farm.name} (R {self.price})"

# --- NEW: SAAS INVENTORY TRACKING ---
class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('med', 'Medication'), 
        ('vac', 'Vaccine'), 
        ('feed', 'Feed Additive')
    ]
    
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="inventory")
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)
    quantity_on_hand = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, default="liters") # e.g., bottles, kg, doses
    min_threshold = models.DecimalField(max_digits=10, decimal_places=2, help_text="Alert when stock hits this")

    @property
    def is_low(self):
        return self.quantity_on_hand <= self.min_threshold

    def __str__(self):
        return f"{self.name} ({self.quantity_on_hand} {self.unit})"