-- SECURITY FIX: Remove sensitive card data fields and implement secure card storage
-- This migration removes full card numbers and CVV data to comply with PCI DSS

-- Add new secure fields
ALTER TABLE public.cards 
ADD COLUMN masked_card_number TEXT,
ADD COLUMN card_token TEXT UNIQUE,
ADD COLUMN last_four_digits TEXT;

-- Update existing records with masked data (simulate tokenization for existing data)
UPDATE public.cards 
SET 
  masked_card_number = '**** **** **** ' || RIGHT(card_number, 4),
  last_four_digits = RIGHT(card_number, 4),
  card_token = 'token_' || gen_random_uuid()::TEXT
WHERE masked_card_number IS NULL;

-- Remove the sensitive fields
ALTER TABLE public.cards 
DROP COLUMN card_number,
DROP COLUMN cvv;

-- Make the new fields required
ALTER TABLE public.cards 
ALTER COLUMN masked_card_number SET NOT NULL,
ALTER COLUMN card_token SET NOT NULL,
ALTER COLUMN last_four_digits SET NOT NULL;

-- Add index for performance on token lookups
CREATE INDEX idx_cards_token ON public.cards(card_token);
CREATE INDEX idx_cards_last_four ON public.cards(last_four_digits);