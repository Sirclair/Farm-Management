from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ExpenseViewSet,
    IncomeViewSet,
    FinanceViewSet,
)

router = DefaultRouter()

# Finance
router.register(
    r"",
    FinanceViewSet,
    basename="finance"
)

# Expenses
router.register(
    r"expenses",
    ExpenseViewSet,
    basename="expense"
)

# Income
router.register(
    r"income",
    IncomeViewSet,
    basename="income"
)

urlpatterns = [
    path(
        "",
        include(router.urls)
    ),
]