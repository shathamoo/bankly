import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import banklyIcon from "@/assets/bankly-icon.png";

// Validation schema
const signUpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name must be less than 50 characters" }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(50, { message: "Last name must be less than 50 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password must be less than 128 characters" }),
  confirmPassword: z
    .string()
    .min(1, { message: "Please confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      setErrors({});

      // Validate input
      const validation = signUpSchema.safeParse({ 
        firstName, 
        lastName, 
        email, 
        password, 
        confirmPassword 
      });
      
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

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* App Bar */}
      <div className="bg-background border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Create Account</h1>
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

          {/* First Name Field */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-foreground font-medium">
              First Name
            </Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`h-12 rounded-lg border-2 ${
                errors.firstName 
                  ? "border-destructive focus:border-destructive" 
                  : "border-input focus:border-primary"
              }`}
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name Field */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-foreground font-medium">
              Last Name
            </Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`h-12 rounded-lg border-2 ${
                errors.lastName 
                  ? "border-destructive focus:border-destructive" 
                  : "border-input focus:border-primary"
              }`}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName}</p>
            )}
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
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`h-12 rounded-lg border-2 ${
                errors.confirmPassword 
                  ? "border-destructive focus:border-destructive" 
                  : "border-input focus:border-primary"
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Sign Up Button */}
          <div className="pt-6">
            <Button 
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>

          {/* Login Link */}
          <div className="pt-4 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link 
                to="/" 
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;