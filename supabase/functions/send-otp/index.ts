import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface SendOTPRequest {
  email: string;
  purpose: string;
  cardDetails?: {
    cardNumber: string;
    cardHolderName: string;
    bankName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    accountId: string;
  };
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

    const { email, purpose, cardDetails }: SendOTPRequest = await req.json();

    if (!email || !purpose) {
      return new Response(
        JSON.stringify({ error: "Email and purpose are required" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database with 5-minute expiration
    const { error: otpError } = await supabase
      .from("otp_verifications")
      .insert({
        user_id: user.id,
        email: email,
        otp_code: otpCode,
        purpose: purpose,
        metadata: cardDetails || null,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Send email with OTP
    const emailResponse = await resend.emails.send({
      from: "Bankly <onboarding@resend.dev>",
      to: [email],
      subject: "Your Bankly Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0A4D92; margin: 0;">Bankly</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Verification Code</h2>
            <p style="color: #666; margin-bottom: 30px;">
              Please use the following code to verify your identity:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #0A4D92; display: inline-block; margin-bottom: 30px;">
              <span style="font-size: 32px; font-weight: bold; color: #0A4D92; letter-spacing: 4px;">
                ${otpCode}
              </span>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 0;">
              This code will expire in 5 minutes.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© 2024 Bankly. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("OTP email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "OTP sent successfully" 
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
    console.error("Error in send-otp function:", error);
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