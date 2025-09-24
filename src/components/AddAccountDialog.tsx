import { useState } from "react";
import { Plus } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddAccountDialogProps {
  onAccountAdded: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddAccountDialog = ({ 
  onAccountAdded, 
  isOpen: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}: AddAccountDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;
  const [bankName, setBankName] = useState("");
  const [balance, setBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bankName.trim() || !balance.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      toast({
        title: "Error", 
        description: "Please enter a valid balance",
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
          description: "You must be logged in to add accounts",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("accounts")
        .insert({
          user_id: user.id,
          bank_name: bankName.trim(),
          balance: balanceNum,
          currency: "JOD",
        });

      if (error) {
        console.error("Error adding account:", error);
        toast({
          title: "Error",
          description: "Failed to add account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Account added successfully!",
      });

      setBankName("");
      setBalance("");
      setIsOpen(false);
      onAccountAdded();
    } catch (error) {
      console.error("Error adding account:", error);
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
      <Button className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg">
        <Plus className="h-6 w-6" />
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {DialogTriggerComponent}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Bank Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Enter bank name"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="Enter balance"
              disabled={isLoading}
            />
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
              {isLoading ? "Adding..." : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};