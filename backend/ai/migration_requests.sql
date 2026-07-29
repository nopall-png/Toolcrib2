-- Migration: Create User Requests Tables

-- 1. Create table for request headers (requests)
CREATE TABLE IF NOT EXISTS public.requests (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    request_no character varying(50) NOT NULL UNIQUE,
    user_name character varying(100) NOT NULL,
    employee_id character varying(50) NOT NULL,
    department character varying(100) NOT NULL,
    status character varying(20) NOT NULL DEFAULT 'Pending',
    request_date timestamp with time zone DEFAULT now(),
    notes text,
    CONSTRAINT requests_pkey PRIMARY KEY (id)
);

-- 2. Create table for request items (request_items)
CREATE TABLE IF NOT EXISTS public.request_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE RESTRICT,
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status character varying(20) NOT NULL DEFAULT 'Pending',
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT request_items_pkey PRIMARY KEY (id)
);

-- Enable RLS (Optional, can just be open for internal app)
-- ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;
