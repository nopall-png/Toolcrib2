-- 1. RPC: get_next_request_no
CREATE SEQUENCE IF NOT EXISTS user_request_no_seq START 1;

CREATE OR REPLACE FUNCTION get_next_request_no()
RETURNS text AS $$
DECLARE
    next_id integer;
    padded_id text;
BEGIN
    SELECT nextval('user_request_no_seq') INTO next_id;
    padded_id := lpad(next_id::text, 4, '0');
    RETURN 'REQ-' || padded_id;
END;
$$ LANGUAGE plpgsql;

-- 2. RPC: approve_toolcrib_request (ACID transaction for approving requests)
CREATE OR REPLACE FUNCTION approve_toolcrib_request(req_id uuid)
RETURNS void AS $$
DECLARE
    item RECORD;
    current_stock integer;
BEGIN
    -- Update status request
    UPDATE public.user_requests 
    SET status = 'Approved' 
    WHERE id = req_id;

    -- Loop through items
    FOR item IN 
        SELECT tool_id, quantity 
        FROM public.user_request_items 
        WHERE request_id = req_id 
    LOOP
        -- Check stock
        SELECT stock INTO current_stock FROM public.tools WHERE id = item.tool_id FOR UPDATE;
        
        IF current_stock < item.quantity THEN
            RAISE EXCEPTION 'Stok tidak mencukupi untuk tool_id %', item.tool_id;
        END IF;

        -- Deduct stock
        UPDATE public.tools 
        SET stock = stock - item.quantity 
        WHERE id = item.tool_id;

        -- Record stock transaction
        INSERT INTO public.stock_transactions (tool_id, transaction_type, quantity, reference_request_id)
        VALUES (item.tool_id, 'OUT', item.quantity, req_id);
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;
