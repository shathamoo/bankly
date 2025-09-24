import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import banklyIcon from "@/assets/bankly-icon.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img 
            src={banklyIcon} 
            alt="Bankly" 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl font-bold text-primary">Bankly</h1>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-2xl border-2 border-input bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-2xl border-2 border-input bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background"
              placeholder="Enter your password"
            />
          </div>

          <div className="text-right">
            <a 
              href="#" 
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Forgot password?
            </a>
          </div>

          <Button 
            onClick={handleSignIn}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg shadow-lg"
          >
            Sign in
          </Button>

          <div className="text-center">
            <a 
              href="#" 
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Don't have an account? <span className="text-primary font-medium">Create account</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;