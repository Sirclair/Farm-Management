from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet,
    OrderViewSet,
    PaymentViewSet,
    PendingOrderViewSet,
    sales_analytics,
)

router = DefaultRouter()
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"payments", PaymentViewSet, basename="payment")
router.register(
    r"pending-orders",
    PendingOrderViewSet,
    basename="pending-orders"
)

urlpatterns = [
    path("", include(router.urls)),
    path("analytics/", sales_analytics, name="sales-analytics"),
]
