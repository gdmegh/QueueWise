
'use client';

import { useState, useEffect } from 'react';
import { User, Shift, QueueMember, ShiftChangeRequest, CompanySettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, UserPlus, CalendarDays, Loader2, Shield, BarChart, Bell, Check, X, Settings, Image as ImageIcon, Palette, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { differenceInMinutes, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import * as db from '@/lib/database';

// Mock current user - in a real app, this would come from an auth context
const MOCK_CURRENT_USER: User = { id: 1, name: 'Admin User', role: 'admin' };

const staffFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  role: z.enum(['staff', 'supervisor', 'admin']),
});

const companySettingsSchema = z.object({
  name: z.string().min(1, 'Company name is required.'),
  logoUrl: z.string().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, 'Invalid HSL color format. Use: H S% L%'),
});


export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftRequests, setShiftRequests] = useState<ShiftChangeRequest[]>([]);
  const [queue, setQueue] = useState<QueueMember[]>([]);
  const [serviced, setServiced] = useState<QueueMember[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({ name: '', logoUrl: '', primaryColor: '' });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const staffForm = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
  });

  const settingsForm = useForm<z.infer<typeof companySettingsSchema>>({
    resolver: zodResolver(companySettingsSchema),
  });
  
  const refreshData = () => {
    setUsers(db.getUsers());
    setShifts(db.getData<Shift[]>('shifts'));
    setShiftRequests(db.getData<ShiftChangeRequest[]>('shiftRequests'));
    setQueue(db.getData<QueueMember[]>('queue'));
    setServiced(db.getData<QueueMember[]>('serviced'));
    const settings = db.getCompanySettings();
    setCompanySettings(settings);
    settingsForm.reset({
      ...settings,
      logoUrl: settings.logoUrl || '',
    });
  };

  useEffect(() => {
    refreshData();
  }, []);
  
  useEffect(() => {
    if (companySettings.primaryColor) {
        document.documentElement.style.setProperty('--primary', companySettings.primaryColor.replace(/\s/g, ' '));
    }
  }, [companySettings.primaryColor]);

  const hasPermission = (permission: 'manageStaff' | 'manageShifts' | 'manageRequests' | 'manageSettings') => {
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
    db.deleteUser(userId);
    refreshData();
  }

  const onStaffSubmit = (data: z.infer<typeof staffFormSchema>) => {
    if (editingUser) {
      db.updateUser({ ...editingUser, ...data });
    } else {
      db.addUser({ ...data, id: Date.now() });
    }
    refreshData();
    setIsFormOpen(false);
  }
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newLogoUrl = `/assets/${file.name}`;
      // In a real app, you would upload the file to a server here.
      // For this prototype, we'll just set the path.
      settingsForm.setValue('logoUrl', newLogoUrl);
      console.log(`Simulating upload of ${file.name}. New path: ${newLogoUrl}`);
    }
  };

  const onSettingsSubmit = (data: z.infer<typeof companySettingsSchema>) => {
    db.setCompanySettings(data);
    refreshData();
    alert('Settings saved! The primary color has been updated.');
  };

  const handleRequestAction = (requestId: number, status: 'approved' | 'denied') => {
    const request = db.updateShiftRequestStatus(requestId, status);
    if (status === 'approved' && request) {
      db.addShift({
        id: Date.now(),
        userId: request.userId,
        start: new Date(request.requestedStart),
        end: new Date(request.requestedEnd),
      });
    }
    refreshData();
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
        m.checkInTime && m.services[0]?.startTime ? Math.max(0, differenceInMinutes(new Date(m.services[0].startTime), new Date(m.checkInTime))) : 0
      );
      const maxWaitTime = Math.max(...waitTimes);

      const serviceTimes = allServiced.flatMap(m => m.services).map(s => 
        s.startTime && s.endTime ? Math.max(0, differenceInMinutes(new Date(s.endTime), new Date(s.startTime))) : 0
      );
      const totalServiceTime = serviceTimes.reduce((acc, time) => acc + time, 0);
      const averageServiceTime = serviceTimes.length > 0 ? totalServiceTime / serviceTimes.length : 0;

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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard"><BarChart className="mr-2"/>Dashboard</TabsTrigger>
              <TabsTrigger value="staff" disabled={!hasPermission('manageStaff')}>Staff Management</TabsTrigger>
              <TabsTrigger value="shifts" disabled={!hasPermission('manageShifts')}>Shift Management</TabsTrigger>
               <TabsTrigger value="requests" disabled={!hasPermission('manageRequests')}>
                Shift Requests 
                {pendingRequestsCount > 0 && <Badge className="ml-2">{pendingRequestsCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="setup" disabled={!hasPermission('manageSettings')}><Settings className="mr-2"/>Setup</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-4">
               <AnalyticsDashboard analytics={getAnalyticsData()} allServiced={[...serviced, ...queue.filter(q => q.status === 'serviced')]} />
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
                                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-400" />
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
            
            <TabsContent value="setup" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Setup</CardTitle>
                  <CardDescription>Customize the application's appearance and branding.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6 max-w-lg">
                      <FormField
                          control={settingsForm.control}
                          name="name"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                  <Input placeholder="Your Company Inc." {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormItem>
                          <FormLabel>Company Logo</FormLabel>
                          <div className="flex items-center gap-4">
                              <FormControl>
                                  <Input id="logo-upload" type="file" className="sr-only" onChange={handleLogoUpload} accept="image/png, image/jpeg, image/svg+xml"/>
                              </FormControl>
                              <label htmlFor="logo-upload" className="flex-grow">
                                <Button type="button" asChild>
                                  <span><Upload className="mr-2"/> Upload Logo</span>
                                </Button>
                              </label>
                              {settingsForm.watch('logoUrl') ? (
                                  <Image data-ai-hint="logo" src={settingsForm.watch('logoUrl') as string} alt="Company Logo" width={40} height={40} className="rounded-md bg-muted object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40.png' }}/>
                              ) : (
                                  <div className="w-10 h-10 flex items-center justify-center rounded-md bg-muted text-muted-foreground">
                                      <ImageIcon/>
                                  </div>
                              )}
                          </div>
                          <FormMessage />
                      </FormItem>
                      <FormField
                          control={settingsForm.control}
                          name="primaryColor"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Primary Color (HSL)</FormLabel>
                               <div className="flex items-center gap-4">
                                <FormControl>
                                    <Input placeholder="e.g. 220 14% 10%" {...field} />
                                </FormControl>
                                <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: `hsl(${field.value})` }}/>
                               </div>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <Button type="submit">
                          {settingsForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Settings'}
                      </Button>
                    </form>
                  </Form>
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
