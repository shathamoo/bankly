import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { TransactionItem } from "@/components/TransactionItem";
import { BankFilterChips } from "@/components/BankFilterChips";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";

interface TransferTransaction {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string;
  created_at: string;
  from_account?: { id: string; bank_name: string };
  to_account?: { id: string; bank_name: string };
}

const Transactions = () => {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [transferTransactions, setTransferTransactions] = useState<TransferTransaction[]>([]);

  const filters = ["All", "Arab Bank", "Etihad", "Safwa"];

  // Static transaction data for demo purposes
  const staticTransactions = [
    {
      id: "static-1",
      merchant: "Starbucks Abdali",
      date: "2025-09-10",
      amount: -8.75,
      currency: "JOD",
      category: "Food & Coffee",
      categoryColor: "bg-orange-500",
      bank: "Arab Bank",
    },
    {
      id: "static-2",
      merchant: "JEPCO",
      date: "2025-09-12", 
      amount: -35.20,
      currency: "JOD",
      category: "Bills",
      categoryColor: "bg-blue-500",
      bank: "Etihad",
    },
    {
      id: "static-3",
      merchant: "Salary",
      date: "2025-09-01",
      amount: 900.00,
      currency: "JOD", 
      category: "Salary",
      categoryColor: "bg-green-500",
      bank: "Arab Bank",
    },
    {
      id: "static-4",
      merchant: "Carrefour",
      date: "2025-09-08",
      amount: -45.60,
      currency: "JOD",
      category: "Shopping",
      categoryColor: "bg-purple-500",
      bank: "Safwa",
    },
    {
      id: "static-5",
      merchant: "Shell Station",
      date: "2025-09-07",
      amount: -25.00,
      currency: "JOD",
      category: "Transport",
      categoryColor: "bg-red-500",
      bank: "Etihad",
    },
    {
      id: "static-6",
      merchant: "Orange Telecom",
      date: "2025-09-05",
      amount: -15.90,
      currency: "JOD",
      category: "Bills", 
      categoryColor: "bg-blue-500",
      bank: "Arab Bank",
    },
  ];

  // Fetch transfer transactions from database
  const fetchTransferTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transfer transactions:", error);
        return;
      }

      // Manually fetch account details for each transaction
      const transactionsWithAccounts = await Promise.all(
        (data || []).map(async (transaction) => {
          const [fromAccountResponse, toAccountResponse] = await Promise.all([
            supabase.from("accounts").select("id, bank_name").eq("id", transaction.from_account_id).single(),
            supabase.from("accounts").select("id, bank_name").eq("id", transaction.to_account_id).single()
          ]);

          return {
            ...transaction,
            from_account: fromAccountResponse.data || { id: transaction.from_account_id, bank_name: "Unknown" },
            to_account: toAccountResponse.data || { id: transaction.to_account_id, bank_name: "Unknown" }
          };
        })
      );

      setTransferTransactions(transactionsWithAccounts);
    } catch (error) {
      console.error("Error in fetchTransferTransactions:", error);
    }
  };

  useEffect(() => {
    fetchTransferTransactions();
  }, []);

  // Convert transfer transactions to display format
  const transferTransactionsForDisplay = transferTransactions.flatMap(transfer => [
    // Debit transaction (from account)
    {
      id: `${transfer.id}-debit`,
      merchant: `Transfer to ${transfer.to_account?.bank_name}`,
      date: new Date(transfer.created_at).toISOString().split('T')[0],
      amount: -transfer.amount,
      currency: "JOD",
      category: "Transfer",
      categoryColor: "bg-blue-500",
      bank: transfer.from_account?.bank_name || "Unknown",
    },
    // Credit transaction (to account)
    {
      id: `${transfer.id}-credit`,
      merchant: `Transfer from ${transfer.from_account?.bank_name}`,
      date: new Date(transfer.created_at).toISOString().split('T')[0],
      amount: transfer.amount,
      currency: "JOD",
      category: "Transfer",
      categoryColor: "bg-green-500",
      bank: transfer.to_account?.bank_name || "Unknown",
    }
  ]);

  // Combine static transactions with transfer transactions
  const allTransactions = [...staticTransactions, ...transferTransactionsForDisplay]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter transactions based on selected filter
  const filteredTransactions = selectedFilter === "All" 
    ? allTransactions 
    : allTransactions.filter(t => t.bank === selectedFilter);

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-6">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
      </div>

      {/* Filter Chips */}
      <div className="px-6 py-4">
        <BankFilterChips 
          selected={selectedFilter} 
          onSelect={setSelectedFilter}
        />
      </div>

      {/* Transactions List */}
      <div className="px-6 pb-24">
        {filteredTransactions.length > 0 ? (
          <div className="space-y-2">
            {filteredTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <EmptyState 
            message={`No transactions found for ${selectedFilter === "All" ? "any bank" : selectedFilter}. Try selecting a different filter or check back later.`}
          />
        )}
      </div>

      <BottomNav activeTab="transactions" />
    </div>
  );
};

export default Transactions;