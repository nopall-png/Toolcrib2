-- ==============================================================================
-- MIGRATION SCRIPT: Toolcrib Schema Updates (Stock Transactions & Machine Tools)
-- ==============================================================================
-- Instruksi: Jalankan script ini melalui Supabase SQL Editor. 
-- Semua script ini bersifat IDEMPOTENT (aman dijalankan berkali-kali).

-- 1. Tambah skor numerik untuk critical spares di tabel tools
ALTER TABLE public.tools 
  ADD COLUMN IF NOT EXISTS machine_impact_score integer DEFAULT 50 CHECK (machine_impact_score BETWEEN 1 AND 100);

-- 2. Buat tabel transaksi stok (untuk forecast Prophet & hitung ADU)
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL,
  transaction_type character varying NOT NULL DEFAULT 'OUT', -- 'OUT' atau 'IN'
  quantity integer NOT NULL CHECK (quantity > 0),
  transaction_date timestamp with time zone NOT NULL DEFAULT now(),
  reference_request_id uuid, -- opsional, link ke user_requests
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT stock_transactions_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE,
  CONSTRAINT stock_transactions_request_id_fkey FOREIGN KEY (reference_request_id) REFERENCES public.user_requests(id) ON DELETE SET NULL,
  CONSTRAINT stock_transactions_unique_ref UNIQUE (tool_id, reference_request_id) -- Untuk Idempotency Backfill
);

-- Index untuk mempercepat query forecast harian
CREATE INDEX IF NOT EXISTS idx_stock_transactions_tool_date ON public.stock_transactions (tool_id, transaction_date);

-- 3. Buat tabel relasi machine_tools (menggantikan required_parts string)
CREATE TABLE IF NOT EXISTS public.machine_tools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL,
  tool_id uuid NOT NULL,
  impact_weight integer DEFAULT 50 CHECK (impact_weight BETWEEN 1 AND 100),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT machine_tools_pkey PRIMARY KEY (id),
  CONSTRAINT machine_tools_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE CASCADE,
  CONSTRAINT machine_tools_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE,
  CONSTRAINT machine_tools_unique_mapping UNIQUE (machine_id, tool_id) -- Idempotency untuk backfill Python
);

-- 4. Backfill data riwayat pemakaian barang lama ke stock_transactions
-- Menarik data dari user_request_items yang berstatus selesai/disetujui.
INSERT INTO public.stock_transactions (tool_id, transaction_type, quantity, transaction_date, reference_request_id)
SELECT 
    uri.tool_id, 
    'OUT', 
    uri.quantity, 
    ur.request_date, 
    ur.id
FROM public.user_request_items uri
JOIN public.user_requests ur ON ur.id = uri.request_id
WHERE ur.status = 'Sudah sampai'
ON CONFLICT (tool_id, reference_request_id) DO NOTHING;
