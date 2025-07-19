
'use client';

import { Bar, BarChart as RechartsBarChart, Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Crown, BarChart, Settings, PlusCircle, Loader2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/database';

interface Company {
  id: string;
  name: string;
  status: 'active' | 'trial' | 'inactive';
  users: number;
  plan: 'Enterprise' | 'Business' | 'Trial' | 'None';
}

const addCompanyFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.'),
  plan: z.enum(['Enterprise', 'Business', 'Trial']),
});

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
    const { toast } = useToast();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    
    const refreshData = () => {
        setCompanies(db.getCompanies());
    };

    useEffect(() => {
        refreshData();
    }, []);

    const addCompanyForm = useForm<z.infer<typeof addCompanyFormSchema>>({
        resolver: zodResolver(addCompanyFormSchema),
        defaultValues: { name: '', plan: 'Trial' },
    });

    const onAddCompanySubmit = (data: z.infer<typeof addCompanyFormSchema>) => {
        const newCompany: Company = {
            id: `comp-${Date.now()}`,
            name: data.name,
            plan: data.plan,
            status: data.plan === 'Trial' ? 'trial' : 'active',
            users: 0,
        };
        db.addCompany(newCompany);
        refreshData();
        toast({ title: 'Company Added', description: `${data.name} has been added to the platform.`});
        setAddModalOpen(false);
        addCompanyForm.reset();
    };

    const totalUsers = companies.reduce((acc, comp) => acc + (comp.status === 'active' ? comp.users : 0), 0);
    const activeSubscriptions = companies.filter(c => c.plan === 'Business' || c.plan === 'Enterprise').length;

    const plansChartData = Object.entries(
        companies.reduce((acc, comp) => {
            acc[comp.plan] = (acc[comp.plan] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([plan, count]) => ({
        plan,
        companies: count,
        fill: plansChartConfig[plan as keyof typeof plansChartConfig]?.color || 'hsl(var(--muted))'
    }));

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
                            <SuperAdminAnalyticsCard title="Total Companies" value={String(companies.length)} description="All registered companies." />
                            <SuperAdminAnalyticsCard title="Active Users" value={String(totalUsers)} description="Total users across all active companies." />
                            <SuperAdminAnalyticsCard title="Active Subscriptions" value={String(activeSubscriptions)} description="Companies on paid plans." />
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
                            <Dialog open={isAddModalOpen} onOpenChange={setAddModalOpen}>
                                <DialogTrigger asChild>
                                     <Button><PlusCircle className="mr-2"/> Add New Company</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add a New Company</DialogTitle>
                                    </DialogHeader>
                                    <Form {...addCompanyForm}>
                                        <form onSubmit={addCompanyForm.handleSubmit(onAddCompanySubmit)} className="space-y-4">
                                            <FormField control={addCompanyForm.control} name="name" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Company Name</FormLabel>
                                                    <FormControl><Input placeholder="New Company Inc." {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={addCompanyForm.control} name="plan" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Subscription Plan</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a plan" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Trial">Trial</SelectItem>
                                                            <SelectItem value="Business">Business</SelectItem>
                                                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <Button type="submit" className="w-full">
                                                {addCompanyForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Company'}
                                            </Button>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
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
                                        {companies.map(company => (
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
