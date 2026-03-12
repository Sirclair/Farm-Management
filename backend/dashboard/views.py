# dashboard/views.py

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Sum

from accounts.models import FarmMembership
from flock.models import FlockBatch
from finance.models import Income, Expense


class FarmDashboardView(APIView):
    """
    API view to return the main dashboard KPIs for a farm.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        membership = FarmMembership.objects.filter(user=request.user).first()
        if not membership:
            return Response({"error": "User not assigned to a farm"})

        farm = membership.farm

        # Birds in stock
        birds = FlockBatch.objects.filter(farm=farm).aggregate(
            total=Sum("current_stock")
        )["total"] or 0

        # Total received
        total_received = FlockBatch.objects.filter(farm=farm).aggregate(
            total=Sum("quantity_received")
        )["total"] or 0

        # Total mortality
        total_mortality = sum(
            batch.total_mortality_count
            for batch in FlockBatch.objects.filter(farm=farm)
        )

        mortality_rate = 0
        if total_received > 0:
            mortality_rate = round((total_mortality / total_received) * 100, 2)

        # Income and expenses
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


@api_view(['GET'])
def farm_kpis(request):
    """
    Placeholder KPI endpoint.
    Can be expanded later with more detailed metrics.
    """
    return Response({
        "message": "Farm KPIs endpoint - define metrics here later"
    })