import pymupdf
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open('templates/sample_hpv24.pdf')
page = doc[0]
H = page.rect.height

# Extract words with rects
words = page.get_text('words')
# word tuple: (x0, y0, x1, y1, word, block_no, line_no, word_no)
for w in words:
    pdflib_y = H - w[3] # pdf-lib bottom of text
    # print word and its rect
    if any(k in w[4] for k in ['bệnh', 'Họ', 'Năm', 'Giới', 'Địa', 'Điện', 'chỉ', 'Đơn', 'Loại', 'nhận', 'trả', 'Phương', 'Hà', 'BÁC', 'KẾT']):
        print(f"'{w[4]}': x0={w[0]:.1f}, x1={w[1]:.1f}, y0={w[1]:.1f}, y1={w[3]:.1f} -> baseline pdf-lib Y ~ {pdflib_y+1.5:.1f}")
