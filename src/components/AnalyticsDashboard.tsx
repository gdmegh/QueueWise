import type { FC } from 'react';
import { BarChart, Clock, Maximize, MessageSquareQuote, Sigma, Users } from 'lucide-react';
import type { AnalyticsData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}

const AnalyticsCard: FC<AnalyticsCardProps> = ({ title, value, icon, description }) => (
  <Card className="bg-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-primary">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

interface AnalyticsDashboardProps {
  analytics: AnalyticsData;
}

export const AnalyticsDashboard: FC<AnalyticsDashboardProps> = ({ analytics }) => {
  return (
    <Card className="h-full bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-primary"><BarChart /> Service Analytics</CardTitle>
        <CardDescription>Overview of today's queue performance.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <AnalyticsCard
            title="Total Serviced"
            value={analytics.servicedCount.toString()}
            icon={<Sigma className="h-4 w-4 text-muted-foreground" />}
            description="Number of users served today."
          />
          <AnalyticsCard
            title="Avg. Service Time"
            value={`${analytics.averageServiceTime.toFixed(1)} min`}
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            description="Average time spent per user."
          />
           <AnalyticsCard
            title="Feedback Received"
            value={analytics.feedbackReceived.toString()}
            icon={<MessageSquareQuote className="h-4 w-4 text-muted-foreground" />}
            description="Number of feedback submissions."
          />
           <AnalyticsCard
            title="Currently Waiting"
            value={analytics.totalWaiting.toString()}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            description="Users currently in the queue."
          />
        </div>
      </CardContent>
    </Card>
  );
};
