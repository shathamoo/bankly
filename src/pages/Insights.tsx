import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { InsightCard } from "@/components/InsightCard";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const Insights = () => {
  const [transferData, setTransferData] = useState({ amount: 0, count: 0, percentage: 0 });
  const [externalTransferData, setExternalTransferData] = useState({ amount: 0, count: 0, percentage: 0 });
  const [totalSpending, setTotalSpending] = useState(0);
  const [aiTips, setAiTips] = useState<string[]>([]);

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

      // Fetch internal transfers (between accounts)
      const { data: internalData, error: internalError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("transaction_type", "transfer")
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString());

      // Fetch external transfers
      const { data: externalData, error: externalError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("transaction_type", "external_transfer")
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString());

      if (internalError || externalError) {
        console.error("Error fetching transfer data:", internalError || externalError);
        return;
      }

      // Process internal transfers
      const internalTransfers = internalData || [];
      const internalTransferAmount = internalTransfers.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const internalTransferCount = internalTransfers.length;

      // Process external transfers
      const externalTransfers = externalData || [];
      const externalTransferAmount = externalTransfers.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const externalTransferCount = externalTransfers.length;

      // Calculate percentages of total spending (using static data as baseline)
      const staticSpending = 376.8; // Sum of static transactions
      const total = staticSpending + internalTransferAmount + externalTransferAmount;
      const internalPercentage = total > 0 ? (internalTransferAmount / total) * 100 : 0;
      const externalPercentage = total > 0 ? (externalTransferAmount / total) * 100 : 0;

      setTransferData({
        amount: internalTransferAmount,
        count: internalTransferCount,
        percentage: Math.round(internalPercentage)
      });

      setExternalTransferData({
        amount: externalTransferAmount,
        count: externalTransferCount,
        percentage: Math.round(externalPercentage)
      });

      setTotalSpending(total);
    } catch (error) {
      console.error("Error in fetchTransferData:", error);
    }
  };

  // Function to get AI-generated tips
  const fetchAiTips = async (categories: any[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-tips', {
        body: { categories }
      });
      
      if (error) {
        console.error('Error fetching AI tips:', error);
        return;
      }
      
      if (data?.tips && Array.isArray(data.tips)) {
        setAiTips(data.tips);
      }
    } catch (error) {
      console.error('Error calling AI tips function:', error);
      // Fail silently - don't break the page
    }
  };

  useEffect(() => {
    fetchTransferData();
  }, []);

  const monthlyInsight = (() => {
    let insight = "You spent 15% less this month compared to last month. Your top spending category was Food & Coffee.";
    
    if (transferData.count > 0 && externalTransferData.count > 0) {
      insight += ` You made ${transferData.count} transfer${transferData.count > 1 ? 's' : ''} between your accounts totaling ${transferData.amount.toFixed(2)} JOD, and ${externalTransferData.count} external transfer${externalTransferData.count > 1 ? 's' : ''} totaling ${externalTransferData.amount.toFixed(2)} JOD.`;
    } else if (transferData.count > 0) {
      insight += ` You made ${transferData.count} transfer${transferData.count > 1 ? 's' : ''} between your accounts totaling ${transferData.amount.toFixed(2)} JOD.`;
    } else if (externalTransferData.count > 0) {
      insight += ` You made ${externalTransferData.count} external transfer${externalTransferData.count > 1 ? 's' : ''} totaling ${externalTransferData.amount.toFixed(2)} JOD.`;
    }
    
    return insight;
  })();

  const topCategories = [
    { category: "Food & Coffee", amount: 125.30, color: "#f97316" },
    { category: "Bills", amount: 98.50, color: "#3b82f6" },
    { category: "Shopping", amount: 87.20, color: "#8b5cf6" },
    { category: "Transport", amount: 65.80, color: "#ef4444" },
    ...(transferData.amount > 0 ? [{ category: "Internal Transfers", amount: transferData.amount, color: "#10b981" }] : []),
    ...(externalTransferData.amount > 0 ? [{ category: "External Transfers", amount: externalTransferData.amount, color: "#06b6d4" }] : [])
  ];

  // Fetch AI tips when categories are computed
  useEffect(() => {
    if (topCategories.length > 0) {
      fetchAiTips(topCategories);
    }
  }, [transferData.amount, externalTransferData.amount]);

  const tips = [
    "Set up automatic savings of 200 JOD monthly to reach your goals faster.",
    "Consider switching to a cashback credit card for your regular purchases.",
    "Your coffee spending increased by 20% - try brewing at home twice a week.",
    ...(transferData.percentage > 20 ? [`${transferData.percentage}% of your financial activity this month were transfers between your accounts. Great job managing your money!`] : []),
    ...(externalTransferData.percentage > 20 ? [`${externalTransferData.percentage}% of your spending this month were external transfers. Consider reducing frequent external transfers to save on fees.`] : [])
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

        {/* AI Smart Tips */}
        {aiTips.length > 0 && (
          <InsightCard title="AI Smart Tips">
            <div className="space-y-3">
              {aiTips.map((tip, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </InsightCard>
        )}
      </div>

      <BottomNav activeTab="insights" />
    </div>
  );
};

export default Insights;