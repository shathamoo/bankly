import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface Account {
  id: string;
  bank_name: string;
  balance: number;
  currency: string;
}

interface TransferDialogProps {
  accounts: Account[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferSuccess: () => void;
}

const transferSchema = z.object({
  fromAccountId: z.string().min(1, "Please select a from account"),
  toAccountId: z.string().min(1, "Please select a to account"),
  amount: z.number().min(0.01, "Amount must be greater than 0").max(999999, "Amount too large"),
  description: z.string().optional(),
});

export const TransferDialog = ({ accounts, isOpen, onOpenChange, onTransferSuccess }: TransferDialogProps) => {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setDescription("");
  };

  const handleTransfer = async () => {
    try {
      setIsLoading(true);

      // Validate form data
      const parsedAmount = parseFloat(amount);
      const validationResult = transferSchema.safeParse({
        fromAccountId,
        toAccountId,
        amount: parsedAmount,
        description,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }

      // Additional validation: same account check
      if (fromAccountId === toAccountId) {
        toast({
          title: "Error",
          description: "Cannot transfer to the same account",
          variant: "destructive",
        });
        return;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "Please log in to make a transfer",
          variant: "destructive",
        });
        return;
      }

      // Call transfer function
      const { data, error } = await supabase.functions.invoke('transfer-money', {
        body: {
          fromAccountId,
          toAccountId,
          amount: parsedAmount,
          description: description || undefined,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Transfer error:', error);
        toast({
          title: "Transfer Failed",
          description: error.message || "An error occurred during the transfer",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Transfer Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Success
      toast({
        title: "Transfer Successful",
        description: data.message,
      });

      resetForm();
      onOpenChange(false);
      onTransferSuccess();

    } catch (error) {
      console.error('Transfer function error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fromAccount = accounts.find(acc => acc.id === fromAccountId);
  const availableToAccounts = accounts.filter(acc => acc.id !== fromAccountId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromAccount">From Account</Label>
            <Select 
              value={fromAccountId} 
              onValueChange={(value) => {
                setFromAccountId(value);
                // Reset to account if it's the same as the new from account
                if (toAccountId === value) {
                  setToAccountId("");
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select account to transfer from" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex justify-between w-full">
                      <span>{account.bank_name}</span>
                      <span className="ml-4 text-muted-foreground">
                        {account.balance} {account.currency}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fromAccount && (
              <p className="text-sm text-muted-foreground">
                Available: {fromAccount.balance} {fromAccount.currency}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAccount">To Account</Label>
            <Select 
              value={toAccountId} 
              onValueChange={setToAccountId}
              disabled={isLoading || !fromAccountId}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select account to transfer to" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {availableToAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex justify-between w-full">
                      <span>{account.bank_name}</span>
                      <span className="ml-4 text-muted-foreground">
                        {account.balance} {account.currency}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (JOD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              step="0.01"
              min="0.01"
              max={fromAccount ? fromAccount.balance : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Transfer description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              maxLength={200}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={isLoading || !fromAccountId || !toAccountId || !amount}
              className="flex-1"
            >
              {isLoading ? "Processing..." : "Transfer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};