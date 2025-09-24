import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import banklyIcon from "@/assets/bankly-icon.png";

// Validation schema
const createAccountSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name cannot be empty" })
    .max(50, { message: "First name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "First name can only contain letters and spaces" }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Last name cannot be empty" })
    .max(50, { message: "Last name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Last name can only contain letters and spaces" }),
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password must be less than 128 characters" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
    }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const CreateAccount = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateAccount = async () => {
    try {
      setIsLoading(true);
      setErrors({});

      // Validate input
      const validation = createAccountSchema.safeParse({ 
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

      // TODO: Implement actual account creation logic here
      // For now, just show success and navigate to dashboard
      toast({
        title: "Account created successfully",
        description: "Welcome to Bankly!",
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Account creation failed",
        description: "Please try again later.",
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
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Create Account</h1>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Logo */}
          <div className="text-center mb-6">
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
              placeholder=""
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
              placeholder=""
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
              placeholder=""
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Create Account Button */}
          <div className="pt-6">
            <Button 
              onClick={handleCreateAccount}
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;