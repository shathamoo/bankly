import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { InsightCard } from "@/components/InsightCard";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const Insights = () => {
  const [transferData, setTransferData] = useState({ amount: 0, count: 0, percentage: 0 });
  const [totalSpending, setTotalSpending] = useState(0);

  // Fetch transfer data for current month
  const fetchTransferData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return;
      }

      // Get current month's start and end dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString());

      if (error) {
        console.error("Error fetching transfer data:", error);
        return;
      }

      const transfers = data || [];
      const transferAmount = transfers.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const transferCount = transfers.length;

      // Calculate percentage of total spending (using static data as baseline)
      const staticSpending = 376.8; // Sum of static transactions
      const total = staticSpending + transferAmount;
      const percentage = total > 0 ? (transferAmount / total) * 100 : 0;

      setTransferData({
        amount: transferAmount,
        count: transferCount,
        percentage: Math.round(percentage)
      });
      setTotalSpending(total);
    } catch (error) {
      console.error("Error in fetchTransferData:", error);
    }
  };

  useEffect(() => {
    fetchTransferData();
  }, []);

  const monthlyInsight = transferData.count > 0 
    ? `You spent 15% less this month compared to last month. Your top spending category was Food & Coffee. You made ${transferData.count} transfer${transferData.count > 1 ? 's' : ''} between your accounts totaling ${transferData.amount.toFixed(2)} JOD.`
    : "You spent 15% less this month compared to last month. Your top spending category was Food & Coffee.";

  const topCategories = [
    { category: "Food & Coffee", amount: 125.30, color: "#f97316" },
    { category: "Bills", amount: 98.50, color: "#3b82f6" },
    { category: "Shopping", amount: 87.20, color: "#8b5cf6" },
    { category: "Transport", amount: 65.80, color: "#ef4444" },
    ...(transferData.amount > 0 ? [{ category: "Transfers", amount: transferData.amount, color: "#10b981" }] : [])
  ];

  const tips = [
    "Set up automatic savings of 200 JOD monthly to reach your goals faster.",
    "Consider switching to a cashback credit card for your regular purchases.",
    "Your coffee spending increased by 20% - try brewing at home twice a week.",
    ...(transferData.percentage > 20 ? [`${transferData.percentage}% of your financial activity this month were transfers between your accounts. Great job managing your money!`] : [])
  ];

  const chartData = topCategories.map(cat => ({
    name: cat.category,
    value: cat.amount,
    color: cat.color
  }));

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-6">
        <h1 className="text-2xl font-bold text-foreground">Monthly Insights</h1>
      </div>

      {/* Content */}
      <div className="p-6 pb-24 space-y-6">
        {/* Summary Insight */}
        <InsightCard title="Monthly Summary">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {monthlyInsight}
          </p>
        </InsightCard>

        {/* Spending Chart */}
        <InsightCard title="Spending Breakdown">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value} JOD`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </InsightCard>

        {/* Top Categories */}
        <InsightCard title="Top Spending Categories">
          <div className="space-y-3">
            {topCategories.map((cat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {cat.category}
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {cat.amount.toFixed(2)} JOD
                </span>
              </div>
            ))}
          </div>
        </InsightCard>

        {/* Tips */}
        <InsightCard title="Smart Tips">
          <div className="space-y-3">
            {tips.map((tip, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </InsightCard>
      </div>

      <BottomNav activeTab="insights" />
    </div>
  );
};

export default Insights;