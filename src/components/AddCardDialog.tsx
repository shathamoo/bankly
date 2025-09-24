import { useState } from "react";
import { CreditCard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddCardDialogProps {
  accounts: Array<{ id: string; bank_name: string }>;
  onCardAdded: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface CardDetails {
  cardNumber: string;
  cardHolderName: string;
  bankName: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  accountId: string;
}

export const AddCardDialog = ({ 
  accounts,
  onCardAdded, 
  isOpen: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}: AddCardDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;
  
  const [step, setStep] = useState<'card-details' | 'otp-verification'>('card-details');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: "",
    cardHolderName: "",
    bankName: "",
    expiryMonth: 1,
    expiryYear: new Date().getFullYear(),
    cvv: "",
    accountId: "",
  });
  
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleCardDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardDetails.cardNumber || !cardDetails.cardHolderName || !cardDetails.bankName || 
        !cardDetails.cvv || !cardDetails.accountId || !email) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate card number (basic validation)
    if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
      toast({
        title: "Error",
        description: "Please enter a valid 16-digit card number",
        variant: "destructive",
      });
      return;
    }

    // Validate CVV
    if (cardDetails.cvv.length !== 3) {
      toast({
        title: "Error",
        description: "Please enter a valid 3-digit CVV",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add cards",
          variant: "destructive",
        });
        return;
      }

      // Send OTP
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: {
          email: email,
          purpose: "add_card",
          cardDetails: cardDetails,
        },
      });

      if (error) {
        console.error("Error sending OTP:", error);
        toast({
          title: "Error",
          description: "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code.",
      });

      setStep('otp-verification');
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-otp-and-add-card", {
        body: {
          email: email,
          otpCode: otpCode,
          purpose: "add_card",
        },
      });

      if (error) {
        console.error("Error verifying OTP:", error);
        toast({
          title: "Error",
          description: "Invalid or expired OTP code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Card added successfully!",
      });

      // Reset form
      setStep('card-details');
      setCardDetails({
        cardNumber: "",
        cardHolderName: "",
        bankName: "",
        expiryMonth: 1,
        expiryYear: currentYear,
        cvv: "",
        accountId: "",
      });
      setEmail("");
      setOtpCode("");
      setIsOpen(false);
      onCardAdded();
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('card-details');
    setOtpCode("");
  };

  const DialogTriggerComponent = controlledOpen !== undefined ? null : (
    <DialogTrigger asChild>
      <Button className="fixed bottom-36 right-6 h-14 w-14 rounded-full shadow-lg">
        <CreditCard className="h-6 w-6" />
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {DialogTriggerComponent}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'card-details' ? 'Add New Card' : 'Email Verification'}
          </DialogTitle>
        </DialogHeader>

        {step === 'card-details' ? (
          <form onSubmit={handleCardDetailsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">Link to Account</Label>
              <Select 
                value={cardDetails.accountId} 
                onValueChange={(value) => setCardDetails({...cardDetails, accountId: value})}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bank_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={cardDetails.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                  if (value.length <= 19) { // 16 digits + 3 spaces
                    setCardDetails({...cardDetails, cardNumber: value});
                  }
                }}
                placeholder="1234 5678 9012 3456"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardHolderName">Card Holder Name</Label>
              <Input
                id="cardHolderName"
                value={cardDetails.cardHolderName}
                onChange={(e) => setCardDetails({...cardDetails, cardHolderName: e.target.value})}
                placeholder="Enter card holder name"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={cardDetails.bankName}
                onChange={(e) => setCardDetails({...cardDetails, bankName: e.target.value})}
                placeholder="Enter bank name"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expiryMonth">Month</Label>
                <Select 
                  value={cardDetails.expiryMonth.toString()} 
                  onValueChange={(value) => setCardDetails({...cardDetails, expiryMonth: parseInt(value)})}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {month.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryYear">Year</Label>
                <Select 
                  value={cardDetails.expiryYear.toString()} 
                  onValueChange={(value) => setCardDetails({...cardDetails, expiryYear: parseInt(value)})}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  value={cardDetails.cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 3) {
                      setCardDetails({...cardDetails, cvv: value});
                    }
                  }}
                  placeholder="123"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpVerification} className="space-y-4">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground">
                  We've sent a verification code to
                </p>
                <p className="font-medium">{email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otpCode">Verification Code</Label>
              <Input
                id="otpCode"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) {
                    setOtpCode(value);
                  }
                }}
                placeholder="Enter 6-digit code"
                disabled={isLoading}
                className="text-center text-lg tracking-widest"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify & Add Card"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};