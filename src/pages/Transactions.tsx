import { useState, useEffect } from "react";
import { Plus, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionItem } from "@/components/TransactionItem";
import { AccountCard } from "@/components/AccountCard";
import { TransferDialog } from "@/components/TransferDialog";
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

interface Transaction {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string;
  created_at: string;
  from_account?: { id: string; bank_name: string };
  to_account?: { id: string; bank_name: string };
}

const Transactions = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
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
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setTransactions([]);
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }

      // Manually fetch account details for each transaction
      const transactionsWithAccounts = await Promise.all(
        (data || []).map(async (transaction) => {
          const [fromAccountResponse, toAccountResponse] = await Promise.all([
            supabase.from("accounts").select("id, bank_name").eq("id", transaction.from_account_id).single(),
            supabase.from("accounts").select("id, bank_name").eq("id", transaction.to_account_id).single()
          ]);

          return {
            ...transaction,
            from_account: fromAccountResponse.data || { id: transaction.from_account_id, bank_name: "Unknown" },
            to_account: toAccountResponse.data || { id: transaction.to_account_id, bank_name: "Unknown" }
          };
        })
      );

      setTransactions(transactionsWithAccounts);
    } catch (error) {
      console.error("Error in fetchTransactions:", error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchAccounts(), fetchTransactions()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const handleTransferSuccess = () => {
    fetchData(); // Refresh both accounts and transactions
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
          <h1 className="text-2xl font-bold text-foreground">My Accounts</h1>
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

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Transfers</h2>
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="bg-background rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ArrowLeftRight className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {transaction.from_account?.bank_name} → {transaction.to_account?.bank_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {transaction.amount} JOD
                      </p>
                      <p className="text-xs text-green-600 capitalize">
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                  {transaction.description && (
                    <p className="text-sm text-muted-foreground mt-2 pl-13">
                      {transaction.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transfer Button */}
        {accounts.length >= 2 && (
          <div className="fixed bottom-24 right-6">
            <Button
              onClick={() => setIsTransferDialogOpen(true)}
              size="lg"
              className="rounded-full shadow-lg"
            >
              <ArrowLeftRight className="w-5 h-5 mr-2" />
              Transfer
            </Button>
          </div>
        )}

        {/* Transfer Dialog */}
        <TransferDialog
          accounts={accounts}
          isOpen={isTransferDialogOpen}
          onOpenChange={setIsTransferDialogOpen}
          onTransferSuccess={handleTransferSuccess}
        />
      </div>

      <BottomNav activeTab="transactions" />
    </div>
  );
};

export default Transactions;