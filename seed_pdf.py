import fitz  # PyMuPDF
import re
import json
from supabase import create_client, Client
import os

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://fovpausfzcjqhznlngfo.supabase.co")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvdnBhdXNmemNqcWh6bmxuZ2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNTI4MjMsImV4cCI6MjEwMDcyODgyM30.mTliZ9LsUZqG302LLr2d9_duHuVRMStBCIrgIZv4aiA")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Hapus data sampah yang terlanjur masuk sebelumnya
print("Membersihkan data sebelumnya...")
try:
    # Delete where category is empty or bad data
    res = supabase.table('tools').select('id, code').execute()
    for row in res.data:
        # We delete all tools to start fresh from PDF
        supabase.table('tools').delete().eq('id', row['id']).execute()
except Exception as e:
    print("Gagal menghapus:", e)

doc = fitz.open('PT_Mattel_ToolCrib_Dataset.pdf')
tools = []

# Mulai dari halaman 1 (lewat halaman 0 yg merupakan cover)
for i in range(1, len(doc)-1):
    text = doc[i].get_text()
    text_flat = " ".join(text.split())
    
    sku_match = re.search(r'SKU\s+(BRG-[A-Z]+-\d+)', text_flat)
    if not sku_match: 
        continue
    sku = sku_match.group(1)
    
    name_match = re.search(r'Item Name\s+(.*?)\s+Brand', text_flat)
    name = name_match.group(1).strip() if name_match else ""
    
    category_match = re.search(r'Category\s+([A-Z]+)\s+Subcategory', text_flat)
    category = category_match.group(1).strip() if category_match else ""
    
    stock_match = re.search(r'Stock Quantity\s+(\d+)', text_flat)
    stock = int(stock_match.group(1)) if stock_match else 0
    
    min_match = re.search(r'Minimum Stock\s+(\d+)', text_flat)
    min_stock = int(min_match.group(1)) if min_match else 0
    
    max_match = re.search(r'Maximum Stock\s+(\d+)', text_flat)
    max_stock = int(max_match.group(1)) if max_match else 0
    
    unit_match = re.search(r'Unit\s+(\w+)\s+Stock', text_flat)
    unit = unit_match.group(1).strip() if unit_match else "PCS"
    
    rack_match = re.search(r'Rack\s+(R-\d+)', text_flat)
    rack = rack_match.group(1).strip() if rack_match else ""
    
    bin_match = re.search(r'Bin\s+(B-\d+)', text_flat)
    bin_val = bin_match.group(1).strip() if bin_match else ""
    location = f"Rack {rack} Bin {bin_val}" if rack and bin_val else ""
    
    desc_match = re.search(r'Technical Description\s+(.*)', text_flat)
    desc = desc_match.group(1).strip() if desc_match else ""
    
    brand_match = re.search(r'Brand\s+(.*?)\s+Model', text_flat)
    brand = brand_match.group(1).strip() if brand_match else ""
    
    model_match = re.search(r'Model\s+(.*?)\s+Part Number', text_flat)
    model = model_match.group(1).strip() if model_match else ""
    
    part_match = re.search(r'Part Number\s+(.*?)\s+Technical Specification', text_flat)
    part_number = part_match.group(1).strip() if part_match else ""
    
    tech_spec_match = re.search(r'Technical Specification\s+(.*?)\s+Material', text_flat)
    tech_spec = tech_spec_match.group(1).strip() if tech_spec_match else ""
    
    mat_match = re.search(r'Material\s+(.*?)\s+Dimension', text_flat)
    material = mat_match.group(1).strip() if mat_match else ""
    
    dim_match = re.search(r'Dimension\s+(.*?)\s+Weight', text_flat)
    dimension = dim_match.group(1).strip() if dim_match else ""
    
    weight_match = re.search(r'Weight\s+(.*?)\s+(?:Technical Description|$)', text_flat)
    weight = weight_match.group(1).strip() if weight_match else ""
    
    technical_specs = {
        "brand": brand,
        "model": model,
        "part_number": part_number,
        "technical_specification": tech_spec,
        "material": material,
        "dimension": dimension,
        "weight": weight
    }
    
    tools.append({
        'code': sku,
        'name': name,
        'category': category,
        'stock': stock,
        'min_stock': min_stock,
        'max_stock': max_stock,
        'unit': unit,
        'location': location,
        'description': desc,
        'technical_specs': technical_specs
    })

print(f"Mengekstrak {len(tools)} alat ukur secara akurat.")

if tools:
    print("Menyimpan ke Supabase...")
    chunk_size = 50
    success = 0
    for i in range(0, len(tools), chunk_size):
        chunk = tools[i:i+chunk_size]
        supabase.table('tools').upsert(chunk, on_conflict='code').execute()
        success += len(chunk)
        print(f"[{success}/{len(tools)}] Berhasil disisipkan.")
    print("Selesai! 🎉 Semua data bersih dan rapi. Cek Supabase Anda.")
