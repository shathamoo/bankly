interface BankFilterChipsProps {
  selected: string;
  onSelect: (bank: string) => void;
}

export const BankFilterChips = ({ selected, onSelect }: BankFilterChipsProps) => {
  const banks = ['All', 'Arab Bank', 'Etihad', 'Safwa'];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      {banks.map((bank) => (
        <button
          key={bank}
          onClick={() => onSelect(bank)}
          className={`
            px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all duration-200 border-2
            ${selected === bank
              ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
              : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-secondary/50 hover:scale-102'
            }
          `}
        >
          {bank}
        </button>
      ))}
    </div>
  );
};