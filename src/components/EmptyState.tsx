import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const EmptyState = ({ message, icon: Icon = Inbox }: EmptyStateProps) => {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="flex flex-col items-center justify-center min-h-[200px] max-w-sm mx-auto text-center space-y-3">
        <Icon className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};