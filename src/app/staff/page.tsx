
'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { User, Shift, QueueMember, ShiftChangeRequest } from '@/lib/types';
import { services } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCog, Users, CalendarOff, Check, Send, ArrowRightLeft, Loader2, List } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Mock current staff user - in a real app, this would come from an auth context
const MOCK_CURRENT_STAFF: User = { id: 2, name: 'Dr. John Smith', role: 'staff' };

const resolveFormSchema = z.object({
  notes: z.string().min(1, 'Service notes cannot be empty.'),
});

const transferFormSchema = z.object({
  targetStaffId: z.string(),
});

const shiftRequestFormSchema = z.object({
    fromDate: z.string().min(1, "Please select a start date."),
    fromTime: z.string().min(1, "Please select a start time."),
    toDate: z.string().min(1, "Please select an end date."),
    toTime: z.string().min(1, "Please select an end time."),
    reason: z.string().min(10, "Please provide a reason of at least 10 characters.")
});

export default function StaffPage() {
  const [users, setUsers] = useLocalStorage<User[]>('users', []);
  const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', []);
  const [serviced, setServiced] = useLocalStorage<QueueMember[]>('serviced', []);
  const [shiftRequests, setShiftRequests] = useLocalStorage<ShiftChangeRequest[]>('shiftRequests', []);
  const [activeToken, setActiveToken] = useState<QueueMember | null>(null);
  const [isResolveModalOpen, setResolveModalOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isShiftRequestModalOpen, setShiftRequestModalOpen] = useState(false);
  const { toast } = useToast();

  const myQueue = queue.filter(m => m.assignedTo === MOCK_CURRENT_STAFF.id || !m.assignedTo); // For demo, staff sees unassigned too
  const otherStaff = users.filter(u => u.role !== 'admin' && u.id !== MOCK_CURRENT_STAFF.id);

  const resolveForm = useForm<z.infer<typeof resolveFormSchema>>({ resolver: zodResolver(resolveFormSchema) });
  const transferForm = useForm<z.infer<typeof transferFormSchema>>({ resolver: zodResolver(transferFormSchema) });
  const shiftRequestForm = useForm<z.infer<typeof shiftRequestFormSchema>>({ resolver: zodResolver(shiftRequestFormSchema) });

  const handleResolve = (token: QueueMember) => {
    setActiveToken(token);
    resolveForm.reset();
    setResolveModalOpen(true);
  };

  const onResolveSubmit = (data: z.infer<typeof resolveFormSchema>) => {
    if (!activeToken) return;
    const resolvedMember: QueueMember = {
      ...activeToken,
      status: 'serviced',
      serviceNotes: data.notes,
    };
    setServiced(prev => [...prev, resolvedMember]);
    setQueue(prev => prev.filter(m => m.id !== activeToken.id));
    setResolveModalOpen(false);
    toast({ title: "Token Resolved", description: `Token ${activeToken.ticketNumber} marked as complete.` });
  };

  const handleTransfer = (token: QueueMember) => {
    setActiveToken(token);
    transferForm.reset();
    setTransferModalOpen(true);
  };

  const onTransferSubmit = (data: z.infer<typeof transferFormSchema>) => {
    if (!activeToken) return;
    const targetStaffId = parseInt(data.targetStaffId, 10);
    setQueue(prev => prev.map(m => m.id === activeToken.id ? { ...m, assignedTo: targetStaffId } : m));
    setTransferModalOpen(false);
    toast({ title: "Token Transferred", description: `Token ${activeToken.ticketNumber} transferred.` });
  };

  const onShiftRequestSubmit = (data: z.infer<typeof shiftRequestFormSchema>) => {
    const newRequest: ShiftChangeRequest = {
        id: Date.now(),
        userId: MOCK_CURRENT_STAFF.id,
        requesterName: MOCK_CURRENT_STAFF.name,
        requestedStart: new Date(`${data.fromDate}T${data.fromTime}`),
        requestedEnd: new Date(`${data.toDate}T${data.toTime}`),
        reason: data.reason,
        status: 'pending',
    };
    
    setShiftRequests(prev => [...prev, newRequest]);
    
    toast({ title: "Request Sent", description: "Your shift change request has been sent for approval." });
    shiftRequestForm.reset();
    setShiftRequestModalOpen(false);
  };

  const staffLastName = MOCK_CURRENT_STAFF.name.split(' ').slice(1).join(' ');

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <UserCog /> Staff Panel
          </CardTitle>
          <CardDescription>Hi {MOCK_CURRENT_STAFF.name}, manage your assigned queue and tasks.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users/> Patient Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ticket</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Services</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myQueue.length > 0 ? myQueue.map(member => (
                                    <TableRow key={member.id}>
                                        <TableCell><Badge variant="secondary">{member.ticketNumber}</Badge></TableCell>
                                        <TableCell>{member.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {member.services.map((s, i) => (
                                                    <Badge variant="outline" key={i} className="text-xs">{s.name}</Badge>
                                                ))}
                                                {member.services.length === 0 && <Badge variant="outline">Pending</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button size="sm" variant="outline" onClick={() => handleResolve(member)}><Check className="mr-1 h-4 w-4"/> Resolve</Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleTransfer(member)}><ArrowRightLeft className="mr-1 h-4 w-4"/> Transfer</Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Your queue is empty.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CalendarOff/> Shift Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Need to request a change to your work schedule? Submit a request here for supervisor approval.</p>
                        <Dialog open={isShiftRequestModalOpen} onOpenChange={setShiftRequestModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full"><Send className="mr-2"/> Request Shift Change</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Shift Change Request</DialogTitle>
                                    <DialogDescription>
                                        Fill out the details below to request a change to your shift. This will be sent to your supervisor for approval.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...shiftRequestForm}>
                                    <form onSubmit={shiftRequestForm.handleSubmit(onShiftRequestSubmit)} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={shiftRequestForm.control} name="fromDate" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>From Date</FormLabel>
                                                    <FormControl><Input type="date" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={shiftRequestForm.control} name="fromTime" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>From Time</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                         <div className="grid grid-cols-2 gap-4">
                                            <FormField control={shiftRequestForm.control} name="toDate" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>To Date</FormLabel>
                                                    <FormControl><Input type="date" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={shiftRequestForm.control} name="toTime" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>To Time</FormLabel>
                                                    <FormControl><Input type="time" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <FormField control={shiftRequestForm.control} name="reason" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reason</FormLabel>
                                                <FormControl><Textarea placeholder="Please state the reason for your shift change request..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <Button type="submit" className="w-full">
                                            {shiftRequestForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : 'Send Request'}
                                        </Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
      </Card>
      
      {/* Resolve Modal */}
      <Dialog open={isResolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Resolve Token: {activeToken?.ticketNumber}</DialogTitle>
                <DialogDescription>Add service notes before marking this token as complete.</DialogDescription>
            </DialogHeader>
            <Form {...resolveForm}>
                <form onSubmit={resolveForm.handleSubmit(onResolveSubmit)} className="space-y-4">
                    <FormField
                        control={resolveForm.control}
                        name="notes"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Service Notes</FormLabel>
                            <FormControl>
                                <Textarea placeholder="e.g., Patient consulted for flu symptoms. Prescription provided." {...field} rows={4}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full">
                        {resolveForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Resolution'}
                    </Button>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      {/* Transfer Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Transfer Token: {activeToken?.ticketNumber}</DialogTitle>
                <DialogDescription>Select a staff member to transfer this token to.</DialogDescription>
            </DialogHeader>
            <Form {...transferForm}>
                <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
                    <FormField
                        control={transferForm.control}
                        name="targetStaffId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Transfer To</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a staff member" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {otherStaff.map(staff => (
                                        <SelectItem key={staff.id} value={String(staff.id)}>{staff.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full">
                        {transferForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Transfer'}
                    </Button>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
