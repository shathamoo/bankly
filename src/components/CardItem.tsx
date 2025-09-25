import { CreditCard, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Card {
  id: string;
  masked_card_number: string;
  card_holder_name: string;
  bank_name: string;
  expiry_month: number;
  expiry_year: number;
  is_active: boolean;
  card_token: string;
  last_four_digits: string;
}

interface CardItemProps {
  card: Card;
  onEdit?: (card: Card) => void;
  onDelete?: (cardId: string) => void;
  onToggleStatus?: (cardId: string, isActive: boolean) => void;
}

export const CardItem = ({ card, onEdit, onDelete, onToggleStatus }: CardItemProps) => {
  const getCardTypeColor = (lastFourDigits: string) => {
    // Simple card type detection based on first digit of last four
    const firstDigit = lastFourDigits.charAt(0);
    switch (firstDigit) {
      case '4': return 'bg-gradient-to-r from-blue-500 to-blue-600'; // Visa
      case '5': return 'bg-gradient-to-r from-red-500 to-red-600'; // Mastercard
      case '3': return 'bg-gradient-to-r from-green-500 to-green-600'; // Amex
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`rounded-2xl p-6 shadow-sm border transition-all ${
      card.is_active 
        ? 'border-border hover:shadow-md' 
        : 'border-muted bg-muted/50 opacity-60'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-8 rounded-lg flex items-center justify-center ${getCardTypeColor(card.last_four_digits)}`}>
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {card.bank_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {card.masked_card_number}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(card)}>
                Edit Card
              </DropdownMenuItem>
            )}
            {onToggleStatus && (
              <DropdownMenuItem 
                onClick={() => onToggleStatus(card.id, !card.is_active)}
              >
                {card.is_active ? 'Deactivate' : 'Activate'} Card
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(card.id)}
                className="text-destructive"
              >
                Delete Card
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Card Holder</p>
          <p className="font-medium text-foreground">
            {card.card_holder_name}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Expires</p>
          <p className="font-medium text-foreground">
            {card.expiry_month.toString().padStart(2, '0')}/{card.expiry_year.toString().slice(-2)}
          </p>
        </div>
      </div>

      {!card.is_active && (
        <div className="mt-3 p-2 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            This card is inactive
          </p>
        </div>
      )}
    </div>
  );
};