
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { CheckInForm } from '@/components/forms/CheckInForm';
import { WaitTimeCard } from '@/components/queue/WaitTimeCard';
import { QueueDisplay } from '@/components/queue/QueueDisplay';
import type { QueueMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Ticket, LogIn, Clock } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as QueueService from '@/lib/queue-service';
import { Badge } from '@/components/ui/badge';

const checkInFormSchema = z.object({
  phone: z.string().regex(/^\d{10,15}$/, { message: 'Please enter a valid phone number.' }),
});

const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const MAX_QUEUE_SIZE = 50;
const REFRESH_INTERVAL_MS = 5000;

const sampleUpcomingTokens = ['A-118', 'A-119', 'A-120', 'A-121', 'A-122', 'A-124', 'A-125'];

export default function HomePageContent() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [ticketCounter, setTicketCounter] = useLocalStorage('ticketCounter', 111);
  const [queue, setQueue] = useState<QueueMember[]>([]);
  const [serviced, setServiced] = useState<QueueMember[]>([]);

  const checkInForm = useForm<z.infer<typeof checkInFormSchema>>({
    resolver: zodResolver(checkInFormSchema),
    defaultValues: { phone: '' },
  });

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const refreshData = useCallback(() => {
    const currentQueue = QueueService.getQueue();
    const currentServiced = QueueService.getServiced();
    setQueue(currentQueue);
    setServiced(currentServiced);
  }, []);

  useEffect(() => {
    refreshData();
    const intervalId = setInterval(refreshData, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refreshData]);
  
  useEffect(() => {
    const simulationId = setInterval(() => {
        QueueService.runQueueSimulation();
        refreshData();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(simulationId);
  }, [refreshData]);


  const handleJoinQueueAsGuest = (data: z.infer<typeof checkInFormSchema>) => {
    const currentQueue = QueueService.getQueue();
    if (currentQueue.filter(q => q.status === 'waiting').length >= MAX_QUEUE_SIZE) {
      toast({
        title: "Queue is full",
        description: "We're sorry, the queue is currently full. Please try again later.",
        variant: 'destructive',
      });
      return;
    }

    const newMember: QueueMember = {
      id: Date.now(),
      ticketNumber: `A-${String(ticketCounter).padStart(3, '0')}`,
      phone: data.phone,
      checkInTime: new Date(),
      status: 'waiting',
      services: [],
      name: 'Guest User', // Default name for guests
      estimatedServiceTime: new Date(), // Placeholder
    };

    setTicketCounter(prev => prev + 1);
    
    const updatedQueue = [...currentQueue, newMember];
    QueueService.updateQueue(updatedQueue);
    refreshData();
    
    router.push(`/check-in?ticketNumber=${newMember.ticketNumber}`);
  };

  const handleLogin = (data: z.infer<typeof loginFormSchema>) => {
    // This is a simulated login
    toast({
        title: "Login Successful",
        description: `Welcome back, ${data.email}!`,
    });
    router.push('/account');
  };
  
  const handleEditService = (memberId: number) => {
    const member = queue.find(m => m.id === memberId);
    if (member) {
      router.push(`/service?ticketNumber=${member.ticketNumber}`);
    }
  };

  const handleSetFeedback = (memberId: number, feedback: any) => {
    const allMembers = [...QueueService.getQueue(), ...QueueService.getServiced()];
    const member = allMembers.find(m => m.id === memberId);
    
    if (member) {
        member.feedback = feedback;
        
        let queueList = QueueService.getQueue();
        const queueIndex = queueList.findIndex(q => q.id === memberId);
        if (queueIndex > -1) {
            queueList[queueIndex] = member;
            QueueService.updateQueue(queueList);
        }

        let servicedList = QueueService.getServiced();
        const servicedIndex = servicedList.findIndex(s => s.id === memberId);
        if (servicedIndex > -1) {
            const newServicedList = servicedList.map(s => s.id === memberId ? member : s);
            localStorage.setItem('serviced', JSON.stringify(newServicedList));
        }
    }
    refreshData();
  };

  const waitingQueue = queue.filter(q => q.status === 'waiting');
  const servicedToday = serviced.length + queue.filter(q => q.status === 'serviced').length;
  const nextInLine = waitingQueue.length > 0 ? waitingQueue[0] : null;

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <div className="space-y-8">
        {/* Check-in and Wait Time Section */}
        <div className="space-y-8">
            <div className="text-center">
                <Ticket className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight text-primary mt-4">Welcome to GD Clinic</h1>
                <p className="text-muted-foreground mt-2">Your health is our priority. Please check in to begin.</p>
            </div>

            <Tabs defaultValue="guest" className="w-full max-w-lg mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="guest">New Patient Check-in</TabsTrigger>
                    <TabsTrigger value="login">Registered Patient</TabsTrigger>
                </TabsList>
                <TabsContent value="guest" className="mt-4">
                    <CheckInForm onJoinQueue={handleJoinQueueAsGuest} isQueueFull={waitingQueue.length >= MAX_QUEUE_SIZE}/>
                </TabsContent>
                <TabsContent value="login" className="mt-4">
                    <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="font-headline text-primary">Patient Login</CardTitle>
                            <CardDescription>Access your account to see your history and get faster service.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...loginForm}>
                                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                                    <FormField
                                        control={loginForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={loginForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full"><LogIn className="mr-2"/> Login</Button>
                                    <Button variant="link" className="w-full text-xs">Don't have an account? Sign up</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <div className="max-w-lg mx-auto">
                <WaitTimeCard 
                    queueLength={waitingQueue.length} 
                    servicedCount={servicedToday}
                    nextTicket={nextInLine?.ticketNumber}
                />
            </div>
        </div>
        
        {/* Queue Display Section */}
        <div>
             <QueueDisplay 
                queue={queue} 
                onEditService={handleEditService} 
                onSetFeedback={handleSetFeedback} 
                isPublicView={true}
              />
        </div>

        {/* Upcoming Tokens Section */}
        <div>
          <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-primary">
                <Clock /> Upcoming Tokens (Next 30 mins)
              </CardTitle>
              <CardDescription>This is a sample list for kiosk display purposes.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4 justify-center">
                    {sampleUpcomingTokens.map(token => (
                        <Badge key={token} variant="secondary" className="text-xl font-bold tracking-wider px-4 py-2">
                            {token}
                        </Badge>
                    ))}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
