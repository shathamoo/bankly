-- Create cards table
CREATE TABLE public.cards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL,
    card_holder_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    expiry_month INTEGER NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
    expiry_year INTEGER NOT NULL CHECK (expiry_year >= EXTRACT(YEAR FROM CURRENT_DATE)),
    cvv TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create OTP verification table
CREATE TABLE public.otp_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT NOT NULL, -- 'add_card', etc.
    metadata JSONB, -- Store card details temporarily
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for cards
CREATE POLICY "Users can view their own cards" 
ON public.cards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cards" 
ON public.cards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" 
ON public.cards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" 
ON public.cards 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for OTP verifications
CREATE POLICY "Users can view their own OTP verifications" 
ON public.otp_verifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own OTP verifications" 
ON public.otp_verifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OTP verifications" 
ON public.otp_verifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_account_id ON public.cards(account_id);
CREATE INDEX idx_otp_verifications_user_id ON public.otp_verifications(user_id);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otp_verifications 
    WHERE expires_at < now() AND is_verified = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;