import { useState } from "react";
import { CreditCard } from "lucide-react";
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
}

export const AddCardDialog = ({ 
  onCardAdded, 
  isOpen: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}: AddCardDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;
  
  const [isLoading, setIsLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: "",
    cardHolderName: "",
    bankName: "",
    expiryMonth: 1,
    expiryYear: new Date().getFullYear(),
    cvv: "",
  });
  
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleCardDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardDetails.cardNumber || !cardDetails.cardHolderName || !cardDetails.bankName || 
        !cardDetails.cvv) {
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

      // Create secure card data (simulate tokenization)
      const cleanCardNumber = cardDetails.cardNumber.replace(/\s/g, '');
      const maskedCardNumber = '**** **** **** ' + cleanCardNumber.slice(-4);
      const lastFourDigits = cleanCardNumber.slice(-4);
      const cardToken = 'token_' + Math.random().toString(36).substr(2, 15) + Date.now().toString(36);

      // Store only secure card data (no CVV, no full card number)
      const { error: insertError } = await supabase
        .from('cards')
        .insert({
          user_id: user.id,
          masked_card_number: maskedCardNumber,
          card_holder_name: cardDetails.cardHolderName,
          bank_name: cardDetails.bankName,
          expiry_month: cardDetails.expiryMonth,
          expiry_year: cardDetails.expiryYear,
          card_token: cardToken,
          last_four_digits: lastFourDigits,
          is_active: true
        });

      if (insertError) {
        console.error("Error adding card:", insertError);
        toast({
          title: "Error",
          description: "Failed to add card. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Card added successfully!",
      });

      // Reset form
      setCardDetails({
        cardNumber: "",
        cardHolderName: "",
        bankName: "",
        expiryMonth: 1,
        expiryYear: currentYear,
        cvv: "",
      });
      setIsOpen(false);
      onCardAdded();
    } catch (error) {
      console.error("Error adding card:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const DialogTriggerComponent = controlledOpen !== undefined ? null : (
    <DialogTrigger asChild>
      <Button className="fixed bottom-36 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90">
        <CreditCard className="h-6 w-6 text-primary-foreground" />
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {DialogTriggerComponent}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCardDetailsSubmit} className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              ⚠️ For demo purposes only. Never enter real card details.
            </p>
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
              <p className="text-xs text-muted-foreground">
                CVV is not stored for security
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              🔒 <strong>Security Notice:</strong> Card numbers and CVV codes are never stored in our database. Only masked card numbers are kept for display purposes.
            </p>
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
              {isLoading ? "Adding Card..." : "Add Card"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};