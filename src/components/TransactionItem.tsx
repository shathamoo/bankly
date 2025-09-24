import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: number;
  merchant: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  categoryColor: string;
}

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const isPositive = transaction.amount > 0;
  const formattedAmount = Math.abs(transaction.amount).toFixed(2);
  
  return (
    <div className="bg-background rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">
              {transaction.merchant}
            </h3>
            <p className={`text-lg font-bold ${
              isPositive ? "text-green-600" : "text-foreground"
            }`}>
              {isPositive ? "+" : "-"}{formattedAmount} {transaction.currency}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {new Date(transaction.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short', 
                day: 'numeric'
              })}
            </p>
            
            <Badge 
              variant="secondary"
              className="text-xs px-2 py-1 rounded-full"
            >
              <div className="flex items-center gap-1">
                <div 
                  className={`w-2 h-2 rounded-full ${transaction.categoryColor}`}
                />
                {transaction.category}
              </div>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};