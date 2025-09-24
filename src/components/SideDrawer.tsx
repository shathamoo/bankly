import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, HelpCircle, LogOut, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddAccountDialog } from "@/components/AddAccountDialog";
import banklyIcon from "@/assets/bankly-icon.png";

interface SideDrawerProps {
  onClose: () => void;
  onAccountAdded?: () => void;
}

export const SideDrawer = ({ onClose, onAccountAdded }: SideDrawerProps) => {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleLogout = () => {
    onClose();
    navigate("/");
  };

  const handleAddAccount = () => {
    setShowAddDialog(true);
  };

  const handleAccountAdded = () => {
    onAccountAdded?.();
    onClose();
  };

  const accountMenuItems = [
    {
      icon: Plus,
      label: "Add Account",
      onClick: handleAddAccount,
    },
    {
      icon: CreditCard,
      label: "Manage Accounts", 
      onClick: () => {
        onClose();
        navigate("/dashboard");
      },
    },
    {
      icon: CreditCard,
      label: "My Cards",
      onClick: () => {
        onClose();
        navigate("/cards");
      },
    },
  ];

  const menuItems = [
    {
      icon: User,
      label: "Profile",
      onClick: () => {
        onClose();
        // Navigate to profile page when implemented
      },
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => {
        onClose();
        // Navigate to settings page when implemented
      },
    },
    {
      icon: HelpCircle,
      label: "Help",
      onClick: () => {
        onClose();
        // Navigate to help page when implemented
      },
    },
  ];

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img src={banklyIcon} alt="Bankly" className="w-10 h-10 rounded-xl" />
          <div>
            <h2 className="text-xl font-bold text-primary">Bankly</h2>
            <p className="text-sm text-muted-foreground">Shatha Abuhammour</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-6 space-y-6">
        {/* Account Management */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">
            Account Management
          </h3>
          <div className="space-y-2">
            {accountMenuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-left hover:bg-secondary"
                  onClick={item.onClick}
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* General Menu */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">
            General
          </h3>
          <div className="space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-left hover:bg-secondary"
                  onClick={item.onClick}
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="p-6 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-left hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </Button>
      </div>

      {/* Add Account Dialog */}
      <AddAccountDialog 
        isOpen={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAccountAdded={handleAccountAdded}
      />
    </div>
  );
};