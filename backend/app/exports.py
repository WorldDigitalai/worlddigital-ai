"""PDF, Word and Excel files from the shared report layouts in products.py."""
from __future__ import annotations

import io
import re

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor, Inches
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .products import report_blocks, report_table, report_title

INK, BLUE, MUTED, LINE, BG = "0E1A2B", "0B4FA8", "4A5B70", "DCE5EF", "F4F8FC"

FORMATS = {
    "pdf": ("pdf", "application/pdf", "PDF"),
    "xlsx": ("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Excel"),
    "docx": ("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Word"),
}

# Emoji and other symbols the built-in PDF fonts can't draw.
_NON_LATIN = re.compile(r"[^\u0000-ɏ‐-‧‰-⁞€™]")


def _pdf_text(s: str) -> str:
    s = _NON_LATIN.sub("", str(s or ""))
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return s.replace("\n", "<br/>")


def build_pdf(job: dict) -> bytes:
    title = f"{report_title(job)} · {job['input']['domain']}"
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, leftMargin=0.7 * inch, rightMargin=0.7 * inch,
                            topMargin=0.95 * inch, bottomMargin=0.75 * inch, title=title, author="WorldDigital.ai")
    st = {
        "title": ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=colors.HexColor("#" + INK), spaceAfter=4),
        "subtitle": ParagraphStyle("s", fontName="Helvetica", fontSize=10.5, leading=14, textColor=colors.HexColor("#" + MUTED), spaceAfter=14),
        "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=colors.HexColor("#" + BLUE), spaceBefore=10, spaceAfter=4),
        "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15, spaceBefore=6, spaceAfter=2),
        "label": ParagraphStyle("l", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=colors.HexColor("#" + BLUE), spaceAfter=1),
        "p": ParagraphStyle("p", fontName="Helvetica", fontSize=10, leading=13.5, textColor=colors.HexColor("#" + INK), spaceAfter=8, alignment=TA_LEFT),
        "cell": ParagraphStyle("c", fontName="Helvetica", fontSize=8.5, leading=11),
        "head": ParagraphStyle("hd", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=colors.white),
    }
    story, pending_label = [], None
    for b in report_blocks(job):
        t = b["type"]
        if t == "table":
            weights = b["weights"]
            width = doc.width
            col_w = [width * w / sum(weights) for w in weights]
            data = [[Paragraph(_pdf_text(h), st["head"]) for h in b["headers"]]]
            data += [[Paragraph(_pdf_text(c), st["cell"]) for c in row] for row in b["rows"]]
            tbl = Table(data, colWidths=col_w, repeatRows=1)
            tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#" + BLUE)),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#" + BG)]),
                ("LINEBELOW", (0, 1), (-1, -1), 0.5, colors.HexColor("#" + LINE)),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            story += [tbl, Spacer(1, 12)]
        elif t == "label":
            pending_label = Paragraph(_pdf_text(b["text"]), st["label"])
        else:
            para = Paragraph(_pdf_text(b["text"]), st.get(t, st["p"]))
            if pending_label is not None:  # keep a field label with its text
                story.append(KeepTogether([pending_label, para]))
                pending_label = None
            else:
                story.append(para)

    def chrome(canvas, d):
        canvas.saveState()
        w, h = letter
        canvas.setFillColor(colors.HexColor("#" + BLUE))
        canvas.rect(0, h - 36, w, 36, stroke=0, fill=1)
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 11)
        canvas.drawString(0.7 * inch, h - 23, "WorldDigital.ai")
        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(w - 0.7 * inch, h - 23, _NON_LATIN.sub("", title))
        canvas.setFillColor(colors.HexColor("#" + MUTED))
        canvas.setFont("Helvetica", 8)
        canvas.drawCentredString(w / 2, 28, f"worlddigital.ai  ·  Page {d.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=chrome, onLaterPages=chrome)
    return buf.getvalue()


def _shade(cell, hex_fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill)
    tc_pr.append(shd)


def build_docx(job: dict) -> bytes:
    doc = Document()
    sec = doc.sections[0]
    if job["type"] == "keywords":
        sec.orientation = WD_ORIENT.LANDSCAPE
        sec.page_width, sec.page_height = sec.page_height, sec.page_width
    for side in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(sec, side, Inches(0.75))
    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(11)
    normal.font.color.rgb = RGBColor.from_string(INK)

    for b in report_blocks(job):
        t = b["type"]
        if t == "title":
            p = doc.add_heading(b["text"], level=0)
        elif t == "subtitle":
            p = doc.add_paragraph()
            r = p.add_run(b["text"])
            r.font.color.rgb = RGBColor.from_string(MUTED)
        elif t == "h1":
            p = doc.add_heading(b["text"], level=1)
        elif t == "h2":
            p = doc.add_heading(b["text"], level=2)
        elif t == "label":
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(b["text"])
            r.bold = True
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor.from_string(BLUE)
        elif t == "table":
            tbl = doc.add_table(rows=1, cols=len(b["headers"]))
            tbl.style = "Table Grid"
            total = sum(b["weights"])
            usable = sec.page_width - sec.left_margin - sec.right_margin
            for i, h in enumerate(b["headers"]):
                c = tbl.rows[0].cells[i]
                c.text = ""
                run = c.paragraphs[0].add_run(h)
                run.bold = True
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(255, 255, 255)
                _shade(c, BLUE)
            for row in b["rows"]:
                cells = tbl.add_row().cells
                for i, v in enumerate(row):
                    cells[i].text = ""
                    cells[i].paragraphs[0].add_run(str(v)).font.size = Pt(9.5)
            for row in tbl.rows:
                for i, c in enumerate(row.cells):
                    c.width = int(usable * b["weights"][i] / total)
            doc.add_paragraph()
        else:
            doc.add_paragraph(b["text"])
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def build_xlsx(job: dict) -> bytes:
    t = report_table(job)
    wb = Workbook()
    ws = wb.active
    ws.title = t["sheet"]
    ws["A1"] = t["title"]
    ws["A1"].font = Font(bold=True, size=16, color=INK)
    ws["A2"] = t["subtitle"]
    ws["A2"].font = Font(color=MUTED)
    head_fill = PatternFill("solid", fgColor=BLUE)
    line = Border(bottom=Side(style="thin", color=LINE))
    for c, h in enumerate(t["headers"], start=1):
        cell = ws.cell(row=4, column=c, value=h)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = head_fill
        cell.alignment = Alignment(vertical="center", wrap_text=True)
    for r, row in enumerate(t["rows"], start=5):
        for c, v in enumerate(row, start=1):
            cell = ws.cell(row=r, column=c, value=v if v != "" else None)
            if isinstance(v, str) and v.startswith("="):
                cell.data_type = "s"  # generated text, never a formula
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = line
            fmt = t["formats"][c - 1]
            if fmt and isinstance(v, (int, float)):
                cell.number_format = fmt
    for i, w in enumerate(t["widths"], start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A5"
    ws.auto_filter.ref = f"A4:{get_column_letter(len(t['headers']))}{4 + len(t['rows'])}"
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def build_file(job: dict, fmt: str) -> tuple[bytes, str, str]:
    """Return (bytes, filename, content_type)."""
    fmt = fmt if fmt in FORMATS else "pdf"
    data = {"pdf": build_pdf, "xlsx": build_xlsx, "docx": build_docx}[fmt](job)
    slug = ("keyword-research" if job["type"] == "keywords" else "content-pack") + "-" + \
        re.sub(r"[^a-z0-9]+", "-", job["input"]["domain"].lower()).strip("-")
    return data, f"{slug}.{FORMATS[fmt][0]}", FORMATS[fmt][1]
