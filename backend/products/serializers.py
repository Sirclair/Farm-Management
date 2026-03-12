from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    farm_name = serializers.ReadOnlyField(source='farm.name')
    location = serializers.ReadOnlyField(source='farm.address')
    country = serializers.ReadOnlyField(source='farm.country')
    currency = serializers.ReadOnlyField(source='farm.currency_code')

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'currency', 
            'stock_quantity', 'image', 'farm_name', 'location', 
            'country', 'category'
        ]