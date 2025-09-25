import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav } from "@/components/BottomNav";
import { AccountCard } from "@/components/AccountCard"; 
import { SideDrawer } from "@/components/SideDrawer";
import { AddAccountDialog } from "@/components/AddAccountDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import banklyIcon from "@/assets/bankly-icon.png";
import arabBankLogo from "@/assets/arab-bank-logo.png";
import etihadBankLogo from "@/assets/etihad-bank-logo.png";
import safwaBankLogo from "@/assets/safwa-bank-logo.png";

interface Account {
  id: string;
  bank_name: string;
  balance: number;
  currency: string;
  logo_url?: string;
}

const Dashboard = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Default logos mapping
  const getLogoForBank = (bankName: string) => {
    const name = bankName.toLowerCase();
    if (name.includes('arab')) return arabBankLogo;
    if (name.includes('etihad')) return etihadBankLogo;  
    if (name.includes('safwa')) return safwaBankLogo;
    return banklyIcon;
  };

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Show default demo accounts if not logged in
        setAccounts([
          {
            id: "demo-1",
            bank_name: "Arab Bank",
            balance: 12700,
            currency: "JOD",
            logo_url: arabBankLogo,
          },
          {
            id: "demo-2", 
            bank_name: "Etihad Bank",
            balance: 8450,
            currency: "JOD",
            logo_url: etihadBankLogo,
          },
          {
            id: "demo-3",
            bank_name: "Safwa Islamic", 
            balance: 5980,
            currency: "JOD",
            logo_url: safwaBankLogo,
          },
        ]);
        return;
      }

      // Fetch user profile for display name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      setUser({ 
        ...user, 
        display_name: profile?.display_name || user.email || 'User' 
      });

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching accounts:", error);
        toast({
          title: "Error",
          description: "Failed to load accounts",
          variant: "destructive",
        });
        return;
      }

      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-secondary">
                <Menu className="h-6 w-6 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <SideDrawer 
                onClose={() => setIsDrawerOpen(false)} 
                onAccountAdded={fetchAccounts}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-3">
            <img src={banklyIcon} alt="Bankly" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold text-primary">Bankly</span>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-semibold text-primary">
            Hello, {user?.display_name || 'User'}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-24 space-y-6">
        {/* Account Cards */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No accounts yet. Add your first account!</p>
            </div>
          ) : (
            accounts.map((account) => (
              <AccountCard 
                key={account.id} 
                account={{
                  id: parseInt(account.id) || 0,
                  bankName: account.bank_name,
                  balance: account.balance.toLocaleString(),
                  currency: account.currency,
                  logo: account.logo_url || getLogoForBank(account.bank_name),
                }}
              />
            ))
          )}
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 shadow-lg">
          <div className="text-primary-foreground">
            <p className="text-sm opacity-90 font-medium">Total Balance</p>
            <p className="text-3xl font-bold mt-1">
              {totalBalance.toLocaleString()} JOD
            </p>
          </div>
        </div>
      </div>

      <AddAccountDialog onAccountAdded={fetchAccounts} />
      <BottomNav activeTab="accounts" />
    </div>
  );
};

export default Dashboard;