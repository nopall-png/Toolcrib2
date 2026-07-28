import fitz
doc = fitz.open('PT_Mattel_ToolCrib_Dataset.pdf')
text = doc[1].get_text()
text_flat = " ".join(text.split())
print(text_flat)
