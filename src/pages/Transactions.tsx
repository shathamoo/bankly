import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { TransactionItem } from "@/components/TransactionItem";

const Transactions = () => {
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filters = ["All", "Arab Bank", "Etihad", "Safwa"];

  const transactions = [
    {
      id: 1,
      merchant: "Starbucks Abdali",
      date: "2025-09-10",
      amount: -8.75,
      currency: "JOD",
      category: "Food & Coffee",
      categoryColor: "bg-orange-500",
    },
    {
      id: 2,
      merchant: "JEPCO",
      date: "2025-09-12", 
      amount: -35.20,
      currency: "JOD",
      category: "Bills",
      categoryColor: "bg-blue-500",
    },
    {
      id: 3,
      merchant: "Salary",
      date: "2025-09-01",
      amount: 900.00,
      currency: "JOD", 
      category: "Salary",
      categoryColor: "bg-green-500",
    },
    {
      id: 4,
      merchant: "Carrefour",
      date: "2025-09-08",
      amount: -45.60,
      currency: "JOD",
      category: "Shopping",
      categoryColor: "bg-purple-500",
    },
    {
      id: 5,
      merchant: "Shell Station",
      date: "2025-09-07",
      amount: -25.00,
      currency: "JOD",
      category: "Transport",
      categoryColor: "bg-red-500",
    },
    {
      id: 6,
      merchant: "Orange Telecom",
      date: "2025-09-05",
      amount: -15.90,
      currency: "JOD",
      category: "Bills", 
      categoryColor: "bg-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-6">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
      </div>

      {/* Filter Chips */}
      <div className="px-6 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <Badge
              key={filter}
              variant={selectedFilter === filter ? "default" : "secondary"}
              className={`px-4 py-2 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                selectedFilter === filter
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-6 pb-24 space-y-2">
        {transactions.map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </div>

      <BottomNav activeTab="transactions" />
    </div>
  );
};

export default Transactions;