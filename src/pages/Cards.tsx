import { useState, useEffect } from "react";
import { Menu, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BottomNav } from "@/components/BottomNav";
import { SideDrawer } from "@/components/SideDrawer";
import { AddCardDialog } from "@/components/AddCardDialog";
import { CardItem } from "@/components/CardItem";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import banklyIcon from "@/assets/bankly-icon.png";

interface Card {
  id: string;
  masked_card_number: string;
  card_holder_name: string;
  bank_name: string;
  expiry_month: number;
  expiry_year: number;
  is_active: boolean;
  account_id: string;
  card_token: string;
  last_four_digits: string;
}

interface Account {
  id: string;
  bank_name: string;
}

const Cards = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCards([]);
        return;
      }

      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching cards:", error);
        toast({
          title: "Error",
          description: "Failed to load cards",
          variant: "destructive",
        });
        return;
      }

      setCards(data || []);
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setAccounts([]);
        return;
      }

      const { data, error } = await supabase
        .from("accounts")
        .select("id, bank_name")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching accounts:", error);
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
    Promise.all([fetchCards(), fetchAccounts()]);
  }, []);

  const handleToggleCardStatus = async (cardId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("cards")
        .update({ is_active: isActive })
        .eq("id", cardId);

      if (error) {
        console.error("Error updating card status:", error);
        toast({
          title: "Error",
          description: "Failed to update card status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Card ${isActive ? 'activated' : 'deactivated'} successfully`,
      });

      fetchCards();
    } catch (error) {
      console.error("Error updating card status:", error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from("cards")
        .delete()
        .eq("id", cardId);

      if (error) {
        console.error("Error deleting card:", error);
        toast({
          title: "Error",
          description: "Failed to delete card",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Card deleted successfully",
      });

      fetchCards();
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

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
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            My Cards
          </h1>
          <p className="text-muted-foreground">
            Manage your payment cards
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-24 space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            message="No cards yet. Add your first payment card to get started"
          />
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onToggleStatus={handleToggleCardStatus}
                onDelete={handleDeleteCard}
              />
            ))}
          </div>
        )}
      </div>

      <AddCardDialog 
        onCardAdded={fetchCards}
      />
      <BottomNav activeTab="cards" />
    </div>
  );
};

export default Cards;