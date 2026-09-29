import pymupdf

doc = pymupdf.open('templates/sample_hpv24.pdf')
page = doc[0]
paths = page.get_drawings()
print(f'Total drawings: {len(paths)}')

# Let's inspect rects in drawings
rects = [p['rect'] for p in paths if 'rect' in p]
for r in rects:
    # check if r is in the results table region (y0 between 270 and 380)
    if 270 <= r.y0 <= 385:
        print(f"Drawing rect: [{r.x0:.1f}, {r.y0:.1f}, {r.x1:.1f}, {r.y1:.1f}] -> pdf-lib X: {r.x0:.1f} to {r.x1:.1f}, Y: {842.04 - r.y1:.1f} to {842.04 - r.y0:.1f}")
