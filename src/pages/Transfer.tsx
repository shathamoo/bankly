import { useState, useEffect } from "react";
import { ArrowLeftRight, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AccountCard } from "@/components/AccountCard";
import { TransferDialog } from "@/components/TransferDialog";
import { ExternalTransferDialog } from "@/components/ExternalTransferDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: string;
  bank_name: string;
  balance: number;
  currency: string;
  logo_url?: string;
}

const Transfer = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isExternalTransferDialogOpen, setIsExternalTransferDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getLogoForBank = (bankName: string) => {
    const logoMap: { [key: string]: string } = {
      "Arab Bank": "/src/assets/arab-bank-logo.png",
      "Etihad Bank": "/src/assets/etihad-bank-logo.png",
      "Safwa Islamic": "/src/assets/safwa-bank-logo.png",
      "Safwa Bank": "/src/assets/safwa-bank-logo.png",
    };
    return logoMap[bankName] || "/src/assets/bankly-icon.png";
  };

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Show demo accounts for non-logged-in users
        const demoAccounts = [
          { id: "demo-1", bank_name: "Arab Bank", balance: 12700, currency: "JOD", logo_url: getLogoForBank("Arab Bank") },
          { id: "demo-2", bank_name: "Etihad Bank", balance: 8450, currency: "JOD", logo_url: getLogoForBank("Etihad Bank") },
          { id: "demo-3", bank_name: "Safwa Islamic", balance: 5980, currency: "JOD", logo_url: getLogoForBank("Safwa Islamic") },
        ];
        setAccounts(demoAccounts);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching accounts:", error);
        toast({
          title: "Error",
          description: "Failed to fetch accounts",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const accountsWithLogos = (data || []).map(account => ({
        ...account,
        balance: parseFloat(account.balance.toString()),
        logo_url: account.logo_url || getLogoForBank(account.bank_name),
      }));

      setAccounts(accountsWithLogos);
    } catch (error) {
      console.error("Error in fetchAccounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const handleTransferSuccess = () => {
    fetchAccounts(); // Refresh account balances
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Transfer Money</h1>
        </div>

        {/* Accounts List */}
        <div className="space-y-4 mb-6">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={{
                  id: parseInt(account.id.replace('demo-', '') || '0'),
                  bankName: account.bank_name,
                  balance: `${account.balance}`,
                  currency: account.currency,
                  logo: account.logo_url || getLogoForBank(account.bank_name),
                }}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No accounts found</p>
            </div>
          )}
        </div>

        {/* Total Balance Card */}
        {accounts.length > 0 && (
          <Card className="mb-6 bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Balance</span>
                <span className="text-2xl font-bold">{totalBalance.toFixed(2)} JOD</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transfer Buttons */}
        {accounts.length >= 1 && (
          <div className="fixed bottom-24 right-6 space-y-3">
            {/* External Transfer Button */}
            <Button
              onClick={() => setIsExternalTransferDialogOpen(true)}
              size="lg"
              variant="secondary"
              className="rounded-full shadow-lg w-full"
            >
              <Send className="w-5 h-5 mr-2" />
              External Transfer
            </Button>
            
            {/* Internal Transfer Button - only show if 2+ accounts */}
            {accounts.length >= 2 && (
              <Button
                onClick={() => setIsTransferDialogOpen(true)}
                size="lg"
                className="rounded-full shadow-lg w-full"
              >
                <ArrowLeftRight className="w-5 h-5 mr-2" />
                Between Accounts
              </Button>
            )}
          </div>
        )}

        {accounts.length < 1 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              You need at least one account to make transfers
            </p>
          </div>
        )}

        {accounts.length === 1 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Add another account to enable transfers between accounts
            </p>
          </div>
        )}

        {/* Internal Transfer Dialog */}
        <TransferDialog
          accounts={accounts}
          isOpen={isTransferDialogOpen}
          onOpenChange={setIsTransferDialogOpen}
          onTransferSuccess={handleTransferSuccess}
        />

        {/* External Transfer Dialog */}
        <ExternalTransferDialog
          accounts={accounts}
          isOpen={isExternalTransferDialogOpen}
          onOpenChange={setIsExternalTransferDialogOpen}
          onTransferSuccess={handleTransferSuccess}
        />
      </div>

      <BottomNav activeTab="transfer" />
    </div>
  );
};

export default Transfer;