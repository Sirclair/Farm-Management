from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from django.db import transaction

from rest_framework import serializers
from flock.models import FlockBatch

from .models import Farm, FarmMembership, User
from .utils import get_user_farm


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

    class Meta:
        model = User
        fields = ["username", "email", "password", "farm_name"]

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
                is_verified=True,
            )

            if farm_name:
                farm = Farm.objects.create(
                    name=farm_name,
                    owner_name=user.username,
                    email=user.email,
                )

                membership = FarmMembership.objects.create(
                    user=user,
                    farm=farm,
                    role="owner",
                )

                user.active_membership = membership
                user.save(update_fields=["active_membership"])

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    farm = serializers.SerializerMethodField()
    farm_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "is_verified",
            "role",
            "farm",
            "farm_name",
        ]

    def get_farm(self, obj):
        farm = get_user_farm(obj)
        return FarmSerializer(farm).data if farm else None

    def get_farm_name(self, obj):
        farm = get_user_farm(obj)
        return farm.name if farm else "No Farm"
    
class FarmProductSerializer(serializers.ModelSerializer):

    current_stock = serializers.ReadOnlyField()
    age_in_weeks = serializers.ReadOnlyField()
    survival_rate = serializers.ReadOnlyField()

    class Meta:
        model = FlockBatch

        fields = [
            "id",
            "name",
            "batch_number",
            "flock_type",
            "breed",
            "quantity_received",
            "current_stock",
            "survival_rate",
            "age_in_weeks",
            "selling_price_per_bird",
            "image",
            "status",
            "acquisition_date",
        ]