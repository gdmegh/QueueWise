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
import { Ticket } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

const checkInFormSchema = z.object({
  phone: z.string().regex(/^\d{11}$/, { message: 'Please enter a valid 11-digit phone number.' }),
});

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
});

const MAX_QUEUE_SIZE = 20;

export default function TokenPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [queue, setQueue] = useLocalStorage<QueueMember[]>('queue', []);
  const [serviced, setServiced] = useLocalStorage<QueueMember[]>('serviced', []);
  const [ticketCounter, setTicketCounter] = useLocalStorage('ticketCounter', 1);
  const [currentMember, setCurrentMember] = useState<Partial<QueueMember> | null>(null);
  const [step, setStep] = useState<'getToken' | 'setProfile'>('getToken');

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const handleJoinQueue = (data: z.infer<typeof checkInFormSchema>) => {
    if (queue.length >= MAX_QUEUE_SIZE) {
      toast({
        title: "Queue is full",
        description: "We're sorry, the queue is currently full. Please try again later.",
        variant: 'destructive',
      });
      return;
    }

    const newMember: Partial<QueueMember> = {
      id: Date.now(),
      ticketNumber: `A-${String(ticketCounter).padStart(3, '0')}`,
      phone: data.phone,
      checkInTime: new Date(),
      status: 'waiting',
      services: [], // Initialize services array
    };

    setTicketCounter(prev => prev + 1);
    setCurrentMember(newMember);
    setStep('setProfile');

    toast({
      title: "You have a token!",
      description: `Your ticket is ${newMember.ticketNumber}. Please enter your name.`,
    });
  };

  const handleSetProfile = (data: z.infer<typeof profileFormSchema>) => {
    if (!currentMember) return;
    
    const updatedMember: QueueMember = {
        ...currentMember,
        name: data.name,
        estimatedServiceTime: new Date(), // Placeholder, will be updated
    } as QueueMember;

    // A temporary member is stored to be picked up by the service page
    setQueue(prev => [...prev, updatedMember]);
    
    // We pass the ticket number to the service selection page.
    router.push(`/service?ticketNumber=${updatedMember.ticketNumber}`);
  };
  
  const renderStep = () => {
    switch (step) {
      case 'getToken':
        return (
          <div className="max-w-md mx-auto space-y-8">
            <div className="text-center">
              <Ticket className="mx-auto h-12 w-12 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight text-primary mt-4">Get Your Queue Token</h1>
              <p className="text-muted-foreground mt-2">Enter your phone number to secure your spot in line.</p>
            </div>
            <CheckInForm onJoinQueue={handleJoinQueue} isQueueFull={queue.length >= MAX_QUEUE_SIZE}/>
            <WaitTimeCard queueLength={queue.length} servicedCount={serviced.length} />
          </div>
        );
      case 'setProfile':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary text-center">
                  Your Ticket: <span className="font-bold text-3xl">{currentMember?.ticketNumber}</span>
                </CardTitle>
                 <CardDescription className="text-center">Welcome! Please tell us your name.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleSetProfile)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">Select Service</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {renderStep()}
    </main>
  );
}
