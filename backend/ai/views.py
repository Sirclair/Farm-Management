from decimal import Decimal
from datetime import timedelta
from io import BytesIO

from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum

from rest_framework.decorators import api_view
from rest_framework.response import Response

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4


from sales.models import Order
from finance.models import Expense
from flock.models import FlockBatch
from accounts.utils import get_user_farm

# =========================================================
# AI INSIGHTS
# =========================================================

@api_view(["GET"])
def ai_insights(request):

    farm = get_user_farm(request.user)

    if not farm:
        return Response(
            {
                "summary": {},
                "insights": [],
            },
            status=403,
        )

    # =====================================================
    # SALES
    # =====================================================

    orders = Order.objects.filter(farm=farm)

    total_revenue = (
        orders.aggregate(
            total=Sum("subtotal")
        )["total"]
        or Decimal("0.00")
    )

    total_paid = (
        orders.aggregate(
            total=Sum("total_paid")
        )["total"]
        or Decimal("0.00")
    )

    total_balance_due = (
        orders.aggregate(
            total=Sum("balance_due")
        )["total"]
        or Decimal("0.00")
    )

    total_orders = orders.count()

    # =====================================================
    # LAST 7 DAYS
    # =====================================================

    last_7_days = timezone.now() - timedelta(days=7)

    last_7_revenue = (
        orders.filter(
            created_at__gte=last_7_days
        ).aggregate(
            total=Sum("subtotal")
        )["total"]
        or Decimal("0.00")
    )

    # =====================================================
    # EXPENSES
    # =====================================================

    expenses = Expense.objects.filter(farm=farm)

    total_expenses = (
        expenses.aggregate(
            total=Sum("amount")
        )["total"]
        or Decimal("0.00")
    )

    feed_cost = (
        expenses.filter(
            category__icontains="feed"
        ).aggregate(
            total=Sum("amount")
        )["total"]
        or Decimal("0.00")
    )

    # =====================================================
    # FLOCKS
    # =====================================================

    batches = FlockBatch.objects.filter(farm=farm)

    total_birds = sum(
        batch.current_stock
        for batch in batches
    )

    total_mortality = sum(
        batch.total_mortality_count
        for batch in batches
    )

    # =====================================================
    # AI INSIGHTS
    # =====================================================

    insights = []

    for batch in batches:

        if batch.quantity_received <= 0:
            continue

        mortality_rate = (
            batch.total_mortality_count
            / batch.quantity_received
        ) * 100

        if mortality_rate >= 5:

            insights.append({
                "type": "risk",
                "message":
                f"{batch.name} mortality critical at {mortality_rate:.1f}%"
            })

        elif mortality_rate >= 2:

            insights.append({
                "type": "warning",
                "message":
                f"{batch.name} mortality increasing ({mortality_rate:.1f}%)"
            })

    if total_revenue > 0:

        insights.append({
            "type": "success",
            "message":
            f"Farm generated R{total_revenue}"
        })

    if total_balance_due > 0:

        insights.append({
            "type": "warning",
            "message":
            f"Outstanding customer balances total R{total_balance_due}"
        })

    if not insights:

        insights.append({
            "type": "success",
            "message":
            "Farm systems operating normally"
        })

    # =====================================================
    # RESPONSE
    # =====================================================

    return Response({
        "summary": {
            "total_revenue": total_revenue,
            "total_paid": total_paid,
            "balance_due": total_balance_due,
            "total_orders": total_orders,
            "last_7_revenue": last_7_revenue,
            "feed_cost": feed_cost,
            "birds_in_stock": total_birds,
            "mortality_total": total_mortality,
            "total_expenses": total_expenses,
            "net_profit": total_revenue - total_expenses,
        },
        "insights": insights,
    })


# =========================================================
# PDF REPORT
# =========================================================

@api_view(["GET"])
def download_ai_report(request):

    farm = get_user_farm(request.user)

    if not farm:
        return Response(
            {"error": "No active farm"},
            status=403,
        )

    # =====================================================
    # FETCH DATA
    # =====================================================

    orders = Order.objects.filter(farm=farm)

    expenses = Expense.objects.filter(farm=farm)

    batches = FlockBatch.objects.filter(farm=farm)

    total_revenue = (
        orders.aggregate(
            total=Sum("subtotal")
        )["total"]
        or Decimal("0.00")
    )

    total_paid = (
        orders.aggregate(
            total=Sum("total_paid")
        )["total"]
        or Decimal("0.00")
    )

    total_balance_due = (
        orders.aggregate(
            total=Sum("balance_due")
        )["total"]
        or Decimal("0.00")
    )

    total_expenses = (
        expenses.aggregate(
            total=Sum("amount")
        )["total"]
        or Decimal("0.00")
    )

    total_profit = (
        total_revenue - total_expenses
    )

    total_birds = sum(
        batch.current_stock
        for batch in batches
    )

    total_mortality = sum(
        batch.total_mortality_count
        for batch in batches
    )

    # =====================================================
    # PDF BUFFER
    # =====================================================

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=35,
        leftMargin=35,
        topMargin=40,
        bottomMargin=30,
    )

    styles = getSampleStyleSheet()

    elements = []

    # =====================================================
    # TITLE
    # =====================================================

    title = Paragraph(
        """
        <font color="white">
        <b>ZONKE FARMS</b><br/>
        AI PERFORMANCE REPORT
        </font>
        """,
        styles["Title"],
    )

    title_table = Table(
        [[title]],
        colWidths=[520],
    )

    title_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
            ("BOX", (0, 0), (-1, -1), 0, colors.white),
            ("LEFTPADDING", (0, 0), (-1, -1), 25),
            ("TOPPADDING", (0, 0), (-1, -1), 25),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 25),
        ])
    )

    elements.append(title_table)

    elements.append(Spacer(1, 25))

    # =====================================================
    # EXECUTIVE SUMMARY
    # =====================================================

    summary_title = Paragraph(
        '<font color="white"><b>EXECUTIVE SUMMARY</b></font>',
        styles["Heading2"],
    )

    summary_header = Table([[summary_title]], colWidths=[520])

    summary_header.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111827")),
            ("LEFTPADDING", (0, 0), (-1, -1), 15),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ])
    )

    elements.append(summary_header)

    summary_data = [
        ["Metric", "Value"],
        ["Total Revenue", f"R {total_revenue}"],
        ["Total Paid", f"R {total_paid}"],
        ["Outstanding Balance", f"R {total_balance_due}"],
        ["Total Expenses", f"R {total_expenses}"],
        ["Net Profit", f"R {total_profit}"],
        ["Orders Processed", str(orders.count())],
        ["Birds In Stock", str(total_birds)],
        ["Mortality Count", str(total_mortality)],
    ]

    summary_table = Table(
        summary_data,
        colWidths=[260, 260],
    )

    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.white),

            ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#334155")),

            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),

            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),

            ("TOPPADDING", (0, 1), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 10),
        ])
    )

    elements.append(summary_table)

    elements.append(Spacer(1, 25))

    # =====================================================
    # BATCH ANALYSIS
    # =====================================================

    batch_title = Paragraph(
        '<font color="white"><b>FLOCK ANALYSIS</b></font>',
        styles["Heading2"],
    )

    batch_header = Table([[batch_title]], colWidths=[520])

    batch_header.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111827")),
            ("LEFTPADDING", (0, 0), (-1, -1), 15),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ])
    )

    elements.append(batch_header)

    batch_data = [
        [
            "Batch",
            "Type",
            "Stock",
            "Mortality",
            "Survival %",
        ]
    ]

    for batch in batches:

        batch_data.append([
            batch.batch_number,
            batch.flock_type.upper(),
            str(batch.current_stock),
            str(batch.total_mortality_count),
            f"{batch.survival_rate}%",
        ])

    batch_table = Table(batch_data)

    batch_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#059669")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.white),

            ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#334155")),

            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),

            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ])
    )

    elements.append(batch_table)

    elements.append(Spacer(1, 25))

    # =====================================================
    # RECENT SALES
    # =====================================================

    sales_title = Paragraph(
        '<font color="white"><b>RECENT SALES</b></font>',
        styles["Heading2"],
    )

    sales_header = Table([[sales_title]], colWidths=[520])

    sales_header.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111827")),
            ("LEFTPADDING", (0, 0), (-1, -1), 15),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ])
    )

    elements.append(sales_header)

    sales_data = [
        [
            "Order",
            "Customer",
            "Subtotal",
            "Paid",
            "Balance",
            "Date",
        ]
    ]

    recent_orders = orders.order_by("-created_at")[:10]

    for order in recent_orders:

        customer = (
            order.customer.full_name
            if order.customer
            else "Walk-in"
        )

        sales_data.append([
            str(order.id),
            customer,
            f"R {order.subtotal}",
            f"R {order.total_paid}",
            f"R {order.balance_due}",
            order.created_at.strftime("%d %b %Y"),
        ])

    sales_table = Table(sales_data)

    sales_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7c3aed")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#111827")),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.white),

            ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#374151")),

            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),

            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ])
    )

    elements.append(sales_table)

    elements.append(Spacer(1, 30))

    # =====================================================
    # FOOTER
    # =====================================================

    footer = Paragraph(
        f"""
        <font color="#94a3b8">
        Generated automatically by Zonke Farms AI System<br/>
        {timezone.now().strftime('%d %B %Y %H:%M')}
        </font>
        """,
        styles["BodyText"],
    )

    elements.append(footer)

    # =====================================================
    # BUILD PDF
    # =====================================================

    doc.build(elements)

    pdf = buffer.getvalue()

    buffer.close()

    response = HttpResponse(
        content_type="application/pdf"
    )

    response[
        "Content-Disposition"
    ] = 'attachment; filename="zonke_ai_report.pdf"'

    response.write(pdf)

    return response