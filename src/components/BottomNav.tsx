import { useNavigate, useLocation } from "react-router-dom";
import { CreditCard, BarChart3, Receipt, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: "accounts" | "cards" | "transactions" | "transfer" | "insights";
}

export const BottomNav = ({ activeTab }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: "accounts",
      label: "Accounts",
      icon: Wallet,
      path: "/dashboard",
    },
    {
      id: "transactions", 
      label: "Transactions",
      icon: Receipt,
      path: "/transactions",
    },
    {
      id: "transfer",
      label: "Transfer",
      icon: CreditCard,
      path: "/transfer",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-6 w-6 mb-1", isActive && "text-primary")} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "text-primary"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};