import pymupdf

doc = pymupdf.open('templates/sample_hpv24.pdf')
page = doc[0]
paths = page.get_drawings()

# inspect drawings in patient table region (y0 between 130 and 265 in PyMuPDF)
for p in paths:
    r = p['rect']
    if 130 <= r.y0 <= 270:
        print(f"Patient table line: [{r.x0:.1f}, {r.y0:.1f}, {r.x1:.1f}, {r.y1:.1f}] -> pdf-lib X: {r.x0:.1f}-{r.x1:.1f}, Y: {842.04 - r.y1:.1f}-{842.04 - r.y0:.1f}")
