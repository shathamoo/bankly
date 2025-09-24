-- Fix the security issue by setting proper search_path for the function
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otp_verifications 
    WHERE expires_at < now() AND is_verified = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;