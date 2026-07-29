import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend', 'ai'))
from data_provider import fetch_all_rows
import pandas as pd
from duplicate_detector import DuplicateDetector

tools = fetch_all_rows('tools', 'code, name, category, description, technical_specs')
df = pd.DataFrame(tools)

sku_010 = df[df['code'] == 'BRG-ELC-010'].iloc[0]
sku_026 = df[df['code'] == 'BRG-ELC-026'].iloc[0]

print('--- BRG-ELC-010 ---')
print(f'Name: {sku_010["name"]}')
print(f'Category: {sku_010["category"]}')
print(f'Specs: {sku_010["technical_specs"]}')

print('\n--- BRG-ELC-026 ---')
print(f'Name: {sku_026["name"]}')
print(f'Category: {sku_026["category"]}')
print(f'Specs: {sku_026["technical_specs"]}')

# Test cross-category difference
print('\n--- Cross Category Test ---')
sku_pne = df[df['category'] == 'PNE'].iloc[0]
sku_elc = df[df['category'] == 'ELC'].iloc[0]

print(f'Item 1: {sku_pne["code"]} - {sku_pne["name"]}')
print(f'Item 2: {sku_elc["code"]} - {sku_elc["name"]}')

df_test = pd.DataFrame([sku_pne, sku_elc])
df_test = df_test.rename(columns={'code': 'SKU_ID', 'name': 'Description', 'technical_specs': 'Technical_Specs'})

detector = DuplicateDetector()
# We run duplicate detector with threshold 0.0 to see the raw score
res = detector.detect_duplicate_sku(df_test, threshold=0.0)
print("\nSimilarity Result:")
print(res)
