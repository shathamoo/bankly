import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Plus } from "lucide-react";

interface Account {
  id: string;
  bank_name: string;
  balance: number;
  currency: string;
  logo_url?: string;
}

interface Beneficiary {
  id: string;
  phone_number?: string;
  alias?: string;
}

interface ExternalTransferDialogProps {
  accounts: Account[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferSuccess: () => void;
}

export const ExternalTransferDialog = ({
  accounts,
  isOpen,
  onOpenChange,
  onTransferSuccess,
}: ExternalTransferDialogProps) => {
  const [fromAccountId, setFromAccountId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [alias, setAlias] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("");
  const [showNewBeneficiary, setShowNewBeneficiary] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFromAccountId("");
    setPhoneNumber("");
    setAlias("");
    setAmount("");
    setSelectedBeneficiary("");
    setShowNewBeneficiary(false);
  };

  const fetchBeneficiaries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("beneficiaries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching beneficiaries:", error);
        return;
      }

      setBeneficiaries(data || []);
    } catch (error) {
      console.error("Error in fetchBeneficiaries:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBeneficiaries();
    }
  }, [isOpen]);

  const handleBeneficiarySelect = (beneficiaryId: string) => {
    const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
    if (beneficiary) {
      setPhoneNumber(beneficiary.phone_number || "");
      setAlias(beneficiary.alias || "");
      setSelectedBeneficiary(beneficiaryId);
      setShowNewBeneficiary(false);
    }
  };

  const handleNewBeneficiary = () => {
    setPhoneNumber("");
    setAlias("");
    setSelectedBeneficiary("");
    setShowNewBeneficiary(true);
  };

  const handleTransfer = async () => {
    if (!fromAccountId || !amount || (!phoneNumber && !alias)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const fromAccount = accounts.find(acc => acc.id === fromAccountId);
    if (!fromAccount) {
      toast({
        title: "Account Not Found",
        description: "Selected account not found",
        variant: "destructive",
      });
      return;
    }

    if (fromAccount.balance < transferAmount) {
      toast({
        title: "Insufficient Funds",
        description: `Not enough balance in ${fromAccount.bank_name}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update account balance
      const { error: updateError } = await supabase
        .from("accounts")
        .update({ balance: fromAccount.balance - transferAmount })
        .eq("id", fromAccountId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating account balance:", updateError);
        toast({
          title: "Transfer Failed",
          description: "Failed to update account balance",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create transaction record
      const recipient = alias || phoneNumber;
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          from_account_id: fromAccountId,
          to_account_id: fromAccountId, // Same account for external transfers
          amount: transferAmount,
          description: `External Transfer to ${recipient}`,
          transaction_type: "external_transfer",
        });

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
        // Don't show error to user since money was already deducted
      }

      // Save beneficiary if new
      if (showNewBeneficiary && (phoneNumber || alias)) {
        const { error: beneficiaryError } = await supabase
          .from("beneficiaries")
          .insert({
            user_id: user.id,
            phone_number: phoneNumber || null,
            alias: alias || null,
          });

        if (beneficiaryError) {
          console.error("Error saving beneficiary:", beneficiaryError);
        }
      }

      toast({
        title: "Transfer Successful",
        description: `Successfully sent ${transferAmount.toFixed(2)} JOD to ${recipient}`,
      });

      resetForm();
      onOpenChange(false);
      onTransferSuccess();
    } catch (error) {
      console.error("Error in handleTransfer:", error);
      toast({
        title: "Transfer Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>External Transfer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* From Account */}
          <div className="space-y-2">
            <Label htmlFor="from-account">From Account</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.bank_name} - {account.balance.toFixed(2)} {account.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Beneficiaries */}
          <div className="space-y-2">
            <Label>Recipient</Label>
            
            {/* Saved Beneficiaries */}
            {beneficiaries.length > 0 && !showNewBeneficiary && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {beneficiaries.map((beneficiary) => (
                    <Card 
                      key={beneficiary.id}
                      className={`cursor-pointer transition-colors ${
                        selectedBeneficiary === beneficiary.id 
                          ? 'ring-2 ring-primary' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => handleBeneficiarySelect(beneficiary.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {beneficiary.alias || "No Alias"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {beneficiary.phone_number || "No Phone"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewBeneficiary}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Recipient
                </Button>
              </div>
            )}

            {/* New Beneficiary Form */}
            {(showNewBeneficiary || beneficiaries.length === 0) && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+962 7X XXX XXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alias">Alias (optional)</Label>
                  <Input
                    id="alias"
                    placeholder="e.g., Mom, John, ABC Company"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  * Please provide at least one: phone number or alias
                </p>

                {beneficiaries.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewBeneficiary(false)}
                    className="w-full"
                  >
                    Choose from Saved Recipients
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (JOD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              className="flex-1"
              disabled={isLoading || !fromAccountId || !amount || (!phoneNumber && !alias)}
            >
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};