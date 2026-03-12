from rest_framework import serializers
from django.db import transaction
from .models import User, Farm, FarmMembership
from flock.models import FlockBatch


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
            "country",
            "currency_code",
            "timezone",
            "is_active_subscription",
            "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class FarmRegistrationSerializer(serializers.ModelSerializer):

    farm_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "farm_name"
        ]

    def create(self, validated_data):

        farm_name = validated_data.pop("farm_name", None)
        password = validated_data.pop("password")

        with transaction.atomic():

            user = User.objects.create_user(
                **validated_data,
                role="owner" if farm_name else "customer"
            )

            user.set_password(password)
            user.save()

            if farm_name:

                farm = Farm.objects.create(
                    name=farm_name,
                    owner_name=f"{user.first_name} {user.last_name}",
                    email=user.email
                )

                FarmMembership.objects.create(
                    user=user,
                    farm=farm,
                    role="owner"
                )

        return user


class UserProfileSerializer(serializers.ModelSerializer):

    farm = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "farm"
        ]

    def get_farm(self, obj):

        farm = obj.active_farm

        if farm:
            return FarmSerializer(farm).data

        return None


class PublicFarmSerializer(serializers.ModelSerializer):

    class Meta:
        model = Farm
        fields = ["id", "name", "address", "country", "currency_code"]


class PublicStockSerializer(serializers.ModelSerializer):

    class Meta:
        model = FlockBatch
        fields = [
            "id",
            "name",
            "batch_number",
            "current_stock",
            "age_in_weeks",
            "breed"
        ]