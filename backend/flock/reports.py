from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from io import BytesIO
from datetime import date

def generate_batch_pdf(batch):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Title
    title = Paragraph(f"<font size=20 color='#0f172a'><b>BATCH PERFORMANCE REPORT</b></font>", styles['Title'])
    elements.append(title)
    elements.append(Paragraph(f"<b>Batch No:</b> {batch.batch_number}", styles['Normal']))
    elements.append(Paragraph(f"<b>Name:</b> {batch.name}", styles['Normal']))
    elements.append(Paragraph(f"<b>Date Generated:</b> {date.today()}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Stats Table
    data = [
        ['Metric', 'Value'],
        ['Quantity Received', f"{batch.quantity_received} Birds"],
        ['Current Stock', f"{batch.current_stock} Birds"],
        ['Age', f"{batch.age_in_weeks} Weeks"],
        ['Status', batch.status.upper()],
    ]
    
    t = Table(data, colWidths=[200, 200])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.hexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(t)
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("<i>Authorized by Zonke Farms Intelligence.</i>", styles['Italic']))

    doc.build(elements)
    buffer.seek(0)
    return buffer