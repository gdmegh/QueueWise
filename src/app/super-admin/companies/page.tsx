
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, PlusCircle, Loader2, Building } from 'lucide-react';
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
import { createCompanyAction } from '@/app/actions';

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


export default function CompanyManagementPage() {
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

    const onAddCompanySubmit = async (data: z.infer<typeof addCompanyFormSchema>) => {
        const result = await createCompanyAction(data.name, data.plan);
        if (result.success) {
            toast({ title: 'Company Added', description: `${data.name} has been added to the platform.`});
            setAddModalOpen(false);
            addCompanyForm.reset();
            refreshData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive'});
        }
    };

  return (
    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                <Building /> Company Management
            </CardTitle>
            <CardDescription>View, add, or manage all companies on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">All Companies</h2>
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
        </CardContent>
    </Card>
  );
}
