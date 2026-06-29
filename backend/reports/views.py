from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.utils import get_user_farm

from .services import (
    FarmReportService
)


@api_view(["GET"])
def reports_dashboard(request):

    farm = get_user_farm(
        request.user
    )

    report = (
        FarmReportService
        .generate(
            farm
        )
    )

    return Response(
        report
    )