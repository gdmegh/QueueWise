'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { CheckInForm } from '@/components/CheckInForm';
import { WaitTimeCard } from '@/components/WaitTimeCard';
import type { QueueMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Ticket, List, Banknote, UserPlus, HandCoins } from 'lucide-react';
import { services, type Service } from '@/lib/services';
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
  const [currentMember, setCurrentMember] = useState<QueueMember | null>(null);
  const [step, setStep] = useState<'getToken' | 'setProfile' | 'selectService'>('getToken');

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

    const newMember: QueueMember = {
      id: Date.now(),
      ticketNumber: `A-${String(ticketCounter).padStart(3, '0')}`,
      name: '', // Will be set in the next step
      phone: data.phone,
      checkInTime: new Date(),
      estimatedServiceTime: new Date(),
      status: 'waiting',
      service: 'General Inquiry',
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
    setCurrentMember(prev => prev ? { ...prev, name: data.name } : null);
    setStep('selectService');
  };

  const handleSelectService = (service: Service) => {
    if (!currentMember) return;

    const updatedMember = { ...currentMember, service: service.name };

    const lastPersonInQueue = queue[queue.length - 1];
    const estimatedServiceTime = new Date(
      (lastPersonInQueue ? new Date(lastPersonInQueue.estimatedServiceTime).getTime() : Date.now()) +
      service.avgTime * 60000
    );
    updatedMember.estimatedServiceTime = estimatedServiceTime;

    setQueue(prevQueue => [...prevQueue, updatedMember]);

    toast({
      title: "Service Selected!",
      description: `You will be directed to the live queue. Go to ${service.counter}.`,
    });

    setTimeout(() => {
      router.push('/queue');
    }, 2000);
  };

  const serviceIcons: { [key: string]: React.ReactNode } = {
    'General Inquiry': <List className="h-6 w-6" />,
    'New Account': <UserPlus className="h-6 w-6" />,
    'Deposit/Withdrawal': <Banknote className="h-6 w-6" />,
    'Loan Application': <HandCoins className="h-6 w-6" />,
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
                            <Input placeholder="e.g. John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">Continue</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
      case 'selectService':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <Card className="bg-card/50 border-primary/20 shadow-lg backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary text-center">
                  Hello, {currentMember?.name}!
                </CardTitle>
                <div className="text-center text-muted-foreground">Your Ticket: <span className="font-bold text-lg text-primary">{currentMember?.ticketNumber}</span></div>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-semibold text-center mb-4">Please select a service:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <Button
                      key={service.name}
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2 text-base"
                      onClick={() => handleSelectService(service)}
                    >
                      {serviceIcons[service.name]}
                      <span>{service.name}</span>
                    </Button>
                  ))}
                </div>
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
