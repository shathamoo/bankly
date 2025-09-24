-- Create beneficiaries table for external transfers
CREATE TABLE public.beneficiaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone_number TEXT,
  alias TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT beneficiaries_phone_alias_check CHECK (
    phone_number IS NOT NULL OR alias IS NOT NULL
  )
);

-- Enable Row Level Security
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own beneficiaries" 
ON public.beneficiaries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own beneficiaries" 
ON public.beneficiaries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own beneficiaries" 
ON public.beneficiaries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own beneficiaries" 
ON public.beneficiaries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_beneficiaries_updated_at
BEFORE UPDATE ON public.beneficiaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();