from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from django.db import transaction
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from flock.models import FlockBatch
from .models import Farm, FarmMembership, User


class FarmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = [
            "id",
            "name",
            "owner_name",
            "email",
            "phone",
            "address",
            "is_active_subscription",
        ]


class FarmRegistrationSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "farm_name",
        ]

    def validate_password(self, value):
        try:
            validate_password(value)
        except exceptions.ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        farm_name = validated_data.pop("farm_name", None)
        password = validated_data.pop("password")

        with transaction.atomic():
            user = User.objects.create_user(
                **validated_data,
                password=password,
                role="owner" if farm_name else "customer",
                is_verified=True,  # Auto-verify for simplicity; adjust as needed   
            )

            if farm_name:
                farm = Farm.objects.create(
                    name=farm_name,
                    owner_name=user.username,
                    email=user.email,
                )
                FarmMembership.objects.create(user=user, farm=farm, role="owner")

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    farm = serializers.SerializerMethodField()
    farm_name = serializers.SerializerMethodField()  # Add this field

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_verified",
            "first_name",
            "last_name",
            "role",
            "farm",
            "farm_name",  # Expose it to the frontend context
        ]

    def get_farm(self, obj):
        farm = obj.active_farm
        return FarmSerializer(farm).data if farm else None

    # Safe fallback lookup method
    def get_farm_name(self, obj):
        farm = obj.active_farm
        return farm.name if farm else "Zonke Farms"

class FarmProductSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="name")
    quantity = serializers.SerializerMethodField()
    price = serializers.DecimalField(
        source="selling_price_per_bird", max_digits=10, decimal_places=2
    )

    class Meta:
        model = FlockBatch
        fields = [
            "id",
            "product_name",
            "quantity",
            "breed",
            "price",
            "image",
        ]

    def get_quantity(self, obj):
        return obj.current_stock
