import { useState } from "react";
import { Menu, CreditCard, BarChart3, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav } from "@/components/BottomNav";
import { AccountCard } from "@/components/AccountCard"; 
import { SideDrawer } from "@/components/SideDrawer";
import banklyIcon from "@/assets/bankly-icon.png";
import arabBankLogo from "@/assets/arab-bank-logo.png";
import etihadBankLogo from "@/assets/etihad-bank-logo.png";
import safwaBankLogo from "@/assets/safwa-bank-logo.png";

const Dashboard = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const accounts = [
    {
      id: 1,
      bankName: "Arab Bank",
      balance: "12,700",
      currency: "JOD",
      logo: arabBankLogo,
    },
    {
      id: 2,
      bankName: "Etihad Bank", 
      balance: "8,450",
      currency: "JOD",
      logo: etihadBankLogo,
    },
    {
      id: 3,
      bankName: "Safwa Islamic",
      balance: "5,980", 
      currency: "JOD",
      logo: safwaBankLogo,
    },
  ];

  const totalBalance = accounts.reduce(
    (sum, account) => sum + parseFloat(account.balance.replace(",", "")), 
    0
  );

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
              <SideDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-3">
            <img src={banklyIcon} alt="Bankly" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold text-primary">Bankly</span>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-semibold text-primary">
            Hello, Shatha Abuhammour
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-24 space-y-6">
        {/* Account Cards */}
        <div className="space-y-4">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
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

      <BottomNav activeTab="accounts" />
    </div>
  );
};

export default Dashboard;