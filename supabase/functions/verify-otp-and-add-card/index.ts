import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface VerifyOTPRequest {
  email: string;
  otpCode: string;
  purpose: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Get user from JWT
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const { email, otpCode, purpose }: VerifyOTPRequest = await req.json();

    if (!email || !otpCode || !purpose) {
      return new Response(
        JSON.stringify({ error: "Email, OTP code, and purpose are required" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Find and verify OTP
    const { data: otpData, error: otpFetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("email", email)
      .eq("otp_code", otpCode)
      .eq("purpose", purpose)
      .eq("is_verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpFetchError || !otpData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP code" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Mark OTP as verified
    const { error: updateOtpError } = await supabase
      .from("otp_verifications")
      .update({ is_verified: true })
      .eq("id", otpData.id);

    if (updateOtpError) {
      console.error("Error updating OTP:", updateOtpError);
      return new Response(
        JSON.stringify({ error: "Failed to verify OTP" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // If purpose is add_card, add the card to the database
    if (purpose === "add_card" && otpData.metadata) {
      const cardDetails = otpData.metadata as any;
      
      // Mask the card number for storage (only keep last 4 digits)
      const maskedCardNumber = "**** **** **** " + cardDetails.cardNumber.slice(-4);
      
      const { error: cardError } = await supabase
        .from("cards")
        .insert({
          user_id: user.id,
          card_number: maskedCardNumber,
          card_holder_name: cardDetails.cardHolderName,
          bank_name: cardDetails.bankName,
          expiry_month: cardDetails.expiryMonth,
          expiry_year: cardDetails.expiryYear,
          cvv: "***", // Never store actual CVV
          is_active: true,
        });

      if (cardError) {
        console.error("Error adding card:", cardError);
        return new Response(
          JSON.stringify({ error: "Failed to add card" }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          }
        );
      }
    }

    // Clean up expired OTPs
    await supabase.rpc("cleanup_expired_otps");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: purpose === "add_card" ? "Card added successfully" : "OTP verified successfully"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-otp-and-add-card function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
