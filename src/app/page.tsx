'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { CheckInForm } from '@/components/CheckInForm';
import { WaitTimeCard } from '@/components/WaitTimeCard';
import type { QueueMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Ticket, LogIn } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const checkInFormSchema = z.object({
  phone: z.string().regex(/^\d{11}$/, { message: 'Please enter a valid 11-digit phone number.' }),
});

const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const MAX_QUEUE_SIZE = 20;

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', []);
  const [serviced, setServiced] = useLocalStorage<QueueMember[]>('serviced', []);
  const [ticketCounter, setTicketCounter] = useLocalStorage('ticketCounter', 111);
  
  const checkInForm = useForm<z.infer<typeof checkInFormSchema>>({
    resolver: zodResolver(checkInFormSchema),
    defaultValues: { phone: '' },
  });

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });


  const handleJoinQueueAsGuest = (data: z.infer<typeof checkInFormSchema>) => {
    if (queue.filter(q => q.status === 'waiting').length >= MAX_QUEUE_SIZE) {
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
    setQueue(prev => [...prev, newMember]);
    
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

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center items-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <Ticket className="mx-auto h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary mt-4">Welcome to QueueWise</h1>
            <p className="text-muted-foreground mt-2">Your smart queueing solution.</p>
        </div>

        <Tabs defaultValue="guest" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="guest">Join as Guest</TabsTrigger>
                <TabsTrigger value="login">Registered User</TabsTrigger>
            </TabsList>
            <TabsContent value="guest" className="mt-4">
                 <CheckInForm onJoinQueue={handleJoinQueueAsGuest} isQueueFull={queue.filter(q => q.status === 'waiting').length >= MAX_QUEUE_SIZE}/>
            </TabsContent>
            <TabsContent value="login" className="mt-4">
                <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="font-headline text-primary">Login</CardTitle>
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
        <WaitTimeCard queueLength={queue.filter(q => q.status === 'waiting').length} servicedCount={serviced.length + queue.filter(q => q.status === 'serviced').length} />
      </div>
    </main>
  );
}
