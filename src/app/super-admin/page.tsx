'use client';

import { Bar, BarChart as RechartsBarChart, Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Crown, BarChart, Settings, PlusCircle } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';

// Mock data for companies
const mockCompanies = [
  { id: 'comp-001', name: 'Innovate Corp', status: 'active', users: 150, plan: 'Enterprise' },
  { id: 'comp-002', name: 'Solutions Inc.', status: 'active', users: 75, plan: 'Business' },
  { id: 'comp-003', name: 'Data Systems', status: 'trial', users: 10, plan: 'Trial' },
  { id: 'comp-004', name: 'NextGen Ventures', status: 'inactive', users: 0, plan: 'None' },
  { id: 'comp-005', name: 'Global Connect', status: 'active', users: 300, plan: 'Enterprise' },
];

const SuperAdminAnalyticsCard = ({ title, value, description }: { title: string, value: string, description: string }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-bold text-primary">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const companiesChartData = [
  { month: 'January', companies: 2 },
  { month: 'February', companies: 1 },
  { month: 'March', companies: 3 },
  { month: 'April', companies: 5 },
  { month: 'May', companies: 4 },
  { month: 'June', companies: 6 },
];

const companiesChartConfig = {
  companies: {
    label: 'New Companies',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const plansChartData = [
  { plan: 'Enterprise', companies: 2, fill: 'hsl(var(--chart-1))' },
  { plan: 'Business', companies: 1, fill: 'hsl(var(--chart-2))' },
  { plan: 'Trial', companies: 1, fill: 'hsl(var(--chart-3))' },
  { plan: 'None', companies: 1, fill: 'hsl(var(--chart-5))' },
];

const plansChartConfig = {
    companies: {
      label: 'Companies',
    },
    Enterprise: {
        label: "Enterprise",
        color: "hsl(var(--chart-1))",
    },
    Business: {
        label: "Business",
        color: "hsl(var(--chart-2))",
    },
    Trial: {
        label: "Trial",
        color: "hsl(var(--chart-3))",
    },
    None: {
        label: "None",
        color: "hsl(var(--chart-5))",
    }
} satisfies ChartConfig;


export default function SuperAdminPage() {
    return (
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                        <Crown /> Super Admin Dashboard
                    </CardTitle>
                    <CardDescription>Oversee and manage all companies on the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Analytics Section */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><BarChart/> Platform Analytics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <SuperAdminAnalyticsCard title="Total Companies" value="5" description="All registered companies." />
                            <SuperAdminAnalyticsCard title="Active Users" value="525" description="Total users across all active companies." />
                            <SuperAdminAnalyticsCard title="Active Subscriptions" value="3" description="Companies on paid plans." />
                             <SuperAdminAnalyticsCard title="Platform Health" value="99.9%" description="System uptime over the last 30 days." />
                        </div>
                    </div>

                    {/* Graphical Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>New Companies Over Time</CardTitle>
                                <CardDescription>Monthly new company sign-ups.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={companiesChartConfig} className="h-[250px] w-full">
                                    <RechartsBarChart accessibilityLayer data={companiesChartData}>
                                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                        <Bar dataKey="companies" fill="var(--color-companies)" radius={4} />
                                    </RechartsBarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Subscription Plan Distribution</CardTitle>
                                <CardDescription>Distribution of active subscription plans.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                               <ChartContainer config={plansChartConfig} className="h-[250px] w-full aspect-square">
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="plan" hideLabel />} />
                                        <Pie data={plansChartData} dataKey="companies" nameKey="plan" innerRadius={50}>
                                            {plansChartData.map((entry) => (
                                                <Cell key={`cell-${entry.plan}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent nameKey="plan" />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Company Management Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Company Management</h2>
                            <Button><PlusCircle className="mr-2"/> Add New Company</Button>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Company Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Users</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockCompanies.map(company => (
                                            <TableRow key={company.id}>
                                                <TableCell className="font-medium">{company.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={company.status === 'active' ? 'default' : company.status === 'trial' ? 'secondary' : 'destructive'} className="capitalize">
                                                        {company.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{company.plan}</TableCell>
                                                <TableCell>{company.users}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon">
                                                        <Settings className="h-4 w-4" />
                                                        <span className="sr-only">Manage {company.name}</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
