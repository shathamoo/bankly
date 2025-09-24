import { ReactNode } from "react";

interface InsightCardProps {
  title: string;
  children: ReactNode;
}

export const InsightCard = ({ title, children }: InsightCardProps) => {
  return (
    <div className="bg-background rounded-2xl p-6 shadow-sm border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
};