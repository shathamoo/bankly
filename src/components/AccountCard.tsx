interface Account {
  id: number;
  bankName: string;
  balance: string;
  currency: string;
  logo: string;
}

interface AccountCardProps {
  account: Account;
}

export const AccountCard = ({ account }: AccountCardProps) => {
  return (
    <div className="bg-background rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={account.logo} 
            alt={account.bankName}
            className="w-12 h-12 rounded-lg object-cover bg-secondary"
          />
          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {account.bankName}
            </h3>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            {account.balance}
          </p>
          <p className="text-sm text-muted-foreground font-medium">
            {account.currency}
          </p>
        </div>
      </div>
    </div>
  );
};