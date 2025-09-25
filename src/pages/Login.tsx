import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import banklyIcon from "@/assets/bankly-icon.png";

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(1, { message: "Password cannot be empty" })
    .max(128, { message: "Password must be less than 128 characters" }),
});

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrors({});

      // Validate input
      const validation = loginSchema.safeParse({ email, password });
      
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0].toString()] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      // Sign in with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sign in successful",
        description: "Welcome to Bankly!",
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* App Bar */}
      <div className="bg-background border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Bankly Login</h1>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={banklyIcon} 
              alt="Bankly" 
              className="w-16 h-16 mx-auto mb-3 rounded-xl shadow-lg"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 rounded-lg border-2 ${
                errors.email 
                  ? "border-destructive focus:border-destructive" 
                  : "border-input focus:border-primary"
              }`}
              placeholder=""
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-12 rounded-lg border-2 ${
                errors.password 
                  ? "border-destructive focus:border-destructive" 
                  : "border-input focus:border-primary"
              }`}
              placeholder=""
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Sign In Button */}
          <div className="pt-6">
            <Button 
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </div>

          {/* Create Account Button */}
          <div className="pt-4">
            <Button
              variant="ghost"
              onClick={handleCreateAccount}
              className="w-full text-primary hover:text-primary/80 hover:bg-secondary"
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;