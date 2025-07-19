
'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { User, Shift, QueueMember, ShiftChangeRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, UserPlus, CalendarDays, Loader2, Shield, BarChart, Bell, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { differenceInMinutes, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';


// Mock current user - in a real app, this would come from an auth context
const MOCK_CURRENT_USER: User = { id: 1, name: 'Admin User', role: 'admin' };

const staffFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  role: z.enum(['staff', 'supervisor', 'admin']),
});

export default function AdminPage() {
  const [users, setUsers] = useLocalStorage<User[]>('users', [
    MOCK_CURRENT_USER,
    { id: 2, name: 'John Staff', role: 'staff' },
    { id: 3, name: 'Jane Supervisor', role: 'supervisor' },
    { id: 4, name: 'Emily Staff', role: 'staff' },
  ]);
  const [shifts, setShifts] = useLocalStorage<Shift[]>('shifts', [
    { id: 1, userId: 2, start: new Date('2024-08-01T09:00:00'), end: new Date('2024-08-01T17:00:00')},
    { id: 2, userId: 3, start: new Date('2024-08-01T10:00:00'), end: new Date('2024-08-01T18:00:00')},
    { id: 3, userId: 4, start: new Date('2024-08-01T09:00:00'), end: new Date('2024-08-01T17:00:00')},
  ]);
  const [shiftRequests, setShiftRequests] = useLocalStorage<ShiftChangeRequest[]>('shiftRequests', []);
  const [queue] = useLocalStorage<QueueMember[]>('queue', []);
  const [serviced] = useLocalStorage<QueueMember[]>('serviced', []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const staffForm = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
  });

  const hasPermission = (permission: 'manageStaff' | 'manageShifts' | 'manageRequests') => {
    if (MOCK_CURRENT_USER.role === 'admin') return true;
    if (MOCK_CURRENT_USER.role === 'supervisor' && (permission === 'manageShifts' || permission === 'manageRequests')) return true;
    return false;
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    staffForm.reset(user);
    setIsFormOpen(true);
  }

  const handleAddNewUser = () => {
    setEditingUser(null);
    staffForm.reset({ name: '', role: 'staff' });
    setIsFormOpen(true);
  }

  const handleDeleteUser = (userId: number) => {
    if (userId === MOCK_CURRENT_USER.id) {
        alert("Cannot delete the current user.");
        return;
    }
    setUsers(users.filter(u => u.id !== userId));
  }

  const onStaffSubmit = (data: z.infer<typeof staffFormSchema>) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
    } else {
      const newUser: User = { ...data, id: Date.now() };
      setUsers([...users, newUser]);
    }
    setIsFormOpen(false);
  }

  const handleRequestAction = (requestId: number, status: 'approved' | 'denied') => {
    setShiftRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status } : req
    ));
    if (status === 'approved') {
        const request = shiftRequests.find(req => req.id === requestId);
        if (request) {
            // This is a simplified logic. A real app might update existing shifts or add new ones.
            const newShift: Shift = {
                id: Date.now(),
                userId: request.userId,
                start: new Date(request.requestedStart),
                end: new Date(request.requestedEnd),
            };
            setShifts(prev => [...prev, newShift]);
        }
    }
  };

  const getAnalyticsData = () => {
      const allServiced = [...serviced, ...queue.filter(q => q.status === 'serviced')];
      const servicedCount = allServiced.length;
      const feedbackReceived = allServiced.filter(m => m.feedback).length;
      const totalWaiting = queue.filter(q => q.status === 'waiting').length;

      if (servicedCount === 0) {
        return { totalWaiting, servicedCount, averageServiceTime: 0, maxWaitTime: 0, feedbackReceived };
      }

      const waitTimes = allServiced.map(m =>
        Math.max(0, differenceInMinutes(new Date(m.estimatedServiceTime), new Date(m.checkInTime)))
      );
      const maxWaitTime = Math.max(...waitTimes);
      const totalServiceTime = allServiced.reduce(
        (acc, m) => acc + Math.max(0, differenceInMinutes(new Date(m.estimatedServiceTime), new Date(m.checkInTime))),
        0
      );
      const averageServiceTime = totalServiceTime / servicedCount;

      return { totalWaiting, servicedCount, averageServiceTime, maxWaitTime, feedbackReceived };
  }
  
  const pendingRequestsCount = shiftRequests.filter(req => req.status === 'pending').length;

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <Shield /> Admin Dashboard
          </CardTitle>
          <CardDescription>Manage staff, shifts, and system settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="dashboard">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard"><BarChart className="mr-2"/>Dashboard</TabsTrigger>
              <TabsTrigger value="staff" disabled={!hasPermission('manageStaff')}>Staff Management</TabsTrigger>
              <TabsTrigger value="shifts" disabled={!hasPermission('manageShifts')}>Shift Management</TabsTrigger>
               <TabsTrigger value="requests" disabled={!hasPermission('manageRequests')}>
                Shift Requests 
                {pendingRequestsCount > 0 && <Badge className="ml-2">{pendingRequestsCount}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-4">
               <AnalyticsDashboard analytics={getAnalyticsData()} />
            </TabsContent>

            <TabsContent value="staff" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Staff List</CardTitle>
                    <Button onClick={handleAddNewUser} disabled={!hasPermission('manageStaff')}><UserPlus className="mr-2"/> Add New Staff</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell className="capitalize">{user.role}</TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} disabled={!hasPermission('manageStaff')}>
                                <Edit className="h-4 w-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} disabled={!hasPermission('manageStaff') || user.id === MOCK_CURRENT_USER.id}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shifts" className="mt-4">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Upcoming Shifts</CardTitle>
                            <Button disabled><CalendarDays className="mr-2"/> Generate Shifts</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Member</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>End Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shifts.map(shift => (
                                    <TableRow key={shift.id}>
                                        <TableCell>{users.find(u => u.id === shift.userId)?.name || 'Unknown'}</TableCell>
                                        <TableCell>{new Date(shift.start).toLocaleString()}</TableCell>
                                        <TableCell>{new Date(shift.end).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="requests" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Shift Change Requests</CardTitle>
                  <CardDescription>Review and respond to staff shift change requests.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requester</TableHead>
                        <TableHead>Requested Period</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shiftRequests.length > 0 ? shiftRequests.map(req => (
                        <TableRow key={req.id}>
                          <TableCell>{req.requesterName}</TableCell>
                          <TableCell>{format(new Date(req.requestedStart), 'Pp')} - {format(new Date(req.requestedEnd), 'Pp')}</TableCell>
                          <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                          <TableCell>
                            <Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'approved' ? 'default' : 'destructive'} className="capitalize">
                                {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {req.status === 'pending' && (
                              <div className="space-x-2">
                                <Button size="icon" variant="outline" onClick={() => handleRequestAction(req.id, 'approved')}>
                                    <Check className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button size="icon" variant="outline" onClick={() => handleRequestAction(req.id, 'denied')}>
                                    <X className="h-4 w-4 text-red-500"/>
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">No shift requests.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            </DialogHeader>
            <Form {...staffForm}>
                <form onSubmit={staffForm.handleSubmit(onStaffSubmit)} className="space-y-4">
                    <FormField
                        control={staffForm.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={staffForm.control}
                        name="role"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="supervisor">Supervisor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit">
                        {staffForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Staff'}
                    </Button>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
