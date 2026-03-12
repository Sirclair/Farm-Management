from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Sum
from drf_spectacular.utils import extend_schema

from accounts.models import FarmMembership
from flock.models import FlockBatch
from finance.models import Income, Expense

@extend_schema(responses={200: dict})
class FarmDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Guard clause for deployment check/swagger
        if getattr(self, "swagger_fake_view", False):
            return Response({})

        membership = FarmMembership.objects.filter(user=request.user).first()
        if not membership:
            return Response({"error": "User not assigned to a farm"})

        farm = membership.farm

        birds = FlockBatch.objects.filter(farm=farm).aggregate(
            total=Sum("current_stock")
        )["total"] or 0

        total_received = FlockBatch.objects.filter(farm=farm).aggregate(
            total=Sum("quantity_received")
        )["total"] or 0

        total_mortality = sum(
            batch.total_mortality_count
            for batch in FlockBatch.objects.filter(farm=farm)
        )

        mortality_rate = 0
        if total_received > 0:
            mortality_rate = round((total_mortality / total_received) * 100, 2)

        income = Income.objects.filter(farm=farm).aggregate(
            total=Sum("amount")
        )["total"] or 0

        expenses = Expense.objects.filter(farm=farm).aggregate(
            total=Sum("amount")
        )["total"] or 0

        profit = income - expenses

        return Response({
            "birds_in_stock": birds,
            "mortality_rate": mortality_rate,
            "total_income": income,
            "total_expenses": expenses,
            "profit": profit
        })

@extend_schema(responses={200: dict})
@api_view(['GET'])
def farm_kpis(request):
    return Response({
        "message": "Farm KPIs endpoint - define metrics here later"
    })