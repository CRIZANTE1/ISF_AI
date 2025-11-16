/*
# [Operation] Create Purchases Table
This script creates the `purchases` table to store all Google Play Billing purchases.

## Query Description:
This is a structural change and is safe to run. It adds a new table to track all in-app purchases from Google Play Billing, including purchase tokens, order IDs, and purchase states.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the table)

## Structure Details:
- Tables affected: `purchases` (new)
- Columns added:
  - `purchases.id` (PK, UUID)
  - `purchases.user_id` (FK to auth.users)
  - `purchases.product_id` (TEXT) - ID do produto no Google Play
  - `purchases.purchase_token` (TEXT, UNIQUE) - Token único da compra
  - `purchases.order_id` (TEXT) - ID do pedido no Google Play
  - `purchases.purchase_time` (TIMESTAMPTZ) - Data/hora da compra
  - `purchases.purchase_state` (INTEGER) - Estado da compra (0=PURCHASED, 1=CANCELED, etc)
  - `purchases.acknowledged` (BOOLEAN) - Se a compra foi reconhecida
  - `purchases.original_json` (JSONB) - Dados originais da compra para auditoria
  - `purchases.created_at` (TIMESTAMPTZ)
  - `purchases.updated_at` (TIMESTAMPTZ)

## Security Implications:
- RLS Status: Enabled on the new `purchases` table.
- Policy Changes: Yes, new policies are created for the `purchases` table to ensure users can only access their own purchase data.
- Auth Requirements: Users must be authenticated to interact with this table.

## Performance Impact:
- Indexes: Indexes are added on `user_id`, `product_id`, and `purchase_token` for efficient querying.
- Triggers: A trigger updates `updated_at` automatically.
- Estimated Impact: Low. This is a new table and will not impact performance of existing queries.
*/

-- 1. Create the purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    purchase_token TEXT NOT NULL UNIQUE,
    order_id TEXT,
    purchase_time TIMESTAMPTZ NOT NULL,
    purchase_state INTEGER NOT NULL DEFAULT 0, -- 0=PURCHASED, 1=CANCELED, 2=PENDING
    acknowledged BOOLEAN DEFAULT false,
    original_json JSONB, -- Store original purchase data for audit
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON public.purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_token ON public.purchases(purchase_token);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_time ON public.purchases(purchase_time DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user_product ON public.purchases(user_id, product_id);

-- 3. Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
    ON public.purchases FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can insert their own purchases"
    ON public.purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own purchases (for acknowledging, etc)
CREATE POLICY "Users can update their own purchases"
    ON public.purchases FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all purchases (optional, for support purposes)
CREATE POLICY "Admins can view all purchases"
    ON public.purchases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update updated_at
CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_purchases_updated_at();

-- 7. Add comment to table
COMMENT ON TABLE public.purchases IS 'Stores all Google Play Billing purchases for the application';
COMMENT ON COLUMN public.purchases.purchase_state IS 'Purchase state: 0=PURCHASED, 1=CANCELED, 2=PENDING, 3=UNSPECIFIED_STATE';
COMMENT ON COLUMN public.purchases.original_json IS 'Original purchase data from Google Play Billing for audit purposes';

