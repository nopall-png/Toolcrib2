-- ============================================================
-- Migration: Create duplicate_decisions table
-- Records staff decisions on duplicate SKU pairs
-- ============================================================

CREATE TABLE IF NOT EXISTS duplicate_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_pair JSONB NOT NULL,           -- { sku1: "...", sku2: "..." }
    action VARCHAR(20) NOT NULL,        -- MERGE | IGNORE | SUBSTITUTE
    similarity_score DECIMAL(5,2),
    notes TEXT,
    decided_by VARCHAR(100),            -- staff name (from auth)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE duplicate_decisions IS 'Records toolcrib staff decisions on AI-detected duplicate SKU pairs';
COMMENT ON COLUMN duplicate_decisions.sku_pair IS 'JSON object containing SKU_1 and SKU_2 of the duplicate pair';
COMMENT ON COLUMN duplicate_decisions.action IS 'MERGE=mark as duplicate and merge, IGNORE=keep as separate, SUBSTITUTE=use one as substitute for the other';

-- Auto-create updated_at trigger
CREATE OR REPLACE FUNCTION updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE duplicate_decisions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
CREATE TRIGGER duplicate_decisions_updated_at
    BEFORE UPDATE ON duplicate_decisions
    FOR EACH ROW EXECUTE FUNCTION updated_at_trigger();
