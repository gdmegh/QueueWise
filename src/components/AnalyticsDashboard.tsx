import type { FC } from 'react';
import { BarChart, Clock, MessageSquareQuote, Sigma, Users } from 'lucide-react';
import { Bar, Pie, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart as RechartsPieChart, Cell } from 'recharts';
import type { AnalyticsData, QueueMember } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';

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
  allServiced: QueueMember[];
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const AnalyticsDashboard: FC<AnalyticsDashboardProps> = ({ analytics, allServiced }) => {
  const servicePopularityData = (allServiced || [])
    .flatMap(member => (member.services || []).map(s => s.name))
    .reduce((acc, serviceName) => {
      const existing = acc.find(item => item.name === serviceName);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: serviceName, value: 1 });
      }
      return acc;
    }, [] as { name: string; value: number }[]);
  
  const hourlyTrafficData = Array.from({ length: 12 }, (_, i) => ({ hour: `${i + 8} a.m.`, customers: 0 }))
  allServiced.forEach(member => {
    const hour = new Date(member.checkInTime).getHours();
    if (hour >= 8 && hour < 20) {
      const index = hour - 8;
      hourlyTrafficData[index].customers += 1;
    }
  });


  return (
    <Card className="h-full bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-primary"><BarChart /> Service Analytics</CardTitle>
        <CardDescription>Overview of today's queue performance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Hourly Customer Traffic</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                        <ResponsiveContainer>
                            <RechartsBarChart data={hourlyTrafficData}>
                                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip content={<ChartTooltipContent />} cursor={{fill: 'hsl(var(--muted))'}}/>
                                <Bar dataKey="customers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Service Popularity</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[250px] w-full">
                       <ResponsiveContainer>
                            <RechartsPieChart>
                                <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                                <Legend />
                                <Pie data={servicePopularityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                     {servicePopularityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
};
