const fs = require('fs');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function extractTools() {
  const dataBuffer = fs.readFileSync('PT_Mattel_ToolCrib_Dataset.pdf');
  const pdfModule = await import('pdf-parse');
  const parsePdf = pdfModule.default || pdfModule;
  const data = await parsePdf(dataBuffer);
  const text = data.text;

  // Split text by "SKU " to find each tool block
  // Note: first block might be introductory text
  const blocks = text.split('\nSKU ').slice(1);
  const tools = [];

  for (const block of blocks) {
    try {
      const lines = block.split('\n');
      const sku = lines[0].trim();
      
      const getValue = (key) => {
        const line = lines.find(l => l.startsWith(key));
        return line ? line.replace(key, '').trim() : '';
      };

      const name = getValue('Item Name ');
      const category = getValue('Category ');
      const unit = getValue('Unit ');
      
      const stock = parseInt(getValue('Stock Quantity ')) || 0;
      const minStock = parseInt(getValue('Minimum Stock ')) || 0;
      const maxStock = parseInt(getValue('Maximum Stock ')) || 0;
      
      const rack = getValue('Rack ');
      const bin = getValue('Bin ');
      const location = `Rack ${rack} Bin ${bin}`;
      
      // Extract Technical Description
      const descIndex = lines.findIndex(l => l === 'Technical Description');
      const inspectIndex = lines.findIndex(l => l === 'Inspection History');
      let description = '';
      if (descIndex !== -1) {
        const endIdx = inspectIndex !== -1 ? inspectIndex : lines.length;
        description = lines.slice(descIndex + 1, endIdx).join(' ').trim();
      }

      tools.push({
        code: sku,
        name: name,
        category: category,
        stock: stock,
        min_stock: minStock,
        max_stock: maxStock,
        unit: unit,
        location: location,
        description: description
      });

    } catch (err) {
      console.error("Error parsing block", err);
    }
  }

  return tools;
}

async function run() {
  console.log("Membaca dan memproses PDF...");
  const tools = await extractTools();
  console.log(`Berhasil mengekstrak ${tools.length} alat dari PDF.`);
  
  if (tools.length === 0) {
    console.log("Tidak ada alat yang ditemukan. Periksa PDF atau Regex.");
    return;
  }

  console.log("Menyimpan ke Supabase...");
  // Bulk insert using chunks of 50 to avoid timeout
  const chunkSize = 50;
  let successCount = 0;

  for (let i = 0; i < tools.length; i += chunkSize) {
    const chunk = tools.slice(i, i + chunkSize);
    const { data, error } = await supabase.from('tools').upsert(chunk, { onConflict: 'code' });
    
    if (error) {
      console.error("Error saat insert:", error.message);
    } else {
      successCount += chunk.length;
      console.log(`[${successCount}/${tools.length}] Berhasil disisipkan.`);
    }
  }

  console.log("Selesai! 🎉 Cek database Supabase Anda.");
}

run();
