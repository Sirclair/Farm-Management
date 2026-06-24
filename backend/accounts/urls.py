from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    LoginView,
    RegisterView,
    CreateFarmUserView,
    ChangePasswordView,
    ExploreFarmsView,
    FarmProductListView,
    FarmViewSet,
    RegisterView,
    SwitchFarmView,
    current_user,
)

router = DefaultRouter()
router.register(r"farms", FarmViewSet, basename="farm")

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("me/", current_user),
    path("register/", RegisterView.as_view()),
    path("staff-create/", CreateFarmUserView.as_view()),
    path("explore/", ExploreFarmsView.as_view()),
    path("change-password/", ChangePasswordView.as_view()),
    path("farms/<int:farm_id>/products/", FarmProductListView.as_view()),
    path("accounts/switch-farm/", SwitchFarmView.as_view()),
    path("", include(router.urls)),
]
