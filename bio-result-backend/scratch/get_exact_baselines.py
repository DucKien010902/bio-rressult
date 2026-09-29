import sys
sys.stdout.reconfigure(encoding='utf-8')
import pymupdf

doc = pymupdf.open('templates/sample_hpv24.pdf')
page = doc[0]
rect = page.rect
d = page.get_text('dict')

print("Page dimensions:", rect.width, "x", rect.height)
print("=" * 60)
for b in d['blocks']:
    if 'lines' in b:
        for l in b['lines']:
            for s in l['spans']:
                text = s['text'].strip()
                if text:
                    pdf_baseline = rect.height - s['origin'][1]
                    bbox = s['bbox']
                    print(f"baseline={pdf_baseline:6.2f} | x_orig={s['origin'][0]:6.2f} | bbox_x=[{bbox[0]:6.2f}, {bbox[2]:6.2f}] | size={s['size']:4.1f} | \"{text}\"")
