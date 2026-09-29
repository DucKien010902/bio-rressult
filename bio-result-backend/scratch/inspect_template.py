import pymupdf
import sys

# Force utf-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open('templates/sample_hpv24.pdf')
page = doc[0]
H = page.rect.height
print(f'Page rect: {page.rect.width:.2f} x {H:.2f}')

blocks = page.get_text('blocks')
for b in blocks:
    text = b[4].strip().replace('\n', ' ')
    if text:
        # Note: in PyMuPDF, y0 is from top (0 at top, 842 at bottom)
        # In pdf-lib, Y is from bottom (0 at bottom, 842 at top)
        # pdf-lib Y = H - y1 (baseline roughly H - y1 + 2)
        pdflib_y = H - b[3]
        print(f"[{b[0]:.1f}, {b[1]:.1f}, {b[2]:.1f}, {b[3]:.1f}] (pdf-lib Y~{pdflib_y:.1f}) -> {text}")
